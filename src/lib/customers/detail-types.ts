import type { CustomerFinancialStatus } from "@/lib/customers/types";
import type { PreviewSheet } from "@/lib/excel/preview-types";

export type CustomerTransaction = {
  id: string;
  date: string;
  description: string;
  fileNo: string;
  debit: number;
  credit: number;
  balance: number | null;
};

export type CustomerPreviewSheet = PreviewSheet;

export type CustomerDetailSnapshot = {
  available: boolean;
  status: "ready" | "not_configured" | "missing" | "error";
  message: string;
  refreshedAtIso: string | null;
  id: string;
  fileName: string;
  customerName: string;
  location: string;
  lastModified: string;
  modifiedAt: number;
  outdated: boolean;
  href: string;
  balance: number | null;
  balanceAvailable: boolean;
  financialStatus: CustomerFinancialStatus;
  openingBalance: number | null;
  totalCredit: number | null;
  totalDebit: number | null;
  transactions: CustomerTransaction[];
  sheets: CustomerPreviewSheet[];
};
