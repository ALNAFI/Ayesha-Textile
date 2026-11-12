import "server-only";

import { classifyByFilename } from "@/lib/dashboard/classify";
import { formatBDT } from "@/lib/dashboard/format";
import { balanceFromParsed, statusLabel } from "@/lib/customers/status";
import { listDriveExcelMetadata } from "@/lib/drive/list";
import { getParsedDriveFileMap } from "@/lib/drive/service";
import type { FavoriteCatalogItem } from "@/lib/favorites/types";

const OUTDATED_MS = 90 * 24 * 60 * 60 * 1000;

export type { FavoriteCatalogItem } from "@/lib/favorites/types";

export async function getFavoriteCatalog(): Promise<{
  available: boolean;
  message: string;
  items: FavoriteCatalogItem[];
}> {
  const meta = await listDriveExcelMetadata(false);
  if (meta.error && meta.items.length === 0) {
    return {
      available: false,
      message: "Favorite details are unavailable until Google Drive can be reached.",
      items: [],
    };
  }

  const parsed = getParsedDriveFileMap();
  const now = Date.now();
  const items: FavoriteCatalogItem[] = [];

  for (const file of meta.items) {
    const classification = classifyByFilename(file.name);
    if (classification.kind !== "customer") continue;
    const ledger = parsed.get(file.id);
    const { balance, available } = balanceFromParsed(ledger);
    items.push({
      id: file.id,
      customerName: classification.customerName,
      location: classification.location,
      fileName: file.name,
      href: `/customers/${file.id}`,
      lastModified: file.lastModified,
      outdated: file.modifiedAt > 0 && now - file.modifiedAt > OUTDATED_MS,
      balanceLabel:
        ledger == null ? null : available && balance != null ? formatBDT(balance) : "Balance Unavailable",
      statusLabel:
        ledger == null
          ? null
          : available && balance != null
            ? statusLabel(
                balance > 0 ? "outstanding" : balance < 0 ? "advance" : "settled"
              )
            : "Unavailable",
    });
  }

  return {
    available: true,
    message: "Saved customers in this browser.",
    items,
  };
}
