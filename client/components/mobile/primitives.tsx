import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/mobile/BrandMark";
import { SidebarShell } from "@/components/mobile/SidebarShell";
import type { NavKind, NavSection } from "@/components/mobile/nav";

export { BrandMark };

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

/**
 * Page chrome for the signed-in app, for every role: a sidebar on desktop that becomes a
 * drawer on small screens, and a content column that widens at `md` and `lg`.
 */
export function AppShell(props: {
  active: NavSection;
  children: ReactNode;
  dark?: boolean;
  homeHref?: string;
  /** Mobile header title; when omitted the brand is shown instead. */
  title?: string;
  backHref?: string;
  backLabel?: string;
  /** Link set for the signed-in role. */
  nav?: NavKind;
}) {
  return <SidebarShell {...props} />;
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

export function Badge({ text, tone = "green" }: { text: string; tone?: "green" | "blue" | "gray" | "amber" | "red" }) {
  const styles = {
    green: "bg-emerald-100 text-emerald-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
  } as const;

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>{text}</span>
  );
}
