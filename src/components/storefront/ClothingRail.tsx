"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import catalogue from "./catalogue.json";
import { GarmentVolume } from "./GarmentVolume";
import { GarmentModel } from "./GarmentModel";
import { useStorePreferences } from "./StorePreferences";

// Collar anchors measured in the source images. Front/back photos have different
// padding, so each view is registered to the hanger, rather than its image box.
const collection = [
  { id: "wordmark-tee", colour: 3, size: [1200, 785], collars: [[336.5, 60], [870.5, 61]] },
  { id: "court-tee", colour: 0, size: [1200, 867], collars: [[316, 54], [878, 54]] },
  { id: "logo-sweatshirt", colour: 4, size: [800, 977], collars: [[401.5, 54]] },
  { id: "wordmark-tee", colour: 5, size: [1200, 785], collars: [[334.5, 60], [866.5, 60]] },
  { id: "logo-quarter-zip", colour: 2, size: [617, 700], collars: [[303.5, 47]] },
  { id: "stripe-quarter-zip", colour: 4, size: [573, 700], collars: [[286, 59]] },
  { id: "logo-sweatshirt", colour: 5, size: [800, 910], collars: [[400, 42]] },
  { id: "wordmark-tee", colour: 0, size: [1200, 781], collars: [[334.5, 64], [869.5, 64]] },
].map(item => ({ ...item, product: catalogue.find(p => p.id === item.id)! }));

function Hanger() {
  return <svg className="clothes-hanger" viewBox="0 0 280 74" fill="none" aria-hidden="true">
    <path d="M140 28V17c0-5 10-5 10-11 0-7-13-7-13 0" stroke="currentColor" strokeWidth="1.8" />
    <path d="m140 25-68 30c-5 3-3 7 2 7h132c5 0 7-4 2-7L140 25Z" fill="#ab8c66" stroke="#806748" strokeWidth="1.4" />
    <path d="m86 54 54-24 54 24" stroke="#d4bb99" strokeWidth="2" />
  </svg>;
}

