"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BookingModal } from "@/components/landing/BookingModal";
import { CheckCircleIcon } from "@/components/landing/icons";
import { HeroSlideshow, Reveal, SectionHeading, ServiceMarquee, type Slide } from "@/components/landing/ui";
import { serviceItems } from "@/components/mobile/data";
import { ClockIcon, ServiceIcon, TruckIcon } from "@/components/mobile/icons";
import { BrandMark } from "@/components/mobile/primitives";

const slides: Slide[] = [
  { src: "/landing/facility.svg", title: "Our cleaning studio", caption: "Commercial machines, gentle detergents, careful hands." },
  { src: "/services/wash-fold.svg", title: "Wash & Fold", caption: "Everyday laundry washed, dried and neatly folded." },
  { src: "/landing/delivery.svg", title: "Free pickup & delivery", caption: "Our riders collect and return right to your door." },
  { src: "/services/dry-clean.svg", title: "Dry Cleaning", caption: "Suits, dresses and delicates treated with care." },
  { src: "/landing/doorstep.svg", title: "Back in 24 hours", caption: "Fresh, folded and delivered when it suits you." },
];

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const stats = [
  { value: "10k+", label: "Happy households" },
  { value: "24h", label: "Average turnaround" },
  { value: "4.9", label: "Customer rating" },
];

const steps = [
  { title: "Schedule a pickup", detail: "Choose your services and a time that suits you.", icon: <ClockIcon className="h-5 w-5" /> },
  { title: "We clean with care", detail: "Washed, pressed and folded by trained experts.", icon: <ServiceIcon className="h-5 w-5" /> },
  { title: "Delivered to your door", detail: "Fresh laundry back within 24 hours.", icon: <TruckIcon className="h-5 w-5" /> },
];

const values = ["Eco-friendly detergents", "Insured garment care", "Live order tracking"];

const primaryCta =
  "inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800";
const secondaryCta =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

