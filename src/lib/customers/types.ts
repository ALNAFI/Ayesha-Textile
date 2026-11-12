export type CustomerFinancialStatus =
  | "outstanding"
  | "settled"
  | "advance"
  | "unavailable";

export type CustomerStatusFilter =
  | "all"
  | "outstanding"
  | "settled"
  | "advance";

export type CustomerSort =
  | "name-asc"
  | "name-desc"
  | "due-high"
  | "due-low"
  | "newest"
  | "oldest";

export type CustomerListItem = {
  id: string;
  fileName: string;
  customerName: string;
  location: string;
  lastModified: string;
  modifiedAt: number;
  href: string;
  outdated: boolean;
  /** Closing ledger balance when parse succeeded; null when unavailable. */
  balance: number | null;
  balanceAvailable: boolean;
  status: CustomerFinancialStatus;
};

export type CustomerListSnapshot = {
  available: boolean;
  status: "ready" | "not_configured" | "error";
  message: string;
  refreshedAt: string | null;
  refreshedAtIso: string | null;
  totalCount: number;
  statusCounts: {
    all: number;
    outstanding: number;
    settled: number;
    advance: number;
    unavailable: number;
  };
  items: CustomerListItem[];
};
