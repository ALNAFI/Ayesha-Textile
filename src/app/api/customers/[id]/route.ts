import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/api";
import {
  getCustomerDetail,
  invalidateCustomerDetail,
} from "@/lib/customers/detail";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const snapshot = await getCustomerDetail(id, false);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  invalidateCustomerDetail(id);
  const snapshot = await getCustomerDetail(id, true);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
