import type { CustomerFinancialStatus } from "@/lib/customers/types";
import type { CustomerLedger, DriveExcelFile } from "@/lib/excel/ledger";

export function balanceFromParsed(
  parsed: DriveExcelFile | undefined
): { balance: number | null; available: boolean } {
  if (!parsed || parsed.isDueFile !== true) {
    return { balance: null, available: false };
  }

  const ledger = parsed as CustomerLedger;
  if (ledger.balanceReliable === false) {
    return { balance: null, available: false };
  }
  const raw = Number(ledger.outstandingBalance);
  if (!Number.isFinite(raw)) {
    return { balance: null, available: false };
  }

  return { balance: raw, available: true };
}

export function statusFromBalance(
  balance: number | null,
  available: boolean
): CustomerFinancialStatus {
  if (!available || balance == null) return "unavailable";
  if (balance > 0) return "outstanding";
  if (balance < 0) return "advance";
  return "settled";
}

export function statusLabel(status: CustomerFinancialStatus): string {
  switch (status) {
    case "outstanding":
      return "Due";
    case "settled":
      return "Paid";
    case "advance":
      return "Advance";
    case "unavailable":
      return "Unavailable";
  }
}
