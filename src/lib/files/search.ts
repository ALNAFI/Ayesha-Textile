import type { FileListItem } from "@/lib/files/types";

/** Normalize for case-insensitive, whitespace-collapsed matching. */
export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchesFileSearch(item: FileListItem, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(
    [item.fileName, item.customerName, item.location].filter(Boolean).join(" ")
  );

  return haystack.includes(normalizedQuery);
}
