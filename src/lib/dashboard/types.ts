export type DashboardAvailability = "ready" | "not_configured" | "error";

export type DashboardFileKind = "customer" | "other";

export type DashboardFileItem = {
  id: string;
  fileName: string;
  kind: DashboardFileKind;
  customerName?: string;
  location?: string;
  lastModified: string;
  modifiedAt: number;
  href: string;
  /** Present for customer files when a valid non-negative outstanding was computed. */
  outstandingBalance?: number | null;
  balanceAvailable: boolean;
};

export type DashboardStats = {
  totalOutstanding: number;
  totalCustomers: number;
  otherFiles: number;
  outstandingIncomplete: boolean;
  incompleteCustomerCount: number;
};

export type DashboardSnapshot = {
  available: boolean;
  status: DashboardAvailability;
  message: string;
  refreshedAt: string | null;
  refreshedAtIso: string | null;
  stats: DashboardStats;
  recentFiles: DashboardFileItem[];
  searchItems: DashboardFileItem[];
};

export type RecentOpenItem = {
  id: string;
  kind: DashboardFileKind;
  title: string;
  subtitle?: string;
  href: string;
  openedAt: number;
};

export type FavoriteCustomer = {
  id: string;
  customerName: string;
  location?: string;
  fileName: string;
  href: string;
  savedAt: number;
};
