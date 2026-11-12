"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteCustomer } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type FavoriteToggleProps = {
  item: FavoriteCustomer;
};

export function FavoriteToggle({ item }: FavoriteToggleProps) {
  const { isFavorite, toggleFavorite, ready } = useFavorites();
  const active = isFavorite(item.id);

  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      onClick={() => toggleFavorite(item)}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium",
        "transition-[background-color,transform,color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "hover:bg-surface-muted active:scale-[0.98]",
        active ? "text-accent" : "text-foreground",
        "disabled:opacity-60"
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-current")} />
      {active ? "Favorited" : "Add favorite"}
    </button>
  );
}
