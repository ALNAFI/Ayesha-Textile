import { statusLabel } from "@/lib/customers/status";
import type { CustomerFinancialStatus } from "@/lib/customers/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CustomerFinancialStatus, string> = {
  outstanding: "bg-accent-soft text-accent",
  settled: "bg-surface-muted text-muted",
  advance: "bg-background text-foreground border border-border",
  unavailable: "bg-surface-muted text-muted border border-dashed border-border",
};

type CustomerStatusBadgeProps = {
  status: CustomerFinancialStatus;
  className?: string;
};

export function CustomerStatusBadge({
  status,
  className,
}: CustomerStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
