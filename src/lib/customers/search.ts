import { normalizeSearchText } from "@/lib/files/search";
import type { CustomerListItem } from "@/lib/customers/types";

export function matchesCustomerSearch(
  item: CustomerListItem,
  query: string
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(
    [item.customerName, item.location, item.fileName].filter(Boolean).join(" ")
  );

  return haystack.includes(normalizedQuery);
}
