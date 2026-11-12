"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { columnLabel, type PreviewMerge, type PreviewSheet } from "@/lib/excel/preview-types";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 36;
const VIEW_HEIGHT = 560;
const OVERSCAN = 8;

type SpreadsheetPreviewProps = {
  sheets: PreviewSheet[];
};

type Match = { r: number; c: number };

function matchesQuery(value: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;
  const text = value.toLowerCase();
  if (text.includes(normalized)) return true;
  const compactQuery = normalized.replace(/,/g, "");
  if (compactQuery !== normalized && text.replace(/,/g, "").includes(compactQuery)) {
    return true;
  }
  return false;
}

function visibleMerges(merges: PreviewMerge[], start: number, end: number) {
  const skip = new Set<string>();
  const anchors = new Map<string, { rows: number; cols: number; textRow: number; textCol: number }>();

  for (const merge of merges) {
    const lastRow = merge.r + merge.rows - 1;
    const lastCol = merge.c + merge.cols - 1;
    if (lastRow < start || merge.r >= end) continue;
    const row = Math.max(merge.r, start);
    const rowSpan = Math.min(lastRow, end - 1) - row + 1;
    anchors.set(`${row}:${merge.c}`, {
      rows: rowSpan,
      cols: merge.cols,
      textRow: merge.r,
      textCol: merge.c,
    });
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = merge.c; c <= lastCol; c++) {
        if (r === row && c === merge.c) continue;
        skip.add(`${r}:${c}`);
      }
    }
  }

  return { skip, anchors };
}

