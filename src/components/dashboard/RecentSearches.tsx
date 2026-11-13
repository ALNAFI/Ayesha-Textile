"use client";

import Link from "next/link";
import { Clock3, FileSpreadsheet, Users } from "lucide-react";
import { formatRefreshTime, formatTimeAgo } from "@/lib/dashboard/format";
import type { RecentOpenItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type RecentSearchesProps = {
  items: RecentOpenItem[];
  ready: boolean;
};

export function RecentSearches({ items, ready }: RecentSearchesProps) {
  return (
    <section className="box-border w-full min-w-0 max-w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">
          Recent Searches
        </h2>
        <p className="mt-1 text-sm text-muted">From your recent opens</p>
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
      ) : items.length === 0 ? (
        <div className="mt-6 flex items-start gap-3 text-sm text-muted">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            No recent activity yet. Open a customer or file from search to build
            this list.
          </p>
        </div>
      ) : (
        <ul className="mt-5 w-full min-w-0 space-y-1">
          {items.slice(0, 5).map((item) => {
            const Icon = item.kind === "customer" ? Users : FileSpreadsheet;
            const when = formatTimeAgo(item.openedAt);
            const exact = formatRefreshTime(
              new Date(item.openedAt).toISOString()
            );
            return (
              <li key={`${item.id}-${item.openedAt}`} className="min-w-0">
                <Link
                  href={item.href}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2.5",
                    "transition-[background-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    "hover:bg-surface-muted active:scale-[0.995]"
                  )}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="block truncate text-xs text-muted">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="w-[5.75rem] shrink-0 text-right text-xs text-muted"
                    title={exact}
                  >
                    {when}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
