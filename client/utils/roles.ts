/**
 * Client-side RBAC: which pages each role may open and where each role lands after login.
 * This only steers navigation; the API enforces the same roles on every request.
 */
export type Role = "customer" | "rider" | "staff" | "admin";

export const ROLES: Role[] = ["customer", "rider", "staff", "admin"];

/** Roles a visitor can choose at signup (/register and /register/rider). */
export type SignupRole = Extract<Role, "customer" | "rider">;

export const ROLE_HOME: Record<Role, string> = {
  customer: "/customer-dashboard",
  rider: "/rider",
  staff: "/shop",
  admin: "/shop",
};

const CUSTOMER_PAGES = [
  "/customer-dashboard",
  "/dark-dashboard",
  "/new-order",
  "/order-tracking",
  "/notifications",
  "/cancel-order",
  "/cancel-pickup",
  "/reschedule",
];

/** Page prefixes and the roles allowed on them. Pages not listed here are public. */
export const PAGE_ACCESS: { prefix: string; roles: Role[] }[] = [
  ...CUSTOMER_PAGES.map((prefix) => ({ prefix, roles: ["customer"] as Role[] })),
  { prefix: "/rider", roles: ["rider"] },
  // More specific prefixes must come before /shop: the first match wins.
  { prefix: "/shop/pricing", roles: ["admin"] },
  { prefix: "/shop/payments", roles: ["admin"] },
  { prefix: "/shop/riders", roles: ["admin"] },
  { prefix: "/shop", roles: ["staff", "admin"] },
  { prefix: "/profile", roles: ROLES },
  { prefix: "/support", roles: ROLES },
];

export function isRole(value: string | undefined | null): value is Role {
  return ROLES.includes(value as Role);
}

export function homeForRole(role: string | undefined | null) {
  return isRole(role) ? ROLE_HOME[role] : "/login";
}

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Roles allowed on a path, or null when the path is public. */
export function rolesForPath(pathname: string): Role[] | null {
  return PAGE_ACCESS.find((rule) => matches(pathname, rule.prefix))?.roles ?? null;
}

export function canAccess(role: Role, pathname: string) {
  const roles = rolesForPath(pathname);
  return roles === null || roles.includes(role);
}
