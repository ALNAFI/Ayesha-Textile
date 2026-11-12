import { normalizeSearchText } from "@/lib/files/search";
import type { CustomerTransaction } from "@/lib/customers/detail-types";

export function parseLedgerDate(value: string): number | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return time;
}

export function matchesTransactionSearch(
  item: CustomerTransaction,
  query: string
): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return true;
  const haystack = normalizeSearchText(
    [item.description, item.fileNo].filter(Boolean).join(" ")
  );
  return haystack.includes(normalized);
}

export function filterTransactionsByDate(
  items: CustomerTransaction[],
  from: string,
  to: string
): CustomerTransaction[] {
  const fromTime = from ? Date.parse(`${from}T00:00:00Z`) : null;
  const toTime = to ? Date.parse(`${to}T00:00:00Z`) : null;

  return items.filter((item) => {
    const time = parseLedgerDate(item.date);
    if (time == null) return !from && !to;
    if (fromTime != null && !Number.isNaN(fromTime) && time < fromTime) {
      return false;
    }
    if (toTime != null && !Number.isNaN(toTime) && time > toTime) {
      return false;
    }
    return true;
  });
}

export function sortTransactions(
  items: CustomerTransaction[],
  sort: "ledger" | "newest" | "oldest"
): CustomerTransaction[] {
  if (sort === "ledger") return items;
  const next = items.map((item, index) => ({ item, index }));
  next.sort((a, b) => {
    const aTime = parseLedgerDate(a.item.date);
    const bTime = parseLedgerDate(b.item.date);
    if (aTime == null && bTime == null) return a.index - b.index;
    if (aTime == null) return 1;
    if (bTime == null) return -1;
    const diff = sort === "newest" ? bTime - aTime : aTime - bTime;
    return diff || a.index - b.index;
  });
  return next.map((entry) => entry.item);
}
