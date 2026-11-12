import "server-only";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { SessionClaims } from "@/lib/auth/constants";

/** Guard for private Route Handlers — independent of UI redirects. */
export async function requireApiSession(): Promise<
  { session: SessionClaims } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      ),
    };
  }
  return { session };
}
