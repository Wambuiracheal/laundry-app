import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export type NavItem = {
  label: string;
  icon: ReactNode;
  isActive?: boolean;
  href?: string;
};

export function SectionTitle({
  title,
  actionLabel,
  actionHref,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">{title}</h2>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
          {actionLabel}
        </Link>
      ) : actionLabel ? (
        <button className="text-sm font-semibold text-blue-700 transition hover:text-blue-800" type="button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  iconTone = "bg-emerald-100 text-emerald-700",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  iconTone?: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className={`mb-3 inline-flex rounded-xl p-2 ${iconTone}`}>{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
    </article>
  );
}

export function ServiceCard({
  title,
  price,
  imageSrc,
  imageAlt,
  accent,
}: {
  title: string;
  price: string;
  imageSrc?: string;
  imageAlt?: string;
  accent: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div
        className="relative flex h-28 items-center justify-center overflow-hidden text-4xl"
        style={{
          background: accent,
        }}
      >
        {imageSrc ? <Image src={imageSrc} alt={imageAlt ?? title} fill className="object-cover" /> : null}
      </div>
      <div className="p-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-cyan-700">From {price}</p>
      </div>
    </article>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="mt-auto rounded-t-3xl border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
      <ul className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href ?? "#"}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition ${
                item.isActive
                  ? "bg-emerald-300/70 text-emerald-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
