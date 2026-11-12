import type { PreviewSheet } from "@/lib/excel/preview-types";

export type FilePreviewSnapshot = {
  available: boolean;
  status: "ready" | "not_configured" | "missing" | "error";
  message: string;
  refreshedAtIso: string | null;
  id: string;
  fileName: string;
  extension: string;
  kind: "customer" | "other" | "unknown";
  lastModified: string;
  modifiedAt: number;
  size: string;
  outdated: boolean;
  href: string;
  sheets: PreviewSheet[];
};
