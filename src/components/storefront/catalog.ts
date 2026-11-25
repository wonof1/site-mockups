import { launchStyles } from "./launch-styles";

export const departments = ["men", "women", "unisex"] as const;
export type Department = (typeof departments)[number];

const categories: Record<(typeof launchStyles)[number]["id"], string> = {
  m01: "T-shirts", m02: "Shorts", m03: "Shorts", m04: "Shorts", m05: "Quarter-zips",
  w01: "T-shirts", w02: "T-shirts", w03: "Tanks", w04: "Tanks", w05: "Sweatpants",
  w06: "Jackets", w07: "Leggings", w08: "Leggings", u01: "T-shirts", u02: "T-shirts",
};

// Two styles ship in two branding treatments. Only M02's hem placement is
// verified (README cross-reference), so the others name the mark alone.
const treatments: Partial<Record<(typeof launchStyles)[number]["id"], { mark: string; detail: string }>> = {
  m02: { mark: "WON OF ONE wordmark", detail: "Full WON OF ONE wordmark on the front hem" },
  m03: { mark: "WO1 logo", detail: "WO1 logo treatment" },
  w03: { mark: "WON OF ONE wordmark", detail: "WON OF ONE wordmark treatment" },
  w04: { mark: "WO1 logo", detail: "WO1 logo treatment" },
};

export const catalogue = launchStyles.map(style => ({
  id: style.slug, name: style.name, category: categories[style.id], audience: style.group,
  price: style.priceMinor, variants: style.colours, treatment: treatments[style.id],
}));
export type Product = (typeof catalogue)[number];
export type Variant = Product["variants"][number];

/** "photo" = verified front/back photography; everything else must stay labelled. */
export type PhotoStatus = "photo" | "preview" | "placeholder";
export function photoStatus(variant: Variant): PhotoStatus {
  if ("backImage" in variant && typeof variant.backImage === "string") return "photo";
  return variant.image.includes("colour-preview") ? "preview" : "placeholder";
}
export function backImage(variant: Variant) {
  return "backImage" in variant && typeof variant.backImage === "string" ? variant.backImage : undefined;
}
export const photoStatusLabel: Record<PhotoStatus, string> = {
  photo: "", preview: "Colour preview", placeholder: "Placeholder image",
};

export function isDepartment(value: string): value is Department {
  return departments.some(dept => dept === value);
}

export function validProductDepartment(product: Product, department: string) {
  return isDepartment(department) &&
    (product.audience === "Unisex" || product.audience.toLowerCase() === department);
}

export function departmentProducts(department: Department) {
  return catalogue.filter(p => validProductDepartment(p, department));
}

export function departmentCategories(department: Department) {
  return [...new Set(departmentProducts(department).map(p => p.category))];
}

export const formatPrice = (minor: number) => new Intl.NumberFormat("en-CA", {
  style: "currency", currency: "CAD", currencyDisplay: "code",
}).format(minor / 100);
