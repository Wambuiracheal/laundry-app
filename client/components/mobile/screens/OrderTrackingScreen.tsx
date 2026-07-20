import { BackIcon, BellIcon, CheckIcon, HomeIcon, OrdersIcon, ProfileIcon, ServiceIcon, ShareIcon } from "@/components/mobile/icons";
import { Badge, MobileBottomNav, MobileLayout, SoftCard } from "@/components/mobile/primitives";
import Link from "next/link";

const timeline = [
  { title: "Order Placed", detail: "We\'ve received your laundry request.", time: "09:15 AM", done: true },
  { title: "Picked Up", detail: "Panda Courier has collected your items.", time: "10:45 AM", done: true },
  { title: "Processing", detail: "Your clothes are being professionally cleaned.", time: "In Progress", done: true, active: true },
  { title: "Out for Delivery", detail: "Ready for transit to your doorstep.", time: "", done: false },
  { title: "Delivered", detail: "Order safely returned to your home.", time: "", done: false },
];

export function OrderTrackingScreen() {
  return (
    <MobileLayout>
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-700">
          <Link href="/customer-dashboard" aria-label="Back to dashboard">
            <BackIcon className="h-6 w-6" />
          </Link>
          <p className="text-2xl font-semibold">Order #PL-8821</p>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <ShareIcon className="h-6 w-6" />
          <div className="h-9 w-9 rounded-full bg-[linear-gradient(140deg,#bfdbfe,#93c5fd)]" />
        </div>
      </header>

      <section className="mb-4 h-44 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mt-20 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-300 text-emerald-900">
            <BellIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg text-slate-500">Arriving in</p>
            <p className="text-xl font-semibold">12 - 18 mins</p>
          </div>
        </div>
      </section>

      <SoftCard>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Premium Wash & Fold</h2>
            <p className="text-lg text-slate-600">3 Bags • Standard Fresh Scent</p>
          </div>
          <Badge text="Processing" tone="green" />
        </div>
        <hr className="my-3 border-slate-200" />
        <p className="text-lg text-slate-500">Estimated Delivery</p>
        <p className="text-2xl font-semibold text-blue-700">Today, 5:30 PM - 6:00 PM</p>
      </SoftCard>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
        <h3 className="text-2xl font-semibold">Track Progress</h3>
        <div className="mt-4 space-y-4">
          {timeline.map((step, index) => (
            <div key={step.title} className="relative flex gap-3">
              {index < timeline.length - 1 ? <div className="absolute left-4 top-8 h-16 w-0.5 bg-blue-700/50" /> : null}
              <span
                className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs ${
                  step.done
                    ? step.active
                      ? "border-blue-700 bg-blue-100 text-blue-700"
                      : "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-300 bg-slate-100 text-slate-400"
                }`}
              >
                {step.done ? <CheckIcon className="h-4 w-4" /> : index + 1}
              </span>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <p className={`text-xl font-semibold ${step.active ? "text-blue-700" : "text-slate-800"}`}>{step.title}</p>
                  {step.time ? <span className="text-sm text-slate-500">{step.time}</span> : null}
                </div>
                <p className="text-base text-slate-500">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link href="/support" className="mt-4 block w-full rounded-xl bg-blue-700 px-4 py-3 text-center text-lg font-semibold text-white shadow-[0_10px_18px_rgba(29,78,216,0.35)]">
        Contact Support
      </Link>
      <Link href="/cancel-order" className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-semibold text-slate-600">
        Cancel Order
      </Link>

      <MobileBottomNav
        items={[
          { label: "Home", icon: <HomeIcon className="h-5 w-5" />, href: "/customer-dashboard" },
          { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, href: "/new-order" },
          { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, active: true, href: "/order-tracking" },
          { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, href: "/login" },
        ]}
      />
    </MobileLayout>
  );
}
