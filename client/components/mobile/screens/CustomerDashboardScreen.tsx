import { BellIcon, HomeIcon, OrdersIcon, PlusIcon, ProfileIcon, ServiceIcon } from "@/components/mobile/icons";
import { Badge, MobileBottomNav, MobileLayout, SoftCard } from "@/components/mobile/primitives";
import Link from "next/link";

export function CustomerDashboardScreen() {
  return (
    <MobileLayout>
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[linear-gradient(140deg,#bae6fd,#93c5fd)]" />
          <p className="text-2xl font-semibold text-blue-700">Panda Laundry</p>
        </div>
        <BellIcon className="h-6 w-6 text-slate-500" />
      </header>

      <section>
        <h1 className="text-5xl font-semibold tracking-tight">Hello, Sarah!</h1>
        <p className="mt-2 text-xl text-slate-600">Your laundry is our priority today.</p>
      </section>

      <section className="mt-5 rounded-2xl bg-blue-700 p-4 text-white shadow-[0_12px_26px_rgba(29,78,216,0.35)]">
        <p className="text-sm tracking-wide text-blue-100">NEXT PICKUP</p>
        <p className="mt-1 text-3xl font-semibold">Tomorrow, 09:00 AM</p>
        <div className="mt-2 inline-flex rounded-full bg-blue-500/70 px-3 py-1 text-base">Home (Primary)</div>
      </section>

      <section className="mt-3.5 grid grid-cols-2 gap-3">
        <SoftCard>
          <p className="text-lg text-slate-600">Active Orders</p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">02 Ongoing</p>
        </SoftCard>
        <section className="rounded-2xl border border-emerald-200 bg-emerald-300/85 p-4 shadow-[0_8px_20px_rgba(16,185,129,0.18)]">
          <p className="text-lg text-emerald-900">Panda Points</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">450 pts</p>
        </section>
      </section>

      <Link href="/new-order" className="mt-5 block w-full rounded-2xl bg-blue-700 px-4 py-3 text-center text-xl font-semibold text-white">
        New Order
      </Link>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">Recent Orders</h2>
          <Link href="/order-tracking" className="text-lg font-semibold text-blue-700">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          <SoftCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">Order #8821</p>
                <p className="text-lg text-slate-600">Dry Cleaning • 4 items</p>
              </div>
              <Badge text="PROCESSING" tone="green" />
            </div>
            <p className="mt-2 text-right text-2xl">$32.50</p>
          </SoftCard>

          <SoftCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">Order #8819</p>
                <p className="text-lg text-slate-600">Wash & Fold • 8kg</p>
              </div>
              <Badge text="OUT FOR DELIVERY" tone="blue" />
            </div>
            <p className="mt-2 text-right text-2xl">$18.00</p>
          </SoftCard>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <section className="h-36 rounded-2xl bg-[linear-gradient(140deg,#d1d5db,#6b7280)] p-3 text-white">
          <p className="mt-12 text-2xl font-semibold">Premium Wash</p>
          <p className="text-lg">From $2.50/kg</p>
        </section>
        <section className="h-36 rounded-2xl bg-[linear-gradient(140deg,#d6d3d1,#78716c)] p-3 text-white">
          <p className="mt-12 text-2xl font-semibold">Ironing</p>
          <p className="text-lg">From $1.00/pc</p>
        </section>
      </section>

      <Link
        href="/new-order"
        className="fixed bottom-24 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white"
      >
        <PlusIcon className="h-6 w-6" />
      </Link>

      <MobileBottomNav
        items={[
          { label: "Home", icon: <HomeIcon className="h-5 w-5" />, active: true, href: "/customer-dashboard" },
          { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, href: "/new-order" },
          { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, href: "/order-tracking" },
          { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, href: "/login" },
        ]}
      />
    </MobileLayout>
  );
}
