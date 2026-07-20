import Link from "next/link";

const screens = [
  { href: "/", label: "Landing Page" },
  { href: "/new-order", label: "New Order - Select Services" },
  { href: "/customer-dashboard", label: "Customer Dashboard" },
  { href: "/order-tracking", label: "Order Tracking" },
  { href: "/dark-dashboard", label: "Dark Dashboard" },
  { href: "/login", label: "Login Screen" },
  { href: "/support", label: "Support Placeholder" },
  { href: "/forgot-password", label: "Forgot Password Placeholder" },
  { href: "/reschedule", label: "Reschedule Placeholder" },
  { href: "/cancel-pickup", label: "Cancel Pickup Placeholder" },
  { href: "/cancel-order", label: "Cancel Order Placeholder" },
];

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f1f5f9_55%,#f8fafc_100%)] px-4 py-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Panda Laundry</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Screen Preview Hub</h1>
        <p className="mt-2 text-sm text-slate-600">Open any screen below to review the mobile and landing designs.</p>

        <ul className="mt-6 space-y-3">
          {screens.map((screen) => (
            <li key={screen.href}>
              <Link
                href={screen.href}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
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
