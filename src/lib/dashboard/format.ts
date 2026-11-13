/** Client-safe BDT formatting (mirrors ledger helper without server imports). */
export function formatBDT(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `${isNegative ? "-" : ""}৳${formatted}`;
}

export function formatRefreshTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Calendar days from a timestamp to today, e.g. "Today", "1 day ago". */
export function formatDaysFromToday(
  value: string | number | null | undefined
): string {
  if (value == null || value === "") return "—";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / (24 * 60 * 60 * 1000)
  );

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days > 1) return `${days} days ago`;
  if (days === -1) return "Tomorrow";
  return `In ${Math.abs(days)} days`;
}

/** Elapsed time: min → hr → day → week → year. */
export function formatTimeAgo(
  value: string | number | null | undefined
): string {
  if (value == null || value === "") return "—";
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const year = 365 * day;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }
  if (diffMs < week) {
    const days = Math.floor(diffMs / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (diffMs < year) {
    const weeks = Math.floor(diffMs / week);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(diffMs / year);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
