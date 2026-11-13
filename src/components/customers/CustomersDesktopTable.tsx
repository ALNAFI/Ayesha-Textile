"use client";

import { useRouter } from "next/navigation";
import { CustomerBalance } from "@/components/customers/CustomerBalance";
import { CustomerFavoriteStar } from "@/components/customers/CustomerFavoriteStar";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { customerInitials } from "@/lib/customers/initials";
import type { CustomerListItem } from "@/lib/customers/types";
import { formatTimeAgo } from "@/lib/dashboard/format";
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
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[18%]" />
          <col className="w-[18%]" />
          <col className="w-[12%]" />
          <col className="w-[16%]" />
          <col className="w-[8%]" />
        </colgroup>
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
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] text-xs font-bold text-[#101828] dark:bg-[#F2F4F7] dark:text-[#101828]"
                  >
                    {customerInitials(item.customerName)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.customerName}
                      </p>
                      {item.outdated ? (
                        <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[0.65rem] font-medium text-muted">
                          Outdated
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-foreground">
                <span className="block truncate">{item.location || "—"}</span>
              </td>
              <td className="px-4 py-4">
                <CustomerBalance
                  item={item}
                  className="block truncate tabular-nums"
                />
              </td>
              <td className="px-4 py-4">
                <CustomerStatusBadge status={item.status} variant="compact" />
              </td>
              <td
                className="px-4 py-4 text-sm text-muted"
                title={item.lastModified}
              >
                <span className="block truncate">
                  {formatTimeAgo(item.modifiedAt)}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
