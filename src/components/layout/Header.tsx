"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Menu, Search, Settings, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useSearch } from "@/components/search/SearchProvider";
import { getPageTitle } from "@/config/navigation";
import { cn } from "@/lib/utils";

type HeaderProps = {
  pathname: string;
};

export function Header({ pathname }: HeaderProps) {
  const title = getPageTitle(pathname);
  const { open, setOpen, items, snapshot, loading } = useSearch();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unavailableMessage =
    snapshot && !snapshot.available
      ? snapshot.message
      : loading
        ? "Loading search index…"
        : null;

  useEffect(() => {
    setMounted(true);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!open) {
        setMobileSearchOpen(false);
        return;
      }
      if (window.matchMedia("(max-width: 639px)").matches) {
        setMobileSearchOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <header className="relative sticky top-0 z-30 border-b border-border bg-surface print:hidden">
      <div className="flex h-[var(--header-height)] items-center gap-3 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1
            key={title}
            className="page-enter truncate text-lg font-semibold tracking-tight text-foreground"
          >
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden w-56 sm:block lg:w-72 xl:w-80">
            <GlobalSearch
              mode="inline"
              open={open}
              onOpenChange={setOpen}
              items={items}
              unavailableMessage={unavailableMessage}
              className="h-9"
              inputClassName="h-9"
            />
          </div>

          <button
            type="button"
            onMouseDown={(event) => {
              // Keep icon toggle from being treated as an outside-click close.
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={() => {
              setMobileSearchOpen((value) => {
                const next = !value;
                setOpen(next);
                return next;
              });
            }}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-background text-muted sm:hidden",
              "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
              "hover:bg-surface-muted hover:text-foreground active:scale-95",
              "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
            )}
            aria-label="Search"
            aria-expanded={mobileSearchOpen}
          >
            <Search className="h-4 w-4" />
          </button>

          <ThemeToggle className="hidden md:inline-flex" />

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
                className="menu-enter absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-[var(--radius-md)] border border-border bg-surface p-2 shadow-[var(--shadow-soft)]"
              >
                <div className="px-1 pb-2 pt-1">
                  <p className="mb-1.5 text-xs font-medium text-muted">Theme</p>
                  <div
                    role="group"
                    aria-label="Theme"
                    className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-border bg-background p-1"
                  >
                    {(
                      [
                        ["light", "Light"],
                        ["dark", "Dark"],
                      ] as const
                    ).map(([value, label]) => {
                      const selected = mounted && theme === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={selected}
                          disabled={!mounted}
                          onClick={() => setTheme(value)}
                          className={cn(
                            "rounded-[var(--radius-sm)] px-2.5 py-2 text-sm font-medium",
                            "transition-[background-color,color] duration-[var(--motion-fast)]",
                            selected
                              ? "bg-accent-soft text-foreground"
                              : "text-muted hover:bg-surface-muted hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

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

                <div className="my-1 border-t border-border" role="separator" />

                <LogoutButton
                  className={cn(
                    "h-auto w-full justify-start gap-2 rounded-[var(--radius-sm)] border-0 bg-transparent px-3 py-2.5 text-sm font-medium shadow-none",
                    "hover:bg-surface-muted"
                  )}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="absolute inset-x-0 top-full z-40 bg-transparent px-4 py-3 sm:hidden">
          <GlobalSearch
            mode="inline"
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setMobileSearchOpen(false);
            }}
            items={items}
            unavailableMessage={unavailableMessage}
            className="h-10 bg-surface shadow-[var(--shadow-soft)]"
            inputClassName="h-10"
          />
        </div>
      ) : null}
    </header>
  );
}
