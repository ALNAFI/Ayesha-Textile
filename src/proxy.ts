import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/jwt";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

const PUBLIC_PATHS = new Set(["/login"]);

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$/i.test(pathname)
  );
}

function isProtectedPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return false;
  if (pathname.startsWith("/api/")) {
    // Public health-style endpoints can be added later; default private.
    return true;
  }
  return (
    pathname === "/" ||
    pathname.startsWith("/files") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/files")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const isAuthed = Boolean(session);

  if (pathname === "/login") {
    if (isAuthed) {
      const next = sanitizeRedirectPath(
        request.nextUrl.searchParams.get("next")
      );
      return NextResponse.redirect(new URL(next, request.url));
    }
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (isProtectedPath(pathname) && !isAuthed) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", sanitizeRedirectPath(nextPath));
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (pathname.startsWith("/api/") && !isAuthed) {
    return NextResponse.json(
      { error: "Authentication required." },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const response = NextResponse.next();
  if (isProtectedPath(pathname) || isAuthed) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
