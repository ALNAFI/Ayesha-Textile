import type { CustomerListItem, CustomerSort } from "@/lib/customers/types";

export const CUSTOMER_SORT_OPTIONS: Array<{
  value: CustomerSort;
  label: string;
}> = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "due-high", label: "Highest Due" },
  { value: "due-low", label: "Lowest Due" },
  { value: "newest", label: "Recently Updated" },
  { value: "oldest", label: "Oldest Updated" },
];

function compareNames(a: CustomerListItem, b: CustomerListItem) {
  return a.customerName.localeCompare(b.customerName, undefined, {
    sensitivity: "base",
  });
}

/** Available balances first; unavailable always last for amount sorts. */
function compareByDue(
  a: CustomerListItem,
  b: CustomerListItem,
  direction: "high" | "low"
) {
  if (a.balanceAvailable !== b.balanceAvailable) {
    return a.balanceAvailable ? -1 : 1;
  }
  if (!a.balanceAvailable || a.balance == null || b.balance == null) {
    return compareNames(a, b);
  }
  const diff =
    direction === "high" ? b.balance - a.balance : a.balance - b.balance;
  return diff || compareNames(a, b);
}

export function sortCustomerItems(
  items: CustomerListItem[],
  sort: CustomerSort
): CustomerListItem[] {
  const next = [...items];

  switch (sort) {
    case "name-asc":
      return next.sort(compareNames);
    case "name-desc":
      return next.sort((a, b) => compareNames(b, a));
    case "due-high":
      return next.sort((a, b) => compareByDue(a, b, "high"));
    case "due-low":
      return next.sort((a, b) => compareByDue(a, b, "low"));
    case "newest":
      return next.sort(
        (a, b) => b.modifiedAt - a.modifiedAt || compareNames(a, b)
      );
    case "oldest":
      return next.sort(
        (a, b) => a.modifiedAt - b.modifiedAt || compareNames(a, b)
      );
    default:
      return next;
  }
}
