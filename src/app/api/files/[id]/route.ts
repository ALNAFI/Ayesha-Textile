import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import { getFilePreview, invalidateFilePreview } from "@/lib/files/preview";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const snapshot = await getFilePreview(id, false);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  invalidateFilePreview(id);
  const snapshot = await getFilePreview(id, true);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
