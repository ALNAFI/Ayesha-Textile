import Link from "next/link";
import { ArrowUpRight, FileSpreadsheet, Users } from "lucide-react";
import type { DashboardFileItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type RecentFilesProps = {
  files: DashboardFileItem[];
  available: boolean;
};

export function RecentFiles({ files, available }: RecentFilesProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Recently Updated
          </h2>
          <p className="mt-1 text-sm text-muted">Latest Excel changes</p>
        </div>
        <Link
          href="/files"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-opacity duration-[var(--motion-fast)] hover:opacity-80"
        >
          View All
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!available ? (
        <p className="mt-6 text-sm text-muted">
          Recently updated files will appear when Drive sync is available.
        </p>
      ) : files.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          No Excel files were found in the connected Drive folder.
        </p>
      ) : (
        <ul className="mt-5 space-y-1">
          {files.map((file) => {
            const Icon = file.kind === "customer" ? Users : FileSpreadsheet;
            return (
              <li key={file.id}>
                <Link
                  href={file.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2.5",
                    "transition-[background-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    "hover:bg-surface-muted active:scale-[0.995]"
                  )}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {file.kind === "customer"
                        ? file.customerName || file.fileName
                        : file.fileName}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {file.kind === "customer"
                        ? `${file.location || "Customer"} · Due file`
                        : "Other file"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {file.lastModified}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
