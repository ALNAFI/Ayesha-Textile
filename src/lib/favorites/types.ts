export type FavoriteCatalogItem = {
  id: string;
  customerName: string;
  location: string;
  fileName: string;
  href: string;
  lastModified: string;
  outdated: boolean;
  /** Null when this workbook has not been parsed in the current server cache. */
  balanceLabel: string | null;
  statusLabel: string | null;
};
