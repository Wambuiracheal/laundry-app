import { serviceItems } from "@/components/mobile/data";
import { PlusIcon } from "@/components/mobile/icons";
import { FirstName } from "@/components/mobile/SessionUser";
import { AppShell, Badge, PageHeading, SectionHeader, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import Image from "next/image";
import Link from "next/link";

const progress = [
  { label: "Picked up", state: "done" },
  { label: "Cleaning", state: "current" },
  { label: "Drying", state: "todo" },
  { label: "Delivery", state: "todo" },
] as const;

const quickServices = serviceItems.filter((item) => ["dry-clean", "wash-fold", "iron-only", "household"].includes(item.id));

const recentOrders = [
  { id: "#PL-8790", date: "Oct 20, 2023", service: "Wash & Fold", amount: "$32.50" },
  { id: "#PL-8752", date: "Oct 15, 2023", service: "Dry Cleaning", amount: "$18.00" },
];

export function DarkDashboardScreen() {
  return (
    <AppShell active="home" homeHref="/dark-dashboard" dark>
      <PageHeading
        dark
        title={
          <>
            Welcome back, <FirstName />
          </>
        }
        subtitle="Your laundry is in expert hands today."
        action={
          <Link href="/new-order" className={`${primaryButtonClass} shadow-none max-sm:hidden`}>
            <PlusIcon className="h-4 w-4" />
            New Order
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        <SoftCard dark className="lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-50">Active order</h2>
              <p className="text-xs text-slate-400">Order #PL-8821 · Wash & Fold</p>
            </div>
            <Badge text="Processing" tone="blue" />
          </div>

          <ol className="my-4 grid grid-cols-4 gap-1.5">
            {progress.map((step) => (
              <li key={step.label}>
                <span
                  className={`block h-1.5 rounded-full ${
                    step.state === "done" ? "bg-blue-500" : step.state === "current" ? "bg-blue-500/50" : "bg-slate-700"
                  }`}
                />
                <span className={`mt-1.5 block text-[11px] ${step.state === "todo" ? "text-slate-500" : "text-slate-300"}`}>{step.label}</span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">Estimated delivery</p>
              <p className="text-base font-semibold text-slate-50">Today, 6:00 PM</p>
            </div>
            <Link href="/order-tracking" className={`${primaryButtonClass} px-3 py-2 shadow-none`}>
              Track driver
            </Link>
          </div>
        </SoftCard>

        <SoftCard dark className="lg:p-5">
          <h2 className="text-base font-semibold text-slate-50">Next pickup</h2>
          <p className="mt-1 text-sm text-slate-200">Tomorrow, Oct 24</p>
          <p className="text-xs text-slate-400">Window: 08:00 AM – 10:00 AM</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/reschedule"
              className="rounded-xl border border-blue-500/40 px-3 py-2 text-center text-sm font-medium text-blue-300 transition hover:bg-blue-500/10"
            >
              Reschedule
            </Link>
            <Link
              href="/cancel-pickup"
              className="rounded-xl border border-slate-700 px-3 py-2 text-center text-sm font-medium text-slate-300 transition hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </SoftCard>
      </div>

      <Link href="/new-order" className={`${primaryButtonClass} mt-4 w-full shadow-none sm:hidden`}>
        <PlusIcon className="h-4 w-4" />
        New Order
      </Link>

      <section className="mt-6 lg:mt-8">
        <SectionHeader dark title="Quick services" href="/new-order" linkLabel="All services" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
          {quickServices.map((service) => (
            <Link
              key={service.name}
              href="/new-order"
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#111d31] p-3 transition hover:border-blue-500/50 lg:p-4"
            >
              <span className="relative h-10 w-12 shrink-0 overflow-hidden rounded-lg">
                <Image src={service.image} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="text-sm font-medium">{service.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 lg:mt-8">
        <SectionHeader dark title="Recent orders" href="/order-tracking" linkLabel="See all" />
        <SoftCard dark padding="p-0" className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Date</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium text-slate-100">{order.id}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{order.date}</td>
                  <td className="px-4 py-3">{order.service}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SoftCard>
      </section>
    </AppShell>
  );
}
