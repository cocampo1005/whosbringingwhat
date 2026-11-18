// Presentational colours/icons for item categories. Display only: never written to data.
import iconMains from "../assets/brand/icons/icon-mains.svg";
import iconSides from "../assets/brand/icons/icon-sides.svg";
import iconDessert from "../assets/brand/icons/icon-dessert.svg";
import iconDrinks from "../assets/brand/icons/icon-drinks.svg";
import iconMisc from "../assets/brand/icons/icon-misc.svg";

// Keys are the category strings stored on items.
export const CATEGORY_THEME = {
  Main: {
    key: "main", label: "Main", icon: iconMains,
    bold: "#FF4C43", bar: "#FF7069", pastel: "#FF9B91", tint: "#FFE9E6", accent: "#C2382E",
  },
  Side: {
    key: "side", label: "Side", icon: iconSides,
    bold: "#42D072", bar: "#68D98E", pastel: "#8FE2AC", tint: "#E6F8EE", accent: "#197C42",
  },
  Dessert: {
    key: "dessert", label: "Dessert", icon: iconDessert,
    bold: "#F8CA49", bar: "#F9D56D", pastel: "#FFE194", tint: "#FEF6E2", accent: "#8F6910",
  },
  Beverage: {
    key: "beverage", label: "Beverage", icon: iconDrinks,
    bold: "#A968FC", bar: "#BA86FD", pastel: "#C9A7F5", tint: "#F1E9FE", accent: "#7B3FD4",
  },
  Miscellaneous: {
    key: "misc", label: "Miscellaneous", icon: iconMisc,
    bold: "#FF73BD", bar: "#FF8FCA", pastel: "#FEABD7", tint: "#FFEAF5", accent: "#BD377F",
  },
};

export const CATEGORY_ORDER = ["Main", "Side", "Dessert", "Beverage", "Miscellaneous"];

const ALIASES = {
  main: "Main", mains: "Main", entree: "Main", entrees: "Main",
  side: "Side", sides: "Side",
  dessert: "Dessert", desserts: "Dessert",
  beverage: "Beverage", beverages: "Beverage", drink: "Beverage", drinks: "Beverage",
  misc: "Miscellaneous", miscellaneous: "Miscellaneous", other: "Miscellaneous", others: "Miscellaneous",
};

/** Tolerant lookup (case-insensitive, singular/plural, aliases); falls back to Miscellaneous. */
export function getCategoryTheme(name) {
  const key = String(name ?? "").trim().toLowerCase();
  return CATEGORY_THEME[ALIASES[key] || "Miscellaneous"];
}

export const EVENT_BANNER_PASTELS = [
  "#FF9B91", "#8FE2AC", "#FFE194", "#C9A7F5", "#FEABD7", "#C9D6F5",
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Display-only pastel for an event without an image. Ignores the stored `bannerColor`. */
export function eventBannerPastel(event) {
  const seed = String(event?.id ?? event?.title ?? "");
  return EVENT_BANNER_PASTELS[hashString(seed) % EVENT_BANNER_PASTELS.length];
}

export const AVATAR_FILLS = [
  "#FEABD7", "#C9A7F5", "#FF9B91", "#8FE2AC", "#FFE194", "#42D072",
];

export function avatarFill(seed) {
  return AVATAR_FILLS[hashString(String(seed ?? "")) % AVATAR_FILLS.length];
}
