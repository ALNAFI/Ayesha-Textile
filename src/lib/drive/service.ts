/**
 * Preserved from legacy Ayesha Textile Drive service.
 * Server-only Google Drive read + Excel parse pipeline.
 */

import "server-only";
import { google } from "googleapis";
import type { DriveExcelFile } from "@/lib/excel/ledger";
import { parseExcelBuffer } from "@/lib/excel/parser";
import { isExcelDriveItem } from "@/lib/drive/excel-files";
import { listAllFolderFiles, mapWithConcurrency } from "@/lib/drive/folder-list";

export interface DriveConfigStatus {
  isConfigured: boolean;
  hasFolderId: boolean;
  hasServiceAccount: boolean;
  folderIdMasked: string;
  rawFolderIdMasked: string;
  clientEmailMasked: string;
  scope: string;
  mode: "real_drive" | "error" | "not_configured";
  lastSyncedAt: string | null;
  fileCount: number;
  dueCount: number;
  otherCount: number;
  message: string;
  keyStatus: "valid_pem" | "invalid_key_id" | "missing" | "invalid_format";
  keyStatusMessage: string;
  error?: string | null;
}

interface CacheState {
  files: DriveExcelFile[];
  cachedAt: number;
  syncedAtStr: string;
  error?: string | null;
}

let memoryCache: CacheState | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Extracts raw folder ID from folder URL or plain ID
 */
export function extractFolderId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Safely validates private key format to detect common configuration errors
 * such as pasting the 40-character SHA-1 Key ID instead of the RSA PEM private key.
 */
export function validatePrivateKeyFormat(rawKey: string | null | undefined): {
  status: "valid_pem" | "invalid_key_id" | "missing" | "invalid_format";
  message: string;
  sanitizedKey: string | null;
} {
  if (!rawKey || !rawKey.trim()) {
    return {
      status: "missing",
      message: "GOOGLE_PRIVATE_KEY is not defined in environment variables.",
      sanitizedKey: null,
    };
  }

  let key = rawKey.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, "\n");

  if (/^[0-9a-fA-F]{40}$/.test(key)) {
    return {
      status: "invalid_key_id",
      message: `Invalid Private Key format: GOOGLE_PRIVATE_KEY contains a 40-character Key ID ("${key.slice(0, 8)}..."), NOT the RSA PEM private key. A Google Service Account private key begins with "-----BEGIN PRIVATE KEY-----" and contains ~1,700 characters. Please provide the downloaded Service Account JSON key or copy the full "private_key" field.`,
      sanitizedKey: null,
    };
  }

  if (key.includes("BEGIN PRIVATE KEY") || key.includes("BEGIN RSA PRIVATE KEY")) {
    return {
      status: "valid_pem",
      message: "Valid PEM RSA Private Key format detected.",
      sanitizedKey: key,
    };
  }

  return {
    status: "invalid_format",
    message:
      'Invalid Private Key format: The key must begin with "-----BEGIN PRIVATE KEY-----". Please check your environment secret.',
    sanitizedKey: null,
  };
}

/**
 * Extracts and cleans Google Service Account credentials from environment secrets
 */
export function getServiceAccountCredentials(): {
  clientEmail: string | null;
  privateKey: string | null;
  folderId: string | null;
  keyValidation: ReturnType<typeof validatePrivateKeyFormat>;
} {
  const rawFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || null;
  const folderId = extractFolderId(rawFolderId);

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      if (parsed.client_email && parsed.private_key) {
        const keyVal = validatePrivateKeyFormat(parsed.private_key);
        return {
          clientEmail: parsed.client_email,
          privateKey: keyVal.sanitizedKey,
          folderId,
          keyValidation: keyVal,
        };
      }
    } catch (jsonErr) {
      console.warn(
        "[DriveService] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY as JSON:",
        jsonErr instanceof Error ? jsonErr.message : String(jsonErr)
      );
    }
  }

  const clientEmail = (
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    ""
  ).trim();

  const keyVal = validatePrivateKeyFormat(process.env.GOOGLE_PRIVATE_KEY);

  return {
    clientEmail: clientEmail || null,
    privateKey: keyVal.sanitizedKey,
    folderId,
    keyValidation: keyVal,
  };
}

