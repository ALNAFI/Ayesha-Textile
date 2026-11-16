/**
 * Client-safe helpers: show a change on screen right away, before Drive has
 * saved it. The server answer replaces this guess when the save finishes.
 */

import type { EntrySchema, EntryTailRow } from "@/lib/data-entry/types";

export type EntryOp =
  | { type: "add"; values: Record<string, string> }
  | { type: "update"; rowNumber: number; values: Record<string, string> }
  | { type: "delete"; rowNumber: number };

export type EntryView = Pick<EntrySchema, "currentBalance" | "nextRow" | "tail">;
type Meta = Pick<EntrySchema, "mode" | "fieldCells" | "balanceCell">;

const MAX_TAIL = 5;
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function cleanAmount(raw: string | undefined) {
  return (raw ?? "").trim().replace(/,/g, "");
}

function toAmount(raw: string | undefined) {
  const text = cleanAmount(raw);
  if (!AMOUNT_RE.test(text)) return 0;
  return Number(text);
}

function net(values: Record<string, string>) {
  return toAmount(values.credit) - toAmount(values.debit);
}

function fmtDate(input: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : input;
}

function cellNumber(text: string | undefined): number | null {
  const n = Number((text ?? "").replace(/,/g, "").trim());
  return text && text.trim() !== "" && Number.isFinite(n) ? n : null;
}

function shiftBalance(text: string | undefined, delta: number): string {
  const n = cellNumber(text);
  return n == null ? (text ?? "") : String(round2(n + delta));
}

function buildCells(
  meta: Meta,
  width: number,
  values: Record<string, string>,
  base: string[] | null,
  balance: number | null
): string[] {
  const cells = base ? [...base] : Array<string>(width).fill("");
  for (const [key, index] of Object.entries(meta.fieldCells)) {
    const value = values[key] ?? "";
    if (key === "date") {
      if (value.trim()) cells[index] = fmtDate(value);
    } else if (key === "debit" || key === "credit") {
      const amount = toAmount(value);
      cells[index] = amount > 0 ? String(round2(amount)) : "";
    } else {
      cells[index] = value.trim();
    }
  }
  if (meta.mode === "ledger" && meta.balanceCell >= 0 && balance != null) {
    cells[meta.balanceCell] = String(round2(balance));
  }
  return cells;
}

/** Same rules as the server, so a bad entry is stopped before it is shown. */
export function validateEntry(
  schema: Pick<EntrySchema, "mode" | "fields">,
  values: Record<string, string>,
  editing: boolean,
  original?: Record<string, string>
): string | null {
  if (schema.mode === "ledger") {
    if (!editing && !values.date?.trim()) return "Choose a date.";
    if (!(values.description ?? "").trim()) return "Description is required.";
    for (const key of ["debit", "credit"] as const) {
      const text = cleanAmount(values[key]);
      if (text && !AMOUNT_RE.test(text)) {
        const label = key === "debit" ? "Debit" : "Credit";
        return `${label} must be a positive number.`;
      }
    }
    if (toAmount(values.debit) === 0 && toAmount(values.credit) === 0) {
      return "Enter a Debit or a Credit amount.";
    }
  } else if (!schema.fields.some((f) => (values[f.key] ?? "").trim() !== "")) {
    return "Fill in at least one field.";
  }

  if (editing && original) {
    const same = schema.fields.every((f) => {
      const next = (values[f.key] ?? "").trim();
      const before = (original[f.key] ?? "").trim();
      if (f.key === "date" && next === "") return true; // blank keeps the old date
      if (f.key === "debit" || f.key === "credit") {
        return toAmount(next) === toAmount(before);
      }
      return next === before;
    });
    if (same) return "Nothing was changed.";
  }
  return null;
}

export function applyOptimistic(
  meta: Meta,
  view: EntryView,
  op: EntryOp
): EntryView {
  const ledger = meta.mode === "ledger";
  const width = view.tail.headers.length;
  const rows = view.tail.rows;
  const hasBalanceCol = ledger && meta.balanceCell >= 0;

  if (op.type === "add") {
    const balance =
      ledger && view.currentBalance != null
        ? round2(view.currentBalance + net(op.values))
        : null;
    const row: EntryTailRow = {
      rowNumber: view.nextRow,
      cells: buildCells(meta, width, op.values, null, balance),
      values: { ...op.values },
      editable: true,
      pending: true,
    };
    return {
      currentBalance: ledger ? balance : view.currentBalance,
      nextRow: view.nextRow + 1,
      tail: {
        headers: view.tail.headers,
        rows: [...rows, row].slice(-MAX_TAIL),
      },
    };
  }

  const index = rows.findIndex((r) => r.rowNumber === op.rowNumber);
  if (index < 0) return view;
  const old = rows[index];

  if (op.type === "update") {
    const delta = ledger ? net(op.values) - net(old.values) : 0;
    const merged = {
      ...old.values,
      ...op.values,
      date: op.values.date?.trim() ? op.values.date : old.values.date,
    };
    const next = rows.map((r, i) => {
      if (i < index) return r;
      if (i === index) {
        const current = hasBalanceCol ? cellNumber(r.cells[meta.balanceCell]) : null;
        return {
          ...r,
          cells: buildCells(
            meta,
            width,
            merged,
            r.cells,
            current == null ? null : current + delta
          ),
          values: merged,
          pending: true,
        };
      }
      if (!delta || !hasBalanceCol) return r;
      const cells = [...r.cells];
      cells[meta.balanceCell] = shiftBalance(cells[meta.balanceCell], delta);
      return { ...r, cells };
    });
    return {
      currentBalance:
        ledger && view.currentBalance != null
          ? round2(view.currentBalance + delta)
          : view.currentBalance,
      nextRow: view.nextRow,
      tail: { headers: view.tail.headers, rows: next },
    };
  }

  // delete
  const removed = ledger ? net(old.values) : 0;
  const next = rows
    .filter((r) => r.rowNumber !== op.rowNumber)
    .map((r) => {
      if (r.rowNumber < op.rowNumber) return r;
      const cells = [...r.cells];
      if (hasBalanceCol && removed) {
        cells[meta.balanceCell] = shiftBalance(cells[meta.balanceCell], -removed);
      }
      return { ...r, rowNumber: r.rowNumber - 1, cells };
    });
  return {
    currentBalance:
      ledger && view.currentBalance != null
        ? round2(view.currentBalance - removed)
        : view.currentBalance,
    nextRow: view.nextRow - 1,
    tail: { headers: view.tail.headers, rows: next },
  };
}
