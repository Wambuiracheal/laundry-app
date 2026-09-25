import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/utils/session";

const AUTH_PAGES = ["/login", "/register"];

// Optimistic check only: it keeps signed-out visitors on the public pages. The API still
// authorizes every request with the access token.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE);

  if (AUTH_PAGES.includes(pathname)) {
    return signedIn ? NextResponse.redirect(new URL("/customer-dashboard", request.url)) : NextResponse.next();
  }

  if (!signedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/customer-dashboard/:path*",
    "/dark-dashboard/:path*",
    "/new-order/:path*",
    "/order-tracking/:path*",
    "/profile/:path*",
    "/support/:path*",
    "/cancel-order/:path*",
    "/cancel-pickup/:path*",
    "/reschedule/:path*",
  ],
};
