import "server-only";

/**
 * Process-local login throttle.
 * Limitation: resets per server instance / cold start; not shared across
 * Vercel serverless instances. Suitable as a practical baseline only.
 */

type AttemptState = {
  count: number;
  firstAt: number;
  lockedUntil: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const LOCK_MS = 15 * 60 * 1000;

const attempts = new Map<string, AttemptState>();

function prune(now: number) {
  for (const [key, state] of attempts) {
    if (state.lockedUntil < now && now - state.firstAt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

export function getClientThrottleKey(ip: string | null | undefined): string {
  return (ip || "unknown").slice(0, 64);
}

export function checkLoginThrottle(key: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  prune(now);
  const state = attempts.get(key);

  if (!state) {
    return { allowed: true };
  }

  if (state.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((state.lockedUntil - now) / 1000),
    };
  }

  if (now - state.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true };
  }

  if (state.count >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCK_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(LOCK_MS / 1000),
    };
  }

  return { allowed: true };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const state = attempts.get(key);

  if (!state || now - state.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }

  state.count += 1;
  if (state.count >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCK_MS;
  }
}

export function clearLoginThrottle(key: string) {
  attempts.delete(key);
}
