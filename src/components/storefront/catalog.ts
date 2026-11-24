import { launchStyles } from "./launch-styles";

export const departments = ["men", "women", "unisex"] as const;
export type Department = (typeof departments)[number];

const categories: Record<(typeof launchStyles)[number]["id"], string> = {
  m01: "T-shirts", m02: "Shorts", m03: "Shorts", m04: "Shorts", m05: "Quarter-zips",
  w01: "T-shirts", w02: "T-shirts", w03: "Tanks", w04: "Tanks", w05: "Sweatpants",
  w06: "Jackets", w07: "Leggings", w08: "Leggings", u01: "T-shirts", u02: "T-shirts",
};

export const catalogue = launchStyles.map(style => ({
  id: style.slug, name: style.name, category: categories[style.id], audience: style.group,
  price: style.priceMinor, variants: style.colours,
}));
export type Product = (typeof catalogue)[number];

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
