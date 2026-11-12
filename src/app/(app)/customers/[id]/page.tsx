import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteToggle } from "@/components/shared/FavoriteToggle";
import { RecordRecentOpen } from "@/components/shared/RecordRecentOpen";
import { classifyByFilename } from "@/lib/dashboard/classify";
import { formatBDT } from "@/lib/dashboard/format";
import { getDashboardSnapshot } from "@/lib/dashboard/snapshot";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getDashboardSnapshot(false);
  const item = snapshot.searchItems.find(
    (entry) => entry.id === id && entry.kind === "customer"
  );
  return {
    title: item?.customerName || "Customer",
  };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const snapshot = await getDashboardSnapshot(false);
  const item = snapshot.searchItems.find(
    (entry) => entry.id === id && entry.kind === "customer"
  );

  if (!item) {
    notFound();
  }

  const classification = classifyByFilename(item.fileName);

  return (
    <section className="space-y-6">
      <RecordRecentOpen
        id={item.id}
        kind="customer"
        title={item.customerName || item.fileName}
        subtitle={item.location}
        href={item.href}
      />

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted">Customer</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {item.customerName}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {item.location || "Location unavailable"} · {item.fileName}
            </p>
          </div>
          {classification.kind === "customer" ? (
            <FavoriteToggle
              item={{
                id: item.id,
                customerName: item.customerName || item.fileName,
                location: item.location,
                fileName: item.fileName,
                href: item.href,
                savedAt: Date.now(),
              }}
            />
          ) : null}
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
            <dt className="text-sm text-muted">Outstanding</dt>
            <dd className="mt-2 text-xl font-semibold text-foreground">
              {item.balanceAvailable && item.outstandingBalance != null
                ? formatBDT(item.outstandingBalance)
                : "Unavailable"}
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
            <dt className="text-sm text-muted">Last modified</dt>
            <dd className="mt-2 text-xl font-semibold text-foreground">
              {item.lastModified}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-muted">
          Full ledger transactions will be available in a later module.
        </p>

        <Link
          href="/customers"
          className="mt-6 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Back to customers
        </Link>
      </div>
    </section>
  );
}
