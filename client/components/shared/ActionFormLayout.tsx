import Link from "next/link";
import type { ReactNode } from "react";

type ActionFormLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  children: ReactNode;
};

export function ActionFormLayout({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  children,
}: ActionFormLayoutProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f1f5f9_55%,#f8fafc_100%)] px-4 py-10">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>

        <div className="mt-6">{children}</div>

        <div className="mt-6">
          <Link
            href={backHref}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {backLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
