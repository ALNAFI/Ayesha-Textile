"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { CustomersDesktopTable } from "@/components/customers/CustomersDesktopTable";
import { CustomersMobileCards } from "@/components/customers/CustomersMobileCards";
import { SyncStatusBanner } from "@/components/shared/SyncStatusBanner";
import { RubberSegment } from "@/components/ui/rubber-segment";
import { useFavorites } from "@/hooks/use-favorites";
import { useSyncedData } from "@/hooks/use-synced-data";
import { matchesCustomerSearch } from "@/lib/customers/search";
import { CUSTOMER_SORT_OPTIONS, sortCustomerItems } from "@/lib/customers/sort";
import type {
  CustomerListSnapshot,
  CustomerSort,
  CustomerStatusFilter,
} from "@/lib/customers/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<{
  id: "all" | "outstanding" | "settled";
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "outstanding", label: "Due" },
  { id: "settled", label: "Paid" },
];

export function CustomersView() {
  const { data, status, refresh, refreshBusy } = useSyncedData<CustomerListSnapshot>(
    "customers",
    "/api/customers"
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("all");
  const [sort, setSort] = useState<CustomerSort>("name-asc");
  const syncing = status === "syncing" || status === "loading";
  const { pruneMissing, ready } = useFavorites();
  const items = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    if (!ready || !data?.available) return;
    pruneMissing(new Set(data.items.map((item) => item.id)));
  }, [data, pruneMissing, ready]);

  const searched = useMemo(
    () => items.filter((item) => matchesCustomerSearch(item, query)),
    [items, query]
  );

  const filterCounts = useMemo(
    () => ({
      all: searched.length,
      outstanding: searched.filter((item) => item.status === "outstanding")
        .length,
      settled: searched.filter((item) => item.status === "settled").length,
    }),
    [searched]
  );

  const visible = useMemo(() => {
    const next =
      statusFilter === "all"
        ? searched
        : searched.filter((item) => item.status === statusFilter);

    return sortCustomerItems(next, sort);
  }, [searched, statusFilter, sort]);

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
        <div className="h-11 animate-pulse rounded-[var(--radius-md)] bg-surface-muted" />
        <div className="h-9 w-full max-w-md animate-pulse rounded-[9px] bg-surface-muted" />

        {/* Mobile-only skeleton matching the card */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[18px] border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
                </div>
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-surface-muted" />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="h-6 w-16 animate-pulse rounded-full bg-surface-muted" />
                <div className="h-6 w-20 animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* md+ skeleton unchanged */}
        <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-[14px] bg-surface-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-surface-muted" />
                </div>
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-surface-muted" />
              </div>
              <div className="h-14 animate-pulse rounded-[14px] bg-surface-muted" />
              <div className="h-3 w-28 animate-pulse rounded bg-surface-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="customers-stagger space-y-6">
      <SyncStatusBanner status={status} />
      <header className="customers-section hidden flex-col gap-4 md:flex lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Customers
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            View customer accounts and due balances
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

            <div className="w-full max-w-full overflow-hidden rounded-[9px] border border-border bg-surface shadow-[var(--shadow-soft)] sm:max-w-md">
              <RubberSegment
                aria-label="Customer status filters"
                items={STATUS_FILTERS.map((item) => ({
                  value: item.id,
                  label: (
                    <span className="inline-flex items-center gap-1">
                      <span>{item.label}</span>
                      <span className="text-[0.65rem] opacity-70">
                        {String(filterCounts[item.id]).padStart(2, "0")}
                      </span>
                    </span>
                  ),
                }))}
                value={statusFilter === "advance" ? "all" : statusFilter}
                onChange={(next) =>
                  setStatusFilter(next as CustomerStatusFilter)
                }
                trackColor="transparent"
                thumbColor="var(--accent-soft)"
                textColor="var(--muted)"
                activeTextColor="var(--foreground)"
                size="sm"
                radius={7}
                inset={2}
                equalSlots
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-muted">
                {visible.length === 0
                  ? "No customers match"
                  : `Showing ${visible.length} of ${data.totalCount} `}
              </p>
              <select
                value={sort}
                aria-label="Sort customers"
                onChange={(event) =>
                  setSort(event.target.value as CustomerSort)
                }
                className={cn(
                  "h-9 w-auto shrink-0 rounded-[var(--radius-md)] border border-border bg-surface px-2.5 text-sm text-foreground shadow-[var(--shadow-soft)] sm:min-w-44",
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
            </div>
          </div>

          <div className="customers-section">
            {visible.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]">
                <p className="text-sm font-medium text-foreground">
                  No customers match
                </p>
                <p className="mt-2 text-sm text-muted">
                  {query.trim() || statusFilter !== "all"
                    ? "Try another search term or clear filters."
                    : "No customers are available."}
                </p>
                {query.trim() || statusFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
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
