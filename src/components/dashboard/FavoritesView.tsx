"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useSyncedData } from "@/hooks/use-synced-data";
import { formatBDT } from "@/lib/dashboard/format";
import type { CustomerListSnapshot } from "@/lib/customers/types";
import { cn } from "@/lib/utils";

function customerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function FavoritesView() {
  const { favorites, ready, removeFavorite, pruneMissing } = useFavorites();
  const { data, status } = useSyncedData<CustomerListSnapshot>(
    "customers",
    "/api/customers"
  );

  const catalogById = useMemo(() => {
    const map = new Map<
      string,
      {
        customerName: string;
        location: string;
        fileName: string;
        href: string;
        lastModified: string;
        outdated: boolean;
        balanceLabel: string | null;
      }
    >();

    for (const item of data?.items ?? []) {
      map.set(item.id, {
        customerName: item.customerName,
        location: item.location,
        fileName: item.fileName,
        href: item.href,
        lastModified: item.lastModified,
        outdated: item.outdated,
        balanceLabel:
          item.balanceAvailable && item.balance != null
            ? formatBDT(item.balance)
            : item.status === "unavailable"
              ? "Balance Unavailable"
              : null,
      });
    }

    return map;
  }, [data]);

  useEffect(() => {
    if (!ready || !data?.available) return;
    pruneMissing(new Set(data.items.map((item) => item.id)));
  }, [data, pruneMissing, ready]);

  const visible = favorites.filter(
    (item) => !data?.available || catalogById.has(item.id)
  );

  const catalogMessage =
    status === "error"
      ? "Favorite details could not be loaded."
      : data && !data.available
        ? data.message
        : null;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          <span>Favorites</span>
          {ready ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-sm font-medium text-muted shadow-[var(--shadow-soft)]">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" aria-hidden />
              {visible.length}
            </span>
          ) : null}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Quick access to your saved customers
        </p>
      </header>

      {catalogMessage ? (
        <p className="text-sm text-muted">{catalogMessage}</p>
      ) : null}

      {!ready ? (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.length > 0 ? (
            <ul className="space-y-3">
              {visible.map((saved) => {
                const live = catalogById.get(saved.id);
                const name = live?.customerName || saved.customerName;
                const location = live?.location || saved.location || "";
                const balance = live?.balanceLabel || "Balance not loaded";
                const updated = live?.lastModified
                  ? `Updated ${live.lastModified}`
                  : null;

                return (
                  <li
                    key={saved.id}
                    className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={live?.href || saved.href}
                        className="flex min-w-0 flex-1 items-start gap-3"
                      >
                        <span
                          aria-hidden
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold tracking-wide text-accent"
                        >
                          {customerInitials(name)}
                        </span>
                        <span className="min-w-0 flex-1 pt-0.5">
                          <span className="block truncate text-sm font-semibold text-foreground sm:text-base">
                            {name}
                          </span>
                          <span className="mt-1 block truncate text-sm text-muted">
                            {location || saved.fileName}
                            {live?.outdated ? " · Outdated" : ""}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFavorite(saved.id)}
                        className={cn(
                          "mt-0.5 inline-flex h-8 shrink-0 items-center rounded-[var(--radius-sm)] px-2.5 text-xs font-medium text-muted",
                          "hover:bg-surface-muted hover:text-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                        )}
                      >
                        Remove
                      </button>
                    </div>
                    <Link
                      href={live?.href || saved.href}
                      className="mt-3 block min-w-0"
                    >
                      <span className="block text-lg font-bold tabular-nums text-amber-500 sm:text-xl">
                        {balance}
                      </span>
                      {updated ? (
                        <span className="mt-1 block text-xs text-muted">
                          {updated}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <Link
            href="/customers"
            className="flex w-full items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-5 py-6 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground sm:px-8 sm:py-7"
          >
            Star a customer to see them here
          </Link>
        </div>
      )}
    </div>
  );
}
