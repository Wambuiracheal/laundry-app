"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/mobile/BrandMark";
import { BackIcon, BellIcon, CloseIcon, LogoutIcon, MenuIcon, PlusIcon } from "@/components/mobile/icons";
import { NAV_LABELS, appNavItems, homeHrefForNav, type NavKind, type NavSection } from "@/components/mobile/nav";
import { UserAvatar, displayName } from "@/components/mobile/SessionUser";
import { usePolledData } from "@/hooks/usePolledData";
import { useSession } from "@/hooks/useSession";
import { NOTIFICATIONS_READ_EVENT, NOTIFICATION_POLL_INTERVAL_MS, fetchNotifications, type NotificationFeed } from "@/utils/notificationsApi";
import { logout } from "@/utils/session";

type ShellProps = {
  active: NavSection;
  children: ReactNode;
  /** Link set for the signed-in role. */
  nav?: NavKind;
  dark?: boolean;
  homeHref?: string;
  /** Mobile header title; when omitted the brand is shown instead. */
  title?: string;
  backHref?: string;
  backLabel?: string;
};

// Only customers receive order updates; other roles skip the request entirely.
const noFeed = async (): Promise<NotificationFeed | null> => null;

function UnreadBadge({ count, dark }: { count: number; dark: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
        dark ? "bg-blue-500 text-white" : "bg-blue-700 text-white"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Brand, primary action, links and account footer; shared by the desktop sidebar and the mobile drawer. */
function SidebarContent({
  active,
  nav,
  homeHref,
  unread,
  dark,
  onNavigate,
}: {
  active: NavSection;
  nav: NavKind;
  homeHref: string;
  unread: number;
  dark: boolean;
  onNavigate?: () => void;
}) {
  const session = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const items = appNavItems(active, homeHref, nav);
  const workspace = NAV_LABELS[nav];

  async function handleLogout() {
    setSigningOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <Link href={homeHref} onClick={onNavigate} className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <BrandMark />
        <span className="min-w-0">
          <span className="block text-base font-semibold leading-tight">Panda Laundry</span>
          {workspace ? (
            <span className={`block text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-blue-300" : "text-blue-700"}`}>{workspace}</span>
          ) : null}
        </span>
      </Link>

      {nav === "customer" ? (
        <div className="px-4 pb-2">
          <Link
            href="/new-order"
            onClick={onNavigate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
          >
            <PlusIcon className="h-4 w-4" />
            New order
          </Link>
        </div>
      ) : null}

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={item.active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition [&_svg]:h-5 [&_svg]:w-5 ${
                  item.active
                    ? dark
                      ? "bg-blue-500/15 text-blue-300"
                      : "bg-blue-50 text-blue-700"
                    : dark
                      ? "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.icon}
                {item.label}
                {item.href === "/notifications" ? <UnreadBadge count={unread} dark={dark} /> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`border-t p-4 ${dark ? "border-slate-800" : "border-slate-200/80"}`}>
        <div className="flex items-center gap-3">
          <UserAvatar className="h-9 w-9 shrink-0 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{displayName(session) || "Your account"}</p>
            <p className={`truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{session?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            aria-label="Log out"
            title="Log out"
            className={`rounded-lg p-2 transition disabled:opacity-60 ${
              dark ? "text-slate-400 hover:bg-white/5 hover:text-rose-300" : "text-slate-500 hover:bg-rose-50 hover:text-rose-700"
            }`}
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Page chrome for the signed-in app, for every role: a fixed sidebar on desktop and, below `lg`,
 * a compact header whose menu button opens the same sidebar as a drawer.
 */
export function SidebarShell({ active, children, nav = "customer", dark = false, homeHref, title, backHref, backLabel = "Back" }: ShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isCustomer = nav === "customer";
  const home = homeHref ?? homeHrefForNav(nav);
  const { data: feed, setData: setFeed } = usePolledData(isCustomer ? fetchNotifications : noFeed, NOTIFICATION_POLL_INTERVAL_MS);
  const unread = feed?.unread ?? 0;

  // The updates page marks everything read; clear the badge without waiting for the next poll.
  useEffect(() => {
    const clear = () => setFeed((prev) => (prev ? { ...prev, unread: 0 } : prev));
    window.addEventListener(NOTIFICATIONS_READ_EVENT, clear);
    return () => window.removeEventListener(NOTIFICATIONS_READ_EVENT, clear);
  }, [setFeed]);

  useEffect(() => {
    if (!menuOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const surface = dark ? "border-slate-800 bg-[#081223]" : "border-slate-200/80 bg-white";
  const muted = dark ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100";
  const content = { active, nav, homeHref: home, unread, dark };

  return (
    <div className={`min-h-screen w-full ${dark ? "bg-[#0a1424] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block ${surface}`}>
        <SidebarContent {...content} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r shadow-2xl ${surface}`}>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className={`absolute right-3 top-3.5 rounded-full p-2 transition ${muted}`}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <SidebarContent {...content} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className={`sticky top-0 z-20 border-b backdrop-blur lg:hidden ${dark ? "border-slate-800 bg-[#0a1424]/85" : "border-slate-200/80 bg-white/85"}`}>
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-2 md:px-4">
            <button type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className={`rounded-full p-2 transition ${muted}`}>
              <MenuIcon className="h-5 w-5" />
            </button>
            {backHref ? (
              <>
                <Link href={backHref} aria-label={backLabel} className={`rounded-full p-2 transition ${muted}`}>
                  <BackIcon className="h-5 w-5" />
                </Link>
                <p className="truncate text-base font-semibold">{title}</p>
              </>
            ) : (
              <Link href={home} className="ml-1 flex min-w-0 items-center gap-2">
                <BrandMark className="h-7 w-7" />
                <span className="truncate text-base font-semibold">{title ?? "Panda Laundry"}</span>
              </Link>
            )}
            <div className="ml-auto flex items-center gap-1">
              {isCustomer ? (
                <Link href="/notifications" aria-label={unread > 0 ? `Updates (${unread} unread)` : "Updates"} className={`relative rounded-full p-2 transition ${muted}`}>
                  <BellIcon className="h-5 w-5" />
                  {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /> : null}
                </Link>
              ) : null}
              <UserAvatar />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-xl px-4 pb-12 pt-4 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8 lg:pb-16 lg:pt-8">
          {backHref ? (
            <Link
              href={backHref}
              className={`mb-4 hidden items-center gap-1 text-sm font-medium transition lg:inline-flex ${
                dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BackIcon className="h-4 w-4" />
              {backLabel}
            </Link>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
