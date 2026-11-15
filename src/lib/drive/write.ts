/**
 * Server-only Google Drive WRITE helpers.
 * Reads keep using the read-only client in service.ts. Only this file asks
 * for the full Drive scope, and it only ever updates an existing Excel file
 * that sits directly inside the configured folder.
 */

import "server-only";
import { Readable } from "node:stream";
import { google } from "googleapis";
import {
  DRIVE_REQUEST_TIMEOUT_MS,
  withDriveRetry,
} from "@/lib/drive/folder-list";
import { getServiceAccountCredentials } from "@/lib/drive/service";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class DriveWriteError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "DriveWriteError";
    this.status = status;
  }
}

function createDriveWriteClient() {
  const { clientEmail, privateKey, keyValidation } =
    getServiceAccountCredentials();
  if (!clientEmail) {
    throw new DriveWriteError("GOOGLE_CLIENT_EMAIL is not configured.", 500);
  }
  if (!privateKey || keyValidation.status !== "valid_pem") {
    throw new DriveWriteError(keyValidation.message, 500);
  }
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

export type WritableDriveFile = {
  id: string;
  name: string;
  modifiedTime: string | null;
};

/** Per-file queue so two saves in one server instance never overlap. */
const queues = new Map<string, Promise<unknown>>();

export function runExclusive<T>(
  fileId: string,
  task: () => Promise<T>
): Promise<T> {
  const previous = queues.get(fileId) ?? Promise.resolve();
  const next = previous.then(task, task);
  const tail = next.catch(() => undefined);
  queues.set(fileId, tail);
  tail.finally(() => {
    if (queues.get(fileId) === tail) queues.delete(fileId);
  });
  return next;
}

async function getFileMeta(
  drive: ReturnType<typeof createDriveWriteClient>,
  fileId: string
) {
  const { folderId } = getServiceAccountCredentials();
  if (!folderId) {
    throw new DriveWriteError("GOOGLE_DRIVE_FOLDER_ID is missing.", 500);
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    throw new DriveWriteError("Invalid file id.", 400);
  }

  let meta;
  try {
    meta = await drive.files.get({
      fileId,
      fields: "id, name, modifiedTime, parents, trashed, capabilities/canEdit",
      supportsAllDrives: true,
    });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 404) throw new DriveWriteError("File not found.", 404);
    throw error;
  }

  const name = meta.data.name || "";
  const parents = meta.data.parents || [];
  if (meta.data.trashed || !parents.includes(folderId)) {
    throw new DriveWriteError("File not found in the configured folder.", 404);
  }
  if (!/\.xlsx$/i.test(name)) {
    throw new DriveWriteError(
      "Only .xlsx files can be edited. Please save this file as .xlsx in Excel first.",
      400
    );
  }
  if (meta.data.capabilities && meta.data.capabilities.canEdit === false) {
    throw new DriveWriteError(
      "The service account has Viewer access only. Share the Drive folder with it as Editor.",
      403
    );
  }

  return {
    id: fileId,
    name,
    modifiedTime: meta.data.modifiedTime || null,
  } satisfies WritableDriveFile;
}

export async function downloadForEdit(fileId: string): Promise<{
  file: WritableDriveFile;
  buffer: Buffer;
}> {
  const drive = createDriveWriteClient();
  const file = await getFileMeta(drive, fileId);
  const response = await withDriveRetry("files.get media (edit)", () =>
    drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      {
        responseType: "arraybuffer",
        signal: AbortSignal.timeout(DRIVE_REQUEST_TIMEOUT_MS),
      }
    )
  );
  return { file, buffer: Buffer.from(response.data as ArrayBuffer) };
}

/**
 * Uploads the new bytes over the existing file.
 * Refuses when someone changed the file after we downloaded it.
 */
export async function uploadEdited(
  fileId: string,
  buffer: Buffer,
  baselineModifiedTime: string | null
): Promise<{ modifiedTime: string | null }> {
  const drive = createDriveWriteClient();

  const latest = await drive.files.get({
    fileId,
    fields: "modifiedTime",
    supportsAllDrives: true,
  });
  if (
    baselineModifiedTime &&
    latest.data.modifiedTime &&
    latest.data.modifiedTime !== baselineModifiedTime
  ) {
    throw new DriveWriteError(
      "This file was changed by someone else a moment ago. Reload the page and try again.",
      409
    );
  }

  try {
    const updated = await drive.files.update(
      {
        fileId,
        media: { mimeType: XLSX_MIME, body: Readable.from(buffer) },
        fields: "id, modifiedTime",
        supportsAllDrives: true,
      },
      { signal: AbortSignal.timeout(DRIVE_REQUEST_TIMEOUT_MS * 2) }
    );
    return { modifiedTime: updated.data.modifiedTime || null };
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 403) {
      throw new DriveWriteError(
        "Drive refused the write. Share the folder with the service account as Editor.",
        403
      );
    }
    throw error;
  }
}
