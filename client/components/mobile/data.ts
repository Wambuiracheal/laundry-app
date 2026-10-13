export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  image: string;
  unit: string;
  tag: string;
  tone: "blue" | "green" | "amber";
};

export const serviceItems: ServiceItem[] = [
  {
    id: "wash-fold",
    image: "/services/wash-fold.svg",
    name: "Wash & Fold",
    description: "Everyday wear, sheets, and towels. Price per KG.",
    price: 200,
    priceLabel: "KES 200 / kg",
    unit: "kg",
    tag: "Bag included",
    tone: "blue",
  },
  {
    id: "dry-clean",
    image: "/services/dry-clean.svg",
    name: "Dry Clean",
    description: "Suits, dresses, and delicate fabrics. Price per item.",
    price: 900,
    priceLabel: "KES 900 / item",
    unit: "item",
    tag: "Panda-Care",
    tone: "green",
  },
  {
    id: "household",
    image: "/services/household.svg",
    name: "Household",
    description: "Comforters, blankets, and large curtains.",
    price: 1000,
    priceLabel: "KES 1,000 / item",
    unit: "item",
    tag: "Oversized",
    tone: "amber",
  },
  {
    id: "shoes",
    image: "/services/shoes.svg",
    name: "Shoes",
    description: "Deep cleaning for sneakers and leather boots.",
    price: 500,
    priceLabel: "KES 500 / pair",
    unit: "pair",
    tag: "Premium care",
    tone: "blue",
  },
  {
    id: "iron-only",
    image: "/services/iron-only.svg",
    name: "Iron Only",
    description: "Steam pressing for shirts and professional attire.",
    price: 150,
    priceLabel: "KES 150 / item",
    unit: "item",
    tag: "Steam finish",
    tone: "green",
  },
  {
    id: "white-bright",
    image: "/services/white-bright.svg",
    name: "White & Bright",
    description: "Special whitening treatment for whites. No bleach used.",
    price: 300,
    priceLabel: "KES 300 / kg",
    unit: "kg",
    tag: "Eco-friendly",
    tone: "amber",
  },
];
