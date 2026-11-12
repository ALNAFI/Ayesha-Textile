"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteCustomer } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type CustomerFavoriteStarProps = {
  item: FavoriteCustomer;
  className?: string;
};

export function CustomerFavoriteStar({
  item,
  className,
}: CustomerFavoriteStarProps) {
  const { isFavorite, toggleFavorite, ready } = useFavorites();
  const active = isFavorite(item.id);

  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${item.customerName} from favorites`
          : `Add ${item.customerName} to favorites`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(item);
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]",
        "transition-[background-color,transform,color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "hover:bg-surface-muted active:scale-95",
        active ? "text-accent" : "text-muted hover:text-foreground",
        "disabled:opacity-50",
        className
      )}
    >
      <Star
        className={cn(
          "h-4 w-4 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)]",
          active && "fill-current scale-110"
        )}
      />
    </button>
  );
}
