export type DriveConnectionStatus = "connected" | "disconnected" | "error";

export type DriveHealth = {
  status: DriveConnectionStatus;
  message: string;
  fileCount: number | null;
  lastSyncedAt: string | null;
};
