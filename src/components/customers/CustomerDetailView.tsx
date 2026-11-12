"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  LoaderCircle,
  Printer,
  RefreshCw,
} from "lucide-react";
import { CustomerExcelPreview } from "@/components/customers/CustomerExcelPreview";
import { CustomerStatement } from "@/components/customers/CustomerStatement";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { CustomerTransactions } from "@/components/customers/CustomerTransactions";
import { FavoriteToggle } from "@/components/shared/FavoriteToggle";
import { formatBDT, formatRefreshTime } from "@/lib/dashboard/format";
import type { CustomerDetailSnapshot } from "@/lib/customers/detail-types";
import { cn } from "@/lib/utils";

type CustomerDetailViewProps = {
  initialData: CustomerDetailSnapshot;
};

function SummaryValue({
  value,
  prominent = false,
}: {
  value: number | null;
  prominent?: boolean;
}) {
  if (value == null) {
    return (
      <span className={cn("text-muted", prominent ? "text-3xl" : "text-lg")}>
        {prominent ? "Balance Unavailable" : "Unavailable"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-semibold tabular-nums tracking-tight text-foreground",
        prominent ? "text-3xl sm:text-4xl" : "text-lg"
      )}
    >
      {formatBDT(value)}
    </span>
  );
}

export function CustomerDetailView({ initialData }: CustomerDetailViewProps) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<"transactions" | "preview">("transactions");
  const [copied, setCopied] = useState(false);
  const [printHint, setPrintHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    startTransition(async () => {
      const res = await fetch(`/api/customers/${data.id}`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) return;
      const next = (await res.json()) as CustomerDetailSnapshot;
      setData(next);
    });
  }

  function printStatement(mode: "print" | "pdf") {
    const previous = document.title;
    document.title = data.customerName
      ? `Ayesha Textile — ${data.customerName}`
      : "Ayesha Textile statement";
    setPrintHint(
      mode === "pdf"
        ? "Choose Save as PDF in the print dialog."
        : null
    );
    window.setTimeout(() => {
      window.print();
      document.title = previous;
      window.setTimeout(() => setPrintHint(null), 4000);
    }, 50);
  }

  async function copyBalance() {
    if (!data.balanceAvailable || data.balance == null) return;
    try {
      await navigator.clipboard.writeText(formatBDT(data.balance));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <div className="detail-stagger space-y-6 print:hidden">
        <header className="detail-section space-y-5">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors duration-[var(--motion-fast)] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Customers
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {data.customerName || "Customer"}
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                {data.location || "Location unavailable"}
              </p>
              <p className="mt-3 truncate text-sm text-foreground">
                {data.fileName || "Filename unavailable"}
              </p>
              <p className="mt-1 text-xs text-muted">
                Last modified {data.lastModified}
                {data.outdated ? " · Outdated" : ""}
                {data.refreshedAtIso
                  ? ` · Updated ${formatRefreshTime(data.refreshedAtIso)}`
                  : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.customerName ? (
                <FavoriteToggle
                  item={{
                    id: data.id,
                    customerName: data.customerName,
                    location: data.location,
                    fileName: data.fileName,
                    href: data.href,
                    savedAt: Date.now(),
                  }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={pending}
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-70"
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
                onClick={() => printStatement("print")}
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted"
              >
                <Printer className="h-4 w-4 text-muted" />
                Print
              </button>
              <button
                type="button"
                onClick={() => printStatement("pdf")}
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted"
              >
                <Download className="h-4 w-4 text-muted" />
                Download PDF
              </button>
            </div>
          </div>
          {printHint ? <p className="text-xs text-muted">{printHint}</p> : null}
        </header>

        {!data.available ? (
          <div className="detail-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 text-sm text-muted shadow-[var(--shadow-soft)]">
            {data.message}
          </div>
        ) : (
          <>
            <section className="detail-section grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">Current Balance</p>
                  <CustomerStatusBadge status={data.financialStatus} />
                </div>
                <div className="mt-4">
                  <SummaryValue value={data.balanceAvailable ? data.balance : null} prominent />
                </div>
                <button
                  type="button"
                  onClick={() => void copyBalance()}
                  disabled={!data.balanceAvailable}
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted" />
                  )}
                  {copied ? "Copied" : "Copy Balance"}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {(
                  [
                    ["Opening Balance", data.openingBalance],
                    ["Total Credit", data.totalCredit],
                    ["Total Debit", data.totalDebit],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-soft)]"
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <div className="mt-2">
                      <SummaryValue value={value} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {!data.balanceAvailable ? (
              <p className="detail-section text-sm text-muted">{data.message}</p>
            ) : null}

            <section className="detail-section rounded-[var(--radius-lg)] border border-border bg-background p-4 shadow-[var(--shadow-soft)] sm:p-5">
              <div
                role="tablist"
                aria-label="Customer ledger views"
                className="mb-5 inline-flex gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1"
              >
                {(
                  [
                    ["transactions", "Transactions"],
                    ["preview", "Excel Preview"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={cn(
                      "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--motion-fast)]",
                      tab === id
                        ? "bg-accent-soft text-foreground"
                        : "text-muted hover:bg-surface-muted hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "transactions" ? (
                <CustomerTransactions transactions={data.transactions} />
              ) : (
                <CustomerExcelPreview sheets={data.sheets} />
              )}
            </section>
          </>
        )}
      </div>

      <CustomerStatement detail={data} />
    </>
  );
}
