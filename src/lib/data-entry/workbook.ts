/**
 * Server-only: finds the last data row of a workbook and appends one row.
 *
 * Uses ExcelJS (not SheetJS) because it keeps cell styles, column widths,
 * merged cells and formulas when the file is saved again.
 *
 * Ledger sheets (Date / Description / File No / Debit / Credit / Balance)
 * get a fixed form and an automatic running balance. Any other sheet gets one
 * form field per header cell.
 */

import "server-only";
import ExcelJS from "exceljs";
import { detectLedgerHeaders } from "@/lib/excel/parser";
import type {
  EntryField,
  EntryTail,
  EntryTailRow,
} from "@/lib/data-entry/types";

export class EntryInputError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "EntryInputError";
    this.status = status;
  }
}

const TAIL_ROWS = 5;
const MAX_COLS = 40;
const MAX_HEADER_SCAN = 12;
const SUBTOTAL_RE = /^(total|sub\s*total|subtotal|grand\s*total|মোট)$/i;

type LedgerCols = {
  date: number;
  description: number;
  fileNo: number; // 0 when the sheet has no File No column
  debit: number;
  credit: number;
  balance: number;
};

type Located =
  | {
      mode: "ledger";
      wb: ExcelJS.Workbook;
      ws: ExcelJS.Worksheet;
      headerRow: number;
      lastRow: number;
      colCount: number;
      cols: LedgerCols;
    }
  | {
      mode: "general";
      wb: ExcelJS.Workbook;
      ws: ExcelJS.Worksheet;
      headerRow: number;
      lastRow: number;
      colCount: number;
      fieldCols: { col: number; label: string }[];
    };

/* ------------------------------ cell helpers ------------------------------ */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatUtcDate(d: Date) {
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function displayText(cell: ExcelJS.Cell): string {
  try {
    const v = cell.value;
    if (v instanceof Date) return formatUtcDate(v);
    if (v && typeof v === "object" && "result" in v) {
      const r = (v as { result?: unknown }).result;
      if (r instanceof Date) return formatUtcDate(r);
      if (r == null) return "";
      return String(r);
    }
    return cell.text ?? "";
  } catch {
    return "";
  }
}

function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function cellNumber(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return null;
  if (typeof v === "object" && "result" in v) {
    const r = (v as { result?: unknown }).result;
    if (typeof r === "number") return Number.isFinite(r) ? r : null;
    if (typeof r === "string") return parseNumber(r);
    return null;
  }
  return parseNumber(displayText(cell));
}

function isFormula(cell: ExcelJS.Cell): boolean {
  const v = cell.value;
  return (
    v != null &&
    typeof v === "object" &&
    ("formula" in v || "sharedFormula" in v)
  );
}

function isBlank(text: string) {
  const t = text.trim();
  return t === "" || t === "—";
}

function rowTexts(ws: ExcelJS.Worksheet, r: number, colCount: number) {
  const row = ws.getRow(r);
  const out: string[] = [];
  for (let c = 1; c <= colCount; c++) out.push(displayText(row.getCell(c)));
  return out;
}

function rowHasContent(ws: ExcelJS.Worksheet, r: number, colCount: number) {
  return rowTexts(ws, r, colCount).some((t) => !isBlank(t));
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

/* -------------------------------- locating -------------------------------- */

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new EntryInputError(
      "This file could not be opened. It may be damaged or not a real .xlsx file.",
      422
    );
  }
  return wb;
}

