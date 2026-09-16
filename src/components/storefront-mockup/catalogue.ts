export const categories = {
  Men: ["T-shirts", "Shorts"],
  Women: ["T-shirts", "Skorts"],
};
export type Audience = keyof typeof categories;
export const sizes = ["XS", "S", "M", "L", "XL"];
export const colours = [
  { name: "Navy", hex: "#1d293f" },
  { name: "Red", hex: "#ae2426" },
  { name: "White", hex: "#f7f7f3" },
];
// Display crops of the supplied collaboration sheet, not final retail photography.
// Coordinates describe the unmodified 1328 × 880 source image.
export const products = [
  { id: "never-unnoticed-tee", name: "Court T-shirt", audience: "Men", category: "T-shirts", price: 0, crop: [44, 36, 250, 234], whiteCrop: [570, 36, 250, 234], description: "The men’s crew-neck tee. Example apparel photo; final product details will follow." },
  { id: "performance-shorts", name: "Court Shorts", audience: "Men", category: "Shorts", price: 0, crop: [61, 283, 223, 159], whiteCrop: [594, 282, 204, 164], description: "The men’s court short. Example apparel photo; final product details will follow." },
  { id: "womens-never-unnoticed-tee", name: "Court T-shirt", audience: "Women", category: "T-shirts", price: 0, crop: [64, 487, 216, 195], whiteCrop: [561, 482, 224, 200], description: "The women’s V-neck tee. Example apparel photo; final product details will follow." },
  { id: "womens-court-skort", name: "Court Skort", audience: "Women", category: "Skorts", price: 0, crop: [61, 697, 220, 136], whiteCrop: [560, 699, 237, 134], description: "The women’s court skort. Example apparel photo; final product details will follow." },
] as const;
export type Product = typeof products[number];
export const money = (price: number) => price === 0 ? "TBC" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(price);

// Concept colourways drawn from both user-supplied apparel sheets.
export const productColours = (product: Product) => colours.filter(colour => product.audience === "Men" || ["Navy", "White"].includes(colour.name));
export const productCrop = (product: Product, colour: string): [number, number, number, number] => {
  const col = { Blue: 0, Navy: 1, Red: 2, White: 3 }[colour] ?? 1;
  if (product.audience === "Men") return product.category === "T-shirts" ? [col * 362, 0, 362, 386] : [col * 362, 388, 362, 282];
  if (product.category === "T-shirts") return [colour === "White" ? 362 : 0, 674, 362, 360];
  return [colour === "White" ? 1086 : 724, 714, 362, 295];
};
