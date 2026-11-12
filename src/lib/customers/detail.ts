import "server-only";
import { cache } from "react";

import { classifyByFilename } from "@/lib/dashboard/classify";
import type { CustomerDetailSnapshot } from "@/lib/customers/detail-types";
import { statusFromBalance } from "@/lib/customers/status";
import {
  downloadDriveExcelInFolder,
  formatFileSize,
  formatIsoToDisplay,
  isDriveConfigured,
} from "@/lib/drive/service";
import { extractWorkbookPreview, parseExcelBuffer } from "@/lib/excel/parser";

const CACHE_TTL_MS = 5 * 60 * 1000;
const OUTDATED_MS = 90 * 24 * 60 * 60 * 1000;

type CacheEntry = {
  cachedAt: number;
  modifiedTime: string | null;
  snapshot: CustomerDetailSnapshot;
};

const detailCache = new Map<string, CacheEntry>();

export function invalidateCustomerDetail(fileId?: string) {
  if (fileId) {
    detailCache.delete(fileId);
    return;
  }
  detailCache.clear();
}

function emptySnapshot(
  id: string,
  status: CustomerDetailSnapshot["status"],
  message: string
): CustomerDetailSnapshot {
  return {
    available: false,
    status,
    message,
    refreshedAtIso: new Date().toISOString(),
    id,
    fileName: "",
    customerName: "",
    location: "",
    lastModified: "—",
    modifiedAt: 0,
    outdated: false,
    href: `/customers/${id}`,
    balance: null,
    balanceAvailable: false,
    financialStatus: "unavailable",
    openingBalance: null,
    totalCredit: null,
    totalDebit: null,
    transactions: [],
    sheets: [],
  };
}

export const getCustomerDetail = cache(async function getCustomerDetail(
  fileId: string,
  forceRefresh = false
): Promise<CustomerDetailSnapshot> {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return emptySnapshot(fileId, "missing", "This customer file could not be found.");
  }

  if (!isDriveConfigured()) {
    return emptySnapshot(
      fileId,
      "not_configured",
      "Google Drive credentials are not configured yet. Customer details will appear after Drive integration."
    );
  }

  const cached = detailCache.get(fileId);
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.snapshot;
  }

  let downloaded: Awaited<ReturnType<typeof downloadDriveExcelInFolder>>;
  try {
    downloaded = await downloadDriveExcelInFolder(fileId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The customer workbook could not be read.";
    return emptySnapshot(fileId, "error", message);
  }

  if (!downloaded) {
    return emptySnapshot(
      fileId,
      "missing",
      "This file is missing, was renamed, or is not an Excel file in the connected Drive folder."
    );
  }

  const classification = classifyByFilename(downloaded.name);
  if (classification.kind !== "customer") {
    return emptySnapshot(
      fileId,
      "missing",
      "This workbook is not a customer file. Customer files use the filename pattern Name - Location."
    );
  }

  const lastModified = formatIsoToDisplay(downloaded.modifiedTime);
  const modifiedAt = downloaded.modifiedTime
    ? new Date(downloaded.modifiedTime).getTime()
    : 0;
  const fileSize = formatFileSize(downloaded.size);
  const refreshedAtIso = new Date().toISOString();

  let parsed;
  let sheets: CustomerDetailSnapshot["sheets"] = [];
  try {
    parsed = parseExcelBuffer(
      downloaded.buffer,
      downloaded.name,
      fileId,
      lastModified,
      fileSize
    );
    sheets = extractWorkbookPreview(downloaded.buffer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "This workbook could not be parsed.";
    return {
      ...emptySnapshot(fileId, "error", message),
      fileName: downloaded.name,
      customerName: classification.customerName,
      location: classification.location,
      lastModified,
      modifiedAt,
      outdated: modifiedAt > 0 && Date.now() - modifiedAt > OUTDATED_MS,
      refreshedAtIso,
    };
  }

  const ledger = parsed.customerLedger;
  const reliable = Boolean(ledger && ledger.balanceReliable !== false && parsed.isDueFile);
  const balance = reliable ? ledger!.outstandingBalance : null;

  const snapshot: CustomerDetailSnapshot = {
    available: true,
    status: "ready",
    message: reliable
      ? parsed.error || "Live customer ledger."
      : parsed.error ||
        "This ledger could not be calculated reliably. Balances are unavailable.",
    refreshedAtIso,
    id: fileId,
    fileName: downloaded.name,
    customerName: classification.customerName,
    location: classification.location,
    lastModified,
    modifiedAt: Number.isFinite(modifiedAt) ? modifiedAt : 0,
    outdated: modifiedAt > 0 && Date.now() - modifiedAt > OUTDATED_MS,
    href: `/customers/${fileId}`,
    balance: reliable && balance != null && Number.isFinite(balance) ? balance : null,
    balanceAvailable: reliable && balance != null && Number.isFinite(balance),
    financialStatus: statusFromBalance(
      reliable && balance != null && Number.isFinite(balance) ? balance : null,
      reliable && balance != null && Number.isFinite(balance)
    ),
    openingBalance: reliable ? ledger!.initialBalance : null,
    totalCredit: reliable ? ledger!.totalCredit : null,
    totalDebit: reliable ? ledger!.totalDebit : null,
    transactions: reliable
      ? ledger!.entries.map((entry) => ({
          id: entry.id,
          date: entry.date || "—",
          description: entry.description || "—",
          fileNo: entry.fileNo || "—",
          debit: entry.debit,
          credit: entry.credit,
          balance: entry.balance ?? null,
        }))
      : ledger
        ? ledger.entries.map((entry) => ({
            id: entry.id,
            date: entry.date || "—",
            description: entry.description || "—",
            fileNo: entry.fileNo || "—",
            debit: entry.debit,
            credit: entry.credit,
            balance: null,
          }))
        : [],
    sheets,
  };

  if (!reliable && snapshot.transactions.length === 0 && sheets.length === 0) {
    snapshot.message =
      parsed.error || "This workbook does not contain a readable customer ledger.";
  }

  detailCache.set(fileId, {
    cachedAt: Date.now(),
    modifiedTime: downloaded.modifiedTime,
    snapshot,
  });

  return snapshot;
});
