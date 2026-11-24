"use client";

import { useRef, type ReactNode } from "react";

export function ClothingRail({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  function scroll(direction: number) {
    const rail = track.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * rail.clientWidth,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return <section className="launch-rail" aria-labelledby="launch-rail-title">
    <div className="rail-heading">
      <h2 id="launch-rail-title">Collection 001</h2>
      <div className="launch-rail-controls">
        <button aria-label="Previous products" onClick={() => scroll(-1)}>←</button>
        <button aria-label="Next products" onClick={() => scroll(1)}>→</button>
      </div>
    </div>
    <div className="launch-rail-track" ref={track}>{children}</div>
  </section>;
}
