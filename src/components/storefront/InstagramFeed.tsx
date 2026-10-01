"use client";

import { useEffect, useRef, useState } from "react";
import posts from "./instagram.json";

export function InstagramFeed() {
  const track = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const hovering = useRef(false), focused = useRef(false), visible = useRef(false);
  const [paused, setPaused] = useState(false);
  const move = (direction: number) => {
    const el = track.current;
    if (!el) return;
    const step = (el.firstElementChild?.getBoundingClientRect().width || 280) + 6;
    const max = el.scrollWidth - el.clientWidth;
    const next = direction > 0 && el.scrollLeft >= max - 3 ? 0 : direction < 0 && el.scrollLeft <= 3 ? max : Math.min(max, Math.max(0, el.scrollLeft + direction * step));
    el.scrollTo({ left: next, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; }, { threshold: .25 });
    if (section.current) observer.observe(section.current);
    const el = track.current;
    if (!el) { observer.disconnect(); return; }
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let loopWidth = 0, position = el.scrollLeft, last = 0, frame = 0;
    const measure = () => {
      const first = el.children[0] as HTMLElement;
      const repeat = el.children[posts.length] as HTMLElement;
      loopWidth = repeat.offsetLeft - first.offsetLeft;
      position = el.scrollLeft;
    };
    const resize = new ResizeObserver(measure);
    resize.observe(el); measure();
    const tick = (now: number) => {
      const elapsed = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (!paused && visible.current && !hovering.current && !focused.current && !document.hidden && !preference.matches && !document.documentElement.classList.contains("reduced") && loopWidth > 0) {
        // Keep fractional pixels across frames for an even, refresh-rate-independent glide.
        position = (position + elapsed * .025) % loopWidth;
        el.scrollLeft = position;
      } else position = el.scrollLeft;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { observer.disconnect(); resize.disconnect(); cancelAnimationFrame(frame); };
  }, [paused]);
  return <section ref={section} className="instagram-section" aria-labelledby="instagram-title" aria-roledescription="carousel" onPointerEnter={() => { hovering.current = true; }} onPointerLeave={() => { hovering.current = false; }} onFocusCapture={() => { focused.current = true; }} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) focused.current = false; }}>
    <div className="instagram-heading">
      <h2 id="instagram-title"><a href="https://www.instagram.com/wo1_padel/" target="_blank" rel="noopener noreferrer">@wo1_padel <span aria-hidden="true">↗</span></a></h2>
      <div className="instagram-actions"><a href="https://www.instagram.com/wo1_padel/" target="_blank" rel="noopener noreferrer">Follow on Instagram</a><div className="instagram-arrows"><button className="instagram-pause" aria-label={paused ? "Play Instagram carousel" : "Pause Instagram carousel"} onClick={() => setPaused(p => !p)}>{paused ? "Play" : "Pause"}</button><button aria-label="Previous Instagram posts" onClick={() => { setPaused(true); move(-1); }}>←</button><button aria-label="Next Instagram posts" onClick={() => { setPaused(true); move(1); }}>→</button></div></div>
    </div>
    <div className="instagram-track instagram-continuous" ref={track} onTouchStart={() => setPaused(true)} onWheel={e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) setPaused(true); }}>
      {[...posts, ...posts].map((post, index) => <a key={post.href + index} aria-hidden={index >= posts.length ? true : undefined} tabIndex={index >= posts.length ? -1 : undefined} href={post.href} target="_blank" rel="noopener noreferrer" className="instagram-post" aria-label={`${post.alt}, view on Instagram`}><img src={post.image} alt={post.alt} width={640} height={800} loading="lazy" decoding="async" /><span className="instagram-open" aria-hidden="true">View on Instagram ↗</span></a>)}
    </div>
  </section>;
}
