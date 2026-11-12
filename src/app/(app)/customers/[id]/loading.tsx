export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading customer">
      <div className="h-4 w-28 rounded bg-surface-muted" />
      <div className="h-10 w-64 max-w-full rounded bg-surface-muted" />
      <div className="h-4 w-48 rounded bg-surface-muted" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="h-48 rounded-[var(--radius-lg)] border border-border bg-surface" />
        <div className="grid gap-3">
          <div className="h-16 rounded-[var(--radius-lg)] border border-border bg-surface" />
          <div className="h-16 rounded-[var(--radius-lg)] border border-border bg-surface" />
          <div className="h-16 rounded-[var(--radius-lg)] border border-border bg-surface" />
        </div>
      </div>
      <div className="h-72 rounded-[var(--radius-lg)] border border-border bg-surface" />
    </div>
  );
}
