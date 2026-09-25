import { OrdersIcon, PlusIcon } from "@/components/mobile/icons";
import { FirstName } from "@/components/mobile/SessionUser";
import { AppShell, Badge, PageHeading, SectionHeader, SoftCard, primaryButtonClass } from "@/components/mobile/primitives";
import Image from "next/image";
import Link from "next/link";
import { serviceItems } from "@/components/mobile/data";

const recentOrders = [
  { id: "#8821", service: "Dry Cleaning", detail: "4 items", amount: "$32.50", status: "Processing", tone: "green" },
  { id: "#8819", service: "Wash & Fold", detail: "8 kg", amount: "$18.00", status: "Out for delivery", tone: "blue" },
] as const;

const popularServices = serviceItems.filter((item) => ["wash-fold", "dry-clean", "iron-only", "shoes"].includes(item.id));

export function CustomerDashboardScreen() {
  return (
    <AppShell active="home">
      <PageHeading
        title={
          <>
            Hello, <FirstName />!
          </>
        }
        subtitle="Your laundry is our priority today."
        action={
          <Link href="/new-order" className={`${primaryButtonClass} max-sm:hidden`}>
            <PlusIcon className="h-4 w-4" />
            New Order
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
        <div className="col-span-2 rounded-2xl bg-[linear-gradient(140deg,#2563eb,#1d4ed8_55%,#1e40af)] p-4 text-white shadow-lg shadow-blue-700/20 md:col-span-1 lg:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-100">Next pickup</p>
          <p className="mt-1 text-lg font-semibold lg:text-xl">Tomorrow, 09:00 AM</p>
          <span className="mt-3 inline-flex rounded-full bg-white/15 px-2.5 py-0.5 text-xs">Home (Primary)</span>
        </div>
        <SoftCard className="lg:p-5">
          <p className="text-xs font-medium text-slate-500">Active orders</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 lg:text-2xl">2</p>
          <p className="text-xs text-blue-700">ongoing</p>
        </SoftCard>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 lg:p-5">
          <p className="text-xs font-medium text-emerald-800">Panda points</p>
          <p className="mt-1 text-xl font-semibold text-emerald-900 lg:text-2xl">450</p>
          <p className="text-xs text-emerald-700">pts available</p>
        </div>
      </section>

      <Link href="/new-order" className={`${primaryButtonClass} mt-4 w-full sm:hidden`}>
        <PlusIcon className="h-4 w-4" />
        New Order
      </Link>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <section>
          <SectionHeader title="Recent orders" href="/order-tracking" />
          <div className="space-y-2.5">
            {recentOrders.map((order) => (
              <Link key={order.id} href="/order-tracking" className="block">
                <SoftCard className="flex items-center gap-3 transition hover:border-slate-300">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <OrdersIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Order {order.id}</p>
                    <p className="truncate text-xs text-slate-500">
                      {order.service} · {order.detail}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold">{order.amount}</p>
                    <Badge text={order.status} tone={order.tone} />
                  </div>
                </SoftCard>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Popular services" href="/new-order" linkLabel="Browse" />
          <div className="grid grid-cols-2 gap-3">
            {popularServices.map((service) => (
              <Link
                key={service.id}
                href="/new-order"
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300"
              >
                <div className="relative h-20 overflow-hidden">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">{service.name}</p>
                  <p className="text-xs text-slate-500">From {service.priceLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
