export type PageId =
  | "dashboard"
  | "explorer"
  | "due-details"
  | "normal-preview"
  | "settings";

export interface UserSession {
  username: string;
  displayName: string;
  rememberMe: boolean;
  loginTime: string;
}

export type ThemeMode = "light" | "dark";

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string;
  fileCount: number;
}

export interface DriveStatus {
  isConfigured: boolean;
  hasFolderId: boolean;
  hasServiceAccount: boolean;
  folderIdMasked: string;
  clientEmailMasked: string;
  scope: string;
  mode: "real_drive" | "error" | "not_configured";
  lastSyncedAt: string | null;
  fileCount: number;
  dueCount: number;
  otherCount: number;
  message: string;
  keyStatus?: "valid_pem" | "invalid_key_id" | "missing" | "invalid_format";
  keyStatusMessage?: string;
  error?: string | null;
}

export type {
  CustomerLedger,
  DriveExcelFile,
  GeneralExcelFile,
  GeneralExcelSheet,
  LedgerEntry,
} from "@/lib/excel/ledger";
