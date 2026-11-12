"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { FilesDesktopTable } from "@/components/files/FilesDesktopTable";
import { FilesMobileCards } from "@/components/files/FilesMobileCards";
import { matchesFileSearch } from "@/lib/files/search";
import { FILE_SORT_OPTIONS, sortFileItems } from "@/lib/files/sort";
import type {
  FileListFilter,
  FileListSnapshot,
  FileListSort,
} from "@/lib/files/types";
import { formatRefreshTime } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

type FilesViewProps = {
  initialData: FileListSnapshot;
};

export function FilesView({ initialData }: FilesViewProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FileListFilter>("all");
  const [sort, setSort] = useState<FileListSort>("newest");
  const [pending, startTransition] = useTransition();

  const searched = useMemo(
    () => data.items.filter((item) => matchesFileSearch(item, query)),
    [data.items, query]
  );

  const counts = useMemo(() => {
    const customer = searched.filter((item) => item.kind === "customer").length;
    const other = searched.filter((item) => item.kind === "other").length;
    return {
      all: searched.length,
      customer,
      other,
    };
  }, [searched]);

  const visible = useMemo(() => {
    const filtered =
      filter === "all"
        ? searched
        : searched.filter((item) => item.kind === filter);
    return sortFileItems(filtered, sort);
  }, [searched, filter, sort]);

  async function refresh() {
    startTransition(async () => {
      const res = await fetch("/api/files", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) return;
      const next = (await res.json()) as FileListSnapshot;
      setData(next);
    });
  }

  const filters: Array<{
    id: FileListFilter;
    label: string;
    count: number;
    icon: typeof FileSpreadsheet;
  }> = [
    { id: "all", label: "All Files", count: counts.all, icon: FileSpreadsheet },
    { id: "customer", label: "Customers", count: counts.customer, icon: Users },
    { id: "other", label: "Other Files", count: counts.other, icon: FileSpreadsheet },
  ];

  return (
    <div className="files-stagger space-y-6">
      <header className="files-section flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            All Files
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Browse and manage your Excel files
          </p>
          <p className="mt-3 text-sm text-muted">
            {data.available
              ? `${data.totalCount} Excel file${data.totalCount === 1 ? "" : "s"} available`
              : "Drive files unavailable"}
            {data.refreshedAtIso
              ? ` · Updated ${formatRefreshTime(data.refreshedAtIso)}`
              : null}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
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
          <div className="files-section space-y-4">
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

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="tablist"
                aria-label="File filters"
                className="inline-flex w-full flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1 shadow-[var(--shadow-soft)] sm:w-auto"
              >
                {filters.map((item) => {
                  const active = filter === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(item.id)}
                      className={cn(
                        "inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium sm:flex-none",
                        "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                        active
                          ? "bg-accent-soft text-foreground"
                          : "text-muted hover:bg-surface-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[0.65rem]",
                          active
                            ? "bg-background text-foreground"
                            : "bg-surface-muted text-muted"
                        )}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="shrink-0">Sort</span>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as FileListSort)
                  }
                  className={cn(
                    "h-10 min-w-44 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-soft)]",
                    "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                  )}
                >
                  {FILE_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="files-section">
            {visible.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center shadow-[var(--shadow-soft)]">
                <p className="text-sm font-medium text-foreground">
                  No files match
                </p>
                <p className="mt-2 text-sm text-muted">
                  {query.trim()
                    ? "Try another search term or clear filters."
                    : "No Excel files were found in this category."}
                </p>
                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Clear search
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <FilesDesktopTable items={visible} />
                </div>
                <div className="md:hidden">
                  <FilesMobileCards items={visible} />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
