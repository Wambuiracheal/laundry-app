import type { ReactNode } from "react";
import { BellIcon, HomeIcon, MapIcon, OrdersIcon, ProfileIcon, ServiceIcon, StarRingIcon, SupportIcon, TruckIcon } from "@/components/mobile/icons";

export type NavSection =
  | "home"
  | "services"
  | "orders"
  | "updates"
  | "support"
  | "profile"
  | "jobs"
  | "shop"
  | "pricing"
  | "payments"
  | "riders"
  | "map";

/** Which link set to show: customers, riders, shop staff, or admins (shop + pricing). */
export type NavKind = "customer" | "rider" | "shop" | "admin";

export type NavItem = { label: string; icon: ReactNode; active: boolean; href: string };

export function navForRole(role: string | undefined): NavKind {
  return role === "rider" ? "rider" : role === "admin" ? "admin" : role === "staff" ? "shop" : "customer";
}

export function homeHrefForNav(nav: NavKind) {
  return nav === "rider" ? "/rider" : nav === "shop" || nav === "admin" ? "/shop" : "/customer-dashboard";
}

/** Shown under the brand in the sidebar so staff can tell which workspace they're in. */
export const NAV_LABELS: Record<NavKind, string | null> = {
  customer: null,
  rider: "Rider",
  shop: "Shop staff",
  admin: "Admin",
};

/** Sidebar links for each role. */
export function appNavItems(active: NavSection, homeHref = "/customer-dashboard", kind: NavKind = "customer"): NavItem[] {
  const item = (section: NavSection, label: string, href: string, icon: ReactNode): NavItem => ({ label, icon, href, active: active === section });
  const support = item("support", "Help & support", "/support", <SupportIcon className="h-5 w-5" />);
  const profile = item("profile", "Profile", "/profile", <ProfileIcon className="h-5 w-5" />);

  if (kind === "rider") {
    return [item("jobs", "Jobs", "/rider", <TruckIcon className="h-5 w-5" />), support, profile];
  }

  const shop = item("shop", "Shop", "/shop", <OrdersIcon className="h-5 w-5" />);
  const map = item("map", "Live map", "/shop/map", <MapIcon className="h-5 w-5" />);

  if (kind === "shop") {
    return [shop, map, support, profile];
  }

  if (kind === "admin") {
    return [
      shop,
      map,
      item("pricing", "Pricing", "/shop/pricing", <ServiceIcon className="h-5 w-5" />),
      item("payments", "Payments", "/shop/payments", <StarRingIcon className="h-5 w-5" />),
      item("riders", "Riders", "/shop/riders", <TruckIcon className="h-5 w-5" />),
      support,
      profile,
    ];
  }

  return [
    item("home", "Home", homeHref, <HomeIcon className="h-5 w-5" />),
    item("services", "Book a pickup", "/new-order", <ServiceIcon className="h-5 w-5" />),
    item("orders", "My orders", "/order-tracking", <OrdersIcon className="h-5 w-5" />),
    item("updates", "Updates", "/notifications", <BellIcon className="h-5 w-5" />),
    support,
    profile,
  ];
}
