/**
 * Module 04 filename classification.
 * Due/Customer files: exactly "Name - Location" (with optional .xls/.xlsx).
 * Everything else is an Other File.
 */

const EXT_RE = /\.(xlsx|xls)$/i;

export type FilenameClassification =
  | {
      kind: "customer";
      customerName: string;
      location: string;
      baseName: string;
    }
  | {
      kind: "other";
      baseName: string;
    };

export function stripExcelExtension(fileName: string): string {
  return fileName.replace(EXT_RE, "").trim();
}

export function isExcelFileName(fileName: string): boolean {
  return EXT_RE.test(fileName);
}

export function classifyByFilename(fileName: string): FilenameClassification {
  const baseName = stripExcelExtension(fileName);
  const parts = baseName.split(" - ").map((part) => part.trim());

  if (parts.length === 2 && parts[0] && parts[1]) {
    return {
      kind: "customer",
      customerName: parts[0],
      location: parts[1],
      baseName,
    };
  }

  return { kind: "other", baseName };
}
