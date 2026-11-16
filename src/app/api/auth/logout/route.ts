import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Plain POST endpoint instead of a Server Action: its URL never changes
 * between deployments, so an older open page can still sign out.
 */
export async function POST() {
  await destroySession();
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
