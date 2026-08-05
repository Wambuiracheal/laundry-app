import type { Service } from "@/utils/servicesApi";

const IMAGE_BY_KEYWORD: Array<{ keyword: string; imageSrc: string }> = [
  { keyword: "wash", imageSrc: "/mobile/wash-fold.svg" },
  { keyword: "dry", imageSrc: "/mobile/dry-cleaning.svg" },
  { keyword: "household", imageSrc: "/mobile/household.svg" },
  { keyword: "linen", imageSrc: "/mobile/household.svg" },
  { keyword: "shoe", imageSrc: "/mobile/shoes.svg" },
  { keyword: "iron", imageSrc: "/mobile/iron-only.svg" },
  { keyword: "white", imageSrc: "/mobile/white-bright.svg" },
  { keyword: "bright", imageSrc: "/mobile/white-bright.svg" },
];

const ACCENTS = [
  "linear-gradient(120deg, #dcfce7 0%, #bbf7d0 45%, #86efac 100%)",
  "linear-gradient(120deg, #e0f2fe 0%, #bae6fd 45%, #7dd3fc 100%)",
  "linear-gradient(120deg, #ede9fe 0%, #ddd6fe 45%, #c4b5fd 100%)",
  "linear-gradient(120deg, #fef3c7 0%, #fde68a 45%, #fcd34d 100%)",
];

export type ServiceDisplay = {
  imageSrc?: string;
  accent: string;
};

export function getServiceDisplay(name: string, index: number): ServiceDisplay {
  const normalized = name.toLowerCase();
  const match = IMAGE_BY_KEYWORD.find(({ keyword }) => normalized.includes(keyword));

  return {
    imageSrc: match?.imageSrc,
    accent: ACCENTS[index % ACCENTS.length],
  };
}

const PRICE_UNIT_LABEL: Record<string, string> = {
  per_kg: "kg",
  per_item: "item",
  per_pair: "pair",
};

export function formatServicePrice(service: Pick<Service, "price_type" | "base_price">): string {
  if (!service.base_price) return "—";

  const amount = `$${Number(service.base_price).toFixed(2)}`;
  const unit = service.price_type ? PRICE_UNIT_LABEL[service.price_type] : undefined;

  return unit ? `${amount} / ${unit}` : amount;
}
