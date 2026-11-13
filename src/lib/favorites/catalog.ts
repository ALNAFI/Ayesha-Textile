import "server-only";

import { classifyByFilename } from "@/lib/dashboard/classify";
import { formatBDT } from "@/lib/dashboard/format";
import { balanceFromParsed, statusLabel } from "@/lib/customers/status";
import {
  getParsedDriveFileMap,
  isDriveConfigured,
  loadDriveWorkspace,
} from "@/lib/drive/service";
import type { FavoriteCatalogItem } from "@/lib/favorites/types";

const OUTDATED_MS = 90 * 24 * 60 * 60 * 1000;

export type { FavoriteCatalogItem } from "@/lib/favorites/types";

export async function getFavoriteCatalog(): Promise<{
  available: boolean;
  message: string;
  items: FavoriteCatalogItem[];
}> {
  if (!isDriveConfigured()) {
    return {
      available: false,
      message: "Favorite details are unavailable until Google Drive can be reached.",
      items: [],
    };
  }

  // Warm the shared parse cache (or reuse it). Metadata-only was leaving balances empty.
  const loaded = await loadDriveWorkspace(false);
  if (!loaded.ok && loaded.items.length === 0) {
    return {
      available: false,
      message:
        loaded.error ||
        "Favorite details are unavailable until Google Drive can be reached.",
      items: [],
    };
  }

  // Prefer workspace files (parsed ledgers). Fall back to the surviving map
  // if a warm cache return somehow diverges.
  const byId = new Map(loaded.files.map((file) => [file.id, file]));
  if (byId.size === 0) {
    for (const [id, file] of getParsedDriveFileMap()) {
      byId.set(id, file);
    }
  }

  const now = Date.now();
  const items: FavoriteCatalogItem[] = [];

  for (const meta of loaded.items) {
    const classification = classifyByFilename(meta.name);
    if (classification.kind !== "customer") continue;
    const ledger = byId.get(meta.id);
    const { balance, available } = balanceFromParsed(ledger);
    items.push({
      id: meta.id,
      customerName: classification.customerName,
      location: classification.location,
      fileName: meta.name,
      href: `/customers/${meta.id}`,
      lastModified: meta.lastModified,
      outdated: meta.modifiedAt > 0 && now - meta.modifiedAt > OUTDATED_MS,
      balanceLabel:
        ledger == null
          ? null
          : available && balance != null
            ? formatBDT(balance)
            : "Balance Unavailable",
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
