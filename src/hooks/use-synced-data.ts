"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cacheGet,
  cachePeek,
  cacheSet,
  hydrateClientCache,
} from "@/lib/client-cache";

export type SyncStatus =
  | "loading"
  | "syncing"
  | "fresh"
  | "uptodate"
  | "partial"
  | "offline"
  | "error";

const CACHE_VERSION = 1;
const SYNC_LOCK = "ayesha-sync";
const SYNC_CHANNEL = "ayesha-sync";
const PARTIAL_AT_KEY = "last-partial-at";
const PARTIAL_RETRY_COOLDOWN_MS = 5 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 10 * 1000;
const UP_TO_DATE_MS = 2 * 1000;
const CACHE_KEYS = ["dashboard", "customers"] as const;

type CacheRecord<T> = { v: number; data: T; sig: string };
type SyncResult = "fresh" | "partial" | "offline" | "error";

type SyncPayload = {
  signature: string | null;
  complete?: boolean;
  failedFiles?: unknown;
  dashboard: unknown;
  customers: unknown;
};

let tabWasHidden = false;
let refreshLocked = false;
const refreshListeners = new Set<() => void>();

function notifyRefreshLock() {
  for (const listener of refreshListeners) listener();
}

function lockRefreshButton() {
  refreshLocked = true;
  notifyRefreshLock();
  window.setTimeout(() => {
    refreshLocked = false;
    notifyRefreshLock();
  }, REFRESH_COOLDOWN_MS);
}

function asCurrent<T>(value: unknown): CacheRecord<T> | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Partial<CacheRecord<T>>;
  if (record.v !== CACHE_VERSION || typeof record.sig !== "string" || !("data" in record)) {
    return undefined;
  }
  return record as CacheRecord<T>;
}

const listeners = new Set<() => void>();
let syncInflight: Promise<SyncResult> | null = null;
let channel: BroadcastChannel | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function openSyncChannel() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  if (channel) return;
  channel = new BroadcastChannel(SYNC_CHANNEL);
  channel.onmessage = () => notify();
}

function publishSync() {
  notify();
  try {
    openSyncChannel();
    channel?.postMessage({ type: "synced" });
  } catch {
    // BroadcastChannel can be missing or closed. Other tabs still recheck on focus.
  }
}

async function readRecord(key: string) {
  return asCurrent(await cacheGet<unknown>(key));
}

