"use client";

import { useCallback, useEffect, useState } from "react";
import type { FavoriteCustomer } from "@/lib/dashboard/types";

const STORAGE_KEY = "ayesha-favorite-customers";
const CHANGE_EVENT = "ayesha-favorites-changed";
const MAX_FAVORITES = 50;

function readFavorites(): FavoriteCustomer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteCustomer[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.customerName === "string" &&
        typeof item.href === "string"
    );
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteCustomer[]) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, MAX_FAVORITES))
  );
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCustomer[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(readFavorites());
    setReady(true);

    function syncFromStorage() {
      setFavorites(readFavorites());
    }

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        syncFromStorage();
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, syncFromStorage);
    };
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((item) => item.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((item: FavoriteCustomer) => {
    const current = readFavorites();
    const exists = current.some((entry) => entry.id === item.id);
    const next = exists
      ? current.filter((entry) => entry.id !== item.id)
      : [{ ...item, savedAt: Date.now() }, ...current].slice(0, MAX_FAVORITES);
    writeFavorites(next);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    const next = readFavorites().filter((entry) => entry.id !== id);
    writeFavorites(next);
  }, []);

  const pruneMissing = useCallback((validIds: Set<string>) => {
    const current = readFavorites();
    const next = current.filter((entry) => validIds.has(entry.id));
    if (next.length !== current.length) {
      writeFavorites(next);
    }
  }, []);

  return {
    favorites,
    ready,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    pruneMissing,
  };
}
