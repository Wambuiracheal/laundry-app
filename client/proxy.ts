import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/utils/session";
import { homeForRole, isRole, rolesForPath } from "@/utils/roles";

const AUTH_PAGES = ["/login", "/register", "/register/rider"];

// Optimistic RBAC: it keeps signed-out visitors on the public pages and each role on its own
// pages. The API still authorizes every request with the access token.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieRole = request.cookies.get(SESSION_COOKIE)?.value;
  // A cookie without a known role (e.g. from before roles were stored) counts as signed out.
  const role = isRole(cookieRole) ? cookieRole : null;

  if (AUTH_PAGES.includes(pathname)) {
    return role ? NextResponse.redirect(new URL(homeForRole(role), request.url)) : NextResponse.next();
  }

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    if (cookieRole !== undefined) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const allowed = rolesForPath(pathname);
  if (allowed && !allowed.includes(role)) {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register/:path*",
    "/customer-dashboard/:path*",
    "/dark-dashboard/:path*",
    "/new-order/:path*",
    "/order-tracking/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/support/:path*",
    "/cancel-order/:path*",
    "/cancel-pickup/:path*",
    "/reschedule/:path*",
    "/shop/:path*",
    "/rider/:path*",
  ],
};
