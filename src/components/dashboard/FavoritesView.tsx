"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteCatalogItem } from "@/lib/favorites/types";
import { cn } from "@/lib/utils";

type FavoritesViewProps = {
  catalog: FavoriteCatalogItem[];
  catalogAvailable: boolean;
  catalogMessage: string;
};

export function FavoritesView({
  catalog,
  catalogAvailable,
  catalogMessage,
}: FavoritesViewProps) {
  const { favorites, ready, removeFavorite, pruneMissing } = useFavorites();
  const catalogById = new Map(catalog.map((item) => [item.id, item]));

  useEffect(() => {
    if (!ready || !catalogAvailable) return;
    pruneMissing(new Set(catalog.map((item) => item.id)));
  }, [catalog, catalogAvailable, pruneMissing, ready]);

  const visible = favorites.filter(
    (item) => !catalogAvailable || catalogById.has(item.id)
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Favorites
        </h2>
        <p className="mt-2 text-sm text-muted">
          Customers saved in this browser
          {ready ? ` · ${visible.length}` : ""}
        </p>
      </header>

      {!catalogAvailable ? (
        <p className="text-sm text-muted">{catalogMessage}</p>
      ) : null}

      {!ready ? (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-[var(--radius-lg)] border border-border bg-surface"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]">
          <Star className="mx-auto h-5 w-5 text-muted" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            No favorite customers
          </p>
          <p className="mt-2 text-sm text-muted">
            Star a customer from the Customers page to keep them here.
          </p>
          <Link
            href="/customers"
            className="mt-4 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Browse customers
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((saved) => {
            const live = catalogById.get(saved.id);
            return (
              <li
                key={saved.id}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={live?.href || saved.href} className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {live?.customerName || saved.customerName}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {live?.location || saved.location || saved.fileName}
                      {live?.outdated ? " · Outdated" : ""}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFavorite(saved.id)}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center rounded-[var(--radius-sm)] px-2.5 text-xs font-medium text-muted",
                      "hover:bg-surface-muted hover:text-foreground"
                    )}
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium tabular-nums text-foreground">
                    {live?.balanceLabel || "Balance not loaded"}
                  </span>
                  {live?.statusLabel ? (
                    <span className="text-xs text-muted">{live.statusLabel}</span>
                  ) : null}
                  <span className="text-xs text-muted">
                    {live?.lastModified || ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
