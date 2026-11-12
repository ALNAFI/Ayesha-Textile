/**
 * Preserved from legacy Ayesha Textile Excel parsing.
 * Parses Drive workbook buffers into customer ledgers or general sheets.
 */

import "server-only";
import * as XLSX from "xlsx";
import {
  CustomerLedger,
  GeneralExcelFile,
  LedgerEntry,
  calculateLedgerBalances,
  formatDate,
} from "./ledger";

export interface ParseResult {
  isDueFile: boolean;
  customerLedger?: CustomerLedger;
  generalExcelFile?: GeneralExcelFile;
  error?: string;
}

function normalizeHeader(str: unknown): string {
  if (typeof str !== "string") return "";
  return str.toLowerCase().trim().replace(/[\s_\\/-]+/g, " ");
}

/**
 * Checks if a row appears to be a Customer Due Ledger header row:
 * Must contain Date, Description, File No, Debit, Credit, Balance (or standard variations/spelling).
 * Handles Bengali clothing shop accounting spellings: "Discriptio", "Cradit", "Dabit", "File\No".
 */
export function detectLedgerHeaders(headers: string[]): {
  isMatch: boolean;
  colMap: {
    date: number;
    description: number;
    fileNo: number;
    debit: number;
    credit: number;
    balance: number;
  };
} {
  const norm = headers.map(normalizeHeader);

  let dateIdx = -1;
  let descIdx = -1;
  let fileNoIdx = -1;
  let debitIdx = -1;
  let creditIdx = -1;
  let balanceIdx = -1;

  norm.forEach((h, idx) => {
    if (h.includes("date") || h.includes("তারিখ") || h === "dt") {
      dateIdx = idx;
    } else if (
      h.includes("desc") ||
      h.includes("discrip") ||
      h.includes("particular") ||
      h.includes("item") ||
      h.includes("বিবরণ")
    ) {
      descIdx = idx;
    } else if (
      h.includes("file") ||
      h.includes("voucher") ||
      h.includes("challan") ||
      h.includes("ref") ||
      h.includes("নং") ||
      h.includes("no")
    ) {
      fileNoIdx = idx;
    } else if (
      h.includes("debit") ||
      h.includes("dabit") ||
      h.includes("payment") ||
      h.includes("paid") ||
      h.includes("জমা")
    ) {
      debitIdx = idx;
    } else if (
      h.includes("credit") ||
      h.includes("cradit") ||
      h.includes("kredit") ||
      h.includes("due") ||
      h.includes("bill") ||
      h.includes("invoice") ||
      h.includes("বাকি")
    ) {
      creditIdx = idx;
    } else if (
      h.includes("balance") ||
      h.includes("outstanding") ||
      h.includes("জের") ||
      h === "bal"
    ) {
      balanceIdx = idx;
    }
  });

  // A valid Due Ledger MUST have Date, Description, Debit, Credit, and Balance columns
  const isMatch =
    dateIdx !== -1 &&
    descIdx !== -1 &&
    debitIdx !== -1 &&
    creditIdx !== -1 &&
    balanceIdx !== -1;

  return {
    isMatch,
    colMap: {
      date: dateIdx,
      description: descIdx,
      fileNo: fileNoIdx,
      debit: debitIdx,
      credit: creditIdx,
      balance: balanceIdx,
    },
  };
}

/**
 * Extracts customer name, location, and file number from filename:
 * e.g. "Kazi bosraloy - Issorganj.xlsx" -> "Kazi Bosraloy", "Issorganj"
 * e.g. "Sosta Basralay - Adabor.xlsx" -> "Sosta Basralay", "Adabor"
 */
export function parseCustomerMetadataFromFilename(fileName: string): {
  customerName: string;
  shopName: string;
  location: string;
  fileNo: string;
} {
  const base = fileName.replace(/\.(xlsx|xls)$/i, "").trim();
  const fileNo = `AT-LDG-${Math.abs(hashString(fileName) % 900 + 100)}`;

  if (base.includes("-")) {
    const parts = base
      .split("-")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const customerName = capitalizeWords(parts[0]);
      const location = capitalizeWords(parts.slice(1).join(", "));
      return {
        customerName,
        shopName: `${customerName} & Bastra Bitan`,
        location,
        fileNo,
      };
    }
  }

  if (base.includes("(") && base.includes(")")) {
    const match = base.match(/^([^(]+)\(([^)]+)\)/);
    if (match) {
      const customerName = capitalizeWords(match[1].trim());
      const location = capitalizeWords(match[2].trim());
      return {
        customerName: customerName || "Ayesha Customer",
        shopName: `${customerName} & Bastra Bitan`,
        location: location || "Dhaka",
        fileNo,
      };
    }
  }

  const parts = base.split(/[-_]+/).filter(Boolean);
  let customerName = capitalizeWords(base);
  let location = "Dhaka";

  if (parts.length >= 2) {
    const words = parts.filter(
      (p) => !/^(ledger|sheet|file|acc|account|\d+)$/i.test(p)
    );
    if (words.length >= 2) {
      customerName = capitalizeWords(words.slice(0, words.length - 1).join(" "));
      location = capitalizeWords(words[words.length - 1]);
    } else if (words.length === 1) {
      customerName = capitalizeWords(words[0]);
    }
  }

  return {
    customerName: customerName || "Ayesha Customer",
    shopName: `${customerName} & Bastra Bitan`,
    location,
    fileNo,
  };
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Parses an Excel file buffer (.xlsx or .xls) from Google Drive
 */
