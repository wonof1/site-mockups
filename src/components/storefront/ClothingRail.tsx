"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { scrollBehavior } from "./motion";

// Survives the round trip to a product page so Back lands on the same garment.
let savedScroll = 0;

type Position = { first: number; last: number; start: boolean; end: boolean };

export function ClothingRail({ children, title, summary, count }: { children: ReactNode; title: string; summary: ReactNode; count: number }) {
  const track = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<Position>({ first: 1, last: 1, start: true, end: false });

  useLayoutEffect(() => {
    const el = track.current;
    if (el && savedScroll) el.scrollLeft = savedScroll;
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = el.getBoundingClientRect();
        const cards = Array.from(el.children) as HTMLElement[];
        const visible = cards.map((card, index) => ({ rect: card.getBoundingClientRect(), index }))
          .filter(({ rect }) => rect.left >= box.left - 2 && rect.right <= box.right + 2);
        const max = el.scrollWidth - el.clientWidth;
        const next: Position = {
          first: (visible[0]?.index ?? 0) + 1,
          last: (visible.at(-1)?.index ?? 0) + 1,
          start: el.scrollLeft <= 2,
          end: el.scrollLeft >= max - 2,
        };
        section.current?.style.setProperty("--rail-progress", String(max > 0 ? el.scrollLeft / max : 1));
        section.current?.style.setProperty("--rail-window", String(Math.min(1, el.clientWidth / el.scrollWidth)));
        savedScroll = el.scrollLeft;
        setPosition(p => p.first === next.first && p.last === next.last && p.start === next.start && p.end === next.end ? p : next);
      });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    return () => { cancelAnimationFrame(frame); el.removeEventListener("scroll", measure); resize.disconnect(); };
  }, []);

  // Page by whole cards: "next" brings the first partly hidden card to the start.
  function page(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const inset = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const visibleCount = Math.max(1, position.last - position.first + 1);
    const index = direction > 0 ? Math.min(cards.length - 1, position.last) : Math.max(0, position.first - 1 - visibleCount);
    const target = cards[index];
    if (target) el.scrollTo({ left: target.offsetLeft - inset, behavior: scrollBehavior() });
  }

  return <section ref={section} className="launch-rail" aria-labelledby="launch-rail-title" data-start={position.start} data-end={position.end}>
    <div className="rail-heading">
      <div>
        <h2 id="launch-rail-title">{title}</h2>
        <p className="rail-summary">{summary}</p>
      </div>
      <div className="launch-rail-controls">
        <span className="rail-count" aria-hidden="true">{position.first === position.last ? position.first : `${position.first}–${position.last}`} / {count}</span>
        <button className="round-control" aria-label="Previous products" aria-disabled={position.start} onClick={() => { if (!position.start) page(-1); }}><ArrowLeft aria-hidden="true" size={18} strokeWidth={1.5} /></button>
        <button className="round-control" aria-label="Next products" aria-disabled={position.end} onClick={() => { if (!position.end) page(1); }}><ArrowRight aria-hidden="true" size={18} strokeWidth={1.5} /></button>
      </div>
    </div>
    <div className="launch-rail-track" ref={track}>{children}</div>
    <div className="rail-progress" aria-hidden="true"><span /></div>
  </section>;
}
