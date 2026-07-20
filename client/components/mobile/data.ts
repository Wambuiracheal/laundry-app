export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  unit: string;
  tag: string;
  tone: "blue" | "green" | "amber";
};

export const serviceItems: ServiceItem[] = [
  {
    id: "wash-fold",
    name: "Wash & Fold",
    description: "Everyday wear, sheets, and towels. Price per KG.",
    priceLabel: "$2.50 / kg",
    unit: "kg",
    tag: "Bag included",
    tone: "blue",
  },
  {
    id: "dry-clean",
    name: "Dry Clean",
    description: "Suits, dresses, and delicate fabrics. Price per item.",
    priceLabel: "$5.00 / item",
    unit: "item",
    tag: "Panda-Care",
    tone: "green",
  },
  {
    id: "household",
    name: "Household",
    description: "Comforters, blankets, and large curtains.",
    priceLabel: "$12.00 / item",
    unit: "item",
    tag: "Oversized",
    tone: "amber",
  },
  {
    id: "shoes",
    name: "Shoes",
    description: "Deep cleaning for sneakers and leather boots.",
    priceLabel: "$8.50 / pair",
    unit: "pair",
    tag: "Premium care",
    tone: "blue",
  },
  {
    id: "iron-only",
    name: "Iron Only",
    description: "Steam pressing for shirts and professional attire.",
    priceLabel: "$1.50 / item",
    unit: "item",
    tag: "Steam finish",
    tone: "green",
  },
  {
    id: "white-bright",
    name: "White & Bright",
    description: "Special whitening treatment for whites. No bleach used.",
    priceLabel: "$1.00 / kg",
    unit: "kg",
    tag: "Eco-friendly",
    tone: "amber",
  },
];
