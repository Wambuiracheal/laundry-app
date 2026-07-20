import Link from "next/link";

type ActionPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

export function ActionPlaceholderPage({
  eyebrow,
  title,
  description,
  backHref = "/preview",
  backLabel = "Back to Preview",
}: ActionPlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f1f5f9_55%,#f8fafc_100%)] px-4 py-10">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-slate-600">{description}</p>

        <div className="mt-6 flex gap-3">
          <Link
            href={backHref}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            {backLabel}
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
