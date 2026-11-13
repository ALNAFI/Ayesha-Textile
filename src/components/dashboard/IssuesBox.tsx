"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
} from "lucide-react";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import type { SyncStatus } from "@/hooks/use-synced-data";
import { cn } from "@/lib/utils";

type AppIssue = {
  id: string;
  title: string;
  detail: string;
  files?: Array<{
    id: string;
    title: string;
    subtitle: string;
    href: string;
    issue: string;
  }>;
};

type IssuesBoxProps = {
  data: DashboardSnapshot;
  syncStatus: SyncStatus;
};

const INCOMPLETE_BALANCE_ISSUE =
  "No valid parsed balance. The ledger may be missing expected columns, or the stated closing balance does not match the calculated one. It is left out of Total Due.";

function buildIssues(
  data: DashboardSnapshot,
  syncStatus: SyncStatus
): AppIssue[] {
  const issues: AppIssue[] = [];

  if (!data.available) {
    issues.push({
      id: "drive-unavailable",
      title: "Drive data unavailable",
      detail: data.message || "Live Google Drive data could not be loaded.",
    });
  }

  if (syncStatus === "offline") {
    issues.push({
      id: "sync-offline",
      title: "Showing saved data",
      detail:
        "The latest Drive signature could not be checked. Balances on screen may be from the last successful sync.",
    });
  }

  if (syncStatus === "partial") {
    issues.push({
      id: "sync-partial",
      title: "Some files could not be updated",
      detail:
        "At least one Excel file failed during the last sync. Totals may be incomplete until the next successful refresh.",
    });
  }

  if (data.available && data.stats.outstandingIncomplete) {
    const files = data.searchItems
      .filter((item) => item.kind === "customer" && !item.balanceAvailable)
      .map((item) => ({
        id: item.id,
        title: item.customerName || item.fileName,
        subtitle: item.location || item.fileName,
        href: item.href,
        issue: INCOMPLETE_BALANCE_ISSUE,
      }));

    issues.push({
      id: "outstanding-incomplete",
      title:
        data.message ||
        `Due excludes ${data.stats.incompleteCustomerCount} customer file${
          data.stats.incompleteCustomerCount === 1 ? "" : "s"
        } without a valid parsed balance.`,
      detail:
        "These customer ledgers are excluded from Total Due until their balances can be parsed reliably.",
      files,
    });
  }

  return issues;
}

export function IssuesBox({ data, syncStatus }: IssuesBoxProps) {
  const [dismissed, setDismissed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const issues = useMemo(
    () => buildIssues(data, syncStatus),
    [data, syncStatus]
  );

  if (dismissed || issues.length === 0) return null;

  const previewFiles = issues.flatMap((issue) => issue.files ?? []);
  const summary =
    issues.length === 1
      ? issues[0].title
      : `${issues.length} issues need attention`;

  return (
    <section
      className={cn(
        "dash-section relative overflow-hidden rounded-[var(--radius-lg)] border border-amber-500/25 bg-amber-500/10 p-4 shadow-[var(--shadow-soft)] sm:p-5"
      )}
      aria-label="App issues"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-amber-500/80"
      />

      <div className="flex items-start gap-3 pl-2">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{summary}</p>
              {issues.length === 1 ? (
                <p className="mt-1 text-sm text-muted">{issues[0].detail}</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {issues.map((issue) => (
                    <li key={issue.id} className="text-sm text-muted">
                      <span className="font-medium text-foreground">
                        {issue.title}
                      </span>
                      <span className="block">{issue.detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              aria-label="Hide issues"
              onClick={() => setDismissed(true)}
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted",
                "transition-[background-color,color] duration-[var(--motion-fast)]",
                "hover:bg-amber-500/10 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {previewFiles.length > 0 ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setPreviewOpen((open) => !open)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-amber-500/30 bg-surface/70 px-3 text-sm font-medium text-foreground",
                  "transition-[background-color,transform] duration-[var(--motion-fast)]",
                  "hover:bg-surface active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                )}
              >
                {previewOpen ? "Hide preview" : "Preview"}
                {previewOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="text-muted">({previewFiles.length})</span>
              </button>

              {previewOpen ? (
                <ul className="mt-3 space-y-2">
                  {previewFiles.map((file) => (
                    <li
                      key={file.id}
                      className="rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {file.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {file.subtitle}
                          </p>
                          <p className="mt-2 text-sm text-muted">{file.issue}</p>
                        </div>
                        <Link
                          href={file.href}
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent",
                            "transition-opacity duration-[var(--motion-fast)] hover:opacity-80",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                          )}
                        >
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
