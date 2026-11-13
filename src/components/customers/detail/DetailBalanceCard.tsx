import { Check, Copy } from "lucide-react";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { formatBDT } from "@/lib/dashboard/format";
import type { CustomerFinancialStatus } from "@/lib/customers/types";
import { cn } from "@/lib/utils";

type DetailBalanceCardProps = {
  balance: number | null;
  balanceAvailable: boolean;
  financialStatus: CustomerFinancialStatus;
  copied: boolean;
  onCopy: () => void;
  className?: string;
};

function LargeBalance({ value }: { value: number }) {
  const formatted = formatBDT(value);
  const match = formatted.match(/^(-?)৳(.+)$/);
  if (!match) {
    return (
      <span className="text-[40px] font-bold tracking-tight text-foreground tabular-nums">
        {formatted}
      </span>
    );
  }

  const [, sign, amount] = match;
  return (
    <span className="inline-flex items-baseline gap-1 tracking-tight">
      <span className="text-2xl font-semibold text-muted tabular-nums">
        {sign}৳
      </span>
      <span className="text-[40px] font-bold text-foreground tabular-nums">
        {amount}
      </span>
    </span>
  );
}

export function DetailBalanceCard({
  balance,
  balanceAvailable,
  financialStatus,
  copied,
  onCopy,
  className,
}: DetailBalanceCardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-border bg-surface p-[22px]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted">Current Balance</p>
        <CustomerStatusBadge status={financialStatus} variant="compact" />
      </div>

      <div className="mt-3 min-w-0">
        {balanceAvailable && balance != null ? (
          <LargeBalance value={balance} />
        ) : (
          <span className="text-[28px] font-semibold text-muted">
            Balance Unavailable
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onCopy}
        disabled={!balanceAvailable || balance == null}
        className={cn(
          "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-3 text-sm font-medium text-foreground",
          "hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {copied ? (
          <Check className="h-4 w-4 text-muted" aria-hidden />
        ) : (
          <Copy className="h-4 w-4 text-muted" aria-hidden />
        )}
        {copied ? "Copied" : "Copy Balance"}
      </button>
    </div>
  );
}
