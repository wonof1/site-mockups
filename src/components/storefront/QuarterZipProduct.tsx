"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { modelVariantIndex, productPhotos } from "./productMedia";

type Variant = { name: string; image: string; hex: string };
type Props = {
  id: string; name: string; department: string; variants: Variant[]; colourIndex: number;
  chooseColour: (index: number) => void; returnTo: string; returnLabel: string; category: string;
};

export function QuarterZipProduct({ id, name, department, variants, colourIndex, chooseColour, returnTo, returnLabel, category }: Props) {
  const [mode, setMode] = useState<"product" | "model">("product");
  const [zoomed, setZoomed] = useState<string | null>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const current = variants[colourIndex];
  const fullViewIndex = modelVariantIndex(id, department, variants);
  const referencePhotos = productPhotos(id, department, current);
  const modelPhotos = referencePhotos.length > 1 ? referencePhotos : [
    { src: `/storefront/quarter-zip-carousel/${id}-${colourIndex}.webp`, label: "Front" },
  ];
  const photos = mode === "model" ? modelPhotos : [{ src: current.image, label: "Product" }];
  const hasModel = department === "men";

  function returnToGallery() {
    requestAnimationFrame(() => {
      // Avoid collapsing a tall gallery underneath the reader when switching views.
      const top = gallery.current?.getBoundingClientRect().top;
      if (top !== undefined && top < 80) window.scrollBy({ top: top - 88, behavior: "instant" });
    });
  }
  function changeMode(next: "product" | "model") { setMode(next); setZoomed(null); returnToGallery(); }
  function changeColour(index: number) { chooseColour(index); setZoomed(null); returnToGallery(); }
  function showAngle(label: string) {
    gallery.current?.querySelector<HTMLElement>(`[data-angle="${label}"]`)?.scrollIntoView({ block: "start", behavior: (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduced")) ? "instant" : "smooth" });
  }

  return <div className="product-layout qz-product-layout">
    <div className="product-title"><Link className="product-back" href={returnTo}>← {returnLabel}</Link><h1>{name}</h1></div>
    <div className="qz-product-gallery" ref={gallery} id="quarterzip-gallery">
      {photos.map((photo, index) => <figure key={`${mode}:${photo.src}`} data-angle={photo.label}>
        <button type="button" className={`gallery qz-product-photo${zoomed === photo.src ? " is-zoomed" : ""}`} onClick={() => setZoomed(zoomed === photo.src ? null : photo.src)} aria-label={`${zoomed === photo.src ? "Reduce" : "Enlarge"} ${name}, ${current.name}, ${photo.label.toLowerCase()} view`} aria-pressed={zoomed === photo.src}>
          <img src={photo.src} alt={`${name}, ${current.name}, ${mode === "model" ? "on model, " : ""}${photo.label.toLowerCase()} view`} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
        </button>
        {photos.length > 1 && <figcaption>{photo.label}</figcaption>}
      </figure>)}
    </div>
    <div className="product-info">
      <p className="chosen">{current.name}</p>
      <div className="swatches" aria-label={`${name} colours`}>{variants.map((variant, index) => <button key={variant.name} className="swatch" aria-label={variant.name} aria-pressed={colourIndex === index} style={{ "--colour": variant.hex } as CSSProperties} onClick={() => changeColour(index)}><i /></button>)}</div>
      {hasModel && <div className="qz-view-mode" role="group" aria-label="Photography" aria-controls="quarterzip-gallery">
        <button type="button" aria-pressed={mode === "product"} onClick={() => changeMode("product")}>Product only</button>
        <button type="button" aria-pressed={mode === "model"} onClick={() => changeMode("model")}>On model</button>
      </div>}
      {mode === "model" && <nav className="qz-angle-links" aria-label="Model angles">
        {photos.length > 1 ? photos.map(photo => <button key={photo.label} onClick={() => showAngle(photo.label)}>{photo.label}</button>) : <button onClick={() => changeColour(fullViewIndex)}>Front, side &amp; back in {variants[fullViewIndex].name} ↗</button>}
      </nav>}
      <Link className="category-link" href={category}>All quarter-zips →</Link>
    </div>
  </div>;
}
