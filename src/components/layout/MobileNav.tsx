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
      className="fixed inset-x-0 z-40 px-3.5 print:hidden md:hidden"
      style={{
        bottom: "calc(var(--mobile-nav-offset) + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <ul
        className={cn(
          "mx-auto flex h-[var(--mobile-nav-height)] w-full max-w-lg items-stretch gap-1 rounded-[1.875rem] border p-2",
          "border-[color-mix(in_srgb,var(--border)_70%,transparent)]",
          "bg-[color-mix(in_srgb,var(--surface)_72%,transparent)]",
          "shadow-[var(--shadow-soft),0_18px_40px_color-mix(in_srgb,var(--foreground)_12%,transparent)]",
          "backdrop-blur-[18px]"
        )}
        style={{ WebkitBackdropFilter: "blur(18px)" }}
      >
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl px-1.5",
                  "text-[11px] font-medium leading-none",
                  "transition-[background-color,color,box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-out)]",
                  "active:scale-[0.96]",
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_20%,transparent),0_0_16px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
                    : "bg-transparent text-muted"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="max-w-full truncate">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
