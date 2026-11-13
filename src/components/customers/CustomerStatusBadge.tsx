import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  MinusCircle,
  type LucideIcon,
} from "lucide-react";
import { statusLabel } from "@/lib/customers/status";
import type { CustomerFinancialStatus } from "@/lib/customers/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  CustomerFinancialStatus,
  { icon: LucideIcon; className: string }
> = {
  outstanding: {
    icon: AlertCircle,
    className: "bg-accent-soft text-accent",
  },
  settled: {
    icon: CheckCircle2,
    className: "bg-surface-muted text-muted",
  },
  advance: {
    icon: CircleDollarSign,
    className: "bg-background text-foreground border border-border",
  },
  unavailable: {
    icon: MinusCircle,
    className:
      "bg-surface-muted text-muted border border-dashed border-border",
  },
};

/** Compact styles used outside the redesigned card (e.g. detail, table). */
const COMPACT_STYLES: Record<CustomerFinancialStatus, string> = {
  outstanding: "bg-accent-soft text-accent",
  settled: "bg-surface-muted text-muted",
  advance: "bg-background text-foreground border border-border",
  unavailable:
    "bg-surface-muted text-muted border border-dashed border-border",
};

type CustomerStatusBadgeProps = {
  status: CustomerFinancialStatus;
  className?: string;
  /** Card panel badge with icon (default). Compact text-only for table/detail. */
  variant?: "card" | "compact";
};

export function CustomerStatusBadge({
  status,
  className,
  variant = "card",
}: CustomerStatusBadgeProps) {
  const label = statusLabel(status);

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
          COMPACT_STYLES[status],
          className
        )}
      >
        {label}
      </span>
    );
  }

  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold",
        meta.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
