import type { ReactNode } from "react";
import Link from "next/link";
import { BackIcon, BellIcon } from "@/components/mobile/icons";
import { appNavItems, type NavSection } from "@/components/mobile/nav";
import { UserAvatar } from "@/components/mobile/SessionUser";

export type NavItem = { label: string; icon: ReactNode; active?: boolean; href?: string };

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return <span className={`inline-block shrink-0 rounded-xl bg-[linear-gradient(150deg,#5eead4,#22d3ee_45%,#2563eb)] ${className}`} />;
}

/**
 * Page chrome for the signed-in app: sticky top bar on desktop, compact header and
 * bottom tab bar on mobile, and a content column that widens at `md` and `lg`.
 */
export function AppShell({
  active,
  children,
  dark = false,
  homeHref,
  title,
  backHref,
  backLabel = "Back",
}: {
  active: NavSection;
  children: ReactNode;
  dark?: boolean;
  homeHref?: string;
  /** Mobile header title; when omitted the brand is shown instead. */
  title?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const items = appNavItems(active, homeHref);

  return (
    <div className={`min-h-screen w-full ${dark ? "bg-[#0a1424] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <DesktopTopNav items={items} dark={dark} />

      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-3 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8 lg:pb-16 lg:pt-8">
        <header className="mb-4 flex h-12 items-center justify-between lg:hidden">
          {backHref ? (
            <div className="flex items-center gap-1">
              <Link
                href={backHref}
                aria-label={backLabel}
                className={`-ml-2 rounded-full p-2 transition ${dark ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-200/60"}`}
              >
                <BackIcon className="h-5 w-5" />
              </Link>
              <p className="text-base font-semibold">{title}</p>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <BrandMark />
              <span className="text-base font-semibold">Panda Laundry</span>
            </Link>
          )}
          <div className={`flex items-center gap-1 ${dark ? "text-slate-300" : "text-slate-500"}`}>
            <button className="rounded-full p-2" type="button" aria-label="Notifications">
              <BellIcon className="h-5 w-5" />
            </button>
            <UserAvatar />
          </div>
        </header>

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

      <MobileBottomNav items={items} dark={dark} />
    </div>
  );
}

export function DesktopTopNav({ items, dark = false }: { items: NavItem[]; dark?: boolean }) {
  return (
    <header
      className={`sticky top-0 z-30 hidden border-b backdrop-blur lg:block ${
        dark ? "border-slate-800 bg-[#0a1424]/85" : "border-slate-200/80 bg-white/85"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-base font-semibold">Panda Laundry</span>
        </Link>
        <nav className="flex items-center gap-1">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href ?? "#"}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition [&_svg]:h-4 [&_svg]:w-4 ${
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
            </Link>
          ))}
        </nav>
        <div className={`flex items-center gap-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          <button
            className={`rounded-full p-2 transition ${dark ? "hover:bg-white/5" : "hover:bg-slate-100"}`}
            type="button"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav({ items, dark = false, className = "" }: { items: NavItem[]; dark?: boolean; className?: string }) {
  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden ${
        dark ? "border-slate-800 bg-[#081223]/90" : "border-slate-200 bg-white/90"
      } ${className}`}
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-4 px-2 md:max-w-3xl">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href ?? "#"}
              className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                item.active ? (dark ? "text-blue-300" : "text-blue-700") : dark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full [&_svg]:h-5 [&_svg]:w-5 ${
                  item.active ? (dark ? "bg-blue-500/15" : "bg-blue-50") : ""
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PageHeading({
  title,
  subtitle,
  action,
  dark = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 lg:mb-6">
      <div>
        <h1 className={`text-2xl font-semibold tracking-tight lg:text-3xl ${dark ? "text-slate-50" : "text-slate-900"}`}>{title}</h1>
        {subtitle ? <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  href,
  linkLabel = "View all",
  dark = false,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className={`text-base font-semibold lg:text-lg ${dark ? "text-slate-100" : "text-slate-900"}`}>{title}</h2>
      {href ? (
        <Link href={href} className={`text-sm font-medium transition ${dark ? "text-blue-300 hover:text-blue-200" : "text-blue-700 hover:text-blue-800"}`}>
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function SoftCard({
  children,
  dark = false,
  padding = "p-4",
  className = "",
}: {
  children: ReactNode;
  dark?: boolean;
  /** Base padding; passed separately so it can be replaced rather than fought over in `className`. */
  padding?: string;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border shadow-sm ${padding} ${
        dark ? "border-slate-800 bg-[#111d31] shadow-black/10" : "border-slate-200/80 bg-white shadow-slate-900/[0.03]"
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function Badge({ text, tone = "green" }: { text: string; tone?: "green" | "blue" | "gray" | "amber" }) {
  const styles = {
    green: "bg-emerald-100 text-emerald-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
  } as const;

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>{text}</span>
  );
}
