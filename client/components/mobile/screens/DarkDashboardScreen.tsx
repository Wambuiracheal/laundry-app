import { BellIcon, HomeIcon, OrdersIcon, PlusIcon, ProfileIcon, ServiceIcon } from "@/components/mobile/icons";
import { Badge, MobileBottomNav, MobileLayout, SoftCard } from "@/components/mobile/primitives";
import Link from "next/link";

export function DarkDashboardScreen() {
  return (
    <MobileLayout dark>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[linear-gradient(140deg,#1d4ed8,#0ea5e9)]" />
          <p className="text-xl font-semibold">Panda Laundry</p>
        </div>
        <div className="flex items-center gap-3">
          <BellIcon className="h-6 w-6 text-slate-300" />
          <div className="h-9 w-9 rounded-full border border-slate-500 bg-[linear-gradient(140deg,#334155,#0f172a)]" />
        </div>
      </header>

      <section>
        <h1 className="text-5xl font-semibold tracking-tight text-blue-100">Welcome back, Alex</h1>
        <p className="mt-2 text-lg text-slate-300">Your laundry is in expert hands today.</p>
      </section>

      <SoftCard dark>
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-semibold text-blue-100">Active Order</h2>
          <Badge text="Processing" tone="blue" />
        </div>
        <p className="mt-1 text-base text-slate-300">Order #PL-8821 • Wash & Fold</p>

        <div className="my-4 flex items-center justify-between text-sm text-slate-300">
          <span className="rounded-full bg-blue-600 px-3 py-1">Picked Up</span>
          <span className="rounded-full bg-blue-500/60 px-3 py-1">Cleaning</span>
          <span className="rounded-full border border-blue-500 px-3 py-1">Drying</span>
          <span className="rounded-full border border-slate-600 px-3 py-1">Delivery</span>
        </div>

        <p className="text-2xl font-semibold text-blue-100">Estimated Delivery: Today, 6:00 PM</p>
        <Link href="/order-tracking" className="mt-4 inline-block rounded-xl bg-blue-700 px-5 py-2 text-lg font-semibold">
          Track Driver
        </Link>
      </SoftCard>

      <div className="mt-4">
        <SoftCard dark>
        <p className="text-4xl font-semibold text-blue-100">Next Pickup</p>
        <p className="mt-2 text-xl">Tomorrow, Oct 24</p>
        <p className="text-lg text-slate-300">Window: 08:00 AM - 10:00 AM</p>
        <Link href="/reschedule" className="mt-4 block w-full rounded-xl border border-blue-700 px-4 py-2 text-center text-lg text-blue-300">
          Reschedule
        </Link>
        <Link href="/cancel-pickup" className="mt-2 block w-full rounded-xl border border-slate-600 px-4 py-2 text-center text-lg text-slate-300">
          Cancel Pickup
        </Link>
        </SoftCard>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {["Dry Clean", "Wash & Fold", "Ironing", "Rush Order"].map((name) => (
          <section key={name} className="rounded-2xl border border-slate-700 bg-[#162338] p-4 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[#22364f]" />
            <p className="text-lg font-semibold">{name}</p>
          </section>
        ))}
      </section>

      <SoftCard dark>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-4xl font-semibold text-blue-100">Recent Orders</h2>
          <Link href="/order-tracking" className="text-lg text-blue-300">
            See All
          </Link>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-sm uppercase text-slate-400">
            <tr>
              <th className="pb-2">Order ID</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Service</th>
              <th className="pb-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">#PL-8790</td>
              <td>Oct 20, 2023</td>
              <td>Wash & Fold</td>
              <td>$32.50</td>
            </tr>
            <tr>
              <td className="py-2">#PL-8752</td>
              <td>Oct 15, 2023</td>
              <td>Dry Cleaning</td>
              <td>$18.00</td>
            </tr>
          </tbody>
        </table>
      </SoftCard>

      <Link href="/new-order" className="fixed bottom-24 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-[0_10px_20px_rgba(29,78,216,0.4)]" aria-label="Create order">
        <PlusIcon className="h-6 w-6" />
      </Link>

      <MobileBottomNav
        dark
        items={[
          { label: "Home", icon: <HomeIcon className="h-5 w-5" />, active: true, href: "/dark-dashboard" },
          { label: "Services", icon: <ServiceIcon className="h-5 w-5" />, href: "/new-order" },
          { label: "Orders", icon: <OrdersIcon className="h-5 w-5" />, href: "/order-tracking" },
          { label: "Profile", icon: <ProfileIcon className="h-5 w-5" />, href: "/login" },
        ]}
      />
    </MobileLayout>
  );
}