async function locate(buffer: Buffer): Promise<Located> {
  const wb = await loadWorkbook(buffer);

  // 1) Customer ledger sheet.
  for (const ws of wb.worksheets) {
    const colCount = Math.min(Math.max(ws.columnCount, 1), MAX_COLS);
    const scan = Math.min(ws.rowCount, MAX_HEADER_SCAN);
    for (let r = 1; r <= scan; r++) {
      const match = detectLedgerHeaders(rowTexts(ws, r, colCount));
      if (!match.isMatch) continue;

      const cols: LedgerCols = {
        date: match.colMap.date + 1,
        description: match.colMap.description + 1,
        fileNo: match.colMap.fileNo === -1 ? 0 : match.colMap.fileNo + 1,
        debit: match.colMap.debit + 1,
        credit: match.colMap.credit + 1,
        balance: match.colMap.balance + 1,
      };

      let lastRow = r;
      let blockerRow = 0;
      for (let rr = r + 1; rr <= ws.rowCount; rr++) {
        if (!rowHasContent(ws, rr, colCount)) continue;
        const desc = displayText(ws.getRow(rr).getCell(cols.description));
        if (SUBTOTAL_RE.test(desc.trim())) {
          if (!blockerRow) blockerRow = rr;
          continue;
        }
        if (blockerRow) continue; // content after a total row
        lastRow = rr;
      }
      // Anything non-empty after the last data row (a Total row, notes) means
      // appending below would land in the wrong place.
      for (let rr = lastRow + 1; rr <= ws.rowCount && !blockerRow; rr++) {
        if (rowHasContent(ws, rr, colCount)) blockerRow = rr;
      }
      if (blockerRow) {
        throw new EntryInputError(
          `Row ${blockerRow} has a Total or note row below the last entry, so a new row cannot be added safely. Remove it (or move it to the top) in Excel and try again.`,
          409
        );
      }

      return { mode: "ledger", wb, ws, headerRow: r, lastRow, colCount, cols };
    }
  }

  // 2) General sheet: first sheet that has any content.
  for (const ws of wb.worksheets) {
    const colCount = Math.min(Math.max(ws.columnCount, 1), MAX_COLS);
    let headerRow = 0;
    for (let r = 1; r <= ws.rowCount; r++) {
      if (rowHasContent(ws, r, colCount)) {
        headerRow = r;
        break;
      }
    }
    if (!headerRow) continue;

    let lastRow = headerRow;
    for (let r = ws.rowCount; r > headerRow; r--) {
      if (rowHasContent(ws, r, colCount)) {
        lastRow = r;
        break;
      }
    }

    if (lastRow > headerRow) {
      const firstText = rowTexts(ws, lastRow, colCount).find((t) => !isBlank(t));
      if (firstText && SUBTOTAL_RE.test(firstText.trim())) {
        throw new EntryInputError(
          `The last row (row ${lastRow}) looks like a Total row, so a new row cannot be added safely.`,
          409
        );
      }
    }

    const headers = rowTexts(ws, headerRow, colCount);
    const fieldCols = headers
      .map((label, i) => ({ col: i + 1, label: label.trim() }))
      .filter((h) => h.label !== "");
    if (fieldCols.length === 0) continue;

    return {
      mode: "general",
      wb,
      ws,
      headerRow,
      lastRow,
      colCount,
      fieldCols,
    };
  }

  throw new EntryInputError("This workbook has no data to add to.", 422);
}

/* --------------------------------- outputs -------------------------------- */

function pad2n(n: number) {
  return String(n).padStart(2, "0");
}

/** yyyy-mm-dd for an <input type="date">, or "" when the cell is not a clear date. */
function cellDateInput(cell: ExcelJS.Cell): string {
  let v: unknown = cell.value;
  if (v && typeof v === "object" && !(v instanceof Date) && "result" in v) {
    v = (v as { result?: unknown }).result;
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getUTCFullYear()}-${pad2n(v.getUTCMonth() + 1)}-${pad2n(v.getUTCDate())}`;
  }
  if (typeof v === "string") {
    const m = /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2}|\d{4})$/.exec(v.trim());
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]);
      let year = Number(m[3]);
      if (year < 100) year += year >= 70 ? 1900 : 2000;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${pad2n(month)}-${pad2n(day)}`;
      }
    }
  }
  return "";
}

function amountText(n: number | null): string {
  return n && n !== 0 ? String(roundMoney(n)) : "";
}

function isOpeningRow(
  loc: Extract<Located, { mode: "ledger" }>,
  r: number
): boolean {
  const row = loc.ws.getRow(r);
  const debit = cellNumber(row.getCell(loc.cols.debit)) ?? 0;
  const credit = cellNumber(row.getCell(loc.cols.credit)) ?? 0;
  const stated = cellNumber(row.getCell(loc.cols.balance));
  return debit === 0 && credit === 0 && stated != null;
}

