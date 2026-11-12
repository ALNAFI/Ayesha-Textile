"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { Sidebar } from "@/components/layout/Sidebar";
import { SearchProvider } from "@/components/search/SearchProvider";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "ayesha-sidebar-collapsed";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <SearchProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

        <div
          className={cn(
            "app-content flex min-h-dvh flex-col",
            collapsed
              ? "md:pl-[var(--sidebar-width-collapsed)]"
              : "md:pl-[var(--sidebar-width)]"
          )}
        >
          <Header pathname={pathname} />

          <main
            className={cn(
              "flex-1 px-4 py-6 sm:px-6",
              "pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+1.25rem)] md:pb-8"
            )}
          >
            <div className="mx-auto w-full max-w-6xl">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>

        <MobileNav />
      </div>
    </SearchProvider>
  );
}