export function isDriveConfigured(): boolean {
  const { clientEmail, privateKey, folderId, keyValidation } =
    getServiceAccountCredentials();
  return Boolean(
    clientEmail && privateKey && folderId && keyValidation.status === "valid_pem"
  );
}

export function createDriveClientFromEnv() {
  const { clientEmail, privateKey, keyValidation } = getServiceAccountCredentials();
  if (!clientEmail) {
    throw new Error(
      "Google Drive service account email (GOOGLE_CLIENT_EMAIL) is not configured."
    );
  }
  if (!privateKey || keyValidation.status !== "valid_pem") {
    throw new Error(keyValidation.message);
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

function createDriveClient() {
  return createDriveClientFromEnv();
}

/**
 * Lists and parses all .xls and .xlsx files from the configured Google Drive folder.
 * NEVER silently falls back to demo data.
 */
export async function getDriveFiles(forceRefresh = false): Promise<{
  files: DriveExcelFile[];
  syncedAt: string;
  error?: string | null;
}> {
  const now = Date.now();

  if (!forceRefresh && memoryCache && now - memoryCache.cachedAt < CACHE_TTL_MS) {
    return {
      files: memoryCache.files,
      syncedAt: memoryCache.syncedAtStr,
      error: memoryCache.error,
    };
  }

  const { clientEmail, privateKey, folderId, keyValidation } =
    getServiceAccountCredentials();
  const syncedAt = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  console.log("[DriveService] Sync initiated.");
  console.log(
    `[DriveService] Folder ID configured: ${folderId ? maskString(folderId, 4, 4) : "NONE"}`
  );
  console.log(
    `[DriveService] Client Email: ${clientEmail ? maskEmail(clientEmail) : "NONE"}`
  );
  console.log(
    `[DriveService] Private Key status: ${keyValidation.status} (${keyValidation.message})`
  );

  if (!folderId) {
    const errorMsg = "GOOGLE_DRIVE_FOLDER_ID environment variable is missing.";
    console.error(`[DriveService] Configuration error: ${errorMsg}`);
    memoryCache = { files: [], cachedAt: now, syncedAtStr: syncedAt, error: errorMsg };
    return { files: [], syncedAt, error: errorMsg };
  }

  if (!clientEmail) {
    const errorMsg = "GOOGLE_CLIENT_EMAIL environment variable is missing.";
    console.error(`[DriveService] Configuration error: ${errorMsg}`);
    memoryCache = { files: [], cachedAt: now, syncedAtStr: syncedAt, error: errorMsg };
    return { files: [], syncedAt, error: errorMsg };
  }

  if (keyValidation.status !== "valid_pem" || !privateKey) {
    const errorMsg = keyValidation.message;
    console.error(`[DriveService] Authentication error: ${errorMsg}`);
    memoryCache = { files: [], cachedAt: now, syncedAtStr: syncedAt, error: errorMsg };
    return { files: [], syncedAt, error: errorMsg };
  }

  try {
    const drive = createDriveClient();

    console.log(
      `[DriveService] Querying Google Drive folder "${maskString(folderId, 4, 4)}" for files...`
    );

    try {
      const folderRes = await drive.files.get({
        fileId: folderId,
        fields: "id, name, mimeType",
        supportsAllDrives: true,
      });
      console.log(
        `[DriveService] Confirmed folder access: "${folderRes.data.name}" (${folderRes.data.id})`
      );
    } catch (folderAccessErr: unknown) {
      const status = (folderAccessErr as { code?: number })?.code;
      const msg =
        folderAccessErr instanceof Error
          ? folderAccessErr.message
          : String(folderAccessErr);
      if (status === 404 || msg.includes("File not found")) {
        const errorMsg = `Google Drive folder not found (404). Either the folder ID is incorrect or the folder has not been shared with the service account (${clientEmail}). Please share the folder with this email as Viewer.`;
        console.error(`[DriveService] ${errorMsg}`);
        memoryCache = {
          files: [],
          cachedAt: now,
          syncedAtStr: syncedAt,
          error: errorMsg,
        };
        return { files: [], syncedAt, error: errorMsg };
      }
      if (status === 403 || msg.includes("permission")) {
        const errorMsg = `Permission denied (403) accessing Google Drive folder. Please share folder "${maskString(folderId, 4, 4)}" with service account "${clientEmail}" as Viewer.`;
        console.error(`[DriveService] ${errorMsg}`);
        memoryCache = {
          files: [],
          cachedAt: now,
          syncedAtStr: syncedAt,
          error: errorMsg,
        };
        return { files: [], syncedAt, error: errorMsg };
      }
      throw folderAccessErr;
    }

    const allItems = await listAllFolderFiles(drive, folderId);
    console.log(
      `[DriveService] Drive files.list returned ${allItems.length} total items in folder.`
    );

    const excelFiles = allItems.filter(isExcelDriveItem);

    console.log(
      `[DriveService] Filtered ${excelFiles.length} Excel spreadsheet files (.xlsx/.xls).`
    );

    if (excelFiles.length === 0) {
      const infoMsg = `No .xlsx or .xls Excel files were found inside Google Drive folder "${maskString(folderId, 4, 4)}".`;
      console.log(`[DriveService] ${infoMsg}`);
      memoryCache = {
        files: [],
        cachedAt: now,
        syncedAtStr: syncedAt,
        error:
          allItems.length > 0
            ? `${infoMsg} (${allItems.length} non-Excel items found in folder).`
            : infoMsg,
      };
      return { files: [], syncedAt, error: memoryCache.error };
    }

    const parsedFiles: DriveExcelFile[] = [];

    await mapWithConcurrency(excelFiles, 4, async (file) => {
      if (!file.id || !file.name) return;

      try {
        const fileMedia = await drive.files.get(
          { fileId: file.id, alt: "media", supportsAllDrives: true },
          { responseType: "arraybuffer" }
        );

        const buffer = Buffer.from(fileMedia.data as ArrayBuffer);
        const sizeStr = formatFileSize(Number(file.size) || buffer.byteLength);
        const lastModified = formatIsoToDisplay(file.modifiedTime);

        const parseResult = parseExcelBuffer(
          buffer,
          file.name,
          file.id,
          lastModified,
          sizeStr
        );

        if (parseResult.isDueFile && parseResult.customerLedger) {
          parsedFiles.push(parseResult.customerLedger);
        } else if (parseResult.generalExcelFile) {
          parsedFiles.push(parseResult.generalExcelFile);
        }
      } catch (fileErr) {
        console.warn(
          `[DriveService] Failed to parse workbook ${file.id}:`,
          fileErr instanceof Error ? fileErr.message : String(fileErr)
        );
      }
    });

    console.log(
      `[DriveService] Parsed ${parsedFiles.length} workbooks (${parsedFiles.filter((f) => f.isDueFile).length} ledgers, ${parsedFiles.filter((f) => !f.isDueFile).length} other).`
    );

    memoryCache = {
      files: parsedFiles,
      cachedAt: now,
      syncedAtStr: syncedAt,
      error: null,
    };

    return {
      files: parsedFiles,
      syncedAt,
      error: null,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[DriveService] Google Drive API connection failed:", errorMsg);

    memoryCache = {
      files: [],
      cachedAt: now,
      syncedAtStr: syncedAt,
      error: `Drive API Error: ${errorMsg}`,
    };

    return {
      files: [],
      syncedAt,
      error: memoryCache.error,
    };
  }
}

export async function getDriveFileById(fileId: string): Promise<DriveExcelFile | null> {
  const { files } = await getDriveFiles(false);
  const matched = files.find((f) => f.id === fileId);
  return matched || null;
}

export async function downloadDriveExcelInFolder(fileId: string): Promise<{
  buffer: Buffer;
  name: string;
  modifiedTime: string | null;
  size: number;
} | null> {
  if (!isDriveConfigured()) return null;

  const { folderId } = getServiceAccountCredentials();
  if (!folderId) return null;

  const drive = createDriveClientFromEnv();
  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, modifiedTime, size, parents, trashed",
    supportsAllDrives: true,
  });

  const name = meta.data.name || "";
  const parents = meta.data.parents || [];
  const excelName = /\.(xlsx|xls)$/i.test(name);
  if (meta.data.trashed || !excelName || !parents.includes(folderId)) {
    return null;
  }

  const fileMedia = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );

  return {
    buffer: Buffer.from(fileMedia.data as ArrayBuffer),
    name,
    modifiedTime: meta.data.modifiedTime || null,
    size: Number(meta.data.size) || 0,
  };
}

