import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { refreshWorkspaceData } from "@/lib/settings/drive-health";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const result = await refreshWorkspaceData();
  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
    headers: { "Cache-Control": "private, no-store" },
  });
}