async function fetchSignature(): Promise<string | null> {
  try {
    const response = await fetch("/api/drive-signature", { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { signature?: unknown };
    if (typeof body.signature !== "string" || body.signature.length === 0) return null;
    return body.signature;
  } catch {
    return null;
  }
}

function recordsMatch(
  signature: string,
  records: Array<CacheRecord<unknown> | undefined>
) {
  return records.every((record) => record?.sig === signature);
}

function isIncomplete(records: Array<CacheRecord<unknown> | undefined>) {
  return records.every((record) => record != null && record.sig === "");
}

function partialAttemptAt(value: unknown): number | null {
  if (typeof value !== "object" || value === null) return null;
  const mark = value as { v?: unknown; at?: unknown };
  if (mark.v !== CACHE_VERSION || typeof mark.at !== "number") return null;
  return mark.at;
}

async function readLastPartialAt(): Promise<number | null> {
  return partialAttemptAt(await cacheGet<unknown>(PARTIAL_AT_KEY));
}

function partialCoolingDown(at: number | null, now = Date.now()): boolean {
  return at != null && now - at < PARTIAL_RETRY_COOLDOWN_MS;
}

async function writeLastPartialAt(at: number | null): Promise<void> {
  await cacheSet(PARTIAL_AT_KEY, { v: CACHE_VERSION, at });
}

async function withSyncLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return run();
  return locks.request(SYNC_LOCK, () => run());
}

async function runSharedSync(force: boolean): Promise<SyncResult> {
  if (!force && partialCoolingDown(await readLastPartialAt())) return "partial";

  const before = await Promise.all(CACHE_KEYS.map((key) => readRecord(key)));
  const startedIncomplete = isIncomplete(before);
  const signature = await fetchSignature();
  if (!signature) return before.some(Boolean) ? "offline" : "error";
  if (!force && recordsMatch(signature, before)) {
    await writeLastPartialAt(null);
    return "fresh";
  }

  try {
    return await withSyncLock(async () => {
      if (!force && partialCoolingDown(await readLastPartialAt())) return "partial";

      const again = await Promise.all(CACHE_KEYS.map((key) => readRecord(key)));
      const signatureAgain = await fetchSignature();
      if (!signatureAgain) return again.some(Boolean) ? "offline" : "error";
      if (!force && recordsMatch(signatureAgain, again)) {
        await writeLastPartialAt(null);
        return "fresh";
      }
      // Another tab already stored this attempt as incomplete. Do not POST again.
      if (!force && !startedIncomplete && isIncomplete(again)) return "partial";

      const response = await fetch("/api/sync", { method: "POST", cache: "no-store" });
      if (!response.ok) throw new Error("sync failed");
      const payload = (await response.json()) as Partial<SyncPayload>;
      if (payload.dashboard == null || payload.customers == null) {
        throw new Error("sync payload");
      }
      const saved =
        payload.complete === false || typeof payload.signature !== "string"
          ? ""
          : payload.signature;
      const incomplete = saved === "";
      await cacheSet("dashboard", {
        v: CACHE_VERSION,
        data: payload.dashboard,
        sig: saved,
      });
      await cacheSet("customers", {
        v: CACHE_VERSION,
        data: payload.customers,
        sig: saved,
      });
      await writeLastPartialAt(incomplete ? Date.now() : null);
      publishSync();
      return incomplete ? "partial" : "fresh";
    });
  } catch {
    const latest = await Promise.all(CACHE_KEYS.map((key) => readRecord(key)));
    return latest.some(Boolean) ? "offline" : "error";
  }
}

async function refreshIfNeeded(): Promise<SyncResult | "uptodate"> {
  const before = await Promise.all(CACHE_KEYS.map((key) => readRecord(key)));
  const lastWasPartial = isIncomplete(before) || (await readLastPartialAt()) != null;
  const signature = await fetchSignature();
  if (!signature) return before.some(Boolean) ? "offline" : "error";
  if (!lastWasPartial && recordsMatch(signature, before)) return "uptodate";
  return startSync(true);
}

/** Settings full resync: hard-reset server caches, then always POST /api/sync. */
export async function fullResync(): Promise<{ resetOk: boolean; result: SyncResult }> {
  let resetOk = false;
  try {
    const reset = await fetch("/api/settings/refresh", {
      method: "POST",
      cache: "no-store",
    });
    resetOk = reset.ok;
  } catch {
    resetOk = false;
  }
  return { resetOk, result: await startSync(true) };
}

function startSync(force: boolean): Promise<SyncResult> {
  if (syncInflight) {
    if (!force) return syncInflight;
    const current = syncInflight;
    return current.then(() => startSync(true));
  }
  const job = runSharedSync(force).finally(() => {
    if (syncInflight === job) syncInflight = null;
  });
  syncInflight = job;
  return job;
}

/** Warm IndexedDB/localStorage and refresh in the background once per session. */
export function warmSyncedCache(): void {
  if (typeof window === "undefined") return;
  void hydrateClientCache().then(() => startSync(false));
}

export function useSyncedData<T>(key: string, path: string) {
  void path;
  const seeded = asCurrent<T>(cachePeek<unknown>(key));
  const [data, setData] = useState<T | null>(seeded?.data ?? null);
  const [status, setStatus] = useState<SyncStatus>(() => {
    if (!seeded) return "loading";
    if (seeded.sig === "") return "partial";
    return "fresh";
  });
  const [refreshBusy, setRefreshBusy] = useState(refreshLocked);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const onLock = () => setRefreshBusy(refreshLocked);
    refreshListeners.add(onLock);
    return () => {
      mounted.current = false;
      refreshListeners.delete(onLock);
    };
  }, []);

  const applyFromCache = useCallback(async (result: SyncResult) => {
    const cached = asCurrent<T>(await cacheGet<unknown>(key));
    if (!mounted.current) return;
    if (cached) setData(cached.data);
    if (result === "offline" || result === "error") {
      setStatus(cached ? "offline" : "error");
      return;
    }
    if (!cached) {
      setStatus("error");
      return;
    }
    if (cached.sig === "") {
      setStatus("partial");
      return;
    }
    setStatus("fresh");
  }, [key]);

  const run = useCallback(async (force = false) => {
    await hydrateClientCache();
    const cached = asCurrent<T>(await cacheGet<unknown>(key));
    if (!mounted.current) return;
    if (cached) {
      setData(cached.data);
      // Keep UI on cached data; avoid a loading flash while background sync runs.
      setStatus(cached.sig === "" ? "partial" : "fresh");
    }
    if (!force && partialCoolingDown(await readLastPartialAt())) {
      if (!mounted.current) return;
      setStatus(cached ? "partial" : "error");
      return;
    }
    if (!mounted.current) return;
    if (!cached) setStatus("loading");
    const result = await startSync(force);
    if (!mounted.current) return;
    await applyFromCache(result);
  }, [applyFromCache, key]);

  useEffect(() => {
    openSyncChannel();
    const unsubscribe = subscribe(() => {
      void applyFromCache("fresh");
    });
    const timer = window.setTimeout(() => {
      void run(false);
    }, 0);
    function onVisible() {
      if (document.visibilityState === "hidden") {
        tabWasHidden = true;
        return;
      }
      if (!tabWasHidden) return;
      tabWasHidden = false;
      void run(false);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applyFromCache, run]);

  const refresh = useCallback(() => {
    if (refreshLocked) return;
    lockRefreshButton();
    void (async () => {
      const cached = asCurrent<T>(await cacheGet<unknown>(key));
      if (!mounted.current) return;
      if (cached) {
        setData(cached.data);
        setStatus("syncing");
      }
      const result = await refreshIfNeeded();
      if (!mounted.current) return;
      if (result === "uptodate") {
        setStatus("uptodate");
        window.setTimeout(() => {
          if (mounted.current) setStatus("fresh");
        }, UP_TO_DATE_MS);
        return;
      }
      await applyFromCache(result);
    })();
  }, [applyFromCache, key]);

  return { data, status, refresh, refreshBusy };
}
