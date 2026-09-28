import { notFound } from "next/navigation";
import Storefront from "@/components/storefront/Storefront";
import catalogue from "@/components/storefront/catalogue.json";

export default async function ShopPage({ params }: { params: Promise<{ shop: string[] }> }) {
  const result = await params;
  const shop = result.shop.map(segment => { try { return decodeURIComponent(segment); } catch { return segment; } });
  const [page, selection, id] = shop;
  const categories = new Set(catalogue.filter(p => !p.limited && p.category !== "Accessories").map(p => p.category));
  const validCollection = ["men", "women"].includes(page) && shop.length <= 2 && (!selection || categories.has(selection));
  const validAccessories = page === "accessories" && shop.length === 1;
  const validLimited = page === "limited" && shop.length <= 2 && (!selection || catalogue.some(p => p.limited && p.player === selection));
  const validProduct = page === "product" && shop.length === 3 && catalogue.some(p => p.id === id && (p.limited ? selection === "limited" : p.category === "Accessories" ? selection === "accessories" : ["men", "women"].includes(selection)));
  if (!validCollection && !validAccessories && !validLimited && !validProduct) notFound();
  return <Storefront />;
}
