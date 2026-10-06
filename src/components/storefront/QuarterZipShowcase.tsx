"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import catalogue from "./catalogue.json";
import { useStorePreferences } from "./StorePreferences";

const styles = catalogue.filter(p => p.category === "Quarter-zips" && !p.limited);
const count = styles[0].variants.length;
const wrap = (position: number) => ((position % count) + count) % count;
const directory = "/storefront/quarter-zip-carousel/";
const modelSource = (style: number, position: number) => `${directory}${styles[style].id}-${wrap(position)}.webp`;
const cutoutSource = (style: number, position: number) => `${directory}cutout-${styles[style].id}-${wrap(position)}.webp`;
const stylePreference = "quarterZipCarouselStyle";
type Look = { style: number; position: number };
type Phase = "idle" | "scrolling" | "putting-on" | "reveal";

export function QuarterZipShowcase({ department }: { department: string }) {
  const [selected, setSelected] = useStorePreferences();
  const initialStyle = selected[stylePreference] ?? 0;
  const [cursor, setCursor] = useState<Look>({ style: initialStyle, position: selected[styles[initialStyle].id] ?? 0 });
  const [worn, setWorn] = useState(cursor);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [floating, setFloating] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fit, setFit] = useState({ scale: .72, y: -55 });
  const stage = useRef<HTMLDivElement>(null);
  const model = useRef<HTMLAnchorElement>(null);
  const garment = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { amount: .15 });
  const requested = useRef(cursor);
  const request = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const wheel = useRef({ delta: 0, last: 0, changed: 0 });
  const reduce = useReducedMotion();
  const product = styles[cursor.style];
  const colour = product.variants[wrap(cursor.position)];

  useEffect(() => {
    const sources = [directory + "base-model.webp", ...styles.flatMap((p, style) => p.variants.flatMap((_, i) => [modelSource(style, i), cutoutSource(style, i)]))];
    sources.forEach(src => { const image = new Image(); image.src = src; void image.decode().catch(() => {}); });
    return () => { request.current++; };
  }, []);

  useEffect(() => {
    if (!run) return;
    if (reduce) { setWorn(cursor); setPhase("idle"); return; }
    // The whole rail arrives first; only then does its centre garment get put on.
    const dress = window.setTimeout(() => setPhase("putting-on"), 1020);
    const reveal = window.setTimeout(() => { setWorn(cursor); setPhase("reveal"); }, 1290);
    const finish = window.setTimeout(() => setPhase("idle"), 1700);
    return () => { clearTimeout(dress); clearTimeout(reveal); clearTimeout(finish); };
  }, [run, cursor, reduce]);

  async function choose(style: number, position: number) {
    if (style === requested.current.style && position === requested.current.position) return;
    requested.current = { style, position };
    const ticket = ++request.current;
    setLoading(true); setError(false);
    try {
      await Promise.all([modelSource(style, position), directory + "base-model.webp", ...[-1, 0, 1].map(offset => cutoutSource(style, position + offset))].map(src => {
        const image = new Image(); image.src = src; return image.decode();
      }));
      if (ticket !== request.current) return;
      const person = model.current?.getBoundingClientRect();
      const frame = stage.current?.getBoundingClientRect();
      const width = garment.current?.offsetWidth;
      if (person && frame && width) setFit({ scale: person.width * .41 / width, y: person.height * .335 - frame.height * .44 });
      setPhase(reduce ? "idle" : "scrolling");
      setCursor({ style, position });
      setRun(ticket);
      setSelected(s => ({ ...s, [stylePreference]: style, [styles[style].id]: wrap(position) }));
    } catch {
      if (ticket === request.current) { requested.current = cursor; setError(true); }
    } finally { if (ticket === request.current) setLoading(false); }
  }

  function move(step: number) { void choose(requested.current.style, requested.current.position + step); }
  function chooseColour(i: number) {
    const current = requested.current;
    let delta = i - wrap(current.position);
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    void choose(current.style, current.position + delta);
  }

  return <div className="qz-showcase">
    <div className="qz-style-tabs" role="group" aria-label="Quarter-zip styles">
      {styles.map((p, i) => <button key={p.id} aria-pressed={cursor.style === i} onClick={() => void choose(i, requested.current.position)}>{p.name}</button>)}
    </div>
    <div ref={stage} className="qz-stage" data-phase={phase} data-floating={floating && inView && !reduce && phase === "idle"} role="region" aria-roledescription="carousel" aria-label="Try quarter-zip colours" aria-busy={loading} tabIndex={0}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); move(e.key === "ArrowLeft" ? -1 : 1); } }}
      onWheel={e => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        const now = performance.now();
        if (now - wheel.current.changed < 420) return;
        if (now - wheel.current.last > 150) wheel.current.delta = 0;
        wheel.current.last = now;
        wheel.current.delta += e.deltaX;
        if (Math.abs(wheel.current.delta) > 35) { move(wheel.current.delta > 0 ? 1 : -1); wheel.current = { delta: 0, last: now, changed: now }; }
      }}
      onPointerDown={e => { dragged.current = false; e.currentTarget.dataset.swiped = "false"; if ((e.target as HTMLElement).closest(".qz-arrow,.qz-motion-toggle,.qz-colours,.qz-open")) return; start.current = { x: e.clientX, y: e.clientY }; }}
      onPointerCancel={() => { start.current = null; }}
      onPointerLeave={() => { start.current = null; }}
      onPointerUp={e => { const from = start.current; start.current = null; if (from && Math.abs(e.clientX - from.x) > 40 && Math.abs(e.clientX - from.x) > Math.abs(e.clientY - from.y) * 1.5) { dragged.current = true; e.currentTarget.dataset.swiped = "true"; move(e.clientX < from.x ? 1 : -1); } }}
      onClickCapture={e => { if (dragged.current) { dragged.current = false; e.preventDefault(); e.stopPropagation(); } }}>
      <Link ref={model} draggable={false} className="qz-model" href={`/product/${department}/${product.id}`} data-quarterzip-product data-busy={phase !== "idle" || loading} aria-label={`View ${colour.name} ${product.name}`}>
        <img className="qz-base" src={`${directory}base-model.webp`} alt="" draggable={false} />
        <motion.img key={modelSource(worn.style, worn.position)} className="qz-worn" src={modelSource(worn.style, worn.position)}
          alt={`Model wearing the ${styles[worn.style].variants[wrap(worn.position)].name} ${styles[worn.style].name}`} draggable={false} fetchPriority="high"
          initial={run && !reduce ? { opacity: 0 } : false} animate={{ opacity: phase === "scrolling" || phase === "putting-on" ? 0 : 1 }}
          transition={{ duration: reduce ? 0 : phase === "scrolling" ? .18 : .36 }} />
      </Link>
      <div className="qz-rail" aria-label="Floating quarter-zips">
        {Array.from({ length: 9 }, (_, i) => cursor.position + i - 4).map(position => {
          const offset = position - cursor.position;
          const v = product.variants[wrap(position)];
          const centre = offset === 0;
          const wearing = centre && phase !== "scrolling";
          const visible = Math.abs(offset) <= 2;
          return <motion.div key={`${product.id}-${position}`} ref={centre ? garment : undefined} className="qz-rail-item"
            initial={false} animate={{ x: `${offset * 110 - 50}%`, opacity: visible ? 1 : 0, rotate: offset * -4 }}
            transition={{ duration: reduce ? 0 : .82, ease: [.22, 1, .36, 1] }} style={{ zIndex: centre ? 4 : 3 - Math.abs(offset) }}>
            <motion.div className="qz-try-on" initial={false} animate={{ scale: wearing ? fit.scale : 1, y: wearing ? fit.y : 0, opacity: centre && (phase === "idle" || phase === "reveal") ? 0 : 1 }}
              transition={{ duration: reduce ? 0 : .42, ease: [.22, 1, .36, 1] }}>
              <button className="qz-garment" tabIndex={visible && !centre ? 0 : -1} aria-hidden={!visible || centre} aria-label={`Try ${v.name}`}
                style={{ pointerEvents: centre || !visible ? "none" : "auto" }} onClick={() => { stage.current?.focus({ preventScroll: true }); void choose(cursor.style, position); }}>
                <span className="qz-garment-float" style={{ animationDelay: `${wrap(position) * -.7}s` }}><img src={cutoutSource(cursor.style, position)} alt="" draggable={false} /></span>
              </button>
            </motion.div>
          </motion.div>;
        })}
      </div>
      {!reduce && <button className="qz-motion-toggle" aria-label={floating ? "Pause floating motion" : "Resume floating motion"} onClick={() => setFloating(value => !value)}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">{floating ? <><path d="M3 2h2v10H3z" /><path d="M9 2h2v10H9z" /></> : <path d="m4 2 8 5-8 5z" />}</svg>
      </button>}
      <button className="qz-arrow qz-prev" onClick={() => move(-1)} aria-label="Previous colour">←</button>
      <button className="qz-arrow qz-next" onClick={() => move(1)} aria-label="Next colour">→</button>
      <div className="qz-colours swatches" role="group" aria-label={`${product.name} colours`}>{product.variants.map((v, i) => <button key={v.name} className="swatch" aria-label={v.name} title={v.name} aria-pressed={wrap(cursor.position) === i} style={{ "--colour": v.hex } as CSSProperties} onClick={() => chooseColour(i)}><i /></button>)}</div>
      <Link className="qz-open" data-quarterzip-product data-busy={phase !== "idle" || loading} href={`/product/${department}/${product.id}`} aria-label={`View ${product.name}`} title="View product">↗</Link>
      <span className="qz-announcement" aria-live="polite" aria-atomic="true">{product.name}, {colour.name}</span>
    </div>
    {error && <p className="qz-error" role="alert">This colour couldn’t load. Please try again.</p>}
  </div>;
}
