"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="grid h-[var(--mobile-nav-height)] grid-cols-4">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-medium",
                  "transition-[color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                  active
                    ? "text-accent"
                    : "text-muted hover:text-foreground active:scale-95"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    active && "scale-105"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
