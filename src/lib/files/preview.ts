import "server-only";
import { cache } from "react";

import { classifyByFilename } from "@/lib/dashboard/classify";
import type { PreviewSheet } from "@/lib/excel/preview-types";
import { extractWorkbookPreview } from "@/lib/excel/parser";
import type { FilePreviewSnapshot } from "@/lib/files/preview-types";
import {
  downloadDriveExcelInFolder,
  formatFileSize,
  formatIsoToDisplay,
  isDriveConfigured,
} from "@/lib/drive/service";

const CACHE_TTL_MS = 5 * 60 * 1000;
const OUTDATED_MS = 90 * 24 * 60 * 60 * 1000;

export type { FilePreviewSnapshot } from "@/lib/files/preview-types";

type CacheEntry = {
  cachedAt: number;
  snapshot: FilePreviewSnapshot;
};

const previewCache = new Map<string, CacheEntry>();

export function invalidateFilePreview(fileId?: string) {
  if (fileId) {
    previewCache.delete(fileId);
    return;
  }
  previewCache.clear();
}

function emptySnapshot(
  id: string,
  status: FilePreviewSnapshot["status"],
  message: string
): FilePreviewSnapshot {
  return {
    available: false,
    status,
    message,
    refreshedAtIso: new Date().toISOString(),
    id,
    fileName: "",
    extension: "",
    kind: "unknown",
    lastModified: "—",
    modifiedAt: 0,
    size: "—",
    outdated: false,
    href: `/files/${id}`,
    sheets: [],
  };
}

async function loadFilePreview(
  fileId: string,
  forceRefresh = false
): Promise<FilePreviewSnapshot> {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return emptySnapshot(fileId, "missing", "This file could not be found.");
  }

  if (!isDriveConfigured()) {
    return emptySnapshot(
      fileId,
      "not_configured",
      "Google Drive credentials are not configured yet. Spreadsheet preview will appear after Drive integration."
    );
  }

  const cached = previewCache.get(fileId);
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.snapshot;
  }

  let downloaded: Awaited<ReturnType<typeof downloadDriveExcelInFolder>>;
  try {
    downloaded = await downloadDriveExcelInFolder(fileId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "This workbook could not be read.";
    return emptySnapshot(fileId, "error", message);
  }

  if (!downloaded) {
    return emptySnapshot(
      fileId,
      "missing",
      "This file is missing, was removed, or is not an Excel file in the connected Drive folder."
    );
  }

  const classification = classifyByFilename(downloaded.name);
  const extension = downloaded.name.toLowerCase().endsWith(".xls")
    ? "XLS"
    : "XLSX";
  const modifiedAt = downloaded.modifiedTime
    ? new Date(downloaded.modifiedTime).getTime()
    : 0;

  let sheets: PreviewSheet[] = [];
  try {
    sheets = extractWorkbookPreview(downloaded.buffer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "This workbook is corrupted or uses an unsupported format.";
    return {
      ...emptySnapshot(fileId, "error", message),
      fileName: downloaded.name,
      extension,
      kind: classification.kind,
      lastModified: formatIsoToDisplay(downloaded.modifiedTime),
      modifiedAt: Number.isFinite(modifiedAt) ? modifiedAt : 0,
      size: formatFileSize(downloaded.size),
      outdated: modifiedAt > 0 && Date.now() - modifiedAt > OUTDATED_MS,
    };
  }

  const snapshot: FilePreviewSnapshot = {
    available: true,
    status: "ready",
    message:
      sheets.length === 0
        ? "This workbook has no worksheets."
        : "Read-only Excel preview.",
    refreshedAtIso: new Date().toISOString(),
    id: fileId,
    fileName: downloaded.name,
    extension,
    kind: classification.kind,
    lastModified: formatIsoToDisplay(downloaded.modifiedTime),
    modifiedAt: Number.isFinite(modifiedAt) ? modifiedAt : 0,
    size: formatFileSize(downloaded.size),
    outdated: modifiedAt > 0 && Date.now() - modifiedAt > OUTDATED_MS,
    href: `/files/${fileId}`,
    sheets,
  };

  previewCache.set(fileId, { cachedAt: Date.now(), snapshot });
  return snapshot;
}

export const getFilePreview = cache(loadFilePreview);
