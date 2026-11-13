import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { isExcelDriveItem } from "@/lib/drive/excel-files";
import { listAllFolderFiles } from "@/lib/drive/folder-list";
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
    const items = await listAllFolderFiles(drive, folderId);
    const excel = items.filter(isExcelDriveItem);
    const lines = excel
      .filter((file) => file.id)
      .map((file) => `${file.id}:${file.modifiedTime ?? ""}`)
      .sort()
      .join("\n");
    const signature = createHash("sha1").update(lines).digest("hex").slice(0, 16);

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
