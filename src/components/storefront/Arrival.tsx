"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import assets from "./assets.json";
import { easeInOut } from "./motion";

// 2.8s total: the mark holds ~1s, then settles into the header as the film opens up.
const INTRO_MS = 2800;


export default function Arrival() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (!root.dataset.arrival) return;
    if (pathname !== "/") { delete root.dataset.arrival; return; }
    let cancelled = false;
    let finishTimer: ReturnType<typeof setTimeout>;
    let frame = 0;
    const animations: Animation[] = [];
    const finish = () => {
      cancelled = true;
      clearTimeout(finishTimer);
      cancelAnimationFrame(frame);
      delete root.dataset.arrival;
      animations.forEach(animation => animation.cancel());
      const skip = document.getElementById("skip-arrival");
      if (document.activeElement === skip) document.getElementById("main")?.focus({ preventScroll: true });
    };
    const keyboard = (e: KeyboardEvent) => { if (["Escape", "Tab", "ArrowDown", "PageDown", " "].includes(e.key)) finish(); };
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { if (preference.matches) finish(); };
    const logo = document.querySelector<HTMLImageElement>(".arrival-logo");
    const target = document.querySelector<HTMLImageElement>(".header .brand img");
    const backdrop = document.querySelector<HTMLElement>(".arrival-backdrop");
    const hero = document.querySelector<HTMLElement>(".hero");
    let waitTimer: ReturnType<typeof setTimeout>;
    Promise.race([logo?.decode().catch(() => {}), new Promise<void>(resolve => { waitTimer = setTimeout(resolve, 800); })]).then(() => {
      clearTimeout(waitTimer);
      if (cancelled || !logo || !target || !backdrop) return;
      frame = requestAnimationFrame(() => {
        if (window.scrollY > 10) { finish(); return; }
        const rect = target.getBoundingClientRect();
        const scale = Math.min(260, innerWidth * .48) / rect.width;
        const dx = innerWidth / 2 - (rect.x + rect.width / 2);
        const dy = innerHeight / 2 - (rect.y + rect.height / 2);
        Object.assign(logo.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` });
        root.dataset.arrival = "playing";
        if (hero) {
          const restingHeight = hero.getBoundingClientRect().height;
          animations.push(hero.animate([
            { height: `${window.innerHeight}px` },
            { height: `${restingHeight}px` }
          ], { duration: 1500, delay: INTRO_MS - 1500, easing: easeInOut, fill: "both" }));
        }
        const motion = logo.animate([
          { opacity: 0, transform: `translate(${dx}px,${dy + 16}px) scale(${scale * .9})`, offset: 0 },
          { opacity: 1, transform: `translate(${dx}px,${dy}px) scale(${scale})`, offset: .24 },
          { opacity: 1, transform: `translate(${dx}px,${dy}px) scale(${scale})`, offset: .36 },
          { opacity: 1, transform: "translate(0,0) scale(1)", offset: 1 }
        ], { duration: INTRO_MS, easing: easeInOut, fill: "forwards" });
        animations.push(motion, backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1300, delay: 100, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }));
        void motion.finished.then(finish, () => {});
        finishTimer = setTimeout(finish, INTRO_MS + 400);
      });
    });
    document.addEventListener("keydown", keyboard);
    window.addEventListener("resize", finish);
    document.addEventListener("wheel", finish, { passive: true });
    document.addEventListener("touchmove", finish, { passive: true });
    document.addEventListener("wo1:skip-arrival", finish);
    preference.addEventListener("change", change);
    return () => {
      // Before playback starts (e.g. StrictMode's mount/unmount/mount), keep the
      // "waiting" state for the next run; route changes clear it above.
      if (root.dataset.arrival === "playing") finish();
      else { cancelled = true; clearTimeout(finishTimer); cancelAnimationFrame(frame); }
      clearTimeout(waitTimer);
      document.removeEventListener("keydown", keyboard);
      window.removeEventListener("resize", finish);
      document.removeEventListener("wheel", finish);
      document.removeEventListener("touchmove", finish);
      document.removeEventListener("wo1:skip-arrival", finish);
      preference.removeEventListener("change", change);
    };
  }, [pathname]);
  return <div className="arrival" aria-label="WON OF ONE introduction">
    <div className="arrival-backdrop" aria-hidden="true" />
    <img className="arrival-logo" src={assets.logo} alt="" aria-hidden="true" />
    <button id="skip-arrival" className="arrival-skip" onClick={() => document.dispatchEvent(new Event("wo1:skip-arrival"))}>Skip intro ↗</button>
  </div>;
}
