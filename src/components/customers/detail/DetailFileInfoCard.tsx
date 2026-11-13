import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

type DetailFileInfoCardProps = {
  fileName: string;
  lastModified: string;
  outdated?: boolean;
  className?: string;
};

export function DetailFileInfoCard({
  fileName,
  lastModified,
  outdated = false,
  className,
}: DetailFileInfoCardProps) {
  const name = fileName || "Filename unavailable";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-[14px] border border-border bg-surface px-3.5 py-2.5",
        className
      )}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted">
        <FileSpreadsheet className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground" title={name}>
          {name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          Last modified {lastModified}
          {outdated ? " · Outdated" : ""}
        </p>
      </div>
    </div>
  );
}
