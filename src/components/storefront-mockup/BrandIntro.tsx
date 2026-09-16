"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import "./brand-intro.css";

const SESSION_KEY = "wo1-full-scene-v5";

export default function BrandIntro({ children }: { children: ReactNode }) {
  const section = useRef<HTMLElement>(null);

  const play = () => {
    const node = section.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    node.dataset.loading = "false";
    node.dataset.complete = "false";
    node.dataset.playing = "false";
    // Restart the same sequence without changing the resting layout.
    void node.offsetWidth;
    node.dataset.playing = "true";
  };

  useLayoutEffect(() => {
    let cancelled = false;
    let visited = false;
    try { visited = sessionStorage.getItem(SESSION_KEY) === "seen"; } catch { /* Optional storage. */ }
    if (!visited && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (section.current) section.current.dataset.loading = "true";
      const images = Array.from(section.current?.querySelectorAll("img") || []);
      Promise.allSettled(images.map(image => image.decode())).then(() => {
        if (cancelled) return;
        play();
        try { sessionStorage.setItem(SESSION_KEY, "seen"); } catch { /* Optional storage. */ }
      });
    }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => { if (preference.matches && section.current) { section.current.dataset.playing = "false"; section.current.dataset.loading = "false"; } };
    preference.addEventListener("change", stop);
    return () => { cancelled = true; preference.removeEventListener("change", stop); };
  }, []);

  return (
    <section ref={section} className="wo-cinematic" aria-label="WON OF ONE collection"
      onAnimationEnd={event => {
        // Retain the filled final poses. Only retire the offscreen overlay;
        // removing every animation here can cause a compositor reset.
        if (event.animationName === "wo-scene-settle" && section.current) section.current.dataset.complete = "true";
      }}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}><defs><filter id="wo-white-mark" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.2126 -0.7152 -0.0722 0 1" /><feComposite in2="SourceGraphic" operator="in" /></filter></defs></svg>
      <div className="wo-scene-photo"><Image src="/brand/indo-padel.jpg" alt="Aerial view of padel courts surrounded by tropical palms" fill sizes="100vw" priority /><div className="wo-scene-shade" /></div>
      {children}
      <button className="wo-replay" onClick={play} aria-label="Replay introduction">↻</button>
      <div className="wo-cinema-layers" aria-hidden="true">
        <div className="wo-cinema-layer wo-layer-navy"><div><Image src="/brand/intro-navy-detail.png" alt="" fill sizes="100vw" priority /></div></div>
        <div className="wo-cinema-layer wo-layer-white"><div><Image src="/brand/intro-white-apparel.png" alt="" fill sizes="100vw" priority /></div></div>
        <div className="wo-cinema-layer wo-layer-campaign"><div><Image src="/brand/court-campaign-concept.png" alt="" fill sizes="100vw" priority /></div></div>
      </div>
    </section>
  );
}
