import { notFound } from "next/navigation";
import Storefront from "@/components/storefront/Storefront";
import { catalogue, departmentCategories, isDepartment, validProductDepartment } from "@/components/storefront/catalog";
import { buyingOptions } from "@/components/storefront/shopify";

export default async function ShopPage({ params }: { params: Promise<{ shop: string[] }> }) {
  const result = await params;
  const shop = result.shop.map(segment => { try { return decodeURIComponent(segment); } catch { return segment; } });
  const [page, selection, id] = shop;
  const validCollection = isDepartment(page) && shop.length <= 2 && (!selection || departmentCategories(page).includes(selection));
  const product = page === "product" && shop.length === 3 ? catalogue.find(p => p.id === id) : undefined;
  const validProduct = product && validProductDepartment(product, selection);
  if (!validCollection && !validProduct) notFound();
  const options = product?.price ? await buyingOptions(product.id, product.price) : [];
  return <Storefront buyOptions={options} />;
}