function rowFormValues(loc: Located, r: number): Record<string, string> {
  const row = loc.ws.getRow(r);
  if (loc.mode === "ledger") {
    const { cols } = loc;
    const values: Record<string, string> = {
      date: cellDateInput(row.getCell(cols.date)),
      description: displayText(row.getCell(cols.description)).trim(),
      debit: amountText(cellNumber(row.getCell(cols.debit))),
      credit: amountText(cellNumber(row.getCell(cols.credit))),
    };
    if (cols.fileNo) values.fileNo = displayText(row.getCell(cols.fileNo)).trim();
    return values;
  }
  const values: Record<string, string> = {};
  for (const f of loc.fieldCols) {
    values[`c${f.col}`] = displayText(row.getCell(f.col)).trim();
  }
  return values;
}

function buildTail(loc: Located): EntryTail {
  const { ws, headerRow, lastRow } = loc;
  const showCols = Math.min(loc.colCount, 10);
  const headers = rowTexts(ws, headerRow, showCols).map((h, i) =>
    h.trim() ? h.trim() : `Col ${i + 1}`
  );
  const rows: EntryTailRow[] = [];
  for (let r = lastRow; r > headerRow && rows.length < TAIL_ROWS; r--) {
    if (!rowHasContent(ws, r, loc.colCount)) continue;
    if (loc.mode === "ledger") {
      const desc = displayText(ws.getRow(r).getCell(loc.cols.description));
      if (SUBTOTAL_RE.test(desc.trim())) continue;
    }
    rows.unshift({
      rowNumber: r,
      cells: rowTexts(ws, r, showCols),
      values: rowFormValues(loc, r),
      editable: loc.mode === "ledger" ? !isOpeningRow(loc, r) : true,
    });
  }
  return { headers, rows };
}

function currentLedgerBalance(
  loc: Extract<Located, { mode: "ledger" }>
): number | null {
  const { ws, headerRow, lastRow, cols } = loc;
  let running = 0;
  let sawAny = false;
  for (let r = headerRow + 1; r <= lastRow; r++) {
    const row = ws.getRow(r);
    const stated = cellNumber(row.getCell(cols.balance));
    const debit = cellNumber(row.getCell(cols.debit)) ?? 0;
    const credit = cellNumber(row.getCell(cols.credit)) ?? 0;
    if (stated != null) {
      running = stated;
      sawAny = true;
    } else if (debit !== 0 || credit !== 0) {
      running += credit - debit;
      sawAny = true;
    }
  }
  return sawAny ? roundMoney(running) : lastRow === headerRow ? 0 : null;
}

export type WorkbookDescription = {
  mode: "ledger" | "general";
  sheetName: string;
  fields: EntryField[];
  currentBalance: number | null;
  tail: EntryTail;
};

export async function describeWorkbook(
  buffer: Buffer
): Promise<WorkbookDescription> {
  const loc = await locate(buffer);

  if (loc.mode === "ledger") {
    const fields: EntryField[] = [
      { key: "date", label: "Date", type: "date", required: true },
      {
        key: "description",
        label: "Description",
        type: "text",
        required: true,
        placeholder: "e.g. Cash received / Panjabi 20 pcs",
      },
    ];
    if (loc.cols.fileNo) {
      fields.push({
        key: "fileNo",
        label: "File No",
        type: "text",
        placeholder: "Optional",
      });
    }
    fields.push(
      {
        key: "debit",
        label: "Debit",
        type: "number",
        hint: "Payment received. Due goes down.",
        placeholder: "0",
      },
      {
        key: "credit",
        label: "Credit",
        type: "number",
        hint: "New bill or goods given. Due goes up.",
        placeholder: "0",
      }
    );
    return {
      mode: "ledger",
      sheetName: loc.ws.name,
      fields,
      currentBalance: currentLedgerBalance(loc),
      tail: buildTail(loc),
    };
  }

  return {
    mode: "general",
    sheetName: loc.ws.name,
    fields: loc.fieldCols.map((f) => ({
      key: `c${f.col}`,
      label: f.label,
      type: "text" as const,
    })),
    currentBalance: null,
    tail: buildTail(loc),
  };
}

