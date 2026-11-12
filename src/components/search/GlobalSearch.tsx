"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Search, Users, X } from "lucide-react";
import type { DashboardFileItem } from "@/lib/dashboard/types";
import { recordRecentOpen } from "@/hooks/use-recent-opens";
import { cn } from "@/lib/utils";

type GlobalSearchProps = {
  items: DashboardFileItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "dialog" | "inline";
  placeholder?: string;
  className?: string;
  unavailableMessage?: string | null;
};

function matchesQuery(item: DashboardFileItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    item.fileName,
    item.customerName,
    item.location,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function GlobalSearch({
  items,
  open,
  onOpenChange,
  mode = "dialog",
  placeholder = "Search customers or files…",
  className,
  unavailableMessage,
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const filtered = items.filter((item) => matchesQuery(item, query));
    return filtered.slice(0, 8);
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function selectItem(item: DashboardFileItem) {
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
          : "Other file",
      href: item.href,
    });
    onOpenChange(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0 ? 0 : (index + 1) % results.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length === 0
          ? 0
          : (index - 1 + results.length) % results.length
      );
    } else if (event.key === "Enter") {
      const item = results[activeIndex];
      if (item) {
        event.preventDefault();
        selectItem(item);
        router.push(item.href);
      }
    } else if (event.key === "Escape") {
      onOpenChange(false);
    }
  }

  const searchField = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3",
        "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => onOpenChange(true)}
        placeholder={placeholder}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-expanded={open}
        className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery("")}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors duration-[var(--motion-fast)] hover:bg-surface-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );

  const resultsPanel = open ? (
    <div
      id={listId}
      role="listbox"
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]",
        mode === "inline" ? "mt-2" : ""
      )}
    >
      {unavailableMessage ? (
        <p className="px-4 py-6 text-sm text-muted">{unavailableMessage}</p>
      ) : results.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">
          {query.trim()
            ? "No customers or files match that search."
            : items.length === 0
              ? "No searchable files are available yet."
              : "Type a customer name, location, or filename."}
        </p>
      ) : (
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.map((item, index) => {
            const Icon = item.kind === "customer" ? Users : FileSpreadsheet;
            const active = index === activeIndex;
            return (
              <li key={item.id} role="option" aria-selected={active}>
                <Link
                  href={item.href}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    active ? "bg-accent-soft text-foreground" : "hover:bg-surface-muted"
                  )}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {item.kind === "customer"
                        ? item.customerName || item.fileName
                        : item.fileName}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {item.kind === "customer"
                        ? item.location || "Customer ledger"
                        : "Other file"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  ) : null;

  if (mode === "inline") {
    return (
      <div className="relative">
        {searchField}
        {resultsPanel}
      </div>
    );
  }

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop-enter fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-[12vh]"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="dialog-enter w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-[var(--shadow-soft)]">
          {searchField}
          <div className="mt-2">{resultsPanel}</div>
        </div>
      </div>
    </div>
  );
}
