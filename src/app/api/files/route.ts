import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { getFilesListSnapshot } from "@/lib/files/list";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const snapshot = await getFilesListSnapshot(false);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const snapshot = await getFilesListSnapshot(true);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
