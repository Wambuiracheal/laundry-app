import type { ReactNode } from "react";
import Link from "next/link";

type MobileLayoutProps = {
  children: ReactNode;
  dark?: boolean;
};

export function MobileLayout({ children, dark = false }: MobileLayoutProps) {
  return (
    <main
      className={`mx-auto min-h-screen w-full max-w-[390px] px-4 pb-28 pt-5 ${
        dark ? "bg-[#091525] text-slate-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      {children}
    </main>
  );
}

export function MobileHeader({
  left,
  title,
  right,
  dark = false,
}: {
  left?: ReactNode;
  title: ReactNode;
  right?: ReactNode;
  dark?: boolean;
}) {
  return (
    <header
      className={`mb-4 flex items-center justify-between rounded-2xl px-1 py-2 ${
        dark ? "bg-[#0f1c31] text-slate-100" : "bg-transparent text-slate-900"
      }`}
    >
      <div className="min-w-8">{left}</div>
      <div className="flex-1 px-2 text-lg font-semibold">{title}</div>
      <div className="min-w-8 text-right">{right}</div>
    </header>
  );
}

export function SoftCard({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)] ${
        dark ? "border-slate-700 bg-[#162338]" : "border-slate-200 bg-white"
      }`}
    >
      {children}
    </section>
  );
}

export function MobileBottomNav({
  items,
  dark = false,
}: {
  items: Array<{ label: string; icon: ReactNode; active?: boolean; href?: string }>;
  dark?: boolean;
}) {
  return (
    <nav
      className={`fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 rounded-t-2xl border-t px-4 py-2 shadow-[0_-8px_18px_rgba(15,23,42,0.08)] ${
        dark ? "border-slate-700 bg-[#081223]" : "border-slate-200 bg-white"
      }`}
    >
      <ul className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href ?? "#"}
              className={`flex w-full flex-col items-center rounded-xl px-2 py-1.5 text-xs ${
                item.active
                  ? dark
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-emerald-300/70 text-emerald-900"
                  : dark
                    ? "text-slate-300"
                    : "text-slate-500"
              }`}
            >
              <span className="h-5 w-5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Badge({ text, tone = "green" }: { text: string; tone?: "green" | "blue" | "gray" }) {
  const styles = {
    green: "bg-emerald-300 text-emerald-900",
    blue: "bg-blue-600 text-white",
    gray: "bg-slate-200 text-slate-700",
  } as const;

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${styles[tone]}`}>{text}</span>;
}
