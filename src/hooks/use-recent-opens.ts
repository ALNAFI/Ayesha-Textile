"use client";

import { useCallback, useEffect, useState } from "react";
import type { RecentOpenItem } from "@/lib/dashboard/types";

const STORAGE_KEY = "ayesha-recent-opens";
const MAX_ITEMS = 5;

function readRecent(): RecentOpenItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentOpenItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.href === "string" &&
        typeof item.openedAt === "number"
    );
  } catch {
    return [];
  }
}

function writeRecent(items: RecentOpenItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function recordRecentOpen(item: Omit<RecentOpenItem, "openedAt">) {
  if (typeof window === "undefined") return;
  const current = readRecent().filter((entry) => entry.id !== item.id);
  const next = [{ ...item, openedAt: Date.now() }, ...current].slice(0, MAX_ITEMS);
  writeRecent(next);
  window.dispatchEvent(new Event("ayesha-recent-opens"));
}

export function useRecentOpens() {
  const [items, setItems] = useState<RecentOpenItem[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setItems(readRecent());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) refresh();
    }

    function onCustom() {
      refresh();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("ayesha-recent-opens", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ayesha-recent-opens", onCustom);
    };
  }, [refresh]);

  const pruneMissing = useCallback((validIds: Set<string>) => {
    setItems((current) => {
      const next = current.filter((entry) => validIds.has(entry.id));
      if (next.length !== current.length) {
        writeRecent(next);
      }
      return next;
    });
  }, []);

  return { items, ready, pruneMissing, refresh };
}
