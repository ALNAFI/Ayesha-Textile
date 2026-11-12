"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { FavoriteCustomers } from "@/components/dashboard/FavoriteCustomers";
import { RecentFiles } from "@/components/dashboard/RecentFiles";
import { RecentSearches } from "@/components/dashboard/RecentSearches";
import { StatCards } from "@/components/dashboard/StatCards";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useSearch } from "@/components/search/SearchProvider";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentOpens } from "@/hooks/use-recent-opens";
import { formatRefreshTime } from "@/lib/dashboard/format";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  initialData: DashboardSnapshot;
};

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { setSnapshot } = useSearch();
  const { favorites, ready: favoritesReady, pruneMissing: pruneFavorites } =
    useFavorites();
  const { items: recentOpens, ready: recentReady, pruneMissing: pruneRecent } =
    useRecentOpens();

  useEffect(() => {
    setSnapshot(data);
  }, [data, setSnapshot]);

  useEffect(() => {
    const validIds = new Set(data.searchItems.map((item) => item.id));
    pruneFavorites(validIds);
    pruneRecent(validIds);
  }, [data.searchItems, pruneFavorites, pruneRecent]);

  const shortcutLabel = useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl K";
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘K" : "Ctrl K";
  }, []);

  async function refresh() {
    startTransition(async () => {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) return;
      const next = (await res.json()) as DashboardSnapshot;
      setData(next);
      setSnapshot(next);
    });
  }

  return (
    <div className="dash-stagger space-y-8">
      <header className="dash-section flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Overview
          </h2>
          <p className="mt-1.5 text-sm text-muted">Your business at a glance</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted sm:text-sm">
            Last refresh: {formatRefreshTime(data.refreshedAtIso)}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={pending}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground",
              "transition-[background-color,transform,opacity] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              "hover:bg-surface-muted active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-70"
            )}
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 text-muted" aria-hidden />
            )}
            {pending ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {!data.available ? (
        <div className="dash-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4 text-sm text-muted shadow-[var(--shadow-soft)]">
          {data.message}
        </div>
      ) : data.stats.outstandingIncomplete ? (
        <div className="dash-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4 text-sm text-muted shadow-[var(--shadow-soft)]">
          {data.message}
        </div>
      ) : null}

      <div className="dash-section">
        <StatCards stats={data.stats} available={data.available} />
      </div>

      <div className="dash-section">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Quick Search</p>
          <span className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
            {shortcutLabel}
          </span>
        </div>
        <GlobalSearch
          mode="inline"
          open={searchOpen}
          onOpenChange={setSearchOpen}
          items={data.searchItems}
          unavailableMessage={
            data.available
              ? null
              : "Search will connect when Drive data is available."
          }
          className="shadow-[var(--shadow-soft)]"
        />
      </div>

      <div className="dash-section grid gap-4 lg:grid-cols-3">
        <RecentFiles files={data.recentFiles} available={data.available} />
        <RecentSearches items={recentOpens} ready={recentReady} />
        <FavoriteCustomers favorites={favorites} ready={favoritesReady} />
      </div>
    </div>
  );
}
