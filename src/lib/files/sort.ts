import type { FileListItem, FileListSort } from "@/lib/files/types";

export function sortFileItems(
  items: FileListItem[],
  sort: FileListSort
): FileListItem[] {
  const next = [...items];

  switch (sort) {
    case "oldest":
      return next.sort((a, b) => a.modifiedAt - b.modifiedAt);
    case "name-asc":
      return next.sort((a, b) =>
        a.fileName.localeCompare(b.fileName, undefined, { sensitivity: "base" })
      );
    case "name-desc":
      return next.sort((a, b) =>
        b.fileName.localeCompare(a.fileName, undefined, { sensitivity: "base" })
      );
    case "newest":
    default:
      return next.sort((a, b) => b.modifiedAt - a.modifiedAt);
  }
}

export const FILE_SORT_OPTIONS: Array<{ value: FileListSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
];