export function ClothingRail() {
  const [selected, setSelected] = useStorePreferences();
  const [active, setActive] = useState<number | null>(null);
  const [last, setLast] = useState<number | null>(() => selected.homeClothingRail ?? null);
  const [back, setBack] = useState(false);
  const [width, setWidth] = useState(1100);
  const [moving, setMoving] = useState(true);
  const hoverIntent = useRef<{ index: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  function cancelHover() {
    if (hoverIntent.current) clearTimeout(hoverIntent.current.timer);
    hoverIntent.current = null;
  }
  useEffect(() => () => cancelHover(), []);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(section, { amount: .15 });
  const reduce = useReducedMotion();
  const garmentWidth = width < 950 ? 230 : 280;
  const slot = Math.min(125, (width - 140) / collection.length);
  const start = (width - slot * collection.length) / 2;
  const item = last === null ? null : collection[last];
  const motionTransition = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 115, damping: 24, mass: .85 };

  useEffect(() => {
    if (!track.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(track.current);
    return () => observer.disconnect();
  }, []);

  function select(i: number, centre = false, reveal = true) {
    if (i !== last) setBack(false);
    setActive(reveal ? i : null); setLast(i);
    const next = collection[i];
    setSelected(previous => previous[next.id] === next.colour && previous.homeClothingRail === i ? previous : { ...previous, [next.id]: next.colour, homeClothingRail: i });
    if (centre && viewport.current) viewport.current.scrollTo({ left: start + (i + .5) * slot - viewport.current.clientWidth / 2, behavior: reduce ? "instant" : "smooth" });
  }

  function step(direction: number) {
    const next = ((last ?? (direction > 0 ? -1 : 0)) + direction + collection.length) % collection.length;
    select(next, true, matchMedia("(hover: none)").matches);
  }

  return <section ref={section} className="clothing-rail" aria-labelledby="clothing-rail-title" data-moving={moving && inView && !reduce} onPointerLeave={() => setActive(null)}>
    <div className="rail-heading"><h2 id="clothing-rail-title">The collection</h2><nav aria-label="Shop the collection"><Link href="/men">Men ↗</Link><Link href="/women">Women ↗</Link></nav></div>
    <div ref={viewport} className="rail-viewport">
      <div ref={track} className="rail-track" role="group" aria-label="Browse hanging garments" onPointerLeave={() => setActive(null)}>
        <div className="clothes-bar" aria-hidden="true" />
        {collection.map((entry, i) => {
          const chosen = active === i;
          const colour = entry.product.variants[entry.colour];
          const paired = entry.collars.length === 2;
          const cutout = entry.product.category === "Quarter-zips";
          const src = cutout ? `/storefront/quarter-zip-carousel/cutout-${entry.id}-${entry.colour}.webp` : `/storefront/clothing-rail/${entry.id}-${entry.colour}.webp`;
          const angle = chosen ? (back && paired ? 180 : 0) : 52;
          const spread = active === null || chosen ? 0 : (i < active ? -1 : 1) * (garmentWidth - slot) * .48;
          return <button key={`${entry.id}-${entry.colour}`} ref={el => { buttons.current[i] = el; }} type="button" className="rail-item" aria-label={`${entry.product.name}, ${colour.name}`} aria-pressed={chosen} tabIndex={i === (last ?? 0) ? 0 : -1}
            style={{ left: start + i * slot, width: slot, zIndex: chosen ? 10 : collection.length - i }}
            onPointerMove={event => {
              if (event.pointerType !== "mouse" || active === i || hoverIntent.current?.index === i) return;
              cancelHover();
              hoverIntent.current = { index: i, timer: setTimeout(() => { hoverIntent.current = null; select(i); }, 80) };
            }}
            onPointerLeave={event => { if (event.pointerType === "mouse") { cancelHover(); setActive(current => current === i ? null : current); } }}
            onFocus={event => { if (event.currentTarget.matches(":focus-visible")) select(i, true); }}
            onBlur={() => setActive(current => current === i ? null : current)}
            onClick={event => select(i, true, event.detail === 0 || matchMedia("(hover: none)").matches || event.currentTarget.matches(":hover"))}
            onKeyDown={event => { const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0; if (event.key === "Escape") { setActive(null); return; } if (!direction) return; event.preventDefault(); const next = (i + direction + collection.length) % collection.length; select(next, true); buttons.current[next]?.focus({ preventScroll: true }); }}>
            {/* Stable hit areas keep moving images from triggering new pointer enters. */}
            <motion.span className="rail-turn" style={{ width: garmentWidth, left: (slot - garmentWidth) / 2 }} initial={false} animate={{ x: spread }} transition={motionTransition}>
              <span className="rail-sway" style={{ animationDelay: `${i * -.6}s` }}>
                <motion.span className="rail-hanger-turn" initial={false} animate={{ rotateY: angle }} transition={motionTransition}><Hanger /></motion.span>
                <span className="rail-face" data-rail-visible={last === i}>
                  {i === 3 ? <GarmentModel model="/storefront/clothing-rail/ghost-middle-three/green-tee/garment.glb" fallback="/storefront/clothing-rail/ghost-middle-three/green-tee/front.png" angle={angle} reduced={!!reduce} /> : <GarmentVolume src={src} size={entry.size} collars={entry.collars} angle={angle} reduced={!!reduce} />}
                </span>
              </span>
            </motion.span>
          </button>;
        })}
      </div>
    </div>
    <div className="rail-caption">
      <button className="rail-arrow" aria-label="Previous garment" onClick={() => step(-1)}>←</button>
      <div className="rail-description">{item && <><p aria-live="polite">{item.product.name}<span>{item.product.variants[item.colour].name}</span></p><div className="rail-actions">{item.collars.length === 2 && <button onClick={() => setBack(value => !value)} aria-label={back ? "Show garment front" : "Show garment back"}>{back ? "Front" : "Back"} ↻</button>}<Link data-rail-product href={`/product/men/${item.id}`}>View product ↗</Link></div></>}</div>
      <button className="rail-arrow" aria-label="Next garment" onClick={() => step(1)}>→</button>
    </div>
    {!reduce && <button className="rail-motion" aria-label={moving ? "Pause hanger motion" : "Resume hanger motion"} onClick={() => setMoving(value => !value)}>{moving ? "Ⅱ" : "▷"}</button>}
  </section>;
}
