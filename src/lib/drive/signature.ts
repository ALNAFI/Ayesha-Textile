import { createHash } from "node:crypto";

/** Same digest the signature route and /api/sync save with the parsed data. */
export function excelFolderSignature(
  files: { id?: string | null; modifiedTime?: string | null }[]
): string {
  const lines = files
    .filter((file) => file.id)
    .map((file) => `${file.id}:${file.modifiedTime ?? ""}`)
    .sort()
    .join("\n");
  return createHash("sha1").update(lines).digest("hex").slice(0, 16);
}
