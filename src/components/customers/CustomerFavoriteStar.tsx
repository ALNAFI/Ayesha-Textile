"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteCustomer } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type CustomerFavoriteStarProps = {
  item: FavoriteCustomer;
  className?: string;
  /** `neutral` uses theme tokens (mobile cards). Default keeps desktop amber. */
  tone?: "accent" | "neutral";
};

export function CustomerFavoriteStar({
  item,
  className,
  tone = "accent",
}: CustomerFavoriteStarProps) {
  const { isFavorite, toggleFavorite, ready } = useFavorites();
  const active = isFavorite(item.id);
  const neutral = tone === "neutral";

  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={active}
      data-active={active ? "true" : undefined}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(item);
      }}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-transparent",
        "transition-[background-color,transform,color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "hover:bg-surface-muted active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        neutral
          ? active
            ? "text-foreground"
            : "text-muted"
          : active
            ? "text-[#F79009]"
            : "text-[#667085]",
        "disabled:opacity-50",
        className
      )}
    >
      <Star
        className={cn(
          "h-[22px] w-[22px] transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)]",
          neutral
            ? active
              ? "fill-current stroke-current"
              : "fill-none stroke-current"
            : active
              ? "fill-[#F79009] stroke-[#F79009]"
              : "fill-none stroke-[#667085]"
        )}
        aria-hidden
      />
    </button>
  );
}
