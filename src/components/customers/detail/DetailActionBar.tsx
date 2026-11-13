"use client";

import {
  Download,
  LoaderCircle,
  RefreshCw,
  Share2,
  Star,
} from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import type { FavoriteCustomer } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type DetailActionBarProps = {
  favoriteItem: FavoriteCustomer | null;
  pending: boolean;
  onRefresh: () => void;
  onShare: () => void;
  onPdf: () => void;
  className?: string;
};

const btnClass = cn(
  "inline-flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-[14px] border border-border bg-surface px-1 py-2",
  "text-foreground transition-[background-color,transform,opacity] duration-[var(--motion-fast)]",
  "hover:bg-surface-muted active:scale-[0.98] disabled:opacity-60"
);

export function DetailActionBar({
  favoriteItem,
  pending,
  onRefresh,
  onShare,
  onPdf,
  className,
}: DetailActionBarProps) {
  const { isFavorite, toggleFavorite, ready } = useFavorites();
  const active = favoriteItem ? isFavorite(favoriteItem.id) : false;

  return (
    <div className={cn("grid grid-cols-4 gap-2.5", className)}>
      <button
        type="button"
        disabled={!favoriteItem || !ready}
        aria-pressed={active}
        aria-label={active ? "Remove from favorites" : "Add to favorites"}
        onClick={() => {
          if (favoriteItem) toggleFavorite(favoriteItem);
        }}
        className={btnClass}
      >
        <Star
          className={cn(
            "h-[18px] w-[18px] text-foreground",
            active && "fill-current"
          )}
          aria-hidden
        />
        <span className="text-xs font-semibold">Favorite</span>
      </button>

      <button
        type="button"
        onClick={onRefresh}
        disabled={pending}
        aria-label={pending ? "Refreshing" : "Refresh"}
        className={btnClass}
      >
        {pending ? (
          <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="h-[18px] w-[18px] text-muted" aria-hidden />
        )}
        <span className="text-xs font-semibold">
          {pending ? "…" : "Refresh"}
        </span>
      </button>

      <button
        type="button"
        onClick={onShare}
        aria-label="Share"
        className={btnClass}
      >
        <Share2 className="h-[18px] w-[18px] text-muted" aria-hidden />
        <span className="text-xs font-semibold">Share</span>
      </button>

      <button
        type="button"
        onClick={onPdf}
        aria-label="Download PDF"
        className={btnClass}
      >
        <Download className="h-[18px] w-[18px] text-muted" aria-hidden />
        <span className="text-xs font-semibold">PDF</span>
      </button>
    </div>
  );
}
