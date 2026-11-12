import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { getDriveHealth } from "@/lib/settings/drive-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const health = await getDriveHealth(false);
  return NextResponse.json(health, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const health = await getDriveHealth(true);
  return NextResponse.json(health, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
