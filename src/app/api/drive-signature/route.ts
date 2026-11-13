import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { isExcelDriveItem } from "@/lib/drive/excel-files";
import { listFolderShared } from "@/lib/drive/folder-list";
import { excelFolderSignature } from "@/lib/drive/signature";
import {
  createDriveClientFromEnv,
  getServiceAccountCredentials,
  isDriveConfigured,
} from "@/lib/drive/service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" };

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  if (!isDriveConfigured()) {
    return NextResponse.json(
      { error: "Google Drive is not configured." },
      { status: 503, headers: noStore }
    );
  }

  const { folderId } = getServiceAccountCredentials();
  if (!folderId) {
    return NextResponse.json(
      { error: "Google Drive is not configured." },
      { status: 503, headers: noStore }
    );
  }

  try {
    const drive = createDriveClientFromEnv();
    const items = await listFolderShared(drive, folderId, true);
    const excel = items.filter(isExcelDriveItem);
    const signature = excelFolderSignature(excel);

    return NextResponse.json(
      { signature, count: excel.length },
      { headers: noStore }
    );
  } catch {
    return NextResponse.json(
      { error: "Google Drive could not be reached." },
      { status: 502, headers: noStore }
    );
  }
}
