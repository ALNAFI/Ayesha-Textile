import "server-only";

import { classifyByFilename } from "@/lib/dashboard/classify";
import type {
  DashboardFileItem,
  DashboardSnapshot,
} from "@/lib/dashboard/types";
import {
  getDriveStatus,
  isDriveConfigured,
  loadDriveWorkspace,
  type DriveWorkspace,
} from "@/lib/drive/service";
import type { CustomerLedger, DriveExcelFile } from "@/lib/excel/ledger";

function customerHref(id: string) {
  return `/customers/${id}`;
}

function fileHref(id: string) {
  return `/files/${id}`;
}

function outstandingFromParsed(
  parsed: CustomerLedger | undefined
): { value: number | null; available: boolean } {
  if (!parsed || parsed.isDueFile !== true) {
    return { value: null, available: false };
  }
  if (parsed.balanceReliable === false) {
    return { value: null, available: false };
  }
  const raw = Number(parsed.outstandingBalance);
  if (!Number.isFinite(raw)) {
    return { value: null, available: false };
  }
  // Negative advance balances are not treated as outstanding debt.
  if (raw < 0) {
    return { value: 0, available: true };
  }
  return { value: raw, available: true };
}

export function buildDashboardSnapshot(loaded: DriveWorkspace): DashboardSnapshot {
  const emptyStats = {
    totalOutstanding: 0,
    totalCustomers: 0,
    otherFiles: 0,
    outstandingIncomplete: false,
    incompleteCustomerCount: 0,
  };

  if (!loaded.ok && loaded.items.length === 0) {
    return {
      available: false,
      status: "error",
      message: loaded.error || "Google Drive could not be reached.",
      refreshedAt: loaded.syncedAt,
      refreshedAtIso: loaded.syncedAtIso,
      stats: emptyStats,
      recentFiles: [],
      searchItems: [],
    };
  }

  const parsedMap = new Map<string, DriveExcelFile>();
  for (const file of loaded.files) {
    parsedMap.set(file.id, file);
  }
  const searchItems: DashboardFileItem[] = [];

  let totalOutstanding = 0;
  let incompleteCustomerCount = 0;
  let totalCustomers = 0;
  let otherFiles = 0;

  for (const meta of loaded.items) {
    const classification = classifyByFilename(meta.name);

    if (classification.kind === "customer") {
      totalCustomers += 1;
      const parsed = parsedMap.get(meta.id);
      const ledger =
        parsed && parsed.isDueFile ? (parsed as CustomerLedger) : undefined;
      const { value, available } = outstandingFromParsed(ledger);

      if (available && value != null) {
        totalOutstanding += value;
      } else {
        incompleteCustomerCount += 1;
      }

      searchItems.push({
        id: meta.id,
        fileName: meta.name,
        kind: "customer",
        customerName: classification.customerName,
        location: classification.location,
        lastModified: meta.lastModified,
        modifiedAt: meta.modifiedAt,
        href: customerHref(meta.id),
        outstandingBalance: value,
        balanceAvailable: available,
      });
    } else {
      otherFiles += 1;
      searchItems.push({
        id: meta.id,
        fileName: meta.name,
        kind: "other",
        lastModified: meta.lastModified,
        modifiedAt: meta.modifiedAt,
        href: fileHref(meta.id),
        outstandingBalance: null,
        balanceAvailable: false,
      });
    }
  }

  const recentFiles = [...searchItems]
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
    .slice(0, 5);

  return {
    available: true,
    status: "ready",
    message:
      incompleteCustomerCount > 0
        ? `Due excludes ${incompleteCustomerCount} customer file${incompleteCustomerCount === 1 ? "" : "s"} without a valid parsed balance.`
        : loaded.error
          ? loaded.error
          : "Live Google Drive data.",
    refreshedAt: loaded.syncedAt,
    refreshedAtIso: loaded.syncedAtIso,
    stats: {
      totalOutstanding,
      totalCustomers,
      otherFiles,
      outstandingIncomplete: incompleteCustomerCount > 0,
      incompleteCustomerCount,
    },
    recentFiles,
    searchItems,
  };
}

export async function getDashboardSnapshot(
  forceRefresh = false
): Promise<DashboardSnapshot> {
  if (!isDriveConfigured()) {
    const status = getDriveStatus();
    const emptyStats = {
      totalOutstanding: 0,
      totalCustomers: 0,
      otherFiles: 0,
      outstandingIncomplete: false,
      incompleteCustomerCount: 0,
    };
    return {
      available: false,
      status: "not_configured",
      message:
        status.message ||
        "Google Drive credentials are not configured yet. Dashboard totals will appear after Drive integration.",
      refreshedAt: null,
      refreshedAtIso: null,
      stats: emptyStats,
      recentFiles: [],
      searchItems: [],
    };
  }

  return buildDashboardSnapshot(await loadDriveWorkspace(forceRefresh));
}
