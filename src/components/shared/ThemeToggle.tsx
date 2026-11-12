"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface text-foreground",
        "transition-[background-color,border-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "hover:bg-surface-muted active:scale-95",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-[opacity,transform] duration-[var(--motion-base)] ease-[var(--ease-out)]",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-75 opacity-0"
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-[opacity,transform] duration-[var(--motion-base)] ease-[var(--ease-out)]",
          isDark
            ? "rotate-90 scale-75 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        )}
      />
    </button>
  );
}