export function getDriveStatus(): DriveConfigStatus {
  const { clientEmail, privateKey, folderId, keyValidation } =
    getServiceAccountCredentials();
  const configured = Boolean(
    clientEmail && privateKey && folderId && keyValidation.status === "valid_pem"
  );

  const folderIdMasked = folderId ? maskString(folderId, 4, 4) : "Not configured";
  const clientEmailMasked = clientEmail ? maskEmail(clientEmail) : "Not configured";

  const files = memoryCache?.files || [];
  const dueCount = files.filter((f) => f.isDueFile).length;
  const otherCount = files.length - dueCount;

  let mode: "real_drive" | "error" | "not_configured" = "not_configured";
  if (configured && !memoryCache?.error) {
    mode = "real_drive";
  } else if (memoryCache?.error || keyValidation.status !== "valid_pem") {
    mode = "error";
  }

  let message = "Operating with real Google Drive API synchronization.";
  if (keyValidation.status !== "valid_pem") {
    message = keyValidation.message;
  } else if (!folderId) {
    message = "GOOGLE_DRIVE_FOLDER_ID is missing.";
  } else if (!clientEmail) {
    message = "GOOGLE_CLIENT_EMAIL is missing.";
  } else if (memoryCache?.error) {
    message = memoryCache.error;
  }

  return {
    isConfigured: configured,
    hasFolderId: Boolean(folderId),
    hasServiceAccount: Boolean(clientEmail && keyValidation.status === "valid_pem"),
    folderIdMasked,
    rawFolderIdMasked: folderIdMasked,
    clientEmailMasked,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    mode,
    lastSyncedAt: memoryCache?.syncedAtStr || null,
    fileCount: files.length,
    dueCount,
    otherCount,
    message,
    keyStatus: keyValidation.status,
    keyStatusMessage: keyValidation.message,
    error:
      memoryCache?.error ||
      (keyValidation.status !== "valid_pem" ? keyValidation.message : null),
  };
}

export function invalidateDriveCache() {
  memoryCache = null;
}

export function getParsedDriveFileMap(): Map<string, DriveExcelFile> {
  const map = new Map<string, DriveExcelFile>();
  for (const file of memoryCache?.files || []) {
    map.set(file.id, file);
  }
  return map;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatIsoToDisplay(isoStr?: string | null): string {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return "—";
  }
}

export function maskString(str: string, keepStart = 3, keepEnd = 3): string {
  if (str.length <= keepStart + keepEnd) return "****";
  return `${str.slice(0, keepStart)}...${str.slice(-keepEnd)}`;
}

export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return maskString(email);
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 3 ? `${name.slice(0, 3)}***` : "***";
  return `${maskedName}@${domain}`;
}
