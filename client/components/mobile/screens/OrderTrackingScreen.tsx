import { BellIcon, CheckIcon, ShareIcon } from "@/components/mobile/icons";
import { AppShell, Badge, PageHeading, SoftCard, primaryButtonClass, secondaryButtonClass } from "@/components/mobile/primitives";
import Link from "next/link";

const timeline = [
  { title: "Order Placed", detail: "We\'ve received your laundry request.", time: "09:15 AM", done: true },
  { title: "Picked Up", detail: "Panda Courier has collected your items.", time: "10:45 AM", done: true },
  { title: "Processing", detail: "Your clothes are being professionally cleaned.", time: "In progress", done: true, active: true },
  { title: "Out for Delivery", detail: "Ready for transit to your doorstep.", time: "", done: false },
  { title: "Delivered", detail: "Order safely returned to your home.", time: "", done: false },
];

export function OrderTrackingScreen() {
  return (
    <AppShell active="orders" title="Track Order" backHref="/customer-dashboard" backLabel="Dashboard">
      <PageHeading
        title="Order #PL-8821"
        subtitle="Placed today at 09:15 AM"
        action={
          <button className={`${secondaryButtonClass} px-3 py-2`} type="button">
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
        }
      />

      {/* Desktop: details on the left, progress timeline pinned to the right column */}
      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_auto_1fr] lg:gap-6 lg:space-y-0">
        <section className="flex h-40 items-end rounded-2xl border border-slate-200/80 bg-slate-100 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[18px_18px] p-3 md:h-52 lg:h-64 lg:p-4">
          <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <BellIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-slate-500">Arriving in</p>
              <p className="text-sm font-semibold">12 – 18 mins</p>
            </div>
          </div>
        </section>

        <SoftCard className="lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Premium Wash & Fold</h2>
              <p className="text-sm text-slate-500">3 bags · Standard fresh scent</p>
            </div>
            <Badge text="Processing" tone="green" />
          </div>
          <hr className="my-3 border-slate-100" />
          <p className="text-xs text-slate-500">Estimated delivery</p>
          <p className="text-base font-semibold text-blue-700">Today, 5:30 PM – 6:00 PM</p>
        </SoftCard>

        <SoftCard className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start lg:p-5">
          <h2 className="text-base font-semibold">Track progress</h2>
          <ol className="mt-4">
            {timeline.map((step, index) => (
              <li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
                {index < timeline.length - 1 ? (
                  <span className={`absolute bottom-0 left-3.5 top-8 w-px ${step.done && !step.active ? "bg-blue-600" : "bg-slate-200"}`} />
                ) : null}
                <span
                  className={`relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    step.done
                      ? step.active
                        ? "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100"
                        : "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {step.done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="pt-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className={`text-sm font-semibold ${step.active ? "text-blue-700" : step.done ? "text-slate-900" : "text-slate-500"}`}>
                      {step.title}
                    </p>
                    {step.time ? <span className="text-xs text-slate-400">{step.time}</span> : null}
                  </div>
                  <p className="text-xs text-slate-500">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </SoftCard>

        <div className="grid grid-cols-2 gap-3 lg:self-start">
          <Link href="/support" className={primaryButtonClass}>
            Contact Support
          </Link>
          <Link href="/cancel-order" className={secondaryButtonClass}>
            Cancel Order
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
