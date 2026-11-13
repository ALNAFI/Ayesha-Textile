import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { buildCustomersSnapshot } from "@/lib/customers/summary";
import { buildDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { isDriveConfigured, loadDriveWorkspace } from "@/lib/drive/service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" };

export async function POST() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  if (!isDriveConfigured()) {
    return NextResponse.json(
      { error: "Google Drive is not configured." },
      { status: 503, headers: noStore }
    );
  }

  const loaded = await loadDriveWorkspace(true);
  if (!loaded.ok) {
    return NextResponse.json(
      { error: loaded.error || "Google Drive could not be reached." },
      { status: 502, headers: noStore }
    );
  }

  const complete = loaded.failedFiles.length === 0;
  return NextResponse.json(
    {
      signature: complete ? loaded.signature : null,
      complete,
      failedFiles: loaded.failedFiles,
      dashboard: buildDashboardSnapshot(loaded),
      customers: buildCustomersSnapshot(loaded),
    },
    { headers: noStore }
  );
}
