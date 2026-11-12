"use client";

import { useMemo, useState } from "react";
import type { CustomerPreviewSheet } from "@/lib/customers/detail-types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 40;

type CustomerExcelPreviewProps = {
  sheets: CustomerPreviewSheet[];
};

export function CustomerExcelPreview({ sheets }: CustomerExcelPreviewProps) {
  const [sheetName, setSheetName] = useState(sheets[0]?.name ?? "");
  const [page, setPage] = useState(0);

  const sheet = sheets.find((item) => item.name === sheetName) ?? sheets[0];
  const rows = sheet?.rows ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const visible = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  if (!sheet) {
    return (
      <p className="text-sm text-muted">This workbook has no sheets to preview.</p>
    );
  }

  const colCount = visible.reduce((max, row) => Math.max(max, row.length), 0);
  const startRow = safePage * PAGE_SIZE + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="shrink-0">Sheet</span>
          <select
            value={sheet.name}
            onChange={(event) => {
              setSheetName(event.target.value);
              setPage(0);
            }}
            className="h-10 min-w-40 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground"
          >
            {sheets.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">
          {sheet.totalRows} {sheet.totalRows === 1 ? "row" : "rows"}
          {sheet.truncated ? " · preview is truncated for performance" : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <tbody>
            {visible.map((row, rowIndex) => (
              <tr
                key={`${sheet.name}-${startRow + rowIndex}`}
                className="border-b border-border last:border-b-0"
              >
                <th className="sticky left-0 w-12 bg-background px-3 py-2 text-xs font-medium text-muted">
                  {startRow + rowIndex}
                </th>
                {Array.from({ length: colCount }, (_, colIndex) => (
                  <td
                    key={colIndex}
                    className="max-w-64 truncate px-3 py-2 text-foreground"
                  >
                    {row[colIndex] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className={cn(
              "h-9 rounded-[var(--radius-md)] border border-border px-3 text-foreground",
              "disabled:opacity-40"
            )}
          >
            Previous
          </button>
          <span className="text-muted">
            {startRow}–{Math.min(startRow + PAGE_SIZE - 1, rows.length)} of{" "}
            {rows.length}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
            className={cn(
              "h-9 rounded-[var(--radius-md)] border border-border px-3 text-foreground",
              "disabled:opacity-40"
            )}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
