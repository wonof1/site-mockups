import "server-only";

const shop = "https://11qqii-aa.myshopify.com";
const variantsQuery = `query LaunchVariants($handle: String!) @inContext(country: CA) {
  product(handle: $handle) {
    variants(first: 250) {
      nodes { id availableForSale selectedOptions { name value } price { amount currencyCode } }
    }
  }
}`;

type Variant = {
  id: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  price: { amount: string; currencyCode: string };
};
export type BuyOption = { colour: string; size: string; href: string };

export async function buyingOptions(handle: string, priceMinor: number): Promise<BuyOption[]> {
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!token) return [];
  try {
    const response = await fetch(`${shop}/api/2026-10/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({ query: variantsQuery, variables: { handle } }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const result = await response.json();
    const variants: Variant[] = result.data?.product?.variants.nodes ?? [];
    return variants.flatMap(v => {
      const id = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/.exec(v.id)?.[1];
      const colour = v.selectedOptions.find(o => /^(color|colour)$/i.test(o.name))?.value;
      const size = v.selectedOptions.find(o => /^size$/i.test(o.name))?.value;
      if (!id || !colour || !size || !v.availableForSale || v.price.currencyCode !== "CAD" ||
          Math.round(Number(v.price.amount) * 100) !== priceMinor) return [];
      return [{ colour, size, href: `${shop}/cart/${id}:1` }];
    });
  } catch {
    return [];
  }
}
