import { formatDateTime, type ApiOrder, type DamageReport } from "@/utils/ordersApi";

/** House/gate details and rider directions, highlighted so riders and staff don't miss them. */
export function DeliveryInstructions({ order }: { order: Pick<ApiOrder, "house_details" | "delivery_instructions"> }) {
  if (!order.house_details && !order.delivery_instructions) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Delivery instructions</p>
      {order.house_details ? <p className="text-sm font-semibold">{order.house_details}</p> : null}
      {order.delivery_instructions ? <p className="whitespace-pre-line text-xs leading-5">{order.delivery_instructions}</p> : null}
    </div>
  );
}

/** Damage logged at intake, with photo thumbnails that open full size. */
export function DamageList({
  order,
  onDelete,
  busy = false,
}: {
  order: ApiOrder;
  /** Shop only: remove an entry logged by mistake. */
  onDelete?: (damage: DamageReport) => void;
  busy?: boolean;
}) {
  const damages = order.damages ?? [];
  if (damages.length === 0) return null;

  const itemName = (damage: DamageReport) =>
    order.orderItems.find((item) => item.id === damage.order_item_id)?.service.name ?? "Whole order";

  return (
    <ul className="space-y-2">
      {damages.map((damage) => (
        <li key={damage.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
          {damage.photo_url ? (
            <a href={damage.photo_url} target="_blank" rel="noreferrer" className="shrink-0" aria-label="Open damage photo">
              {/* Signed, short-lived Firebase URLs: next/image optimisation would only re-fetch them. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={damage.photo_url} alt={`Damage: ${damage.note}`} className="h-16 w-16 rounded-lg object-cover" />
            </a>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">
              {itemName(damage)} · {formatDateTime(damage.created_at)}
            </p>
            <p className="whitespace-pre-line text-sm text-slate-800">{damage.note}</p>
          </div>
          {onDelete ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(damage)}
              className="self-start text-xs font-semibold text-rose-700 hover:text-rose-800 disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
