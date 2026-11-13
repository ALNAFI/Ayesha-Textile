/**
 * Lightweight Drive Excel listing (metadata only — no workbook parsing).
 */

import "server-only";
import { listAllFolderFiles } from "@/lib/drive/folder-list";
import {
  createDriveClientFromEnv,
  formatFileSize,
  formatIsoToDisplay,
  getServiceAccountCredentials,
  isDriveConfigured,
  maskString,
} from "@/lib/drive/service";
import { isExcelDriveItem } from "@/lib/drive/excel-files";

export type DriveExcelMeta = {
  id: string;
  name: string;
  modifiedTime: string | null;
  modifiedAt: number;
  lastModified: string;
  size: string;
};

type MetaCache = {
  items: DriveExcelMeta[];
  cachedAt: number;
  syncedAtStr: string;
  syncedAtIso: string;
  error?: string | null;
};

let metaCache: MetaCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateDriveMetaCache() {
  metaCache = null;
}

export async function listDriveExcelMetadata(forceRefresh = false): Promise<{
  items: DriveExcelMeta[];
  syncedAt: string;
  syncedAtIso: string;
  error?: string | null;
}> {
  const now = Date.now();

  if (!forceRefresh && metaCache && now - metaCache.cachedAt < CACHE_TTL_MS) {
    return {
      items: metaCache.items,
      syncedAt: metaCache.syncedAtStr,
      syncedAtIso: metaCache.syncedAtIso,
      error: metaCache.error,
    };
  }

  const syncedAtIso = new Date().toISOString();
  const syncedAt = new Date(syncedAtIso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!isDriveConfigured()) {
    const errorMsg =
      "Google Drive is not configured. Add service account credentials to enable live data.";
    metaCache = {
      items: [],
      cachedAt: now,
      syncedAtStr: syncedAt,
      syncedAtIso,
      error: errorMsg,
    };
    return { items: [], syncedAt, syncedAtIso, error: errorMsg };
  }

  const { folderId } = getServiceAccountCredentials();
  if (!folderId) {
    const errorMsg = "GOOGLE_DRIVE_FOLDER_ID environment variable is missing.";
    metaCache = {
      items: [],
      cachedAt: now,
      syncedAtStr: syncedAt,
      syncedAtIso,
      error: errorMsg,
    };
    return { items: [], syncedAt, syncedAtIso, error: errorMsg };
  }

  try {
    const drive = createDriveClientFromEnv();
    const allItems = await listAllFolderFiles(drive, folderId);
    const items: DriveExcelMeta[] = allItems
      .filter(isExcelDriveItem)
      .filter((file) => Boolean(file.id && file.name))
      .map((file) => {
        const modifiedAt = file.modifiedTime
          ? new Date(file.modifiedTime).getTime()
          : 0;
        return {
          id: file.id as string,
          name: file.name as string,
          modifiedTime: file.modifiedTime || null,
          modifiedAt: Number.isFinite(modifiedAt) ? modifiedAt : 0,
          lastModified: formatIsoToDisplay(file.modifiedTime),
          size: formatFileSize(Number(file.size) || 0),
        };
      });

    console.log(
      `[DriveList] Listed ${items.length} Excel files in folder ${maskString(folderId, 4, 4)}.`
    );

    metaCache = {
      items,
      cachedAt: now,
      syncedAtStr: syncedAt,
      syncedAtIso,
      error: null,
    };

    return { items, syncedAt, syncedAtIso, error: null };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[DriveList] Failed to list Drive files:", errorMsg);
    metaCache = {
      items: [],
      cachedAt: now,
      syncedAtStr: syncedAt,
      syncedAtIso,
      error: `Drive API Error: ${errorMsg}`,
    };
    return { items: [], syncedAt, syncedAtIso, error: metaCache.error };
  }
}
