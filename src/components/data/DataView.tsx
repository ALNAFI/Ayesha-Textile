"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { matchesFileSearch } from "@/lib/files/search";
import { sortFileItems } from "@/lib/files/sort";
import type { FileListSnapshot } from "@/lib/files/types";
import { formatRefreshTime } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

type DataViewProps = {
  initialData: FileListSnapshot;
};

export function DataView({ initialData }: DataViewProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = useMemo(
    () =>
      sortFileItems(
        data.items.filter((item) => matchesFileSearch(item, query)),
        "name-asc"
      ),
    [data.items, query]
  );

  function refresh() {
    startTransition(async () => {
      const res = await fetch("/api/files", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) return;
      setData((await res.json()) as FileListSnapshot);
    });
  }

  return (
    <div className="files-stagger space-y-6">
      <header className="files-section flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Data
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Pick a file to add a new entry to its last row
          </p>
          {data.available ? (
            <p className="mt-3 text-sm text-muted">
              {data.totalCount} Excel file{data.totalCount === 1 ? "" : "s"}
              {data.refreshedAtIso
                ? ` · Updated ${formatRefreshTime(data.refreshedAtIso)}`
                : null}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 self-start rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground",
            "transition-[background-color,transform,opacity] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
            "hover:bg-surface-muted active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-70"
          )}
        >
          {pending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4 text-muted" aria-hidden />
          )}
          {pending ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {!data.available ? (
        <div className="files-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 text-sm text-muted shadow-[var(--shadow-soft)]">
          {data.message}
        </div>
      ) : (
        <>
          <div className="files-section">
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
                placeholder="Search by filename, customer, or location…"
                aria-label="Search files"
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
          </div>

          <div className="files-section">
            {visible.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]">
                <p className="text-sm font-medium text-foreground">
                  No files match
                </p>
                <p className="mt-2 text-sm text-muted">
                  Try another search term.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]">
                {visible.map((item) => {
                  const Icon = item.kind === "customer" ? Users : FileSpreadsheet;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/data/${item.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-[var(--motion-fast)] hover:bg-surface-muted sm:px-5"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {item.kind === "customer"
                              ? item.customerName || item.fileName
                              : item.fileName}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {item.kind === "customer" && item.location
                              ? `${item.location} · `
                              : ""}
                            Updated {item.lastModified}
                          </span>
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-muted"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
