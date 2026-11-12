"use client";

import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { FavoriteCustomer } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type FavoriteCustomersProps = {
  favorites: FavoriteCustomer[];
  ready: boolean;
};

export function FavoriteCustomers({
  favorites,
  ready,
}: FavoriteCustomersProps) {
  const top = favorites.slice(0, 5);

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Favorite Customers
          </h2>
          <p className="mt-1 text-sm text-muted">Saved for quick access</p>
        </div>
        <Link
          href="/favorites"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-opacity duration-[var(--motion-fast)] hover:opacity-80"
        >
          View All
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!ready ? (
        <div className="mt-5 space-y-2" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-[var(--radius-md)] bg-surface-muted"
            />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="mt-6 flex items-start gap-3 text-sm text-muted">
          <Star className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            No favorites yet. Save customers from their detail pages to see them
            here.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-1">
          {top.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2.5",
                  "transition-[background-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                  "hover:bg-surface-muted active:scale-[0.995]"
                )}
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
                  <Star className="h-4 w-4 fill-current" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.customerName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {item.location || "Customer ledger"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
