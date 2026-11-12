import "server-only";

import { classifyByFilename } from "@/lib/dashboard/classify";
import {
  balanceFromParsed,
  statusFromBalance,
} from "@/lib/customers/status";
import type {
  CustomerListItem,
  CustomerListSnapshot,
} from "@/lib/customers/types";
import {
  getDriveFiles,
  invalidateDriveCache,
  isDriveConfigured,
  getDriveStatus,
} from "@/lib/drive/service";
import {
  invalidateDriveMetaCache,
  listDriveExcelMetadata,
} from "@/lib/drive/list";
import type { DriveExcelFile } from "@/lib/excel/ledger";

const OUTDATED_MS = 90 * 24 * 60 * 60 * 1000;

function isOutdated(modifiedAt: number, now = Date.now()): boolean {
  if (!modifiedAt) return false;
  return now - modifiedAt > OUTDATED_MS;
}

function emptyCounts(): CustomerListSnapshot["statusCounts"] {
  return {
    all: 0,
    outstanding: 0,
    settled: 0,
    advance: 0,
    unavailable: 0,
  };
}

export async function getCustomersSnapshot(
  forceRefresh = false
): Promise<CustomerListSnapshot> {
  if (forceRefresh) {
    invalidateDriveCache();
    invalidateDriveMetaCache();
  }

  if (!isDriveConfigured()) {
    const status = getDriveStatus();
    return {
      available: false,
      status: "not_configured",
      message:
        status.message ||
        "Google Drive credentials are not configured yet. Customer balances will appear after Drive integration.",
      refreshedAt: null,
      refreshedAtIso: null,
      totalCount: 0,
      statusCounts: emptyCounts(),
      items: [],
    };
  }

  // Metadata for classification + dates; parsed ledgers for balances (cached).
  const [metaResult, parsedResult] = await Promise.all([
    listDriveExcelMetadata(forceRefresh),
    getDriveFiles(forceRefresh),
  ]);

  if (metaResult.error && metaResult.items.length === 0) {
    return {
      available: false,
      status: "error",
      message: metaResult.error,
      refreshedAt: metaResult.syncedAt,
      refreshedAtIso: metaResult.syncedAtIso,
      totalCount: 0,
      statusCounts: emptyCounts(),
      items: [],
    };
  }

  const parsedMap = new Map<string, DriveExcelFile>();
  for (const file of parsedResult.files) {
    parsedMap.set(file.id, file);
  }

  const now = Date.now();
  const items: CustomerListItem[] = [];
  const statusCounts = emptyCounts();

  for (const meta of metaResult.items) {
    const classification = classifyByFilename(meta.name);
    if (classification.kind !== "customer") continue;

    const { balance, available } = balanceFromParsed(parsedMap.get(meta.id));
    const status = statusFromBalance(balance, available);

    items.push({
      id: meta.id,
      fileName: meta.name,
      customerName: classification.customerName,
      location: classification.location,
      lastModified: meta.lastModified,
      modifiedAt: meta.modifiedAt,
      href: `/customers/${meta.id}`,
      outdated: isOutdated(meta.modifiedAt, now),
      balance,
      balanceAvailable: available,
      status,
    });

    statusCounts.all += 1;
    statusCounts[status] += 1;
  }

  // Default server order: Name A–Z (client may re-sort).
  items.sort((a, b) =>
    a.customerName.localeCompare(b.customerName, undefined, {
      sensitivity: "base",
    })
  );

  const unavailable = statusCounts.unavailable;
  const messageParts: string[] = [];
  if (metaResult.error) messageParts.push(metaResult.error);
  if (parsedResult.error) messageParts.push(parsedResult.error);
  if (unavailable > 0) {
    messageParts.push(
      `${unavailable} customer ledger${unavailable === 1 ? "" : "s"} could not be calculated reliably.`
    );
  }

  return {
    available: true,
    status: "ready",
    message: messageParts.join(" ") || "Live Google Drive customer ledgers.",
    refreshedAt: metaResult.syncedAt,
    refreshedAtIso: metaResult.syncedAtIso,
    totalCount: items.length,
    statusCounts,
    items,
  };
}
