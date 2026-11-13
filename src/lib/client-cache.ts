import { get, set, clear, createStore } from "idb-keyval";

export const CACHE_VERSION = 1;

const store = createStore("ayesha-cache", "kv");

/** In-memory copy so a remount in this tab can paint before IndexedDB resolves. */
const memory = new Map<string, unknown>();

function hasCurrentVersion(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { v?: unknown }).v === CACHE_VERSION
  );
}

export function cachePeek<T>(key: string): T | undefined {
  const value = memory.get(key);
  if (!hasCurrentVersion(value)) return undefined;
  return value as T;
}

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  const value = await get<unknown>(key, store);
  if (!hasCurrentVersion(value)) return undefined;
  memory.set(key, value);
  return value as T;
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  memory.set(key, value);
  await set(key, value, store);
}

export async function cacheClear(): Promise<void> {
  memory.clear();
  await clear(store);
}
