import Link from "next/link";

const screens = [
  { href: "/", label: "Landing Page" },
  { href: "/new-order", label: "New Order - Select Services" },
  { href: "/customer-dashboard", label: "Customer Dashboard" },
  { href: "/order-tracking", label: "Order Tracking" },
  { href: "/dark-dashboard", label: "Dark Dashboard" },
  { href: "/login", label: "Login Screen" },
  { href: "/register", label: "Register Screen" },
  { href: "/support", label: "Support Placeholder" },
  { href: "/forgot-password", label: "Forgot Password Placeholder" },
  { href: "/reschedule", label: "Reschedule Placeholder" },
  { href: "/cancel-pickup", label: "Cancel Pickup Placeholder" },
  { href: "/cancel-order", label: "Cancel Order Placeholder" },
];

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f1f5f9_55%,#f8fafc_100%)] px-4 py-8">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Panda Laundry</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Screen Preview Hub</h1>
        <p className="mt-2 text-sm text-slate-600">Open any screen below. Every screen adapts from phone to desktop.</p>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {screens.map((screen) => (
            <li key={screen.href}>
              <Link
                href={screen.href}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
              >
                <span className="font-medium">{screen.label}</span>
                <span className="text-xs font-semibold uppercase tracking-wide">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
