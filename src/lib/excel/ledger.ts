/**
 * Preserved from legacy Ayesha Textile ledger utilities.
 * Business rules for customer due ledgers and workbook typing.
 */

export interface LedgerEntry {
  id: string;
  date: string; // DD/MM/YYYY
  description: string;
  fileNo: string;
  debit: number; // Decreases outstanding due (e.g. payments)
  credit: number; // Increases outstanding due (e.g. new orders, goods delivery)
  balance?: number; // Calculated running balance
}

export interface CustomerLedger {
  id: string;
  fileName: string;
  customerName: string;
  shopName: string;
  location: string;
  phone: string;
  fileNo: string;
  lastModified: string;
  fileSize: string;
  sheetCount: number;
  isDueFile: true;
  initialBalance: number;
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  outstandingBalance: number;
  /** False when a stated running balance disagrees with Opening + Credits − Debits. */
  balanceReliable?: boolean;
}

export interface GeneralExcelSheet {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface GeneralExcelFile {
  id: string;
  fileName: string;
  category: "inventory" | "price_list" | "expenses" | "supplier" | "catalog";
  description: string;
  location?: string;
  lastModified: string;
  fileSize: string;
  sheetCount: number;
  isDueFile: false;
  sheets: GeneralExcelSheet[];
}

export type DriveExcelFile = CustomerLedger | GeneralExcelFile;

/**
 * Calculates running balances and totals for a customer ledger according to business rules:
 * - Credit increases outstanding due
 * - Debit decreases outstanding due
 * - Balance = previous_balance + credit - debit
 */
export function calculateLedgerBalances(
  entries: Omit<LedgerEntry, "balance">[],
  initialBalance: number = 0
): {
  entriesWithBalance: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  outstandingBalance: number;
} {
  let runningBalance = initialBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  const entriesWithBalance: LedgerEntry[] = entries.map((entry) => {
    const debit = Number(entry.debit) || 0;
    const credit = Number(entry.credit) || 0;

    totalDebit += debit;
    totalCredit += credit;
    runningBalance = runningBalance + credit - debit;

    return {
      ...entry,
      debit,
      credit,
      balance: runningBalance,
    };
  });

  return {
    entriesWithBalance,
    totalDebit,
    totalCredit,
    outstandingBalance: runningBalance,
  };
}

/**
 * Formats a number as Bangladeshi Taka (৳) with standard grouping
 * Example: 49487 -> "৳49,487"
 */
export function formatBDT(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));

  const formatted = new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(absAmount);

  return `${isNegative ? "-" : ""}৳${formatted}`;
}

/**
 * Normalizes and formats a date as DD/MM/YYYY
 */
export function formatDate(input: string | Date): string {
  if (!input) return "";
  if (typeof input === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    return input;
  }
  const date = new Date(input);
  if (isNaN(date.getTime())) return String(input);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Business rule: Determines if a file is a Customer Due Ledger file
 */
export function isCustomerDueFile(file: DriveExcelFile): file is CustomerLedger {
  return file.isDueFile === true;
}
