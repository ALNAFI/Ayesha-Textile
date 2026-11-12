import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecordRecentOpen } from "@/components/shared/RecordRecentOpen";
import { getDashboardSnapshot } from "@/lib/dashboard/snapshot";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getDashboardSnapshot(false);
  const item = snapshot.searchItems.find((entry) => entry.id === id);
  return {
    title: item?.fileName || "File",
  };
}

export default async function FileDetailPage({ params }: PageProps) {
  const { id } = await params;
  const snapshot = await getDashboardSnapshot(false);
  const item = snapshot.searchItems.find((entry) => entry.id === id);

  if (!item) {
    notFound();
  }

  const href =
    item.kind === "customer" ? `/customers/${item.id}` : `/files/${item.id}`;

  // Customer-pattern files redirect conceptually to customer route via link below.
  return (
    <section className="space-y-6">
      <RecordRecentOpen
        id={item.id}
        kind={item.kind}
        title={
          item.kind === "customer"
            ? item.customerName || item.fileName
            : item.fileName
        }
        subtitle={
          item.kind === "customer" ? item.location : "Other Excel file"
        }
        href={href}
      />

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-sm text-muted">
          {item.kind === "customer" ? "Customer file" : "Other file"}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {item.fileName}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Last modified {item.lastModified}
        </p>

        {item.kind === "customer" ? (
          <p className="mt-6 text-sm text-muted">
            This file matches the customer naming pattern.{" "}
            <Link
              href={`/customers/${item.id}`}
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Open customer view
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Sheet preview will be available in a later module. No fabricated
            workbook contents are shown here.
          </p>
        )}

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
