import { get, set, clear, createStore } from "idb-keyval";

export const CACHE_VERSION = 1;

const store = createStore("ayesha-cache", "kv");
const LS_PREFIX = "ayesha-cache:";
/** Skip localStorage for oversized payloads (quota / jank). */
const LS_MAX_CHARS = 3_500_000;
const KNOWN_KEYS = ["dashboard", "customers", "last-partial-at"] as const;

/** In-memory copy so a remount in this tab can paint before IndexedDB resolves. */
const memory = new Map<string, unknown>();

let hydratePromise: Promise<void> | null = null;

function hasCurrentVersion(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { v?: unknown }).v === CACHE_VERSION
  );
}

function readLocal(key: string): unknown {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    if (!raw) return undefined;
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(value);
    if (raw.length > LS_MAX_CHARS) {
      window.localStorage.removeItem(LS_PREFIX + key);
      return;
    }
    window.localStorage.setItem(LS_PREFIX + key, raw);
  } catch {
    // Quota or private mode — IndexedDB remains the durable store.
  }
}

function removeLocal(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_PREFIX + key);
  } catch {
    // ignore
  }
}

function clearLocal(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(LS_PREFIX)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Sync read for first paint: memory → localStorage. */
export function cachePeek<T>(key: string): T | undefined {
  const mem = memory.get(key);
  if (hasCurrentVersion(mem)) return mem as T;

  const local = readLocal(key);
  if (hasCurrentVersion(local)) {
    memory.set(key, local);
    return local as T;
  }
  return undefined;
}

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  const peeked = cachePeek<T>(key);
  if (peeked !== undefined) return peeked;

  const value = await get<unknown>(key, store);
  if (!hasCurrentVersion(value)) return undefined;
  memory.set(key, value);
  writeLocal(key, value);
  return value as T;
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  memory.set(key, value);
  writeLocal(key, value);
  await set(key, value, store);
}

export async function cacheClear(): Promise<void> {
  memory.clear();
  clearLocal();
  await clear(store);
}

/** Pull IndexedDB into memory (+ backfill localStorage) for known keys. */
export function hydrateClientCache(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    await Promise.all(
      KNOWN_KEYS.map(async (key) => {
        try {
          const value = await get<unknown>(key, store);
          if (!hasCurrentVersion(value)) return;
          memory.set(key, value);
          if (!hasCurrentVersion(readLocal(key))) {
            writeLocal(key, value);
          }
        } catch {
          // ignore per-key failures
        }
      })
    );
  })();

  return hydratePromise;
}

if (typeof window !== "undefined") {
  void hydrateClientCache();
}
