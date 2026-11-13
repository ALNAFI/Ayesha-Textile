/** Same Excel selection used by the Drive list and the full workbook sync. */

export function isExcelDriveItem(file: {
  name?: string | null;
  mimeType?: string | null;
}): boolean {
  const name = (file.name || "").toLowerCase();
  const mime = file.mimeType || "";
  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel"
  );
}
