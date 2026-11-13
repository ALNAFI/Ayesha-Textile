import Link from "next/link";
import { ArrowUpRight, FileSpreadsheet, Users } from "lucide-react";
import { formatDaysFromToday, formatRefreshTime } from "@/lib/dashboard/format";
import type { DashboardFileItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type RecentFilesProps = {
  files: DashboardFileItem[];
  available: boolean;
};

export function RecentFiles({ files, available }: RecentFilesProps) {
  return (
    <section className="box-border w-full min-w-0 max-w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">
            Recently Updated
          </h2>
          <p className="mt-1 text-sm text-muted">Latest Excel changes</p>
        </div>
        <Link
          href="/files"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-accent transition-opacity duration-[var(--motion-fast)] hover:opacity-80"
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
        <ul className="mt-5 w-full min-w-0 space-y-1">
          {files.map((file) => {
            const Icon = file.kind === "customer" ? Users : FileSpreadsheet;
            const title =
              file.kind === "customer"
                ? file.customerName || file.fileName
                : file.fileName;
            const subtitle =
              file.kind === "customer"
                ? `${file.location || "Customer"} · Due file`
                : "Other file";
            const when = file.modifiedAt
              ? formatDaysFromToday(file.modifiedAt)
              : "—";
            const exact = file.modifiedAt
              ? formatRefreshTime(new Date(file.modifiedAt).toISOString())
              : file.lastModified;
            return (
              <li key={file.id} className="min-w-0">
                <Link
                  href={file.href}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2.5",
                    "transition-[background-color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                    "hover:bg-surface-muted active:scale-[0.995]"
                  )}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background text-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {title}
                    </span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted">
                        {subtitle}
                      </span>
                      <span
                        className="shrink-0 whitespace-nowrap text-[11px] text-muted min-[481px]:hidden"
                        title={exact}
                      >
                        {when}
                      </span>
                    </span>
                  </span>
                  <span
                    className="hidden w-[5.75rem] shrink-0 text-right text-xs text-muted min-[481px]:block"
                    title={exact}
                  >
                    {when}
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