/* --------------------------------- append --------------------------------- */

function copyRowLook(
  ws: ExcelJS.Worksheet,
  fromRow: number,
  toRow: number,
  colCount: number
) {
  const from = ws.getRow(fromRow);
  const to = ws.getRow(toRow);
  for (let c = 1; c <= colCount; c++) {
    const src = from.getCell(c);
    if (src.style && Object.keys(src.style).length > 0) {
      to.getCell(c).style = structuredClone(src.style);
    }
  }
  if (from.height) to.height = from.height;
}

function parseInputDate(value: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new EntryInputError("Please choose a valid date.");
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d
  ) {
    throw new EntryInputError("Please choose a valid date.");
  }
  return { y, m, d };
}

function parseAmount(raw: string | undefined, label: string): number {
  const text = (raw ?? "").trim().replace(/,/g, "");
  if (!text) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new EntryInputError(`${label} must be a positive number.`);
  }
  const n = Number(text);
  if (!Number.isFinite(n) || n > 1_000_000_000) {
    throw new EntryInputError(`${label} is too large.`);
  }
  return n;
}

function cleanText(raw: string | undefined, max: number): string {
  return (raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export type AppendOutcome = {
  buffer: Buffer;
  rowNumber: number;
  newBalance: number | null;
  tail: EntryTail;
};

export async function appendRowToWorkbook(
  buffer: Buffer,
  values: Record<string, string>
): Promise<AppendOutcome> {
  const loc = await locate(buffer);
  const { ws, headerRow, lastRow, colCount } = loc;
  const newRowNumber = lastRow + 1;
  const hasPreviousData = lastRow > headerRow;
  let newBalance: number | null = null;

  if (loc.mode === "ledger") {
    const { cols } = loc;
    const date = parseInputDate(values.date ?? "");
    const description = cleanText(values.description, 200);
    const fileNo = cleanText(values.fileNo, 60);
    const debit = parseAmount(values.debit, "Debit");
    const credit = parseAmount(values.credit, "Credit");

    if (!description) throw new EntryInputError("Description is required.");
    if (debit === 0 && credit === 0) {
      throw new EntryInputError("Enter a Debit or a Credit amount.");
    }

    const before = currentLedgerBalance(loc) ?? 0;
    newBalance = roundMoney(before + credit - debit);

    if (hasPreviousData) copyRowLook(ws, lastRow, newRowNumber, colCount);
    const row = ws.getRow(newRowNumber);
    const prev = ws.getRow(lastRow);

    // Date: match what the sheet already uses (text or a real date).
    const prevDateValue = prev.getCell(cols.date).value;
    const dateCell = row.getCell(cols.date);
    if (typeof prevDateValue === "string") {
      dateCell.value = `${pad2(date.d)}/${pad2(date.m)}/${date.y}`;
    } else {
      dateCell.value = new Date(Date.UTC(date.y, date.m - 1, date.d));
      if (!dateCell.numFmt || dateCell.numFmt === "General") {
        dateCell.numFmt = "dd/mm/yyyy";
      }
    }

    row.getCell(cols.description).value = description;
    if (cols.fileNo && fileNo) row.getCell(cols.fileNo).value = fileNo;
    row.getCell(cols.debit).value = debit > 0 ? debit : null;
    row.getCell(cols.credit).value = credit > 0 ? credit : null;

    // Balance: keep a formula if the sheet uses formulas, else write the number.
    const prevBalanceCell = prev.getCell(cols.balance);
    const balanceCell = row.getCell(cols.balance);
    if (hasPreviousData && isFormula(prevBalanceCell)) {
      const L = (n: number) => ws.getColumn(n).letter;
      balanceCell.value = {
        formula: `${L(cols.balance)}${lastRow}+${L(cols.credit)}${newRowNumber}-${L(cols.debit)}${newRowNumber}`,
        result: newBalance,
      };
    } else {
      balanceCell.value = newBalance;
    }

    row.commit();
  } else {
    let filled = 0;
    if (hasPreviousData) copyRowLook(ws, lastRow, newRowNumber, colCount);
    const row = ws.getRow(newRowNumber);
    const prev = ws.getRow(lastRow);

    for (const f of loc.fieldCols) {
      const text = cleanText(values[`c${f.col}`], 500);
      if (!text) continue;
      filled += 1;
      const prevIsNumber =
        hasPreviousData && typeof prev.getCell(f.col).value === "number";
      const numeric = /^-?\d+(\.\d+)?$/.test(text.replace(/,/g, ""));
      row.getCell(f.col).value =
        prevIsNumber && numeric ? Number(text.replace(/,/g, "")) : text;
    }
    if (filled === 0) {
      throw new EntryInputError("Fill in at least one field.");
    }
    row.commit();
  }

  const out = await loc.wb.xlsx.writeBuffer();
  const tail = buildTail({ ...loc, lastRow: newRowNumber });

  return {
    buffer: Buffer.from(out as ArrayBuffer),
    rowNumber: newRowNumber,
    newBalance,
    tail,
  };
}


/* ------------------------------ update / delete ----------------------------- */

function writeDateValue(
  cell: ExcelJS.Cell,
  existing: ExcelJS.CellValue,
  date: { y: number; m: number; d: number }
) {
  if (typeof existing === "string") {
    cell.value = `${pad2(date.d)}/${pad2(date.m)}/${date.y}`;
  } else {
    cell.value = new Date(Date.UTC(date.y, date.m - 1, date.d));
    if (!cell.numFmt || cell.numFmt === "General") cell.numFmt = "dd/mm/yyyy";
  }
}

function assertRowUsable(loc: Located, rowNumber: number) {
  if (
    !Number.isInteger(rowNumber) ||
    rowNumber <= loc.headerRow ||
    rowNumber > loc.lastRow ||
    !rowHasContent(loc.ws, rowNumber, loc.colCount)
  ) {
    throw new EntryInputError(
      "That row is not in the file any more. Reload the page and try again.",
      409
    );
  }
  if (loc.mode === "ledger" && isOpeningRow(loc, rowNumber)) {
    throw new EntryInputError(
      "This is an opening balance row. Please change it directly in Excel.",
      400
    );
  }
}

/**
 * Recalculates the Balance column from `fromRow` down to the last row.
 * `regenFormulas` is used after a delete, when rows moved up and old
 * formulas would point at the wrong cells.
 */
function recomputeBalances(
  loc: Extract<Located, { mode: "ledger" }>,
  fromRow: number,
  regenFormulas: boolean
) {
  const { ws, headerRow, lastRow, cols } = loc;
  const L = (n: number) => ws.getColumn(n).letter;

  let running = 0;
  for (let r = headerRow + 1; r < fromRow; r++) {
    const row = ws.getRow(r);
    const stated = cellNumber(row.getCell(cols.balance));
    const debit = cellNumber(row.getCell(cols.debit)) ?? 0;
    const credit = cellNumber(row.getCell(cols.credit)) ?? 0;
    if (stated != null) running = stated;
    else if (debit !== 0 || credit !== 0) running += credit - debit;
  }

  for (let r = fromRow; r <= lastRow; r++) {
    const row = ws.getRow(r);
    const debit = cellNumber(row.getCell(cols.debit)) ?? 0;
    const credit = cellNumber(row.getCell(cols.credit)) ?? 0;
    const stated = cellNumber(row.getCell(cols.balance));
    if (debit === 0 && credit === 0 && stated != null) {
      running = stated; // opening or balance-only row
      continue;
    }
    running = roundMoney(running + credit - debit);

    const cell = row.getCell(cols.balance);
    if (isFormula(cell)) {
      if (regenFormulas && r - 1 > headerRow) {
        cell.value = {
          formula: `${L(cols.balance)}${r - 1}+${L(cols.credit)}${r}-${L(cols.debit)}${r}`,
          result: running,
        };
      } else if (regenFormulas) {
        cell.value = running;
      } else {
        cell.value = {
          ...(cell.value as object),
          result: running,
        } as unknown as ExcelJS.CellValue;
      }
    } else {
      cell.value = running;
    }
  }
}

export async function updateRowInWorkbook(
  buffer: Buffer,
  rowNumber: number,
  values: Record<string, string>
): Promise<AppendOutcome> {
  const loc = await locate(buffer);
  assertRowUsable(loc, rowNumber);
  const { ws } = loc;
  const row = ws.getRow(rowNumber);
  let newBalance: number | null = null;

  if (loc.mode === "ledger") {
    const { cols } = loc;
    const description = cleanText(values.description, 200);
    const fileNo = cleanText(values.fileNo, 60);
    const debit = parseAmount(values.debit, "Debit");
    const credit = parseAmount(values.credit, "Credit");
    if (!description) throw new EntryInputError("Description is required.");
    if (debit === 0 && credit === 0) {
      throw new EntryInputError("Enter a Debit or a Credit amount.");
    }

    // Only touch cells that actually changed, so untouched cells keep their type.
    if (values.date?.trim()) {
      const date = parseInputDate(values.date);
      const asInput = `${date.y}-${pad2(date.m)}-${pad2(date.d)}`;
      const dateCell = row.getCell(cols.date);
      if (asInput !== cellDateInput(dateCell)) {
        writeDateValue(dateCell, dateCell.value, date);
      }
    }

    const descCell = row.getCell(cols.description);
    if (description !== displayText(descCell).replace(/\s+/g, " ").trim()) {
      descCell.value = description;
    }

    if (cols.fileNo) {
      const fileCell = row.getCell(cols.fileNo);
      if (fileNo !== displayText(fileCell).replace(/\s+/g, " ").trim()) {
        fileCell.value = fileNo || null;
      }
    }

    const debitCell = row.getCell(cols.debit);
    if (debit !== (cellNumber(debitCell) ?? 0)) {
      debitCell.value = debit > 0 ? debit : null;
    }
    const creditCell = row.getCell(cols.credit);
    if (credit !== (cellNumber(creditCell) ?? 0)) {
      creditCell.value = credit > 0 ? credit : null;
    }

    recomputeBalances(loc, rowNumber, false);
    newBalance = currentLedgerBalance(loc);
  } else {
    let touched = 0;
    for (const f of loc.fieldCols) {
      const text = cleanText(values[`c${f.col}`], 500);
      const cell = row.getCell(f.col);
      if (text === displayText(cell).replace(/\s+/g, " ").trim()) continue;
      touched += 1;
      if (!text) {
        cell.value = null;
        continue;
      }
      const wasNumber = typeof cell.value === "number";
      const numeric = /^-?\d+(\.\d+)?$/.test(text.replace(/,/g, ""));
      cell.value = wasNumber && numeric ? Number(text.replace(/,/g, "")) : text;
    }
    if (touched === 0) {
      throw new EntryInputError("Nothing was changed.");
    }
  }

  row.commit();
  const out = await loc.wb.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(out as ArrayBuffer),
    rowNumber,
    newBalance,
    tail: buildTail(loc),
  };
}

export async function deleteRowFromWorkbook(
  buffer: Buffer,
  rowNumber: number
): Promise<AppendOutcome> {
  const loc = await locate(buffer);
  assertRowUsable(loc, rowNumber);
  const { ws, lastRow, colCount } = loc;

  // Move every row below the deleted one up by one, then drop the last row.
  for (let r = rowNumber; r < lastRow; r++) {
    const dst = ws.getRow(r);
    const src = ws.getRow(r + 1);
    for (let c = 1; c <= colCount; c++) {
      const to = dst.getCell(c);
      const from = src.getCell(c);
      to.value = from.value;
      to.style =
        from.style && Object.keys(from.style).length > 0
          ? structuredClone(from.style)
          : {};
    }
    if (src.height) dst.height = src.height;
  }
  ws.spliceRows(lastRow, 1);

  const next: Located = { ...loc, lastRow: lastRow - 1 };
  let newBalance: number | null = null;
  if (next.mode === "ledger") {
    if (rowNumber <= next.lastRow) recomputeBalances(next, rowNumber, true);
    newBalance = currentLedgerBalance(next);
  }

  const out = await next.wb.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(out as ArrayBuffer),
    rowNumber,
    newBalance,
    tail: buildTail(next),
  };
}
