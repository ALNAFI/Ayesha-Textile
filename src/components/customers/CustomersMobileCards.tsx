"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { CustomerFavoriteStar } from "@/components/customers/CustomerFavoriteStar";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { customerInitials } from "@/lib/customers/initials";
import type { CustomerListItem } from "@/lib/customers/types";
import { formatBDT, formatTimeAgo } from "@/lib/dashboard/format";
import { recordRecentOpen } from "@/hooks/use-recent-opens";
import { cn } from "@/lib/utils";

type CustomersMobileCardsProps = {
  items: CustomerListItem[];
};

function statusAmount(item: CustomerListItem) {
  if (
    item.status === "unavailable" ||
    !item.balanceAvailable ||
    item.balance == null
  ) {
    return (
      <span className="text-[22px] font-bold tracking-[-0.02em] text-muted tabular-nums">
        ৳ —
      </span>
    );
  }

  return (
    <span className="text-[22px] font-bold tracking-[-0.02em] text-foreground tabular-nums">
      {formatBDT(item.balance)}
    </span>
  );
}

export function CustomersMobileCards({ items }: CustomersMobileCardsProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      {items.map((item) => {
        const relativeDate =
          item.status === "unavailable"
            ? "Could not be updated"
            : formatTimeAgo(item.modifiedAt);
        const hasLocation = Boolean(item.location);

        return (
          <li key={item.id} className="min-w-0">
            <article
              className={cn(
                "relative flex flex-col gap-3 rounded-[18px] border border-border bg-surface p-4",
                "shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
                "dark:shadow-[0_1px_2px_rgba(0,0,0,0.24)]"
              )}
            >
              <Link
                href={item.href}
                onClick={() =>
                  recordRecentOpen({
                    id: item.id,
                    kind: "customer",
                    title: item.customerName,
                    subtitle: item.location,
                    href: item.href,
                  })
                }
                className={cn(
                  "absolute inset-0 z-0 rounded-[18px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                aria-label={`Open ${item.customerName}`}
              />

              <div className="relative z-10 flex items-center gap-3 pointer-events-none">
                <span
                  aria-hidden
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] text-[15px] font-bold text-[#101828] dark:bg-[#F2F4F7] dark:text-[#101828]"
                >
                  {customerInitials(item.customerName)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold leading-[22px] text-foreground">
                    {item.customerName}
                  </p>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] leading-[18px] text-muted">
                    {hasLocation ? (
                      <>
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />
                        <span className="truncate">{item.location}</span>
                        <span
                          className="h-[3px] w-[3px] shrink-0 rounded-full bg-muted"
                          aria-hidden
                        />
                      </>
                    ) : null}
                    <span
                      className="truncate"
                      title={
                        item.status === "unavailable"
                          ? undefined
                          : item.lastModified
                      }
                    >
                      {relativeDate}
                    </span>
                  </p>
                </div>

                <CustomerFavoriteStar
                  item={{
                    id: item.id,
                    customerName: item.customerName,
                    location: item.location,
                    fileName: item.fileName,
                    href: item.href,
                    savedAt: item.modifiedAt || 0,
                  }}
                  className="pointer-events-auto relative z-20 -mr-2 h-11 w-11 shrink-0"
                />
              </div>

              <div className="relative z-10 pointer-events-none flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                <CustomerStatusBadge status={item.status} />
                {statusAmount(item)}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
