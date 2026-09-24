import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon } from "@/components/mobile/icons";
import logo from "@/public/mobile/logo.png";

const perks = ["Free pickup & delivery", "24-hour turnaround", "Live order tracking"];

/** Split layout for sign-in pages: brand panel on desktop, a single centered column on mobile. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#2563eb,#1d4ed8_45%,#1e3a8a)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <Image src={logo} alt="" className="h-9 w-9 rounded-full bg-white" />
          <span className="text-base font-semibold">Panda Laundry</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">Fresh laundry, right on schedule.</h2>
          <p className="mt-3 text-sm text-blue-100">Book a pickup in seconds and let us handle the washing, folding and delivery.</p>
          <ul className="mt-6 space-y-2.5">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-blue-200">Trusted by 10,000+ households every month.</p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 flex justify-center lg:hidden">
            <Image src={logo} alt="Panda Laundry" className="h-12 w-12 rounded-full" />
          </Link>
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
