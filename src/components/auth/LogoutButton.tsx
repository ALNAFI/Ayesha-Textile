"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { cacheClear } from "@/lib/client-cache";
import { clearCachedPages } from "@/lib/page-cache";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        void (async () => {
          setPending(true);
          try {
            // Sign out first: it must work even when the cached copies cannot be cleared.
            await fetch("/api/auth/logout", {
              method: "POST",
              cache: "no-store",
            }).catch(() => undefined);
            await cacheClear().catch(() => undefined);
            await clearCachedPages().catch(() => undefined);
          } finally {
            // Full page load, so a cached app shell cannot stay on screen.
            window.location.assign("/login");
          }
        })();
      }}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-foreground",
        "transition-[background-color,transform,opacity] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "hover:bg-surface-muted active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <LogOut className="h-4 w-4 text-muted" aria-hidden />
      )}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
