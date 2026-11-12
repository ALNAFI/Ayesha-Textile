"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { formatBDT } from "@/lib/dashboard/format";
import type { CustomerTransaction } from "@/lib/customers/detail-types";
import {
  filterTransactionsByDate,
  matchesTransactionSearch,
  sortTransactions,
} from "@/lib/customers/transactions";
import { cn } from "@/lib/utils";

type CustomerTransactionsProps = {
  transactions: CustomerTransaction[];
};

function amountCell(value: number) {
  if (!value) return "—";
  return formatBDT(value);
}

export function CustomerTransactions({ transactions }: CustomerTransactionsProps) {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"ledger" | "newest" | "oldest">("ledger");

  const visible = useMemo(() => {
    const searched = transactions.filter((item) =>
      matchesTransactionSearch(item, query)
    );
    const ranged = filterTransactionsByDate(searched, from, to);
    return sortTransactions(ranged, sort);
  }, [transactions, query, from, to, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3",
            "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search description or file number…"
            aria-label="Search transactions"
            className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear transaction search"
              onClick={() => setQuery("")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "ledger" | "newest" | "oldest")
              }
              className="h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="ledger">Ledger order</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </div>

      <p className="text-xs text-muted">
        {visible.length} of {transactions.length}{" "}
        {transactions.length === 1 ? "transaction" : "transactions"}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No transactions match
          </p>
          <p className="mt-2 text-sm text-muted">
            {transactions.length === 0
              ? "This ledger has no readable transaction rows."
              : "Try another search or date range."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)] md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="border-b border-border bg-background/70">
                <tr className="text-xs font-medium text-muted">
                  <th className="px-4 py-3.5 font-medium">Date</th>
                  <th className="px-4 py-3.5 font-medium">Description</th>
                  <th className="px-4 py-3.5 font-medium">File No</th>
                  <th className="px-4 py-3.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-3.5 text-right font-medium">Credit</th>
                  <th className="px-4 py-3.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-muted/60"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-muted">
                      {item.date}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {item.description}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted">
                      {item.fileNo}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm tabular-nums text-foreground">
                      {amountCell(item.debit)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm tabular-nums text-foreground">
                      {amountCell(item.credit)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                      {item.balance == null ? "—" : formatBDT(item.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {item.description}
                  </p>
                  <p className="shrink-0 text-xs text-muted">{item.date}</p>
                </div>
                <p className="mt-1 text-xs text-muted">File No {item.fileNo}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted">Debit</dt>
                    <dd className="mt-1 font-medium tabular-nums text-foreground">
                      {amountCell(item.debit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Credit</dt>
                    <dd className="mt-1 font-medium tabular-nums text-foreground">
                      {amountCell(item.credit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Balance</dt>
                    <dd className="mt-1 font-medium tabular-nums text-foreground">
                      {item.balance == null ? "—" : formatBDT(item.balance)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
