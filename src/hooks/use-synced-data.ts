"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cacheGet, cachePeek, cacheSet } from "@/lib/client-cache";

export type SyncStatus = "loading" | "syncing" | "fresh" | "offline" | "error";

const CACHE_VERSION = 1;

type CacheRecord<T> = { v: number; data: T; sig: string };

function asCurrent<T>(value: unknown): CacheRecord<T> | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Partial<CacheRecord<T>>;
  if (record.v !== CACHE_VERSION || typeof record.sig !== "string" || !("data" in record)) {
    return undefined;
  }
  return record as CacheRecord<T>;
}

type SyncResult = "fresh" | "offline" | "error";

const inflight = new Map<string, Promise<SyncResult>>();

export function useSyncedData<T>(key: string, path: string) {
  const seeded = asCurrent<T>(cachePeek<unknown>(key));
  const [data, setData] = useState<T | null>(seeded?.data ?? null);
  const [status, setStatus] = useState<SyncStatus>(seeded ? "syncing" : "loading");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const applyCached = useCallback(
    async (result: SyncResult) => {
      const cached = asCurrent<T>(await cacheGet<unknown>(key));
      if (!mounted.current) return;
      if (cached) setData(cached.data);
      setStatus(result);
    },
    [key]
  );

  const execute = useCallback(async (force: boolean): Promise<SyncResult> => {
    const cached = asCurrent<T>(await cacheGet<unknown>(key));
    if (!mounted.current) {
      return cached ? "offline" : "error";
    }
    if (cached) {
      setData(cached.data);
      setStatus("syncing");
    }

    try {
      const signatureResponse = await fetch("/api/drive-signature", {
        cache: "no-store",
      });
      if (!signatureResponse.ok) {
        throw new Error("signature failed");
      }
      const body = (await signatureResponse.json()) as { signature?: unknown };
      if (typeof body.signature !== "string" || body.signature.length === 0) {
        throw new Error("signature missing");
      }
      if (!mounted.current) return cached ? "offline" : "error";

      if (!force && cached?.sig === body.signature) {
        setStatus("fresh");
        return "fresh";
      }

      const response = await fetch(path, {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("sync failed");
      }
      const next = (await response.json()) as T;
      await cacheSet(key, { v: CACHE_VERSION, data: next, sig: body.signature });
      if (!mounted.current) return "fresh";
      setData(next);
      setStatus("fresh");
      return "fresh";
    } catch {
      const result: SyncResult = cached ? "offline" : "error";
      if (mounted.current) setStatus(result);
      return result;
    }
  }, [key, path]);

  const run = useCallback(
    async (force = false) => {
      const current = inflight.get(key);
      if (current) {
        const cachedNow = asCurrent<T>(await cacheGet<unknown>(key));
        if (mounted.current && cachedNow) {
          setData(cachedNow.data);
          setStatus("syncing");
        }
        const result = await current;
        if (!mounted.current) return;
        if (!force) {
          await applyCached(result);
          return;
        }
      }

      if (inflight.has(key)) {
        const result = await inflight.get(key);
        if (!mounted.current || result == null) return;
        if (!force) {
          await applyCached(result);
          return;
        }
      }

      const job = execute(force);
      inflight.set(key, job);
      try {
        await job;
      } finally {
        if (inflight.get(key) === job) {
          inflight.delete(key);
        }
      }
    },
    [applyCached, execute, key]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void run(false);
    }, 0);
    function onVisible() {
      if (document.visibilityState === "visible") {
        void run(false);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [run]);

  const refresh = useCallback(() => run(true), [run]);

  return { data, status, refresh };
}
