import type { SyncStatus } from "@/hooks/use-synced-data";

export function SyncStatusBanner({ status }: { status: SyncStatus }) {
  if (status !== "syncing" && status !== "offline" && status !== "partial") return null;

  const label =
    status === "syncing"
      ? "Syncing..."
      : status === "partial"
        ? "Some files could not be updated. Will retry."
        : "Offline, showing saved data";

  return (
    <p
      role="status"
      className="pointer-events-none fixed left-1/2 top-[calc(var(--header-height)+0.5rem)] z-40 -translate-x-1/2 rounded-full border border-border bg-surface/95 px-3 py-1 text-xs text-muted shadow-[var(--shadow-soft)]"
    >
      {label}
    </p>
  );
}
