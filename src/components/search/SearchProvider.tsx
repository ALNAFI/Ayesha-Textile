"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DashboardFileItem, DashboardSnapshot } from "@/lib/dashboard/types";
import { GlobalSearch } from "@/components/search/GlobalSearch";

type SearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: DashboardFileItem[];
  snapshot: DashboardSnapshot | null;
  setSnapshot: (snapshot: DashboardSnapshot) => void;
  loading: boolean;
  ensureLoaded: () => Promise<void>;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return ctx;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureLoaded = useCallback(async () => {
    if (snapshot || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as DashboardSnapshot;
        setSnapshot(data);
      }
    } finally {
      setLoading(false);
    }
  }, [snapshot, loading]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        void ensureLoaded();
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ensureLoaded]);

  useEffect(() => {
    if (open) {
      void ensureLoaded();
    }
  }, [open, ensureLoaded]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      items: snapshot?.searchItems ?? [],
      snapshot,
      setSnapshot,
      loading,
      ensureLoaded,
    }),
    [open, snapshot, loading, ensureLoaded]
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <GlobalSearch
        mode="dialog"
        open={open}
        onOpenChange={setOpen}
        items={snapshot?.searchItems ?? []}
        unavailableMessage={
          snapshot && !snapshot.available
            ? snapshot.message
            : loading
              ? "Loading search index…"
              : null
        }
      />
    </SearchContext.Provider>
  );
}
