import { FileSpreadsheet, Users, Wallet } from "lucide-react";
import { formatBDT } from "@/lib/dashboard/format";
import type { DashboardStats } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type StatCardsProps = {
  stats: DashboardStats;
  available: boolean;
};

export function StatCards({ stats, available }: StatCardsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
      <article
        className={cn(
          "dash-card relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-accent p-6 text-accent-foreground shadow-[var(--shadow-soft)] sm:p-7",
          "transition-[transform,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out)]",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(21_24_33_/_0.12)]"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-accent-foreground/75">
              Total Due
            </p>
            <p className="mt-3 whitespace-nowrap text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl lg:text-5xl">
              {available ? formatBDT(stats.totalOutstanding) : "—"}
            </p>
          </div>
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-foreground/12">
            <Wallet className="h-5 w-5" />
          </span>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <article
          className={cn(
            "dash-card rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]",
            "transition-[transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-out)]",
            "hover:-translate-y-0.5 hover:bg-surface-muted/40"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Total Customers</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {available ? stats.totalCustomers : "—"}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
              <Users className="h-4.5 w-4.5 h-[1.125rem] w-[1.125rem]" />
            </span>
          </div>
        </article>

        <article
          className={cn(
            "dash-card rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-soft)]",
            "transition-[transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-out)]",
            "hover:-translate-y-0.5 hover:bg-surface-muted/40"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Other Files</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {available ? stats.otherFiles : "—"}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
              <FileSpreadsheet className="h-[1.125rem] w-[1.125rem]" />
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}
