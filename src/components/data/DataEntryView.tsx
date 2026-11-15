"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { formatBDT } from "@/lib/dashboard/format";
import type {
  EntryAppendResult,
  EntryError,
  EntryField,
  EntrySchema,
  EntryTailRow,
} from "@/lib/data-entry/types";
import { cn } from "@/lib/utils";

type DataEntryViewProps = {
  fileId: string;
};

type Busy = "add" | "update" | "delete" | null;

function todayInputValue() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function emptyValues(fields: EntryField[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.key] = field.type === "date" ? todayInputValue() : "";
  }
  return values;
}

function toAmount(raw: string | undefined) {
  const n = Number((raw ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const inputClass = cn(
  "h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground",
  "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
  "placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
);

export function DataEntryView({ fileId }: DataEntryViewProps) {
  const [schema, setSchema] = useState<EntrySchema | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<
    { type: "ok" | "error"; text: string } | null
  >(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const editing = selectedRow !== null;
  const selected: EntryTailRow | null = useMemo(
    () =>
      schema?.tail.rows.find((row) => row.rowNumber === selectedRow) ?? null,
    [schema, selectedRow]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/data/${fileId}`, { cache: "no-store" });
      const json = (await res.json()) as EntrySchema | EntryError;
      if (!res.ok || !json.ok) {
        setLoadError(json.ok ? "Could not open this file." : json.error);
        setSchema(null);
        return;
      }
      setSchema(json);
      setValues(emptyValues(json.fields));
      setSelectedRow(null);
      setConfirmingDelete(false);
    } catch {
      setLoadError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const balanceTile = useMemo(() => {
    if (!schema || schema.mode !== "ledger" || schema.currentBalance == null) {
      return null;
    }
    const net = (v: Record<string, string>) =>
      toAmount(v.credit) - toAmount(v.debit);
    if (editing && selected) {
      return {
        label: "Balance after this change",
        value: schema.currentBalance + net(values) - net(selected.values),
      };
    }
    return {
      label: "Balance after this entry",
      value: schema.currentBalance + net(values),
    };
  }, [schema, values, editing, selected]);

  function resetToAddMode() {
    if (!schema) return;
    setSelectedRow(null);
    setConfirmingDelete(false);
    setValues(emptyValues(schema.fields));
  }

  function pickRow(row: EntryTailRow) {
    if (!schema || busy || !row.editable) return;
    if (selectedRow === row.rowNumber) {
      resetToAddMode();
      return;
    }
    setSelectedRow(row.rowNumber);
    setConfirmingDelete(false);
    setNotice(null);
    setValues({ ...emptyValues(schema.fields), ...row.values });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function send(
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
    which: Exclude<Busy, null>
  ) {
    if (!schema || busy) return;
    setBusy(which);
    setNotice(null);
    try {
      const res = await fetch(`/api/data/${fileId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          expectedModifiedTime: schema.modifiedTime,
        }),
      });
      const json = (await res.json()) as EntryAppendResult | EntryError;
      if (!res.ok || !json.ok) {
        setNotice({
          type: "error",
          text: json.ok ? "Could not save." : json.error,
        });
        return;
      }
      setSchema({
        ...schema,
        modifiedTime: json.modifiedTime,
        currentBalance:
          schema.mode === "ledger" ? json.newBalance : schema.currentBalance,
        tail: json.tail,
      });
      setSelectedRow(null);
      setConfirmingDelete(false);
      setValues(emptyValues(schema.fields));
      setNotice({
        type: "ok",
        text:
          which === "add"
            ? `Added to Drive (row ${json.rowNumber}).`
            : which === "update"
              ? `Row ${json.rowNumber} updated in Drive.`
              : `Row ${json.rowNumber} deleted from Drive.`,
      });
    } catch {
      setNotice({
        type: "error",
        text: "Could not reach the server. Nothing was changed. Please try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  function submit(event: SyntheticEvent) {
    event.preventDefault();
    if (editing && selectedRow !== null) {
      void send("PATCH", { rowNumber: selectedRow, values }, "update");
    } else {
      void send("POST", { values }, "add");
    }
  }

  const backLink = (
    <Link
      href="/data"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      All files
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 text-sm text-muted shadow-[var(--shadow-soft)]">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          Opening file from Drive…
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-8 shadow-[var(--shadow-soft)]">
          <p className="flex items-start gap-2 text-sm text-foreground">
            <CircleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
              aria-hidden
            />
            <span>{loadError ?? "Could not open this file."}</span>
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            <RefreshCw className="h-4 w-4 text-muted" aria-hidden />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {backLink}

      <header>
        <h2 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {schema.fileName.replace(/\.xlsx$/i, "")}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Sheet “{schema.sheetName}”. Add a new row, or tap a row below to edit
          or delete it.
        </p>
      </header>

      {schema.mode === "ledger" && schema.currentBalance != null ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
            <p className="text-xs text-muted">Current balance</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatBDT(schema.currentBalance)}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
            <p className="text-xs text-muted">{balanceTile?.label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {balanceTile ? formatBDT(balanceTile.value) : "—"}
            </p>
          </div>
        </div>
      ) : null}

      <form
        ref={formRef}
        onSubmit={submit}
        className={cn(
          "scroll-mt-20 space-y-4 rounded-[var(--radius-lg)] border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5",
          editing ? "border-accent" : "border-border"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">
            {editing ? `Edit row ${selectedRow}` : "Add new entry"}
          </h3>
          {editing ? (
            <button
              type="button"
              onClick={resetToAddMode}
              disabled={busy !== null}
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New entry instead
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {schema.fields.map((field) => (
            <label
              key={field.key}
              className={cn(
                "block space-y-1.5",
                field.key === "description" && "sm:col-span-2"
              )}
            >
              <span className="text-sm font-medium text-foreground">
                {field.label}
                {field.required ? (
                  <span className="text-red-500"> *</span>
                ) : null}
              </span>
              <input
                type={field.type === "date" ? "date" : "text"}
                inputMode={field.type === "number" ? "decimal" : undefined}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                required={
                  field.required && !(editing && field.type === "date")
                }
                maxLength={field.type === "number" ? 14 : 500}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.key]: event.target.value,
                  }))
                }
                className={inputClass}
              />
              {field.hint ? (
                <span className="block text-xs text-muted">{field.hint}</span>
              ) : null}
            </label>
          ))}
        </div>

        {schema.mode === "ledger" ? (
          <p className="text-xs text-muted">
            Balance is calculated automatically: previous balance + Credit −
            Debit.
            {editing
              ? " Rows below this one are recalculated too."
              : null}
          </p>
        ) : null}

        {notice ? (
          <p
            role="status"
            className={cn(
              "flex items-start gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
              notice.type === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
                : "border-red-500/30 bg-red-500/10 text-foreground"
            )}
          >
            {notice.type === "ok" ? (
              <CircleCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                aria-hidden
              />
            ) : (
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                aria-hidden
              />
            )}
            <span>{notice.text}</span>
          </p>
        ) : null}

        {confirmingDelete && selectedRow !== null ? (
          <div className="space-y-3 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-foreground">
              Delete row {selectedRow} from the Excel file? Rows below will move
              up by one. This cannot be undone from here.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void send("DELETE", { rowNumber: selectedRow }, "delete")
                }
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-red-600 px-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "delete" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                {busy === "delete" ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmingDelete(false)}
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-sm font-medium text-foreground hover:bg-surface-muted disabled:opacity-60"
              >
                <X className="h-4 w-4 text-muted" aria-hidden />
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={busy !== null}
              className={cn(
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-accent-foreground sm:w-auto",
                "transition-[opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
                "hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              {busy === "add" || busy === "update" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : editing ? (
                <Save className="h-4 w-4" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              {busy === "add"
                ? "Adding to Drive…"
                : busy === "update"
                  ? "Updating Drive…"
                  : editing
                    ? "Update"
                    : "Add"}
            </button>

            {editing ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-red-500/40 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </button>
            ) : null}
          </div>
        )}
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Last {schema.tail.rows.length} row
          {schema.tail.rows.length === 1 ? "" : "s"} in the file
          <span className="ml-2 text-xs font-normal text-muted">
            Tap a row to edit or delete
          </span>
        </h3>
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-background/70">
              <tr className="text-xs font-medium text-muted">
                <th className="w-10 px-3 py-2.5 font-medium">#</th>
                {schema.tail.headers.map((header, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap px-3 py-2.5 font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schema.tail.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={schema.tail.headers.length + 1}
                    className="px-3 py-4 text-center text-muted"
                  >
                    No rows yet
                  </td>
                </tr>
              ) : (
                schema.tail.rows.map((row) => {
                  const active = row.rowNumber === selectedRow;
                  return (
                    <tr
                      key={row.rowNumber}
                      tabIndex={row.editable ? 0 : -1}
                      aria-selected={active}
                      title={
                        row.editable
                          ? undefined
                          : "Opening balance row. Change it in Excel."
                      }
                      onClick={() => pickRow(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          pickRow(row);
                        }
                      }}
                      className={cn(
                        "border-b border-border last:border-b-0",
                        row.editable
                          ? "cursor-pointer transition-colors hover:bg-surface-muted"
                          : "opacity-60",
                        active && "bg-accent-soft hover:bg-accent-soft"
                      )}
                    >
                      <td className="px-3 py-2.5 text-xs text-muted">
                        {row.rowNumber}
                      </td>
                      {row.cells.map((cell, c) => (
                        <td
                          key={c}
                          className="whitespace-nowrap px-3 py-2.5 text-foreground"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
