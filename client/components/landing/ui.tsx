"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ServiceItem } from "@/components/mobile/data";

export type Slide = { src: string; title: string; caption: string };

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cross-fading image carousel that auto-advances, pausing on hover or when motion is reduced. */
export function HeroSlideshow({ slides, interval = 4500 }: { slides: Slide[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), interval);
    return () => window.clearInterval(timer);
  }, [paused, interval, slides.length]);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-blue-900/15"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`}
          aria-hidden={index !== active}
        >
          <Image
            src={slide.src}
            alt={slide.title}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 560px, 100vw"
            className={`object-cover transition-transform duration-[6000ms] ease-out ${index === active ? "scale-105" : "scale-100"}`}
          />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent p-5 pt-16 text-white">
        <p key={active} className="animate-fade-up text-base font-semibold">
          {slides[active].title}
        </p>
        <p key={`${active}-caption`} className="animate-fade-up text-xs text-white/80 [animation-delay:80ms]">
          {slides[active].caption}
        </p>
        <div className="mt-3 flex gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show ${slide.title}`}
              aria-current={index === active}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Fades children up the first time they scroll into view. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`${visible ? "motion-safe:animate-fade-up" : "motion-safe:opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

/** Endless horizontal strip of services; the list is rendered twice so the loop is seamless. */
export function ServiceMarquee({ services }: { services: ServiceItem[] }) {
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <ul className="flex w-max gap-4 motion-safe:animate-marquee group-hover:[animation-play-state:paused]">
        {[...services, ...services].map((service, index) => (
          <li
            key={`${service.id}-${index}`}
            aria-hidden={index >= services.length}
            className="flex w-64 shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm shadow-slate-900/[0.03]"
          >
            <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image src={service.image} alt="" fill sizes="80px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">{service.name}</span>
              <span className="block text-xs text-slate-500">From {service.priceLabel}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-500 md:text-base">{subtitle}</p> : null}
    </div>
  );
}
