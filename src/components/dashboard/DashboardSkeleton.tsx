export function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="h-8 w-40 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-surface-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-[var(--radius-md)] bg-surface-muted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="h-[5.25rem] animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
          <div className="h-[5.25rem] animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
        </div>
      </div>

      <div className="h-12 animate-pulse rounded-[var(--radius-md)] bg-surface-muted" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted lg:col-span-1" />
        <div className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted lg:col-span-1" />
        <div className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted lg:col-span-1" />
      </div>
    </div>
  );
}
