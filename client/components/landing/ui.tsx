import Image from "next/image";

export function ServiceCard({
  title,
  price,
  imageSrc,
  imageAlt,
  accent,
}: {
  title: string;
  price: string;
  imageSrc?: string;
  imageAlt?: string;
  accent: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div
        className="relative flex h-28 items-center justify-center overflow-hidden text-4xl"
        style={{
          background: accent,
        }}
      >
        {imageSrc ? <Image src={imageSrc} alt={imageAlt ?? title} fill className="object-cover" /> : null}
      </div>
      <div className="p-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-cyan-700">From {price}</p>
      </div>
    </article>
  );
}
