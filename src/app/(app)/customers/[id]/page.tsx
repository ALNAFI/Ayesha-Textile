import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerBalance } from "@/components/customers/CustomerBalance";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { FavoriteToggle } from "@/components/shared/FavoriteToggle";
import { RecordRecentOpen } from "@/components/shared/RecordRecentOpen";
import { getCustomersSnapshot } from "@/lib/customers/summary";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getCustomersSnapshot(false);
  const item = snapshot.items.find((entry) => entry.id === id);
  return {
    title: item?.customerName || "Customer",
  };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const snapshot = await getCustomersSnapshot(false);
  const item = snapshot.items.find((entry) => entry.id === id);

  if (!item) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <RecordRecentOpen
        id={item.id}
        kind="customer"
        title={item.customerName}
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
          <FavoriteToggle
            item={{
              id: item.id,
              customerName: item.customerName,
              location: item.location,
              fileName: item.fileName,
              href: item.href,
              savedAt: Date.now(),
            }}
          />
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
            <dt className="text-sm text-muted">Due Balance</dt>
            <dd className="mt-2">
              <CustomerBalance item={item} className="text-xl font-semibold" />
            </dd>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
            <dt className="text-sm text-muted">Status</dt>
            <dd className="mt-2">
              <CustomerStatusBadge status={item.status} />
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
          Full ledger transactions will be available in Module 07.
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
