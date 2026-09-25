import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "@/components/mobile/icons";
import { BrandMark } from "@/components/mobile/primitives";

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
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,#dbeafe_0%,transparent_55%)]">
      <header className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:h-16">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="text-sm font-semibold text-slate-900">Panda Laundry</span>
        </Link>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-12 pt-2 sm:pt-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <BackIcon className="h-4 w-4" />
          {backLabel}
        </Link>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>

          <div className="mt-6">{children}</div>
        </section>
      </main>
    </div>
  );
}
