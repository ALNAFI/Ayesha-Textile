import "server-only";

import { classifyByFilename } from "@/lib/dashboard/classify";
import type { FileListItem, FileListSnapshot } from "@/lib/files/types";
import { isDriveConfigured } from "@/lib/drive/service";
import {
  invalidateDriveMetaCache,
  listDriveExcelMetadata,
} from "@/lib/drive/list";

const OUTDATED_MS = 90 * 24 * 60 * 60 * 1000;

function isOutdated(modifiedAt: number, now = Date.now()): boolean {
  if (!modifiedAt) return false;
  return now - modifiedAt > OUTDATED_MS;
}

export async function getFilesListSnapshot(
  forceRefresh = false
): Promise<FileListSnapshot> {
  if (forceRefresh) {
    invalidateDriveMetaCache();
  }

  if (!isDriveConfigured()) {
    return {
      available: false,
      status: "not_configured",
      message:
        "Google Drive is not configured yet. File browsing will appear after Drive credentials are connected.",
      refreshedAt: null,
      refreshedAtIso: null,
      totalCount: 0,
      customerCount: 0,
      otherCount: 0,
      items: [],
    };
  }

  const meta = await listDriveExcelMetadata(forceRefresh);

  if (meta.error && meta.items.length === 0) {
    return {
      available: false,
      status: "error",
      message: meta.error,
      refreshedAt: meta.syncedAt,
      refreshedAtIso: meta.syncedAtIso,
      totalCount: 0,
      customerCount: 0,
      otherCount: 0,
      items: [],
    };
  }

  const now = Date.now();
  const items: FileListItem[] = meta.items.map((file) => {
    const classification = classifyByFilename(file.name);

    if (classification.kind === "customer") {
      return {
        id: file.id,
        fileName: file.name,
        kind: "customer" as const,
        customerName: classification.customerName,
        location: classification.location,
        lastModified: file.lastModified,
        modifiedAt: file.modifiedAt,
        href: `/customers/${file.id}`,
        outdated: isOutdated(file.modifiedAt, now),
      };
    }

    return {
      id: file.id,
      fileName: file.name,
      kind: "other" as const,
      lastModified: file.lastModified,
      modifiedAt: file.modifiedAt,
      href: `/files/${file.id}`,
      outdated: isOutdated(file.modifiedAt, now),
    };
  });

  const customerCount = items.filter((item) => item.kind === "customer").length;
  const otherCount = items.length - customerCount;

  return {
    available: true,
    status: "ready",
    message: meta.error || "Live Google Drive file metadata.",
    refreshedAt: meta.syncedAt,
    refreshedAtIso: meta.syncedAtIso,
    totalCount: items.length,
    customerCount,
    otherCount,
    items,
  };
}
