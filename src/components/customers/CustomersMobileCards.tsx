"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { CustomerBalance } from "@/components/customers/CustomerBalance";
import { CustomerFavoriteStar } from "@/components/customers/CustomerFavoriteStar";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import type { CustomerListItem } from "@/lib/customers/types";
import { recordRecentOpen } from "@/hooks/use-recent-opens";
import { cn } from "@/lib/utils";

type CustomersMobileCardsProps = {
  items: CustomerListItem[];
};

export function CustomersMobileCards({ items }: CustomersMobileCardsProps) {
  return (
    <ul className="space-y-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {items.map((item) => (
        <li key={item.id}>
          <div
            className={cn(
              "rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]",
              "transition-[background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]"
            )}
          >
            <div className="flex items-start gap-3">
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
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted"
                aria-label={`Open ${item.customerName}`}
              >
                <Users className="h-4 w-4" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
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
                    className="min-w-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.customerName}
                      </p>
                      {item.outdated ? (
                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[0.65rem] font-medium text-muted">
                          Outdated
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      {item.location || "—"}
                    </p>
                  </Link>

                  <CustomerFavoriteStar
                    item={{
                      id: item.id,
                      customerName: item.customerName,
                      location: item.location,
                      fileName: item.fileName,
                      href: item.href,
                      savedAt: Date.now(),
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <CustomerStatusBadge status={item.status} />
                  <CustomerBalance item={item} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">{item.lastModified}</p>
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
                    className="text-xs font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