export function parseExcelBuffer(
  buffer: Buffer | ArrayBuffer,
  fileName: string,
  fileId: string,
  lastModified: string,
  fileSize: string
): ParseResult {
  try {
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      cellNF: true,
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        isDueFile: false,
        error: "Empty workbook with no sheets",
      };
    }

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const sheetData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!sheetData || sheetData.length === 0) continue;

      let headerRowIdx = -1;
      let detectedMatch = {
        isMatch: false,
        colMap: {
          date: -1,
          description: -1,
          fileNo: -1,
          debit: -1,
          credit: -1,
          balance: -1,
        },
      };

      for (let r = 0; r < Math.min(sheetData.length, 8); r++) {
        const rowStrings = (sheetData[r] || []).map((c) => String(c || ""));
        const match = detectLedgerHeaders(rowStrings);
        if (match.isMatch) {
          headerRowIdx = r;
          detectedMatch = match;
          break;
        }
      }

      if (detectedMatch.isMatch && headerRowIdx !== -1) {
        const meta = parseCustomerMetadataFromFilename(fileName);
        const { colMap } = detectedMatch;
        const rawEntries: Omit<LedgerEntry, "balance">[] = [];
        let initialBalance = 0;

        for (let r = headerRowIdx + 1; r < sheetData.length; r++) {
          const row = sheetData[r];
          if (!row || row.length === 0) continue;

          const dateRaw = row[colMap.date];
          const descRaw = row[colMap.description];
          const fileNoRaw = colMap.fileNo !== -1 ? row[colMap.fileNo] : "";
          const debitVal = parseCurrencyNumber(row[colMap.debit]);
          const creditVal = parseCurrencyNumber(row[colMap.credit]);
          const balanceVal = parseCurrencyNumber(row[colMap.balance]);

          const descStr = String(descRaw ?? "").trim();
          const fileNoStr = String(fileNoRaw ?? "").trim();

          const isSabek = /^(sabek|সাবেক|opening|forward|prev)/i.test(descStr);
          if (isSabek && debitVal === 0 && creditVal === 0 && balanceVal > 0) {
            initialBalance = balanceVal;
            rawEntries.push({
              id: `${fileId}-row-${r}`,
              date: formatLedgerDate(dateRaw),
              description: "Opening Balance (Sabek)",
              fileNo: fileNoStr || "OB",
              debit: 0,
              credit: 0,
            });
            continue;
          }

          if (!descStr && !dateRaw && debitVal === 0 && creditVal === 0) {
            continue;
          }

          let formattedDesc = descStr;
          if (!formattedDesc) {
            if (debitVal > 0 && creditVal === 0) {
              formattedDesc = "Payment Received";
            } else if (creditVal > 0 && debitVal === 0) {
              formattedDesc = "Fabric Invoiced";
            } else {
              formattedDesc = "Transaction";
            }
          } else if (/^\d+$/.test(formattedDesc)) {
            formattedDesc = `Challan #${formattedDesc}`;
          }

          const entryDate = formatLedgerDate(dateRaw);

          rawEntries.push({
            id: `${fileId}-row-${r}`,
            date: entryDate,
            description: formattedDesc,
            fileNo: fileNoStr || `V-${r}`,
            debit: debitVal,
            credit: creditVal,
          });
        }

        const calculated = calculateLedgerBalances(rawEntries, initialBalance);

        const customerLedger: CustomerLedger = {
          id: fileId,
          fileName,
          customerName: meta.customerName,
          shopName: meta.shopName,
          location: meta.location,
          phone: "+880 1712-000000",
          fileNo: meta.fileNo,
          lastModified,
          fileSize,
          sheetCount: workbook.SheetNames.length,
          isDueFile: true,
          entries: calculated.entriesWithBalance,
          outstandingBalance: calculated.outstandingBalance,
          totalDebit: calculated.totalDebit,
          totalCredit: calculated.totalCredit,
          initialBalance,
        };

        return {
          isDueFile: true,
          customerLedger,
        };
      }
    }

    const parsedSheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!json || json.length === 0) {
        return {
          sheetName: name,
          headers: ["Column 1"],
          rows: [],
        };
      }

      const headers = (json[0] || []).map((c, i) =>
        c ? String(c).trim() : `Column ${i + 1}`
      );
      const rows: (string | number)[][] = json.slice(1).map((row) =>
        (row || []).map((cell) => {
          if (typeof cell === "number") return cell;
          if (typeof cell === "string") return cell;
          return cell != null ? String(cell) : "";
        })
      );

      return {
        sheetName: name,
        headers,
        rows,
      };
    });

    const generalExcelFile: GeneralExcelFile = {
      id: fileId,
      fileName,
      category: "catalog",
      description: `Excel workbook containing ${workbook.SheetNames.length} sheet${workbook.SheetNames.length > 1 ? "s" : ""}`,
      lastModified,
      fileSize,
      sheetCount: workbook.SheetNames.length,
      isDueFile: false,
      sheets: parsedSheets,
    };

    return {
      isDueFile: false,
      generalExcelFile,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isDueFile: false,
      error: `Failed to parse Excel buffer: ${errorMsg}`,
    };
  }
}

function parseCurrencyNumber(val: unknown): number {
  if (typeof val === "number") return isNaN(val) ? 0 : Math.round(val);
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function formatLedgerDate(dateVal: unknown): string {
  if (!dateVal) return "—";
  if (typeof dateVal === "number" && dateVal > 1000 && dateVal < 3000) {
    return `FY-${dateVal}`;
  }
  return formatDate(String(dateVal));
}
