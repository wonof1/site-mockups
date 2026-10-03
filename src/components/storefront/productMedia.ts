type Variant = { name: string; image: string };
type ProductPhoto = { src: string; label: string };

// Apparel models are men's only; accessories have their own shared photography.
const modelColourways: Record<string, { colour: string; folder: string; front?: string; suffix?: string; department?: string }> = {
  "court-tee": { colour: "Navy", folder: "court-tee/navy" },
  "wordmark-tee": { colour: "Black", folder: "wordmark-tee/black" },
  "court-shorts": { colour: "Navy", folder: "court-shorts/navy" },
  "wordmark-sweatpants": { colour: "Black", folder: "wordmark-wide-leg-pants/black" },
  "cuffed-joggers": { colour: "Navy", folder: "cuffed-joggers/navy", front: "front-v2" },
  "logo-sweatpants": { colour: "Black", folder: "logo-wide-leg-pants/black", front: "front-v2" },
  "logo-quarter-zip": { colour: "Forest", folder: "logo-quarter-zip/forest", suffix: "-identity-v3" },
  "stripe-quarter-zip": { colour: "Beige", folder: "stripe-quarter-zip/beige", suffix: "-identity-v3" },
  "logo-sweatshirt": { colour: "Burgundy", folder: "logo-sweatshirt/burgundy" },
  "stripe-sweatshirt": { colour: "Grey", folder: "stripe-sweatshirt/grey", suffix: "-plain-v6" },
  "court-cap": { colour: "Navy", folder: "court-cap/navy", department: "accessories" },
  "logo-cap": { colour: "Beige", folder: "logo-cap/beige", front: "front-identity-v3", department: "accessories" },
  "court-visor": { colour: "Forest", folder: "court-visor/forest", front: "front-identity-v4", department: "accessories" },
  "crew-socks": { colour: "White", folder: "crew-socks/white", department: "accessories" },
};

export function modelVariantIndex(id: string, department: string, variants: Variant[]) {
  const model = modelColourways[id];
  if (!model || department !== (model.department || "men")) return 0;
  return Math.max(0, variants.findIndex(v => v.name === model.colour));
}

export function modelCrop(id: string) {
  if (["court-cap", "logo-cap", "court-visor"].includes(id)) return { scale: 1.65, origin: "6%" };
  if (id === "crew-socks") return { scale: 2.1, origin: "95%" };
  if (id === "court-shorts") return { scale: 2.35, origin: "64%" };
  if (["wordmark-sweatpants", "cuffed-joggers", "logo-sweatpants"].includes(id)) return { scale: 1.7, origin: "94%" };
  return { scale: 2.3, origin: "24%" };
}

export function productPhotos(id: string, department: string, variant: Variant): ProductPhoto[] {
  const model = modelColourways[id];
  if (!model || department !== (model.department || "men") || model.colour !== variant.name) {
    return [{ src: variant.image, label: "Product" }];
  }
  return ["Front", "Side", "Back"].map(label => ({
    src: `/storefront/models/${model.folder}/${label === "Front" && model.front ? model.front : label.toLowerCase() + (model.suffix || "")}.webp`,
    label,
  }));
}
