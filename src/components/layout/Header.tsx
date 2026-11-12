"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, RefreshCw, Search, Settings, X } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { getPageTitle } from "@/config/navigation";
import { cn } from "@/lib/utils";

type HeaderProps = {
  pathname: string;
};

export function Header({ pathname }: HeaderProps) {
  const title = getPageTitle(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  const dialogTitleId = useId();
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setShortcutLabel(isMac ? "⌘K" : "Ctrl K");

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      window.addEventListener("mousedown", onPointerDown);
    }

    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1
            key={title}
            className="page-enter truncate text-lg font-semibold tracking-tight text-foreground"
          >
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "hidden h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm text-muted sm:inline-flex",
              "transition-[background-color,border-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              "hover:bg-surface-muted hover:text-foreground active:scale-[0.98]"
            )}
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
              {shortcutLabel}
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background text-muted sm:hidden",
              "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              "hover:bg-surface-muted hover:text-foreground active:scale-95"
            )}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled
            title="Refresh will be available after Drive integration"
            aria-label="Refresh unavailable"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background text-muted-foreground opacity-55"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <ThemeToggle />

          <div className="relative md:hidden" ref={menuRef}>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background text-muted",
                "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "hover:bg-surface-muted hover:text-foreground active:scale-95"
              )}
            >
              <span className="relative h-4 w-4">
                <Menu
                  className={cn(
                    "absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    mobileMenuOpen
                      ? "rotate-90 scale-75 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  )}
                />
                <X
                  className={cn(
                    "absolute inset-0 h-4 w-4 transition-[opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    mobileMenuOpen
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-75 opacity-0"
                  )}
                />
              </span>
            </button>

            {mobileMenuOpen ? (
              <div
                role="menu"
                className="menu-enter absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-44 rounded-[var(--radius-md)] border border-border bg-surface p-1 shadow-[var(--shadow-soft)]"
              >
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-foreground",
                    "transition-[background-color,color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    "hover:bg-surface-muted"
                  )}
                >
                  <Settings className="h-4 w-4 text-muted" />
                  Settings
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {searchOpen ? (
        <div
          className="dialog-backdrop-enter fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-[12vh]"
          role="presentation"
          onClick={() => setSearchOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="dialog-enter w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id={dialogTitleId}
                  className="text-base font-semibold text-foreground"
                >
                  Search
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Global search will be available after Drive integration. No
                  results can be queried yet.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted",
                  "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                  "hover:bg-surface-muted hover:text-foreground active:scale-95"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              className={cn(
                "mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground"
              )}
              aria-disabled="true"
            >
              <Search className="h-4 w-4" />
              <span>Search is not connected yet</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
