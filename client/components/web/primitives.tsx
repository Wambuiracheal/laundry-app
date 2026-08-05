import type { ReactNode } from "react";
import Link from "next/link";

export type SidebarNavItem = {
  label: string;
  icon: ReactNode;
  href: string;
  active?: boolean;
};

export function WebLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {sidebar}
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

export function Sidebar({
  items,
  userName,
  userSubtitle,
}: {
  items: SidebarNavItem[];
  userName: string;
  userSubtitle: string;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6">
      <div className="mb-8 flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-[linear-gradient(140deg,#bae6fd,#93c5fd)]" />
        <p className="text-lg font-semibold text-blue-700">Panda Laundry</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  item.active ? "bg-emerald-300/70 text-emerald-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <span className="h-5 w-5">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-[linear-gradient(140deg,#334155,#0f172a)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
          <p className="truncate text-xs text-slate-500">{userSubtitle}</p>
        </div>
      </div>
    </aside>
  );
}

export function StatCard({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <section
      className={`rounded-2xl border p-5 shadow-[0_6px_16px_rgba(15,23,42,0.05)] ${
        dark ? "border-transparent bg-[#0f172a] text-white" : "border-slate-200 bg-white"
      }`}
    >
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "delivered"
      ? "bg-slate-100 text-slate-600"
      : normalized === "cancelled"
        ? "bg-rose-100 text-rose-700"
        : "bg-emerald-100 text-emerald-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{status}</span>;
}
