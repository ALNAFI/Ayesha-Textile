"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Users } from "lucide-react";
import { CustomerBalance } from "@/components/customers/CustomerBalance";
import { CustomerFavoriteStar } from "@/components/customers/CustomerFavoriteStar";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import type { CustomerListItem } from "@/lib/customers/types";
import { recordRecentOpen } from "@/hooks/use-recent-opens";
import { cn } from "@/lib/utils";

type CustomersDesktopTableProps = {
  items: CustomerListItem[];
};

export function CustomersDesktopTable({ items }: CustomersDesktopTableProps) {
  const router = useRouter();

  function openItem(item: CustomerListItem) {
    recordRecentOpen({
      id: item.id,
      kind: "customer",
      title: item.customerName,
      subtitle: item.location,
      href: item.href,
    });
    router.push(item.href);
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead className="border-b border-border bg-background/70">
          <tr className="text-xs font-medium text-muted">
            <th className="px-5 py-3.5 font-medium">Customer Name</th>
            <th className="px-4 py-3.5 font-medium">Location</th>
            <th className="px-4 py-3.5 font-medium">Due Balance</th>
            <th className="px-4 py-3.5 font-medium">Status</th>
            <th className="px-4 py-3.5 font-medium">Last Updated</th>
            <th className="px-5 py-3.5 text-right font-medium">Favorite</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              tabIndex={0}
              onClick={() => openItem(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openItem(item);
                }
              }}
              className={cn(
                "cursor-pointer border-b border-border last:border-b-0",
                "transition-[background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "hover:bg-surface-muted/60 focus-visible:bg-accent-soft focus-visible:outline-none"
              )}
            >
              <td className="px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.customerName}
                      </p>
                      {item.outdated ? (
                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[0.65rem] font-medium text-muted">
                          Outdated
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {item.fileName}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-foreground">
                {item.location || "—"}
              </td>
              <td className="px-4 py-4">
                <CustomerBalance item={item} />
              </td>
              <td className="px-4 py-4">
                <CustomerStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-4 text-sm text-muted">
                {item.lastModified}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
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
                  <Link
                    href={item.href}
                    onClick={(event) => {
                      event.stopPropagation();
                      recordRecentOpen({
                        id: item.id,
                        kind: "customer",
                        title: item.customerName,
                        subtitle: item.location,
                        href: item.href,
                      });
                    }}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 text-xs font-medium text-accent",
                      "transition-[background-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                      "hover:bg-accent-soft active:scale-95"
                    )}
                    aria-label={`Open ${item.customerName}`}
                  >
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
