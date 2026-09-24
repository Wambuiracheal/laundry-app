"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackIcon, ClockIcon, MailIcon, OrdersIcon, ServiceIcon, StarRingIcon } from "@/components/mobile/icons";
import { AppShell, PageHeading, SoftCard } from "@/components/mobile/primitives";
import { UserAvatar, displayName } from "@/components/mobile/SessionUser";
import { useSession } from "@/hooks/useSession";
import { logout } from "@/utils/session";

const links = [
  { label: "My orders", detail: "Track active and past orders", href: "/order-tracking", icon: <OrdersIcon className="h-5 w-5" /> },
  { label: "New order", detail: "Book a pickup for your laundry", href: "/new-order", icon: <ServiceIcon className="h-5 w-5" /> },
  { label: "Reschedule pickup", detail: "Change your next pickup window", href: "/reschedule", icon: <ClockIcon className="h-5 w-5" /> },
  { label: "Help & support", detail: "Talk to our support team", href: "/support", icon: <StarRingIcon className="h-5 w-5" /> },
];

export function ProfileScreen() {
  const session = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <AppShell active="profile">
      <PageHeading title="Profile" subtitle="Manage your account and preferences." />

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6">
        <SoftCard className="flex items-center gap-4 lg:flex-col lg:items-start lg:p-6">
          <UserAvatar className="h-14 w-14 text-base" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{displayName(session) || "Your account"}</p>
            <p className="flex items-center gap-1.5 truncate text-sm text-slate-500">
              <MailIcon className="h-4 w-4 shrink-0" />
              {session?.email ?? "—"}
            </p>
          </div>
          <div className="ml-auto grid shrink-0 grid-cols-2 gap-2 text-center lg:ml-0 lg:w-full">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-base font-semibold">2</p>
              <p className="text-[11px] text-slate-500">Active</p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-3 py-2">
              <p className="text-base font-semibold text-emerald-800">450</p>
              <p className="text-[11px] text-emerald-700">Points</p>
            </div>
          </div>
        </SoftCard>

        <div className="space-y-4">
          <SoftCard padding="p-0" className="overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{link.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{link.label}</span>
                      <span className="block text-xs text-slate-500">{link.detail}</span>
                    </span>
                    <BackIcon className="h-4 w-4 rotate-180 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </SoftCard>

          <button
            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Log out"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
