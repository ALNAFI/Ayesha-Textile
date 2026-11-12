"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

export function FavoritesView() {
  const { favorites, ready, removeFavorite } = useFavorites();

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Favorites
      </h2>
      <p className="mt-2 text-sm text-muted">
        Customers you saved for quick access. Stored locally in this browser.
      </p>

      {!ready ? (
        <div className="mt-6 space-y-2" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-[var(--radius-md)] bg-surface-muted"
            />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="mt-8 flex items-start gap-3 text-sm text-muted">
          <Star className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            No favorite customers yet. Open a customer and use Add favorite to
            save them here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-1">
          {favorites.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 hover:bg-surface-muted"
            >
              <Link href={item.href} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.customerName}
                </span>
                <span className="block truncate text-xs text-muted">
                  {item.location || item.fileName}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => removeFavorite(item.id)}
                className={cn(
                  "inline-flex h-8 items-center rounded-[var(--radius-sm)] px-2.5 text-xs font-medium text-muted",
                  "transition-colors duration-[var(--motion-fast)] hover:bg-background hover:text-foreground"
                )}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
