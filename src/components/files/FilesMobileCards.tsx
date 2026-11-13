"use client";

import Link from "next/link";
import { FileSpreadsheet, Users } from "lucide-react";
import type { FileListItem } from "@/lib/files/types";
import { recordRecentOpen } from "@/hooks/use-recent-opens";
import { cn } from "@/lib/utils";

type FilesMobileCardsProps = {
  items: FileListItem[];
};

export function FilesMobileCards({ items }: FilesMobileCardsProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = item.kind === "customer" ? Users : FileSpreadsheet;
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={() =>
                recordRecentOpen({
                  id: item.id,
                  kind: item.kind,
                  title:
                    item.kind === "customer"
                      ? item.customerName || item.fileName
                      : item.fileName,
                  subtitle:
                    item.kind === "customer"
                      ? item.location
                      : "Other Excel file",
                  href: item.href,
                })
              }
              className={cn(
                "block rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]",
                "transition-[transform,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "hover:bg-surface-muted/50 active:scale-[0.995]"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.fileName}
                    </p>
                    {item.outdated ? (
                      <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[0.65rem] font-medium text-muted">
                        Outdated
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        item.kind === "customer"
                          ? "bg-accent-soft text-accent"
                          : "bg-surface-muted text-muted"
                      )}
                    >
                      {item.kind === "customer" ? "Customer" : "Other"}
                    </span>
                    <span>{item.lastModified}</span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
