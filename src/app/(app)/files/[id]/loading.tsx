export default function FilePreviewLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading spreadsheet">
      <div className="h-4 w-24 rounded bg-surface-muted" />
      <div className="h-10 w-80 max-w-full rounded bg-surface-muted" />
      <div className="h-4 w-64 rounded bg-surface-muted" />
      <div className="h-[28rem] rounded-[var(--radius-lg)] border border-border bg-surface" />
    </div>
  );
}
