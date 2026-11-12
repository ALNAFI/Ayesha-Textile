import "server-only";

import { invalidateCustomerDetail } from "@/lib/customers/detail";
import { invalidateFilePreview } from "@/lib/files/preview";
import { invalidateDriveMetaCache, listDriveExcelMetadata } from "@/lib/drive/list";
import { invalidateDriveCache, isDriveConfigured } from "@/lib/drive/service";
import type { DriveHealth } from "@/lib/settings/types";

export type { DriveHealth } from "@/lib/settings/types";

let lastSuccessIso: string | null = null;

function disconnected(): DriveHealth {
  return {
    status: "disconnected",
    message: "Google Drive is not connected.",
    fileCount: null,
    lastSyncedAt: lastSuccessIso,
  };
}

export async function getDriveHealth(forceRefresh = false): Promise<DriveHealth> {
  if (!isDriveConfigured()) {
    return disconnected();
  }

  try {
    const meta = await listDriveExcelMetadata(forceRefresh);
    if (meta.error && meta.items.length === 0) {
      return {
        status: "error",
        message: "Google Drive could not be reached.",
        fileCount: null,
        lastSyncedAt: lastSuccessIso,
      };
    }

    lastSuccessIso = meta.syncedAtIso;
    return {
      status: "connected",
      message: "Google Drive is connected.",
      fileCount: meta.items.length,
      lastSyncedAt: meta.syncedAtIso,
    };
  } catch {
    return {
      status: "error",
      message: "Google Drive could not be reached.",
      fileCount: null,
      lastSyncedAt: lastSuccessIso,
    };
  }
}

export async function refreshWorkspaceData(): Promise<
  | { ok: true; health: DriveHealth }
  | { ok: false; health: DriveHealth }
> {
  invalidateDriveCache();
  invalidateDriveMetaCache();
  invalidateCustomerDetail();
  invalidateFilePreview();

  const health = await getDriveHealth(true);
  if (health.status !== "connected") {
    return { ok: false, health };
  }
  return { ok: true, health };
}
