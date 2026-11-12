export type FileListKind = "customer" | "other";

export type FileListFilter = "all" | "customer" | "other";

export type FileListSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc";

export type FileListItem = {
  id: string;
  fileName: string;
  kind: FileListKind;
  customerName?: string;
  location?: string;
  lastModified: string;
  modifiedAt: number;
  href: string;
  outdated: boolean;
};

export type FileListSnapshot = {
  available: boolean;
  status: "ready" | "not_configured" | "error";
  message: string;
  refreshedAt: string | null;
  refreshedAtIso: string | null;
  totalCount: number;
  customerCount: number;
  otherCount: number;
  items: FileListItem[];
};
