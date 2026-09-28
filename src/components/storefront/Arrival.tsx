"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import assets from "./assets.json";


export default function Arrival() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (!root.dataset.arrival) return;
    if (pathname !== "/") { delete root.dataset.arrival; return; }
    let cancelled = false;
    let finishTimer: ReturnType<typeof setTimeout>;
    let frame = 0;
    const finish = () => {
      cancelled = true;
      clearTimeout(finishTimer);
      cancelAnimationFrame(frame);
      delete root.dataset.arrival;
      root.style.removeProperty("--arrival-top");
      root.style.removeProperty("--arrival-stretch");
      const skip = document.getElementById("skip-arrival");
      if (document.activeElement === skip) document.getElementById("main")?.focus({ preventScroll: true });
    };
    const keyboard = (e: KeyboardEvent) => { if (["Escape", "Tab", "ArrowDown", "PageDown", " "].includes(e.key)) finish(); };
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { if (preference.matches) finish(); };
    const hero = document.querySelector<HTMLElement>(".hero");
    if (hero) {
      root.style.setProperty("--arrival-top", `${hero.offsetTop}px`);
      root.style.setProperty("--arrival-stretch", String(window.innerHeight / hero.offsetHeight));
    }
    const photo = new Image(); photo.src = assets.court;
    let waitTimer: ReturnType<typeof setTimeout>;
    Promise.race([photo.decode().catch(() => {}), new Promise<void>(resolve => { waitTimer = setTimeout(resolve, 500); })]).then(() => {
      clearTimeout(waitTimer);
      if (cancelled) return;
      frame = requestAnimationFrame(() => {
        root.dataset.arrival = "playing";
        finishTimer = setTimeout(finish, 3300);
      });
    });
    document.addEventListener("keydown", keyboard);
    document.addEventListener("wheel", finish, { passive: true });
    document.addEventListener("touchmove", finish, { passive: true });
    document.addEventListener("wo1:skip-arrival", finish);
    preference.addEventListener("change", change);
    return () => {
      finish(); clearTimeout(waitTimer);
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("wheel", finish);
      document.removeEventListener("touchmove", finish);
      document.removeEventListener("wo1:skip-arrival", finish);
      preference.removeEventListener("change", change);
    };
  }, [pathname]);
  return <div className="arrival" aria-label="WON OF ONE introduction">
    <div className="arrival-type" aria-hidden="true"><div className="arrival-word arrival-won">WON</div><div className="arrival-word arrival-of-one">OF ONE</div></div>
    <button id="skip-arrival" className="arrival-skip" onClick={() => document.dispatchEvent(new Event("wo1:skip-arrival"))}>Skip intro ↗</button>
  </div>;
}
