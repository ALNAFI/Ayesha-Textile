import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RecordRecentOpen } from "@/components/shared/RecordRecentOpen";
import { getFilesListSnapshot } from "@/lib/files/list";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getFilesListSnapshot(false);
  const item = snapshot.items.find((entry) => entry.id === id);
  return {
    title: item?.fileName || "File",
  };
}

export default async function FileDetailPage({ params }: PageProps) {
  const { id } = await params;
  const snapshot = await getFilesListSnapshot(false);
  const item = snapshot.items.find((entry) => entry.id === id);

  if (!item) {
    if (!snapshot.available) {
      return (
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            File unavailable
          </h2>
          <p className="mt-2 text-sm text-muted">{snapshot.message}</p>
          <Link
            href="/files"
            className="mt-6 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Back to all files
          </Link>
        </section>
      );
    }
    notFound();
  }

  if (item.kind === "customer") {
    redirect(`/customers/${item.id}`);
  }

  return (
    <section className="space-y-6">
      <RecordRecentOpen
        id={item.id}
        kind="other"
        title={item.fileName}
        subtitle="Other Excel file"
        href={item.href}
      />

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-sm text-muted">Other file</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {item.fileName}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Last modified {item.lastModified}
          {item.outdated ? " · Marked outdated (90+ days)" : null}
        </p>

        <p className="mt-6 text-sm text-muted">
          Spreadsheet preview is not available in this module yet. No fabricated
          workbook contents are shown here.
        </p>

        <Link
          href="/files"
          className="mt-6 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Back to all files
        </Link>
      </div>
    </section>
  );
}
