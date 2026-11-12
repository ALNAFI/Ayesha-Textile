"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, Settings, X } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useSearch } from "@/components/search/SearchProvider";
import { getPageTitle } from "@/config/navigation";
import { cn } from "@/lib/utils";

type HeaderProps = {
  pathname: string;
};

export function Header({ pathname }: HeaderProps) {
  const title = getPageTitle(pathname);
  const { setOpen, ensureLoaded } = useSearch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl K");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setShortcutLabel(isMac ? "⌘K" : "Ctrl K");
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

  function openSearch() {
    setOpen(true);
    void ensureLoaded();
  }

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-3 border-b border-border bg-surface px-4 print:hidden sm:px-6">
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
          type="button"
          onClick={openSearch}
          className={cn(
            "hidden h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm text-muted sm:inline-flex",
            "transition-[background-color,border-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
            "hover:bg-surface-muted hover:text-foreground active:scale-[0.98]"
          )}
          aria-haspopup="dialog"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
            {shortcutLabel}
          </kbd>
        </button>

        <button
          type="button"
          onClick={openSearch}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background text-muted sm:hidden",
            "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
            "hover:bg-surface-muted hover:text-foreground active:scale-95"
          )}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <ThemeToggle />

        <div className="relative md:hidden" ref={menuRef}>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-haspopup="menu"
            onClick={() => setMobileMenuOpen((value) => !value)}
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
  );
}
