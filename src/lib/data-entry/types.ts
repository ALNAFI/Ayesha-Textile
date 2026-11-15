/** Shared (client + server safe) types for the Data entry page. */

export type EntryFieldType = "date" | "text" | "number";

export type EntryField = {
  key: string;
  label: string;
  type: EntryFieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
};

export type EntryTailRow = {
  /** Row number inside the Excel sheet (1-based). */
  rowNumber: number;
  /** Display text of the first columns, for the table. */
  cells: string[];
  /** Form values for this row, same keys as `fields`. */
  values: Record<string, string>;
  /** False for rows that must be changed in Excel (e.g. opening balance). */
  editable: boolean;
};

export type EntryTail = {
  headers: string[];
  /** Last few data rows. */
  rows: EntryTailRow[];
};

export type EntrySchema = {
  ok: true;
  fileId: string;
  fileName: string;
  modifiedTime: string | null;
  mode: "ledger" | "general";
  sheetName: string;
  fields: EntryField[];
  /** Ledger only: running balance after the last row. */
  currentBalance: number | null;
  tail: EntryTail;
};

export type EntryError = {
  ok: false;
  error: string;
};

export type EntryAppendResult = {
  ok: true;
  action?: "added" | "updated" | "deleted";
  modifiedTime: string | null;
  rowNumber: number;
  newBalance: number | null;
  tail: EntryTail;
};

export type EntryAppendBody = {
  values: Record<string, string>;
  /** modifiedTime the user saw when the form opened. */
  expectedModifiedTime?: string | null;
};

export type EntryUpdateBody = {
  rowNumber: number;
  values: Record<string, string>;
  expectedModifiedTime?: string | null;
};

export type EntryDeleteBody = {
  rowNumber: number;
  expectedModifiedTime?: string | null;
};