export function LandingPage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function openBookingModal() {
    setSuccessMessage(null);
    setIsBookingOpen(true);
  }

  return (
    <>
      <div className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="text-base font-semibold">Panda Laundry</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                Log in
              </Link>
              <Link href="/register" className={`${primaryCta} px-3.5 py-2 sm:px-4`}>
                Get started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#bfdbfe,transparent)] opacity-70" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 md:px-6 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:px-8 lg:pb-20">
            <div className="motion-safe:animate-fade-up">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-medium text-blue-800 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Same-day pickup available
              </span>
              <h1 className="mt-5 max-w-[16ch] text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                Freshness, delivered to <span className="text-blue-700">your door.</span>
              </h1>
              <p className="mt-4 max-w-[46ch] text-base leading-7 text-slate-600">
                Expert laundry and dry cleaning for busy people. We pick up, clean with care, and return everything within 24 hours.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={primaryCta}>
                  Get started — it&apos;s free
                </Link>
                <button type="button" onClick={openBookingModal} className={secondaryCta}>
                  Book a pickup
                </button>
              </div>
              {successMessage ? (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">{successMessage}</p>
              ) : null}
              <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-xs text-slate-500">{stat.label}</dt>
                    <dd className="text-xl font-semibold text-slate-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative motion-safe:animate-fade-up [animation-delay:150ms]">
              <HeroSlideshow slides={slides} />
              <div className="absolute -left-3 top-6 hidden items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur motion-safe:animate-float sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <TruckIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] text-slate-500">Rider on the way</p>
                  <p className="text-xs font-semibold">Pickup in 30 min</p>
                </div>
              </div>
              <div className="absolute -right-3 bottom-24 hidden items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur motion-safe:animate-float motion-safe:[animation-delay:-3s] sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">★</span>
                <div>
                  <p className="text-[11px] text-slate-500">2,000+ reviews</p>
                  <p className="text-xs font-semibold">Rated 4.9 / 5</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services strip */}
        <section aria-label="Services offered" className="border-y border-slate-200/70 bg-white/60 py-6">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Services we offer</p>
          <ServiceMarquee services={serviceItems} />
        </section>

        <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
          {/* About */}
          <section id="about" className="grid scroll-mt-24 items-center gap-10 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
            <Reveal className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="relative col-span-2 aspect-[3/2] overflow-hidden rounded-3xl">
                <Image src="/landing/facility.svg" alt="Row of washing machines in the Panda Laundry studio" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
                <Image src="/landing/delivery.svg" alt="Panda Laundry delivery van" fill sizes="280px" className="object-cover" />
              </div>
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
                <Image src="/landing/doorstep.svg" alt="Clean laundry bag delivered to a front door" fill sizes="280px" className="object-cover" />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <SectionHeading
                eyebrow="About us"
                title="Laundry day, handled for you"
                subtitle="Panda Laundry started with a simple idea: nobody should lose a weekend to laundry. Today our team of cleaners and riders looks after thousands of homes, treating every garment as if it were our own."
              />
              <ul className="mt-6 space-y-2.5">
                {values.map((value) => (
                  <li key={value} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircleIcon className="h-5 w-5 text-blue-700" />
                    {value}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link href="/register" className={primaryCta}>
                  Join Panda Laundry
                </Link>
                <a href="#services" className={secondaryCta}>
                  See services
                </a>
              </div>
            </Reveal>
          </section>

          {/* Services */}
          <section id="services" className="scroll-mt-24 pb-16 md:pb-24">
            <Reveal>
              <SectionHeading
                align="center"
                eyebrow="Services"
                title="Everything your wardrobe needs"
                subtitle="Transparent pricing, no hidden fees. Pick what you need when you book."
              />
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {serviceItems.map((service, index) => (
                <Reveal key={service.id} delay={(index % 3) * 100}>
                  <Link
                    href="/new-order"
                    className="group block h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={service.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                        {service.tag}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-base font-semibold">{service.name}</h3>
                        <p className="whitespace-nowrap text-sm font-semibold text-blue-700">{service.priceLabel}</p>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-slate-500">{service.description}</p>
                      <p className="mt-4 text-sm font-medium text-blue-700 transition group-hover:translate-x-0.5">Book this service →</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section id="how-it-works" className="scroll-mt-24 pb-16 md:pb-24">
            <Reveal>
              <SectionHeading align="center" eyebrow="How it works" title="Fresh laundry in three steps" />
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
              {steps.map((step, index) => (
                <Reveal key={step.title} delay={index * 120}>
                  <div className="relative h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/[0.03]">
                    <span className="absolute right-5 top-4 text-4xl font-semibold text-slate-100">0{index + 1}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{step.icon}</span>
                    <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{step.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <Reveal>
            <section
              id="pricing"
              className="scroll-mt-24 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm md:flex md:items-center md:justify-between md:gap-8 md:p-10"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Monthly subscription</h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Popular</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">Save 20% on every order, all month long.</p>
                <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:gap-6">
                  {["4 pickups per month", "Free delivery, always", "Priority support"].map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-blue-700" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 md:mt-0 md:flex-col md:items-end">
                <p className="text-3xl font-semibold">
                  $49.99<span className="text-sm font-medium text-slate-500"> /mo</span>
                </p>
                <Link href="/register" className={primaryCta}>
                  Get started
                </Link>
              </div>
            </section>
          </Reveal>

          {/* Closing CTA */}
          <Reveal>
            <section className="relative my-16 overflow-hidden rounded-3xl bg-[linear-gradient(150deg,#2563eb,#1d4ed8_50%,#1e3a8a)] px-6 py-12 text-center text-white md:my-24 md:py-16">
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
              <h2 className="relative text-2xl font-semibold tracking-tight md:text-3xl">Ready to skip laundry day?</h2>
              <p className="relative mx-auto mt-2 max-w-md text-sm text-blue-100 md:text-base">
                Create an account in under a minute and book your first pickup today. The first one is on us.
              </p>
              <div className="relative mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50">
                  Create free account
                </Link>
                <Link href="/login" className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  I already have an account
                </Link>
              </div>
            </section>
          </Reveal>
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row md:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <BrandMark className="h-6 w-6" />
              <p>© {new Date().getFullYear()} Panda Laundry. All rights reserved.</p>
            </div>
            <div className="flex gap-4">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="transition hover:text-slate-800">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>

      <BookingModal
        open={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBooked={(name) => setSuccessMessage(`Pickup requested for ${name}. We'll be in touch to confirm.`)}
      />
    </>
  );
}
