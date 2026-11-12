"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LoaderCircle,
  Printer,
  RefreshCw,
} from "lucide-react";
import { SpreadsheetPreview } from "@/components/preview/SpreadsheetPreview";
import { formatRefreshTime } from "@/lib/dashboard/format";
import type { FilePreviewSnapshot } from "@/lib/files/preview-types";
import { cn } from "@/lib/utils";

type FilePreviewViewProps = {
  initialData: FilePreviewSnapshot;
};

export function FilePreviewView({ initialData }: FilePreviewViewProps) {
  const [data, setData] = useState(initialData);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/files/${data.id}`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        setError("The workbook could not be refreshed. Try again.");
        return;
      }
      const next = (await res.json()) as FilePreviewSnapshot;
      setData(next);
    });
  }

  function printSheet() {
    const previous = document.title;
    document.title = data.fileName || "Ayesha Textile spreadsheet";
    window.print();
    document.title = previous;
  }

  return (
    <div className="preview-stagger space-y-6 print:space-y-4">
      <header className="preview-section space-y-5 print:space-y-2">
        <Link
          href="/files"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors duration-[var(--motion-fast)] hover:text-foreground print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          All Files
        </Link>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase print:text-black">
              Ayesha Textile
            </p>
            <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {data.fileName || "Excel file"}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              {data.extension ? (
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                  {data.extension}
                </span>
              ) : null}
              <span>Modified {data.lastModified}</span>
              <span>·</span>
              <span>{data.size || "Size unavailable"}</span>
              {data.outdated ? <span>· Outdated</span> : null}
              {data.refreshedAtIso ? (
                <span className="print:hidden">
                  · Updated {formatRefreshTime(data.refreshedAtIso)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={pending}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground",
                "hover:bg-surface-muted disabled:opacity-70"
              )}
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 text-muted" />
              )}
              {pending ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={printSheet}
              disabled={!data.available}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
            >
              <Printer className="h-4 w-4 text-muted" />
              Print
            </button>
          </div>
        </div>
      </header>

      {!data.available ? (
        <div className="preview-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-medium text-foreground">
            Preview unavailable
          </p>
          <p className="mt-2 text-sm text-muted">{error || data.message}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={pending}
            className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline disabled:opacity-60"
          >
            {pending ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : (
        <section className="preview-section">
          {error ? <p className="mb-3 text-sm text-muted">{error}</p> : null}
          <SpreadsheetPreview sheets={data.sheets} />
        </section>
      )}
    </div>
  );
}
