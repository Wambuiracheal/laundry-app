import { HomeIcon, OrdersIcon, ProfileIcon, ServiceIcon, StarRingIcon, TruckIcon } from "@/components/mobile/icons";

export type NavSection = "home" | "services" | "orders" | "profile" | "jobs" | "shop" | "pricing" | "payments" | "riders" | "map";

/** Which tab set to show: customers, riders, shop staff, or admins (shop + pricing). */
export type NavKind = "customer" | "rider" | "shop" | "admin";

/** Shared items for MobileBottomNav and DesktopTopNav. */
export function appNavItems(active: NavSection, homeHref = "/customer-dashboard", kind: NavKind = "customer") {
  const profile = { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, active: active === "profile", href: "/profile" };

  if (kind === "rider") {
    return [{ label: "Jobs", icon: <TruckIcon className="h-5 w-5" />, active: active === "jobs", href: "/rider" }, profile];
  }

  const shop = { label: "Shop", icon: <OrdersIcon className="h-5 w-5" />, active: active === "shop", href: "/shop" };

  const map = { label: "Map", icon: <TruckIcon className="h-5 w-5" />, active: active === "map", href: "/shop/map" };

  if (kind === "shop") {
    return [shop, map, profile];
  }

  if (kind === "admin") {
    return [shop, { label: "Pricing", icon: <ServiceIcon className="h-5 w-5" />, active: active === "pricing", href: "/shop/pricing" },
      { label: "Payments", icon: <StarRingIcon className="h-5 w-5" />, active: active === "payments", href: "/shop/payments" },
      { label: "Riders", icon: <TruckIcon className="h-5 w-5" />, active: active === "riders", href: "/shop/riders" },
      profile,
    ];
  }

  return [
    { label: "Home", icon: <HomeIcon className="h-5 w-5" />, active: active === "home", href: homeHref },
    { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, active: active === "services", href: "/new-order" },
    { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, active: active === "orders", href: "/order-tracking" },
    profile,
  ];
}
