"use client";

import Link from "next/link";
import { useState } from "react";
import { BookingModal } from "@/components/landing/BookingModal";
import {
  BellIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardIcon,
  GridIcon,
  HomeIcon,
  PinIcon,
  PlusIcon,
  UserIcon,
} from "@/components/landing/icons";
import { BottomNav, FeatureCard, SectionTitle, ServiceCard } from "@/components/landing/ui";

const services = [
  {
    title: "Wash & Fold",
    price: "$1.50/lb",
    imageSrc: "/mobile/wash-fold.svg",
    accent: "linear-gradient(120deg, #dcfce7 0%, #bbf7d0 45%, #86efac 100%)",
  },
  {
    title: "Dry Cleaning",
    price: "$5.00/item",
    imageSrc: "/mobile/dry-cleaning.svg",
    accent: "linear-gradient(120deg, #e0f2fe 0%, #bae6fd 45%, #7dd3fc 100%)",
  },
];

const navItems = [
  { label: "Home", icon: <HomeIcon className="h-5 w-5" />, isActive: true, href: "/" },
  { label: "Services", icon: <GridIcon className="h-5 w-5" />, href: "/new-order" },
  { label: "Orders", icon: <ClipboardIcon className="h-5 w-5" />, href: "/order-tracking" },
  { label: "Profile", icon: <UserIcon className="h-5 w-5" />, href: "/login" },
];

export function LandingPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function openBookingModal() {
    setSuccessMessage(null);
    setIsBookingOpen(true);
  }

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f1f5f9_45%,#f8fafc_100%)] px-3 py-4 text-slate-900 md:px-6 md:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-4 flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm md:mb-8 md:px-6 md:py-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 rounded-full bg-[linear-gradient(160deg,#99f6e4,#22d3ee)] md:h-10 md:w-10" />
              <div>
                <p className="text-sm font-semibold md:text-lg">Panda Laundry</p>
                <p className="hidden text-xs text-slate-500 md:block">Fresh laundry, right on schedule</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/new-order" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                Services
              </Link>
              <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                Pricing
              </Link>
              <Link href="/order-tracking" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                Track Order
              </Link>
              <button className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800" type="button" onClick={openBookingModal}>
                Book Pickup
              </button>
            </div>
            <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 md:hidden" type="button" aria-label="Notifications">
              <BellIcon className="h-5 w-5" />
            </button>
          </header>

          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4 md:space-y-6">
              <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(150deg,#3b82f6_0%,#1d4ed8_48%,#1e3a8a_100%)] p-4 text-white shadow-[0_18px_35px_rgba(30,58,138,0.4)] md:rounded-3xl md:p-7">
                <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl md:h-52 md:w-52" />
                <h1 className="max-w-[16ch] text-4xl font-semibold leading-tight tracking-tight md:text-6xl">Freshness, Delivered to Your Door.</h1>
                <p className="mt-3 max-w-[44ch] text-sm text-blue-100 md:text-base">
                  Expert laundry service for urban professionals. Picked up, cleaned, and returned in 24h.
                </p>
                <div className="mt-4 flex flex-col gap-3 md:mt-6 md:flex-row md:items-center">
                  <button
                    className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 md:w-auto md:min-w-48"
                    type="button"
                    onClick={openBookingModal}
                  >
                    Book Pickup Now
                  </button>
                  <p className="text-xs text-blue-100 md:text-sm">Trusted by 10,000+ households every month</p>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                <FeatureCard
                  icon={<BoltIcon className="h-5 w-5" />}
                  iconTone="bg-emerald-100 text-emerald-700"
                  title="Fast Turnaround"
                  description="Same-day cleaning available for express orders."
                />
                <FeatureCard
                  icon={<PinIcon className="h-5 w-5" />}
                  iconTone="bg-indigo-100 text-indigo-700"
                  title="Tracked Orders"
                  description="Live GPS tracking for all pickups and deliveries."
                />
                <article className="col-span-2 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] md:col-span-1">
                  <p className="text-sm font-semibold text-cyan-900">Average Delivery</p>
                  <p className="mt-2 text-3xl font-semibold text-cyan-950">24h</p>
                  <p className="mt-1 text-sm text-cyan-800">From pickup to doorstep.</p>
                </article>
              </section>

              <section>
                <SectionTitle title="Our Services" actionLabel="View All" actionHref="/new-order" />
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.title}
                      title={service.title}
                      price={service.price}
                      imageSrc={service.imageSrc}
                      accent={service.accent}
                    />
                  ))}
                  <ServiceCard
                    title="Ironing"
                    price="$2.00/item"
                    accent="linear-gradient(120deg, #ede9fe 0%, #ddd6fe 45%, #c4b5fd 100%)"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-[0_10px_24px_rgba(37,99,235,0.12)] md:rounded-3xl md:p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-blue-900 md:text-2xl">Monthly Subscription</h2>
                  <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900">Popular</span>
                </div>
                <p className="text-blue-900">Save 20% on all orders</p>
                <ul className="mt-2 space-y-1 text-sm text-blue-900 md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    4 pickups per month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    Free delivery always
                  </li>
                </ul>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-2xl font-semibold text-blue-900 md:text-3xl">
                    $49.99 <span className="text-base font-medium text-blue-700">/mo</span>
                  </p>
                  <Link href="/login" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                    Get Started
                  </Link>
                </div>
              </section>

              <section className="mb-14 text-center md:mb-0 md:hidden">
                <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-[linear-gradient(150deg,#a7f3d0,#67e8f9)]" />
                <p className="text-xs text-slate-500">Trusted by 10,000+ urban households every month.</p>
                {successMessage ? <p className="mt-2 text-sm font-semibold text-emerald-700">{successMessage}</p> : null}
              </section>
            </div>

            <aside className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:flex lg:flex-col">
              <h2 className="text-2xl font-semibold text-slate-900">Your Laundry, Managed</h2>
              <p className="mt-2 text-sm text-slate-500">Everything from booking to delivery in one place.</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <article className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Active Orders</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">12</p>
                </article>
                <article className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Satisfaction</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">4.9</p>
                </article>
              </div>

              <div className="mt-5 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] p-4 text-white">
                <p className="text-sm text-blue-100">Limited Offer</p>
                <p className="mt-1 text-xl font-semibold">Free first pickup this week</p>
                <button
                  className="mt-4 w-full rounded-xl bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
                  type="button"
                  onClick={openBookingModal}
                >
                  Claim Offer
                </button>
              </div>

              <div className="mt-auto rounded-2xl border border-slate-200 p-4 text-center">
                <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-[linear-gradient(150deg,#a7f3d0,#67e8f9)]" />
                <p className="text-sm text-slate-600">Trusted by 10,000+ urban households every month.</p>
                {successMessage ? <p className="mt-2 text-sm font-semibold text-emerald-700">{successMessage}</p> : null}
              </div>
            </aside>
          </div>

          <Link
            href="/new-order"
            className="fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-[0_12px_30px_rgba(37,99,235,0.45)] transition hover:bg-blue-800 md:bottom-8 md:right-8 lg:hidden"
            aria-label="Add pickup"
          >
            <PlusIcon className="h-6 w-6" />
          </Link>

          <div className="fixed inset-x-0 bottom-0 z-20 md:hidden">
            <BottomNav items={navItems} />
          </div>
        </div>
      </main>

      <BookingModal
        open={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBooked={(name) => setSuccessMessage(`Pickup booked successfully for ${name}.`)}
      />
    </>
  );
}