export function SpreadsheetPreview({ sheets }: SpreadsheetPreviewProps) {
  const [sheetName, setSheetName] = useState(sheets[0]?.name ?? "");
  const [query, setQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const sheet = sheets.find((item) => item.name === sheetName) ?? sheets[0];
  const rows = sheet?.rows ?? [];
  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

  const matches = useMemo(() => {
    const found: Match[] = [];
    if (!query.trim()) return found;
    rows.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (matchesQuery(cell, query)) found.push({ r, c });
      });
    });
    return found;
  }, [rows, query]);

  const safeMatch = matches.length === 0 ? 0 : activeMatch % matches.length;
  const current = matches[safeMatch];

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(VIEW_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const end = Math.min(rows.length, start + visibleCount);
  const layout = useMemo(
    () => visibleMerges(sheet?.merges ?? [], start, end),
    [sheet?.merges, start, end]
  );

  useEffect(() => {
    if (!current || !scrollerRef.current) return;
    const node = scrollerRef.current;
    const rowTop = current.r * ROW_HEIGHT;
    const inView =
      rowTop >= node.scrollTop &&
      rowTop < node.scrollTop + node.clientHeight - ROW_HEIGHT;
    if (!inView) {
      node.scrollTop = Math.max(0, rowTop - ROW_HEIGHT * 2);
      return;
    }
    document
      .getElementById(`sheet-cell-${sheet?.name}-${current.r}-${current.c}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [current, sheet?.name, start]);

  function selectSheet(name: string) {
    setSheetName(name);
    setQuery("");
    setActiveMatch(0);
    setScrollTop(0);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }

  function stepMatch(direction: 1 | -1) {
    if (matches.length === 0) return;
    setActiveMatch((index) => (index + direction + matches.length) % matches.length);
  }

  if (!sheet) {
    return (
      <p className="text-sm text-muted">This workbook has no worksheets.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto print:hidden">
        {sheets.map((item) => {
          const active = item.name === sheet.name;
          return (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectSheet(item.name)}
              className={cn(
                "shrink-0 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium",
                "transition-[background-color,color,border-color] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                active
                  ? "border-accent/30 bg-accent-soft text-foreground"
                  : "border-border bg-surface text-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3",
            "transition-[border-color,box-shadow] duration-[var(--motion-fast)]",
            "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveMatch(0);
            }}
            placeholder="Search this sheet…"
            aria-label="Search worksheet"
            className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear sheet search"
              onClick={() => {
                setQuery("");
                setActiveMatch(0);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted">
          <span>
            {query.trim()
              ? matches.length === 0
                ? "No matches"
                : `${safeMatch + 1} of ${matches.length} matches`
              : `${sheet.rowCount} rows · ${sheet.colCount} columns`}
          </span>
          <button
            type="button"
            aria-label="Previous match"
            disabled={matches.length === 0}
            onClick={() => stepMatch(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next match"
            disabled={matches.length === 0}
            onClick={() => stepMatch(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-foreground disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {sheet.truncated ? (
        <p className="text-xs text-muted print:hidden">
          Showing the first {rows.length} rows and {colCount} columns of{" "}
          {sheet.rowCount} × {sheet.colCount}. The rest of the sheet is omitted
          so the preview stays responsive.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-10 text-center">
          <p className="text-sm font-medium text-foreground">Empty worksheet</p>
          <p className="mt-2 text-sm text-muted">
            {sheet.name} has no cells in its used range.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={scrollerRef}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            className="max-h-[70vh] overflow-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)] print:hidden"
            style={{ height: Math.min(VIEW_HEIGHT, (rows.length + 1) * ROW_HEIGHT + 2) }}
          >
            <table className="border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-30 w-14 border-b border-r border-border bg-background px-2 py-2 text-center text-xs font-medium text-muted" />
                  {Array.from({ length: colCount }, (_, index) => (
                    <th
                      key={index}
                      className="sticky top-0 z-20 min-w-28 border-b border-r border-border bg-background px-3 py-2 text-center text-xs font-medium text-muted"
                    >
                      {columnLabel(sheet.originCol + index)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {start > 0 ? (
                  <tr aria-hidden style={{ height: start * ROW_HEIGHT }}>
                    <td colSpan={colCount + 1} />
                  </tr>
                ) : null}
                {rows.slice(start, end).map((row, offset) => {
                  const r = start + offset;
                  return (
                    <tr key={r} style={{ height: ROW_HEIGHT }}>
                      <th className="sticky left-0 z-10 border-b border-r border-border bg-background px-2 text-center text-xs font-medium text-muted">
                        {sheet.originRow + r + 1}
                      </th>
                      {Array.from({ length: colCount }, (_, c) => {
                        if (layout.skip.has(`${r}:${c}`)) return null;
                        const anchor = layout.anchors.get(`${r}:${c}`);
                        const text = anchor
                          ? rows[anchor.textRow]?.[anchor.textCol] ?? ""
                          : row[c] ?? "";
                        const matched = matchesQuery(text, query);
                        const selected =
                          current?.r === (anchor?.textRow ?? r) &&
                          current?.c === (anchor?.textCol ?? c);
                        return (
                          <td
                            key={c}
                            id={`sheet-cell-${sheet.name}-${r}-${c}`}
                            rowSpan={anchor?.rows}
                            colSpan={anchor?.cols}
                            className={cn(
                              "max-w-72 truncate border-b border-r border-border px-3 text-foreground",
                              matched && "bg-accent-soft",
                              selected && "outline outline-2 outline-offset-[-2px] outline-accent"
                            )}
                          >
                            {text}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {end < rows.length ? (
                  <tr aria-hidden style={{ height: (rows.length - end) * ROW_HEIGHT }}>
                    <td colSpan={colCount + 1} />
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <table className="sheet-print hidden w-full border-collapse text-left text-xs print:table">
            <thead>
              <tr>
                <th className="border border-black/20 px-2 py-1" />
                {Array.from({ length: colCount }, (_, index) => (
                  <th key={index} className="border border-black/20 px-2 py-1 text-center">
                    {columnLabel(sheet.originCol + index)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  <th className="border border-black/20 px-2 py-1 text-center">
                    {sheet.originRow + r + 1}
                  </th>
                  {Array.from({ length: colCount }, (_, c) => {
                    const merge = sheet.merges.find(
                      (item) =>
                        r >= item.r &&
                        r < item.r + item.rows &&
                        c >= item.c &&
                        c < item.c + item.cols
                    );
                    if (merge && (merge.r !== r || merge.c !== c)) return null;
                    return (
                      <td
                        key={c}
                        rowSpan={merge?.rows}
                        colSpan={merge?.cols}
                        className="border border-black/20 px-2 py-1 align-top"
                      >
                        {merge ? rows[merge.r]?.[merge.c] ?? "" : row[c] ?? ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
