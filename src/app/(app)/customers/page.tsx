import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { getDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { formatBDT } from "@/lib/dashboard/format";

export const metadata: Metadata = {
  title: "Customers",
};

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const snapshot = await getDashboardSnapshot(false);
  const customers = snapshot.searchItems.filter(
    (item) => item.kind === "customer"
  );

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Customers
      </h2>
      <p className="mt-2 text-sm text-muted">
        Due files named as &quot;Name - Location&quot;.
      </p>

      {!snapshot.available ? (
        <p className="mt-8 text-sm text-muted">{snapshot.message}</p>
      ) : customers.length === 0 ? (
        <div className="mt-8 flex items-start gap-3 text-sm text-muted">
          <Users className="mt-0.5 h-4 w-4 shrink-0" />
          <p>No customer due files were found in the connected Drive folder.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {customers.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 py-3.5 transition-colors duration-[var(--motion-fast)] hover:text-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.customerName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {item.location || "—"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-foreground">
                  {item.balanceAvailable && item.outstandingBalance != null
                    ? formatBDT(item.outstandingBalance)
                    : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
