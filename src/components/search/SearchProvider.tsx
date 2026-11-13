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
import { useSyncedData } from "@/hooks/use-synced-data";

type SearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: DashboardFileItem[];
  snapshot: DashboardSnapshot | null;
  loading: boolean;
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
  const { data, status } = useSyncedData<DashboardSnapshot>(
    "dashboard",
    "/api/dashboard"
  );
  const loading = status === "loading" && data == null;

  const value = useMemo(
    () => ({
      open,
      setOpen,
      items: data?.searchItems ?? [],
      snapshot: data,
      loading,
    }),
    [open, data, loading]
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchDialog
        open={open}
        setOpen={setOpen}
        items={data?.searchItems ?? []}
        snapshot={data}
        loading={loading}
      />
    </SearchContext.Provider>
  );
}

function SearchDialog({
  open,
  setOpen,
  items,
  snapshot,
  loading,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: DashboardFileItem[];
  snapshot: DashboardSnapshot | null;
  loading: boolean;
}) {
  const onOpenChange = useCallback((next: boolean) => setOpen(next), [setOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  return (
    <GlobalSearch
      mode="dialog"
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      unavailableMessage={
        snapshot && !snapshot.available
          ? snapshot.message
          : loading
            ? "Loading search index…"
            : null
      }
    />
  );
}
