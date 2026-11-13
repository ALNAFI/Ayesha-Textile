import { formatBDT } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

type DetailStatTileProps = {
  label: string;
  value: number | null;
  className?: string;
};

export function DetailStatTile({
  label,
  value,
  className,
}: DetailStatTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface px-4 py-3.5",
        className
      )}
    >
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted"
          aria-hidden
        />
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tracking-tight text-foreground tabular-nums">
        {value == null ? "Unavailable" : formatBDT(value)}
      </p>
    </div>
  );
}
