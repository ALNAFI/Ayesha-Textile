"use client";

import { useEffect } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { FavoriteCustomers } from "@/components/dashboard/FavoriteCustomers";
import { IssuesBox } from "@/components/dashboard/IssuesBox";
import { RecentFiles } from "@/components/dashboard/RecentFiles";
import { RecentSearches } from "@/components/dashboard/RecentSearches";
import { StatCards } from "@/components/dashboard/StatCards";
import { SyncStatusBanner } from "@/components/shared/SyncStatusBanner";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentOpens } from "@/hooks/use-recent-opens";
import { useSyncedData } from "@/hooks/use-synced-data";
import { formatRefreshTime } from "@/lib/dashboard/format";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const { data, status, refresh, refreshBusy } = useSyncedData<DashboardSnapshot>(
    "dashboard",
    "/api/dashboard"
  );
  const syncing = status === "syncing" || status === "loading";
  const { favorites, ready: favoritesReady, pruneMissing: pruneFavorites } =
    useFavorites();
  const { items: recentOpens, ready: recentReady, pruneMissing: pruneRecent } =
    useRecentOpens();

  useEffect(() => {
    if (!data) return;
    const validIds = new Set(data.searchItems.map((item) => item.id));
    pruneFavorites(validIds);
    pruneRecent(validIds);
  }, [data, pruneFavorites, pruneRecent]);

  if (!data) {
    return status === "error" ? (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 text-sm text-muted">
        <p>Dashboard data could not be loaded.</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 text-sm font-medium text-accent"
        >
          Try again
        </button>
      </div>
    ) : (
      <DashboardSkeleton />
    );
  }

  return (
    <div className="dash-stagger w-full min-w-0 max-w-full space-y-8">
      <SyncStatusBanner status={status} />
      <header className="dash-section hidden flex-col gap-4 md:flex sm:flex-row sm:items-end sm:justify-between">
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
            disabled={syncing || refreshBusy}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground",
              "transition-[background-color,transform,opacity] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              "hover:bg-surface-muted active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-70"
            )}
          >
            {syncing || refreshBusy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4 text-muted" aria-hidden />
            )}
            {syncing || refreshBusy ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <div className="dash-section">
        <StatCards stats={data.stats} available={data.available} />
      </div>

      <div className="dash-section grid w-full min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="order-3 min-w-0 lg:order-1">
          <RecentFiles files={data.recentFiles} available={data.available} />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <RecentSearches items={recentOpens} ready={recentReady} />
        </div>
        <div className="order-2 min-w-0 lg:order-3">
          <FavoriteCustomers favorites={favorites} ready={favoritesReady} />
        </div>
      </div>

      <IssuesBox data={data} syncStatus={status} />
    </div>
  );
}
