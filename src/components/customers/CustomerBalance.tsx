import { formatBDT } from "@/lib/dashboard/format";
import type { CustomerListItem } from "@/lib/customers/types";
import { cn } from "@/lib/utils";

type CustomerBalanceProps = {
  item: CustomerListItem;
  className?: string;
};

export function CustomerBalance({ item, className }: CustomerBalanceProps) {
  if (!item.balanceAvailable || item.balance == null) {
    return (
      <span className={cn("text-sm text-muted", className)}>
        Balance Unavailable
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-sm font-medium tabular-nums",
        item.status === "outstanding" && "text-foreground",
        item.status === "settled" && "text-muted",
        item.status === "advance" && "text-foreground",
        className
      )}
    >
      {formatBDT(item.balance)}
    </span>
  );
}
