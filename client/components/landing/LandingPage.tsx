"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookingModal } from "@/components/landing/BookingModal";
import {
  ArrowRightIcon,
  BellIcon,
  ClockIcon,
  InstagramIcon,
  MailIcon,
  MenuIcon,
  PhoneIcon,
  PlusIcon,
  ShieldIcon,
  StarIcon,
  TrendingUpIcon,
  TwitterIcon,
  UserIcon,
  XIcon,
} from "@/components/landing/icons";
import { useAuth } from "@/components/shared/auth/AuthProvider";
import { useToast } from "@/components/shared/toast/ToastProvider";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/new-order" },
  { label: "Orders", href: "/order-tracking" },
];

const whyChooseItems = [
  {
    icon: <ClockIcon className="h-6 w-6" />,
    title: "Fast Turnaround",
    description: "Your fresh clothes are returned within 24 hours. Reliable and ready when you are.",
  },
  {
    icon: <TrendingUpIcon className="h-6 w-6" />,
    title: "Tracked Orders",
    description: "Real-time updates from pickup to delivery via our app. Know exactly where your items are.",
  },
  {
    icon: <ShieldIcon className="h-6 w-6" />,
    title: "Secure Payments",
    description: "Multiple safe payment options with end-to-end encryption for your peace of mind.",
  },
];

const specializedServices = [
  {
    title: "Wash & Fold",
    description: "Everyday essentials handled with premium care.",
    price: "$1.50/lb",
    imageSrc: "/web-app/fold.jpg",
  },
  {
    title: "Ironing & Pressing",
    description: "Crisp, wrinkle-free finishing for your entire wardrobe.",
    price: "$2.00/item",
    imageSrc: "/web-app/iron.jpg",
  },
];

const footerLinks = {
  company: [
    { label: "About Us", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Areas We Serve", href: "#" },
    { label: "Careers", href: "#" },
  ],
  support: [
    { label: "Help Center", href: "/support" },
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
};

export function LandingPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  function openBookingModal() {
    setIsMenuOpen(false);
    setIsBookingOpen(true);
  }

  const profileHref = user ? "/customer-dashboard" : "/login";
  const initials = user ? user.first_name.charAt(0).toUpperCase() : null;

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[linear-gradient(150deg,#3b82f6,#1d4ed8)]" />
              <span className="text-lg font-semibold text-blue-700">Panda Laundry</span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
              <Link href={profileHref} className="text-sm font-medium text-slate-600 transition hover:text-blue-700">
                Profile
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                type="button"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
              </button>
              <Link
                href={profileHref}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(150deg,#94a3b8,#334155)] text-sm font-semibold text-white"
                aria-label="Profile"
              >
                {initials ?? <UserIcon className="h-4 w-4" />}
              </Link>
              <button
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 md:hidden"
                type="button"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                {isMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isMenuOpen ? (
            <nav className="flex flex-col gap-1 border-t border-slate-100 bg-white px-4 py-3 md:hidden">
              {[...navItems, { label: "Profile", href: profileHref }].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </header>

        <section className="relative overflow-hidden">
          <div className="relative h-[480px] w-full md:h-[600px]">
            <Image
              src="/web-app/banner.jpg"
              alt="Freshly folded towels and a washing machine in a bright laundry room"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.8)_55%,rgba(255,255,255,0.4)_100%)] md:bg-[linear-gradient(90deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.88)_35%,rgba(255,255,255,0.3)_65%,rgba(255,255,255,0.05)_100%)]" />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  <ShieldIcon className="h-3.5 w-3.5" /> Premium Care Guaranteed
                </span>
                <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
                  Expert Laundry Service, <span className="text-blue-700">Delivered</span> to Your Door
                </h1>
                <p className="mt-4 max-w-md text-slate-600">
                  Experience the luxury of time. We collect, clean, and deliver your laundry within 24 hours with
                  professional-grade care and eco-friendly practices.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                    type="button"
                    onClick={openBookingModal}
                  >
                    Book Pickup <ArrowRightIcon className="h-4 w-4" />
                  </button>
                  <Link
                    href="/new-order"
                    className="inline-flex items-center justify-center rounded-xl border border-blue-700 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Why Choose Panda Laundry?
            </h2>
            <div className="mx-auto mt-3 h-1 w-14 rounded-full bg-blue-700" />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {whyChooseItems.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 p-6 text-center transition hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Our Specialized Services
                </h2>
                <p className="mt-1 text-sm text-slate-500">Tailored care for every fabric and lifestyle need.</p>
              </div>
              <Link href="/new-order" className="text-sm font-semibold text-blue-700 transition hover:text-blue-800">
                View All Services →
              </Link>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {specializedServices.map((service) => (
                <article key={service.title} className="group relative h-64 overflow-hidden rounded-2xl">
                  <Image
                    src={service.imageSrc}
                    alt={service.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,23,42,0.85)_0%,rgba(15,23,42,0.15)_55%,rgba(15,23,42,0)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                      <p className="mt-1 max-w-xs text-sm text-slate-200">{service.description}</p>
                      <span className="mt-3 inline-flex rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-950">
                        From {service.price}
                      </span>
                    </div>
                    <Link
                      href="/new-order"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-900 transition hover:bg-slate-100"
                      aria-label={`Book ${service.title}`}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(120deg,#1d4ed8,#1e3a8a)] py-16 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ready for a Laundry-Free Life?</h2>
            <p className="mt-3 text-blue-100">
              Join over 10,000 happy customers who trust Panda Laundry with their wardrobe. Download our app or book
              online in seconds.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                type="button"
                onClick={openBookingModal}
              >
                Book Pickup Now
              </button>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span className="flex text-amber-300">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={index} className="h-4 w-4" />
                  ))}
                </span>
                4.9/5 from 2k+ reviews
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[linear-gradient(150deg,#3b82f6,#1d4ed8)]" />
                <span className="text-base font-semibold text-blue-700">Panda Laundry</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The city&apos;s most reliable laundry and dry cleaning partner. Freshness delivered to your doorstep
                since 2018.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Company</h3>
              <ul className="mt-3 space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-slate-500 transition hover:text-blue-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Support</h3>
              <ul className="mt-3 space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-slate-500 transition hover:text-blue-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Contact &amp; Social</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4" /> hello@pandalaundry.com
                </li>
                <li className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" /> 1-800-PANDA-CLEAN
                </li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-700 hover:text-blue-700"
                  aria-label="Twitter"
                >
                  <TwitterIcon className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-700 hover:text-blue-700"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200">
            <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-400 md:px-8">
              © {new Date().getFullYear()} Panda Laundry Services Inc. All rights reserved.
            </div>
          </div>
        </footer>
      </main>

      <BookingModal
        open={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBooked={(name) => toast.success(`Pickup booked successfully for ${name}.`)}
      />
    </>
  );
}
