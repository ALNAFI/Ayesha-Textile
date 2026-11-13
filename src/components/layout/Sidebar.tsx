"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { LogoGlyph } from "@/components/shared/BrandMark";
import { mainNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = mainNav.filter((item) => item.href !== "/settings");
  const settingsItem = mainNav.find((item) => item.href === "/settings");

  function renderNavLink(item: NavItem) {
    const Icon = item.icon;
    const active =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.title}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center rounded-[var(--radius-md)] text-sm font-medium",
          "transition-[background-color,color,padding,gap] duration-[var(--motion-base)] ease-[var(--ease-out)]",
          collapsed ? "justify-center gap-0 px-0 py-2.5" : "gap-3 px-3 py-2.5",
          active
            ? "bg-sidebar-active text-foreground"
            : "text-muted hover:bg-surface-muted hover:text-foreground"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent",
            "transition-opacity duration-[var(--motion-fast)] ease-[var(--ease-out)]",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
          )}
        />
        <Icon
          className={cn(
            "h-[1.125rem] w-[1.125rem] shrink-0 transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
            active ? "text-accent" : "text-muted group-hover:text-foreground"
          )}
        />
        <span
          className={cn(
            "sidebar-label overflow-hidden whitespace-nowrap",
            "transition-[opacity,max-width,transform] duration-[var(--motion-base)] ease-[var(--ease-out)]",
            collapsed
              ? "max-w-0 translate-x-1 opacity-0"
              : "max-w-[11rem] translate-x-0 opacity-100"
          )}
        >
          {item.title}
        </span>
      </Link>
    );
  }

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "app-sidebar fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-border bg-sidebar print:hidden md:flex md:flex-col",
        collapsed
          ? "w-[var(--sidebar-width-collapsed)]"
          : "w-[var(--sidebar-width)]"
      )}
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "flex h-[var(--header-height)] shrink-0 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-4"
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="group/brand relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] focus-visible:outline-none"
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-accent text-accent-foreground",
                "transition-[opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "group-hover/brand:scale-95 group-hover/brand:opacity-0",
                "group-focus-visible/brand:scale-95 group-focus-visible/brand:opacity-0"
              )}
            >
              <LogoGlyph />
            </span>
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 inline-flex items-center justify-center rounded-[var(--radius-md)]",
                "bg-surface-muted text-foreground",
                "opacity-0 transition-[opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "group-hover/brand:opacity-100 group-focus-visible/brand:opacity-100"
              )}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </span>
            <span className="sr-only">Ayesha Textile</span>
          </button>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent text-accent-foreground"
              >
                <LogoGlyph />
              </span>
              <span
                className={cn(
                  "sidebar-label truncate text-[0.95rem] font-semibold tracking-tight text-sidebar-foreground",
                  "transition-[opacity,transform] duration-[var(--motion-base)] ease-[var(--ease-out)]"
                )}
              >
                Ayesha Textile
              </span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted",
                "transition-[background-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "hover:bg-surface-muted hover:text-foreground active:scale-95"
              )}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-3">
        {menuItems.map((item) => renderNavLink(item))}
      </nav>

      {settingsItem ? (
        <div className="mt-auto shrink-0 border-t border-border p-3 pb-4">
          {renderNavLink(settingsItem)}
        </div>
      ) : null}
    </aside>
  );
}
