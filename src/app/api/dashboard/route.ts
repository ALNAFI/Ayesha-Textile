import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { getDashboardSnapshot } from "@/lib/dashboard/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const snapshot = await getDashboardSnapshot(false);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const snapshot = await getDashboardSnapshot(true);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
