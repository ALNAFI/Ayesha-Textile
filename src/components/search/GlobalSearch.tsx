"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Search, Users, X } from "lucide-react";
import type { DashboardFileItem } from "@/lib/dashboard/types";
import { recordRecentOpen, useRecentOpens } from "@/hooks/use-recent-opens";
import {
  compareSearchResults,
  getSearchScore,
  highlightSearchMatch,
} from "@/lib/search/rank";
import { cn } from "@/lib/utils";

type GlobalSearchProps = {
  items: DashboardFileItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "dialog" | "inline";
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  unavailableMessage?: string | null;
};

function itemName(item: DashboardFileItem) {
  return item.kind === "customer"
    ? item.customerName || item.fileName
    : item.fileName;
}

function itemLocation(item: DashboardFileItem) {
  return item.kind === "customer" ? item.location || "" : "";
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const parts = highlightSearchMatch(text, query);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.before}
      <span className="font-semibold">{parts.match}</span>
      {parts.after}
    </>
  );
}

export function GlobalSearch({
  items,
  open,
  onOpenChange,
  mode = "dialog",
  placeholder = "Search customers or files…",
  className,
  inputClassName,
  unavailableMessage,
}: GlobalSearchProps) {
  const router = useRouter();
  const { items: recentItems } = useRecentOpens();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const trimmed = query.trim();
  const showRecent = trimmed.length === 0;

  const results = useMemo(() => {
    if (!trimmed) return [];
    return items
      .map((item) => {
        const name = itemName(item);
        const location = itemLocation(item);
        return {
          item,
          name,
          location,
          score: getSearchScore({ name, location }, trimmed),
        };
      })
      .filter((entry) => entry.score > 0)
      .sort(compareSearchResults)
      .slice(0, 8)
      .map((entry) => entry.item);
  }, [items, trimmed]);

  const recent = useMemo(() => recentItems.slice(0, 5), [recentItems]);

  const listLength = showRecent ? recent.length : results.length;

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setQuery("");
        setActiveIndex(0);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveIndex(0), 0);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open || mode !== "inline") return;

    function onPointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      // Ignore hidden instances (e.g. desktop search while mobile overlay is open).
      if (root.getClientRects().length === 0) return;
      if (!root.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open, mode, onOpenChange]);

  function selectDashboardItem(item: DashboardFileItem) {
    recordRecentOpen({
      id: item.id,
      kind: item.kind,
      title:
        item.kind === "customer"
          ? item.customerName || item.fileName
          : item.fileName,
      subtitle:
        item.kind === "customer" ? item.location : "Other file",
      href: item.href,
    });
    onOpenChange(false);
  }

  function selectRecent(
    item: (typeof recent)[number]
  ) {
    recordRecentOpen({
      id: item.id,
      kind: item.kind,
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
    });
    onOpenChange(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        listLength === 0 ? 0 : (index + 1) % listLength
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        listLength === 0 ? 0 : (index - 1 + listLength) % listLength
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (showRecent) {
        const item = recent[activeIndex];
        if (item) {
          selectRecent(item);
          router.push(item.href);
        }
        return;
      }
      const item = results[activeIndex];
      if (item) {
        selectDashboardItem(item);
        router.push(item.href);
      }
    } else if (event.key === "Escape") {
      onOpenChange(false);
      inputRef.current?.blur();
    }
  }

  const searchField = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3",
        "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "focus-within:border-accent focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]",
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
        className={cn(
          "w-full min-w-0 flex-1 appearance-none border-0 bg-transparent text-sm text-foreground shadow-none",
          "outline-none ring-0",
          "focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none",
          "focus-visible:border-0 focus-visible:!outline-none focus-visible:ring-0 focus-visible:shadow-none",
          "placeholder:text-muted-foreground",
          inputClassName ?? "h-11"
        )}
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
        mode === "inline" &&
          "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 mt-0"
      )}
    >
      {unavailableMessage ? (
        <p className="px-4 py-6 text-sm text-muted">{unavailableMessage}</p>
      ) : showRecent ? (
        recent.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">
            Type a customer name, location, or filename.
          </p>
        ) : (
          <>
            <p className="px-4 pb-1 pt-3 text-[0.7rem] font-medium uppercase tracking-wide text-muted">
              Recent
            </p>
            <ul className="overflow-hidden py-1">
              {recent.map((item, index) => {
                const Icon = item.kind === "customer" ? Users : FileSpreadsheet;
                const active = index === activeIndex;
                return (
                  <li key={item.id} role="option" aria-selected={active}>
                    <Link
                      href={item.href}
                      onClick={() => selectRecent(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                        active
                          ? "bg-accent-soft text-foreground"
                          : "hover:bg-surface-muted"
                      )}
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {item.subtitle ||
                            (item.kind === "customer"
                              ? "Customer ledger"
                              : "Other file")}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )
      ) : results.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">
          {items.length === 0
            ? "No searchable files are available yet."
            : "No customers or files match that search."}
        </p>
      ) : (
        <ul className="overflow-hidden py-1">
          {results.map((item, index) => {
            const Icon = item.kind === "customer" ? Users : FileSpreadsheet;
            const active = index === activeIndex;
            return (
              <li key={item.id} role="option" aria-selected={active}>
                <Link
                  href={item.href}
                  onClick={() => selectDashboardItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    active
                      ? "bg-accent-soft text-foreground"
                      : "hover:bg-surface-muted"
                  )}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      <HighlightedText text={itemName(item)} query={trimmed} />
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
      <div className="relative" ref={rootRef}>
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
        className="dialog-enter w-full max-w-xl"
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
