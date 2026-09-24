import { HomeIcon, OrdersIcon, ProfileIcon, ServiceIcon } from "@/components/mobile/icons";

export type NavSection = "home" | "services" | "orders" | "profile";

/** Shared items for MobileBottomNav and DesktopTopNav. */
export function appNavItems(active: NavSection, homeHref = "/customer-dashboard") {
  return [
    { label: "Home", icon: <HomeIcon className="h-5 w-5" />, active: active === "home", href: homeHref },
    { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, active: active === "services", href: "/new-order" },
    { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, active: active === "orders", href: "/order-tracking" },
    { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, active: active === "profile", href: "/profile" },
  ];
}
