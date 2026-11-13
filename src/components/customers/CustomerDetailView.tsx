"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Share2,
} from "lucide-react";
import { CustomerExcelPreview } from "@/components/customers/CustomerExcelPreview";
import { CustomerStatement } from "@/components/customers/CustomerStatement";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { CustomerTransactions } from "@/components/customers/CustomerTransactions";
import { CustomerAvatar } from "@/components/customers/detail/CustomerAvatar";
import { DetailActionBar } from "@/components/customers/detail/DetailActionBar";
import { DetailBalanceCard } from "@/components/customers/detail/DetailBalanceCard";
import { DetailFileInfoCard } from "@/components/customers/detail/DetailFileInfoCard";
import { DetailStatTile } from "@/components/customers/detail/DetailStatTile";
import { FavoriteToggle } from "@/components/shared/FavoriteToggle";
import { formatBDT } from "@/lib/dashboard/format";
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
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const favoriteItem = data.customerName
    ? {
        id: data.id,
        customerName: data.customerName,
        location: data.location,
        fileName: data.fileName,
        href: data.href,
        savedAt: Date.now(),
      }
    : null;

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

  function printPdf() {
    const previous = document.title;
    document.title = data.customerName
      ? `Ayesha Textile — ${data.customerName}`
      : "Ayesha Textile statement";
    setShareHint("Choose Save as PDF in the print dialog.");
    window.setTimeout(() => {
      window.print();
      document.title = previous;
      window.setTimeout(() => setShareHint(null), 4000);
    }, 50);
  }

  function buildShareText() {
    const name = data.customerName || "Customer";
    const location = data.location || "—";
    const due =
      data.balanceAvailable && data.balance != null
        ? formatBDT(data.balance)
        : "৳ —";
    return `${name}\n${location}\n${due}`;
  }

  async function shareCustomer() {
    const text = buildShareText();
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareHint("Copied — paste into WhatsApp or Messenger.");
      window.setTimeout(() => setShareHint(null), 3000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        setShareHint("Copied — paste into WhatsApp or Messenger.");
        window.setTimeout(() => setShareHint(null), 3000);
      } catch {
        setShareHint("Could not share.");
        window.setTimeout(() => setShareHint(null), 3000);
      }
    }
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
      <div
        className={cn(
          "detail-stagger print:hidden",
          "max-md:-mx-3 max-md:space-y-4 max-md:px-4 max-md:pb-[calc(6rem+env(safe-area-inset-bottom))]",
          "md:space-y-6"
        )}
      >
        {/* —— Mobile layout —— */}
        <div className="space-y-4 md:hidden">
          <Link
            href="/customers"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition-colors duration-[var(--motion-fast)] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Customers
          </Link>

          <header className="detail-section flex min-w-0 items-center gap-3.5">
            <CustomerAvatar
              name={data.customerName || "Customer"}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold tracking-tight text-foreground">
                {data.customerName || "Customer"}
              </h2>
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-[13px] w-[13px] shrink-0" aria-hidden />
                <span className="truncate">
                  {data.location || "Location unavailable"}
                </span>
              </p>
            </div>
          </header>

          <DetailFileInfoCard
            className="detail-section"
            fileName={data.fileName}
            lastModified={data.lastModified}
            outdated={data.outdated}
          />

          {!data.available ? (
            <div className="detail-section rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 text-sm text-muted shadow-[var(--shadow-soft)]">
              {data.message}
            </div>
          ) : (
            <>
              <DetailBalanceCard
                className="detail-section"
                balance={data.balance}
                balanceAvailable={data.balanceAvailable}
                financialStatus={data.financialStatus}
                copied={copied}
                onCopy={() => void copyBalance()}
              />

              <div className="detail-section grid grid-cols-2 gap-3">
                <DetailStatTile label="Total Credit" value={data.totalCredit} />
                <DetailStatTile label="Total Debit" value={data.totalDebit} />
              </div>
            </>
          )}

          <DetailActionBar
            className="detail-section"
            favoriteItem={favoriteItem}
            pending={pending}
            onRefresh={() => void refresh()}
            onShare={() => void shareCustomer()}
            onPdf={() => printPdf()}
          />
          {shareHint ? <p className="text-xs text-muted">{shareHint}</p> : null}

          {data.available ? (
            <>
              {!data.balanceAvailable ? (
                <p className="detail-section text-sm text-muted">{data.message}</p>
              ) : null}

              <section className="detail-section rounded-[var(--radius-lg)] border border-border bg-background p-4 shadow-[var(--shadow-soft)]">
                <div
                  role="tablist"
                  aria-label="Customer ledger views"
                  className="mb-5 grid w-full grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1"
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
                        "w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--motion-fast)]",
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
          ) : null}
        </div>

        {/* —— Desktop / tablet layout (unchanged) —— */}
        <div className="hidden md:block md:space-y-6">
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
                <p className="mt-1.5 flex min-w-0 items-center gap-2 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {data.location || "Location unavailable"}
                  </span>
                </p>
                <p className="mt-3 flex min-w-0 items-center gap-2 truncate text-sm text-foreground">
                  <FileSpreadsheet
                    className="h-3.5 w-3.5 shrink-0 text-muted"
                    aria-hidden
                  />
                  <span className="truncate">
                    {data.fileName || "Filename unavailable"}
                  </span>
                </p>
                <p className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted">
                  <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    Last modified {data.lastModified}
                    {data.outdated ? " · Outdated" : ""}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {favoriteItem ? <FavoriteToggle item={favoriteItem} /> : null}
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
                  onClick={() => void shareCustomer()}
                  className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  <Share2 className="h-4 w-4 text-muted" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => printPdf()}
                  className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted"
                >
                  <Download className="h-4 w-4 text-muted" />
                  Download PDF
                </button>
              </div>
            </div>
            {shareHint ? <p className="text-xs text-muted">{shareHint}</p> : null}
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
                    <CustomerStatusBadge
                      status={data.financialStatus}
                      variant="compact"
                    />
                  </div>
                  <div className="mt-4">
                    <SummaryValue
                      value={data.balanceAvailable ? data.balance : null}
                      prominent
                    />
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

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {(
                    [
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
                  className="mb-5 grid w-full grid-cols-2 gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1"
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
                        "w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--motion-fast)]",
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
      </div>

      <CustomerStatement detail={data} />
    </>
  );
}
