import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { getDashboardSnapshot } from "@/lib/dashboard/snapshot";

export const metadata: Metadata = {
  title: "All Files",
};

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const snapshot = await getDashboardSnapshot(false);
  const files = [...snapshot.searchItems].sort(
    (a, b) => b.modifiedAt - a.modifiedAt
  );

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        All Files
      </h2>
      <p className="mt-2 text-sm text-muted">
        Excel workbooks from the connected Google Drive folder.
      </p>

      {!snapshot.available ? (
        <p className="mt-8 text-sm text-muted">{snapshot.message}</p>
      ) : files.length === 0 ? (
        <div className="mt-8 flex items-start gap-3 text-sm text-muted">
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0" />
          <p>No .xls or .xlsx files were found.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {files.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 py-3.5 transition-colors duration-[var(--motion-fast)] hover:text-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.fileName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {item.kind === "customer"
                      ? `Customer · ${item.location || "—"}`
                      : "Other file"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {item.lastModified}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
