"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  RefreshCw,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
import { CustomersDesktopTable } from "@/components/customers/CustomersDesktopTable";
import { CustomersMobileCards } from "@/components/customers/CustomersMobileCards";
import { SyncStatusBanner } from "@/components/shared/SyncStatusBanner";
import { useFavorites } from "@/hooks/use-favorites";
import { useSyncedData } from "@/hooks/use-synced-data";
import { formatRefreshTime } from "@/lib/dashboard/format";
import { matchesCustomerSearch } from "@/lib/customers/search";
import { CUSTOMER_SORT_OPTIONS, sortCustomerItems } from "@/lib/customers/sort";
import type {
  CustomerListSnapshot,
  CustomerSort,
  CustomerStatusFilter,
} from "@/lib/customers/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<{
  id: CustomerStatusFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "outstanding", label: "Outstanding" },
  { id: "settled", label: "Settled" },
  { id: "advance", label: "Advance" },
];

export function CustomersView() {
  const { data, status, refresh, refreshBusy } = useSyncedData<CustomerListSnapshot>(
    "customers",
    "/api/customers"
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<CustomerSort>("name-asc");
  const syncing = status === "syncing" || status === "loading";
  const { favorites, isFavorite, pruneMissing, ready } = useFavorites();
  const items = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    if (!ready || !data?.available) return;
    pruneMissing(new Set(data.items.map((item) => item.id)));
  }, [data, pruneMissing, ready]);

  const searched = useMemo(
    () => items.filter((item) => matchesCustomerSearch(item, query)),
    [items, query]
  );

  const filterCounts = useMemo(() => {
    const base = favoritesOnly
      ? searched.filter((item) => isFavorite(item.id))
      : searched;

    return {
      all: base.length,
      outstanding: base.filter((item) => item.status === "outstanding").length,
      settled: base.filter((item) => item.status === "settled").length,
      advance: base.filter((item) => item.status === "advance").length,
    };
  }, [searched, favoritesOnly, isFavorite]);

  const visible = useMemo(() => {
    let next = searched;

    if (favoritesOnly) {
      next = next.filter((item) => isFavorite(item.id));
    }

    if (statusFilter !== "all") {
      next = next.filter((item) => item.status === statusFilter);
    }

    return sortCustomerItems(next, sort);
  }, [searched, favoritesOnly, isFavorite, statusFilter, sort]);

  if (!data) {
    return status === "error" ? (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 text-sm text-muted">
        <p>Customer data could not be loaded.</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 text-sm font-medium text-accent"
        >
          Try again
        </button>
      </div>
    ) : (
      <div className="space-y-4" aria-hidden>
        <div className="h-8 w-40 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
        <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="customers-stagger space-y-6">
      <SyncStatusBanner status={status} />
      <header className="customers-section flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Customers
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            View customer accounts and outstanding balances
          </p>
          <p className="mt-3 text-sm text-muted">
            {data.available
              ? `${data.totalCount} customer${data.totalCount === 1 ? "" : "s"}`
              : "Drive customers unavailable"}
            {data.refreshedAtIso
              ? ` · Updated ${formatRefreshTime(data.refreshedAtIso)}`
              : null}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={syncing || refreshBusy}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 self-start rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground",
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
      </header>

      {!data.available ? (
        <div className="customers-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 text-sm text-muted shadow-[var(--shadow-soft)]">
          {data.message}
        </div>
      ) : data.items.length === 0 ? (
        <div className="customers-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]">
          <Users className="mx-auto h-5 w-5 text-muted" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            No customers found
          </p>
          <p className="mt-2 text-sm text-muted">
            No Excel files match the &quot;Name - Location&quot; customer
            pattern in the connected Drive folder.
          </p>
        </div>
      ) : (
        <>
          <div className="customers-section space-y-4">
            <div
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 shadow-[var(--shadow-soft)]",
                "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
              )}
            >
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or location…"
                aria-label="Search customers"
                className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors duration-[var(--motion-fast)] hover:bg-surface-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div
                  role="tablist"
                  aria-label="Customer status filters"
                  className="inline-flex w-full flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1 shadow-[var(--shadow-soft)] sm:w-auto"
                >
                  {STATUS_FILTERS.map((item) => {
                    const active = statusFilter === item.id;
                    const count = filterCounts[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setStatusFilter(item.id)}
                        className={cn(
                          "inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium sm:flex-none",
                          "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                          active
                            ? "bg-accent-soft text-foreground"
                            : "text-muted hover:bg-surface-muted hover:text-foreground"
                        )}
                      >
                        <span>{item.label}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[0.65rem]",
                            active
                              ? "bg-background text-foreground"
                              : "bg-surface-muted text-muted"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  aria-pressed={favoritesOnly}
                  onClick={() => setFavoritesOnly((value) => !value)}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3.5 text-sm font-medium",
                    "transition-[background-color,color,border-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    "active:scale-[0.98]",
                    favoritesOnly
                      ? "border-accent/40 bg-accent-soft text-foreground"
                      : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <Star
                    className={cn("h-3.5 w-3.5", favoritesOnly && "fill-current text-accent")}
                  />
                  Favorites Only
                  <span className="rounded-full bg-background px-1.5 py-0.5 text-[0.65rem] text-muted">
                    {ready ? favorites.length : "—"}
                  </span>
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="shrink-0">Sort</span>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as CustomerSort)
                  }
                  className={cn(
                    "h-10 min-w-48 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-soft)]",
                    "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                  )}
                >
                  {CUSTOMER_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {data.statusCounts.unavailable > 0 ? (
              <p className="text-xs text-muted">{data.message}</p>
            ) : null}
          </div>

          <div className="customers-section">
            {visible.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]">
                <p className="text-sm font-medium text-foreground">
                  No customers match
                </p>
                <p className="mt-2 text-sm text-muted">
                  {query.trim() || favoritesOnly || statusFilter !== "all"
                    ? "Try another search term or clear filters."
                    : "No customers are available."}
                </p>
                {query.trim() || favoritesOnly || statusFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setFavoritesOnly(false);
                      setStatusFilter("all");
                    }}
                    className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-muted">
                  Showing {visible.length} of {data.totalCount} customers
                </p>
                <div className="hidden md:block">
                  <CustomersDesktopTable items={visible} />
                </div>
                <div className="md:hidden">
                  <CustomersMobileCards items={visible} />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
