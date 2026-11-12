import "server-only";

import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  type SessionClaims,
} from "@/lib/auth/constants";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

export { AUTH_COOKIE_NAME as COOKIE_NAME };
export { sanitizeRedirectPath };
export type { SessionClaims as AuthSessionPayload };

export async function createSession(claims: SessionClaims): Promise<void> {
  const token = await signSessionToken(claims, SESSION_MAX_AGE_SECONDS);
  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, token, {
    ...AUTH_COOKIE_OPTIONS,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, "", {
    ...AUTH_COOKIE_OPTIONS,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionClaims | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionClaims> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
