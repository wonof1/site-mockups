"use client";

import { useEffect, useId, useRef } from "react";

/** Codrops-style trailing outline: no badge, label, or replacement pointer. */
export default function EditorialCursor() {
  const svg = useRef<SVGSVGElement>(null);
  const circle = useRef<SVGCircleElement>(null);
  const noise = useRef<SVGFETurbulenceElement>(null);
  const filterId = `cursor-warp-${useId().replaceAll(":", "")}`;

  useEffect(() => {
    const allowed = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const node = svg.current;
    const ring = circle.current;
    if (!node || !ring) return;
    let frame = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0, radius = 12, targetRadius = 12;
    let lastTime = 0, rippleStart = -Infinity, active = false, entered = false;
    const render = (now: number) => {
      const dt = lastTime ? Math.min(now - lastTime, 50) : 16.67;
      lastTime = now;
      const blend = 1 - Math.pow(.8, dt / 16.67);
      x += (targetX - x) * blend; y += (targetY - y) * blend;
      radius += (targetRadius - radius) * blend;
      node.style.transform = `translate3d(${x - 120}px,${y - 120}px,0)`;
      ring.setAttribute("r", String(radius));
      const progress = Math.min(1, (now - rippleStart) / 400);
      if (progress < 1) {
        ring.style.filter = `url(#${filterId})`;
        noise.current?.setAttribute("baseFrequency", String(.09 * Math.pow(1 - progress, 2)));
      } else ring.style.filter = "none";
      if (Math.abs(targetX-x) + Math.abs(targetY-y) + Math.abs(targetRadius-radius) > .05 || progress < 1) frame = requestAnimationFrame(render);
      else { frame = 0; lastTime = 0; }
    };
    const hide = () => { node.style.opacity = "0"; entered = false; if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
    const move = (event: PointerEvent) => {
      if (!allowed.matches || event.pointerType !== "mouse") { hide(); return; }
      const target = event.target as HTMLElement;
      if (!target.closest(".wo-store") || target.closest("input,textarea,select")) { hide(); return; }
      targetX = event.clientX; targetY = event.clientY;
      if (!entered) { x = targetX; y = targetY; entered = true; }
      const overLink = !!target.closest("a,button,summary");
      if (overLink && !active) rippleStart = performance.now();
      if (!overLink) rippleStart = -Infinity;
      active = overLink;
      targetRadius = overLink ? 18 : 12;
      node.style.opacity = "1";
      if (!frame) frame = requestAnimationFrame(render);
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    allowed.addEventListener("change", hide);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      allowed.removeEventListener("change", hide);
    };
  }, [filterId]);

  return <svg ref={svg} className="wo-cursor" aria-hidden="true" width="240" height="240" viewBox="0 0 240 240">
    <defs><filter id={filterId} x="-50%" y="-50%" width="200%" height="200%"><feTurbulence ref={noise} type="fractalNoise" baseFrequency="0" numOctaves="1" result="warp" /><feOffset dx="-30" in="warp" result="offset" /><feDisplacementMap in="SourceGraphic" in2="offset" xChannelSelector="R" yChannelSelector="G" scale="5" /></filter></defs>
    <circle ref={circle} cx="120" cy="120" r="12" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>;
}
