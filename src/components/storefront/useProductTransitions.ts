"use client";

import { useLayoutEffect, useRef, type MouseEvent } from "react";

type Router = { push: (href: string, options?: { scroll?: boolean }) => void };
type Pending = { href: string; arrive: () => void; cancel: () => void };
let pending: Pending | undefined;
const origins = new Map<string, { pathname: string; scroll: number }>();
export function productReturnPath(productPath: string, fallback: string) {
  return origins.get(productPath)?.pathname || fallback;
}
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduced");

function isCategoryChange(from: string, to: string) {
  const a = from.split("/").filter(Boolean), b = to.split("/").filter(Boolean);
  return from !== to && ["men", "women"].includes(a[0]) && a[0] === b[0] && a.length <= 2 && b.length <= 2;
}

function imageRect(img: HTMLImageElement) {
  const rect = img.getBoundingClientRect();
  const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
  const width = img.naturalWidth * scale, height = img.naturalHeight * scale;
  return { x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height };
}

function cardImage(anchor: HTMLAnchorElement) {
  if (anchor.hasAttribute("data-rail-product")) return anchor.closest(".clothing-rail")?.querySelector<HTMLImageElement>('[data-rail-visible="true"] img') || null;
  if (anchor.hasAttribute("data-quarterzip-product")) {
    return anchor.closest(".qz-showcase")?.querySelector<HTMLImageElement>(".qz-worn") || null;
  }
  const picture = anchor.closest(".product-card")?.querySelector(".picture") || anchor;
  return picture.querySelector<HTMLImageElement>("img");
}

function imageClip(img: HTMLImageElement, rect: ReturnType<typeof imageRect>) {
  const frame = img.closest(".picture, .gallery, .rail-face")?.getBoundingClientRect();
  if (!frame) return "inset(0% 0% 0% 0%)";
  const top = Math.max(0, frame.top - rect.y) / rect.height * 100;
  let right = Math.max(0, rect.x + rect.width - frame.right) / rect.width * 100;
  const bottom = Math.max(0, rect.y + rect.height - frame.bottom) / rect.height * 100;
  let left = Math.max(0, frame.left - rect.x) / rect.width * 100;
  // Rail photos contain both views; preserve the visible half in the transition.
  if (img.closest(".rail-face")) {
    if (img.style.clipPath === "inset(0px 50% 0px 0px)") right = Math.max(right, 50);
    if (img.style.clipPath === "inset(0px 0px 0px 50%)") left = Math.max(left, 50);
  }
  return `inset(${top}% ${right}% ${bottom}% ${left}%)`;
}

let productSnapshot: { path: string; image: HTMLImageElement; rect: ReturnType<typeof imageRect> } | undefined;

// Follow the worn torso into the normal gallery, then dissolve to the flat product.
function beginQuarterZip(img: HTMLImageElement, href: string) {
  pending?.cancel();
  const from = imageRect(img);
  const ghost = document.createElement("img");
  ghost.src = img.currentSrc; ghost.alt = "";
  ghost.dataset.productTransition = "quarterzip";
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, { position: "fixed", left: `${from.x}px`, top: `${from.y}px`, width: `${from.width}px`, height: `${from.height}px`, zIndex: "90", pointerEvents: "none", transformOrigin: "top left", objectFit: "contain" });
  const veil = document.createElement("div");
  veil.dataset.productTransition = "veil";
  veil.setAttribute("aria-hidden", "true");
  veil.inert = true;
  Object.assign(veil.style, { position: "fixed", inset: "0", background: "white", zIndex: "80", pointerEvents: "none" });
  const main = document.getElementById("main");
  if (main) {
    const scene = main.cloneNode(true) as HTMLElement;
    scene.removeAttribute("id");
    scene.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
    scene.querySelectorAll<HTMLElement>(".qz-model").forEach(el => { el.style.visibility = "hidden"; });
    Object.assign(scene.style, { position: "absolute", width: `${main.offsetWidth}px`, top: `${main.getBoundingClientRect().top}px`, left: `${main.getBoundingClientRect().left}px`, margin: "0" });
    veil.append(scene);
  }
  document.body.append(veil, ghost);
  ghost.style.maskImage = "linear-gradient(to right,transparent,#000 12%,#000 88%,transparent)";
  const animations: Animation[] = [];
  let target: HTMLImageElement | null = null, incoming: HTMLImageElement | null = null;
  let visibility = "", finished = false, arrived = false;
  const cleanup = () => {
    if (finished) return;
    finished = true;
    animations.forEach(a => a.cancel());
    ghost.remove(); veil.remove(); incoming?.remove();
    if (target) target.style.visibility = visibility;
    clearTimeout(timeout);
    if (pending?.cancel === cleanup) pending = undefined;
    for (const name of ["wheel", "touchstart", "keydown", "pagehide", "resize"]) window.removeEventListener(name, cleanup);
  };
  const timeout = window.setTimeout(cleanup, 2500);
  for (const name of ["wheel", "touchstart", "keydown", "pagehide", "resize"]) window.addEventListener(name, cleanup, { passive: true, once: true });
  pending = { href, cancel: cleanup, arrive: async () => {
    if (arrived || finished) return;
    arrived = true;
    window.scrollTo({ top: 0, behavior: "instant" });
    target = document.querySelector<HTMLImageElement>(".gallery img");
    if (!target) { cleanup(); return; }
    visibility = target.style.visibility; target.style.visibility = "hidden";
    await target.decode().catch(() => {});
    if (finished || !target.naturalWidth) { cleanup(); return; }
    const to = imageRect(target);
    const scale = Math.min(to.width / (from.width * .5), to.height / (from.height * .4));
    const x = to.x + to.width / 2 - from.width * .5 * scale - from.x;
    const y = to.y + to.height / 2 - from.height * .36 * scale - from.y;
    const zoom = `translate(${x}px,${y}px) scale(${scale})`;
    animations.push(ghost.animate([
      { transform: "none", clipPath: "inset(0% 0% 0% 0%)" },
      { transform: zoom, clipPath: "inset(16% 25% 44% 25%)" },
    ], { duration: 850, easing: "cubic-bezier(.4,0,.16,1)", fill: "forwards" }));
    animations.push(ghost.animate([{ opacity: 1 }, { opacity: 0 }], { delay: 590, duration: 140, fill: "forwards" }));
    incoming = document.createElement("img"); incoming.src = target.currentSrc; incoming.alt = "";
    incoming.dataset.productTransition = "incoming";
    Object.assign(incoming.style, { position: "fixed", left: `${to.x}px`, top: `${to.y}px`, width: `${to.width}px`, height: `${to.height}px`, objectFit: "contain", zIndex: "91", pointerEvents: "none" });
    document.body.append(incoming);
    animations.push(veil.animate([{ opacity: 1 }, { opacity: 0 }], { delay: 80, duration: 460, easing: "ease-in-out", fill: "forwards" }));
    const reveal = incoming.animate([{ clipPath: "inset(0 0 100% 0)", transform: "scale(.98)" }, { clipPath: "inset(0 0 0% 0)", transform: "scale(1)" }], { delay: 460, duration: 440, easing: "cubic-bezier(.22,.8,.2,1)", fill: "both" });
    animations.push(reveal);
    void reveal.finished.then(cleanup, cleanup);
  } };
}

export function resetProductTransition() {
  pending?.cancel();
  productSnapshot = undefined;
}

export function transitionHome(navigate: () => void) {
  transitionPage("/", navigate);
}

function transitionPage(href: string, navigate: () => void) {
  resetProductTransition();
  if (reduceMotion()) { navigate(); return; }
  const main = document.getElementById("main");
  if (!main) { navigate(); return; }
  const section = href.split("/")[1];
  const source = location.pathname.split("/")[1];
  const mode = href === "/" ? "home" : section === "limited" ? "curtain" : section === "accessories" ? "rise" : "slide";
  const direction = ["men", "women", "accessories", "limited"].indexOf(section) >= ["men", "women", "accessories", "limited"].indexOf(source) ? 1 : -1;
  const layer = document.createElement("div");
  layer.dataset.productTransition = "page";
  layer.dataset.transitionStyle = mode;
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;
  Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: "45", background: "white", overflow: "hidden", pointerEvents: "none" });
  const copy = main.cloneNode(true) as HTMLElement;
  copy.removeAttribute("id");
  copy.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  Object.assign(copy.style, { position: "absolute", width: "100%", top: main.getBoundingClientRect().top + "px", left: "0", margin: "0" });
  layer.append(copy); document.body.append(layer);
  let done = false;
  const animations: Animation[] = [];
  const cancel = () => {
    if (done) return;
    done = true; layer.remove(); animations.forEach(animation => animation.cancel()); clearTimeout(timer);
    if (pending?.cancel === cancel) pending = undefined;
    window.removeEventListener("wheel", cancel); window.removeEventListener("touchstart", cancel);
  };
  const timer = window.setTimeout(cancel, 1800);
  window.addEventListener("wheel", cancel, { passive: true, once: true });
  window.addEventListener("touchstart", cancel, { passive: true, once: true });
  pending = { href, cancel, arrive: () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => {
      if (done) return;
      const hero = document.querySelector("#main .hero") || document.getElementById("main");
      const duration = mode === "curtain" ? 760 : mode === "home" ? 700 : 540;
      const easing = "cubic-bezier(.22,.8,.2,1)";
      const incomingFrames: Keyframe[] = mode === "home"
        ? [{ transform: "scale(1.09)", opacity: .55 }, { transform: "none", opacity: 1 }]
        : mode === "curtain"
          ? [{ transform: "translateY(65px) scale(.97)" }, { transform: "none" }]
          : mode === "rise"
            ? [{ transform: "translateY(80px)", opacity: .4 }, { transform: "none", opacity: 1 }]
            : [{ transform: `translateX(${direction * 70}px)`, opacity: .5 }, { transform: "none", opacity: 1 }];
      const outgoingFrames: Keyframe[] = mode === "curtain"
        ? [{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }]
        : mode === "home"
          ? [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.94) translateY(30px)" }]
          : mode === "rise"
            ? [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-65px)" }]
            : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-direction * 100}px)` }];
      if (hero) animations.push(hero.animate(incomingFrames, { duration, easing }));
      const outgoing = layer.animate(outgoingFrames, { duration, easing, fill: "forwards" });
      animations.push(outgoing);
      void outgoing.finished.then(cancel, cancel);
    });
  } };
  navigate();
}

function begin(img: HTMLImageElement, href: string, productPath: string, reverse: boolean, capturedRect?: ReturnType<typeof imageRect>) {
  pending?.cancel();
  if (!img.naturalWidth || reduceMotion()) return;
  const from = capturedRect || imageRect(img);
  // Preserve the visible crop, including a click before the hover zoom finishes.
  const fromClip = capturedRect ? "inset(0% 0% 0% 0%)" : imageClip(img, from);
  const ghost = document.createElement("img");
  ghost.src = img.currentSrc; ghost.alt = "";
  ghost.dataset.productTransition = reverse ? "return" : "image";
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, { position: "fixed", left: from.x + "px", top: from.y + "px", width: from.width + "px", height: from.height + "px", objectFit: "contain", clipPath: fromClip, zIndex: "90", pointerEvents: "none", transformOrigin: "top left", willChange: "transform,opacity,clip-path" });
  const veil = document.createElement("div");
  veil.dataset.productTransition = "veil";
  veil.setAttribute("aria-hidden", "true");
  Object.assign(veil.style, { position: "fixed", inset: "0", background: "white", zIndex: "80", pointerEvents: "none" });
  document.body.append(veil, ghost);
  veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, fill: "forwards" });
  let target: HTMLImageElement | null = null;
  let hiddenTarget: HTMLElement | null = null;
  let originalVisibility = "";
  let incoming: HTMLImageElement | null = null;
  const animations: Animation[] = [];
  let finished = false, arrived = false;
  const cleanup = () => {
    if (finished) return;
    finished = true;
    animations.forEach(a => a.cancel());
    veil.getAnimations().forEach(a => a.cancel());
    veil.remove(); ghost.remove(); incoming?.remove();
    if (hiddenTarget) hiddenTarget.style.visibility = originalVisibility;
    if (pending?.cancel === cleanup) pending = undefined;
    clearTimeout(timeout);
    for (const name of ["wheel", "touchstart", "keydown", "pagehide", "resize"]) window.removeEventListener(name, cleanup);
  };
  const timeout = window.setTimeout(cleanup, 1800);
  for (const name of ["wheel", "touchstart", "keydown", "pagehide", "resize"]) window.addEventListener(name, cleanup, { passive: true, once: true });
  pending = {
    href, cancel: cleanup,
    arrive: async () => {
      if (arrived || finished) return;
      arrived = true;
      const origin = origins.get(productPath);
      if (!reverse) window.scrollTo({ top: 0, behavior: "instant" });
      else if (origin?.pathname === href) window.scrollTo({ top: origin.scroll, behavior: "instant" });
      const returnCard = reverse ? Array.from(document.querySelectorAll<HTMLAnchorElement>('main a[href]')).find(a => a.getAttribute("href") === productPath && (a.querySelector("img") || a.hasAttribute("data-rail-product"))) : null;
      target = reverse ? returnCard ? cardImage(returnCard) : null : document.querySelector<HTMLImageElement>(".gallery img");
      if (target) {
        // Visibility also suppresses the gallery's CSS entrance animation.
        hiddenTarget = target;
        originalVisibility = hiddenTarget.style.visibility;
        hiddenTarget.style.visibility = "hidden";
        await target.decode().catch(() => {});
      }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (finished) return;
        const to = target?.naturalWidth ? imageRect(target) : null;
        const onScreen = to && to.y < innerHeight && to.y + to.height > 0;
        veil.getAnimations().forEach(a => a.cancel());
        animations.push(veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: "ease-out", fill: "forwards" }));
        if (onScreen && target && target.currentSrc !== ghost.src) {
          // A flat product and a model are different compositions, so dissolve
          // between them instead of enlarging one and swapping it at the end.
          incoming = document.createElement("img");
          incoming.src = target.currentSrc; incoming.alt = "";
          incoming.dataset.productTransition = "incoming";
          incoming.setAttribute("aria-hidden", "true");
          Object.assign(incoming.style, { position: "fixed", left: to.x + "px", top: to.y + "px", width: to.width + "px", height: to.height + "px", objectFit: "contain", clipPath: imageClip(target, to), zIndex: "91", pointerEvents: "none", willChange: "transform,opacity" });
          document.body.append(incoming);
          animations.push(ghost.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-8px) scale(.985)" }], { duration: 260, easing: "ease-out", fill: "forwards" }));
          const reveal = incoming.animate([{ opacity: 0, transform: "translateY(12px) scale(.985)" }, { opacity: 1, transform: "none" }], { delay: 90, duration: 450, easing: "cubic-bezier(.22,.8,.2,1)", fill: "both" });
          animations.push(reveal);
          void reveal.finished.then(cleanup, cleanup);
          return;
        }
        const animation = ghost.animate([
          { transform: "translate(0,0) scale(1)", opacity: 1, clipPath: fromClip },
          onScreen && target ? { transform: "translate(" + (to.x - from.x) + "px," + (to.y - from.y) + "px) scale(" + to.width / from.width + ")", opacity: 1, clipPath: imageClip(target, to) }
            : { transform: "translateY(24px) scale(.94)", opacity: 0 }
        ], { duration: reverse ? 620 : 580, easing: "cubic-bezier(.22,.8,.2,1)", fill: "forwards" });
        animations.push(animation);
        void animation.finished.then(cleanup, cleanup);
      }));
    }
  };
}

export function useProductTransitions(pathname: string, router: Router) {
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    const categoryChange = isCategoryChange(previousPath.current, pathname);
    previousPath.current = pathname;
    if (categoryChange && !reduceMotion()) {
      document.querySelectorAll(".products .product-card").forEach((card, index) => {
        card.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
          duration: 380, delay: Math.min(index, 5) * 35, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards"
        });
      });
    }
    if (pending && pathname !== pending.href) pending.cancel();
    // History can commit before popstate listeners run. Preserve the outgoing
    // geometry and start the return during the incoming route's pre-paint phase.
    if (!pending && productSnapshot && !pathname.startsWith("/product/")) {
      begin(productSnapshot.image, pathname, productSnapshot.path, true, productSnapshot.rect);
    }
    if (pending) pending.arrive();
    if (!pathname.startsWith("/product/")) { productSnapshot = undefined; return; }
  }, [pathname]);

  // Capture after every rendered colour/view change, not just route changes,
  // so browser Back starts from the photograph the shopper is actually viewing.
  useLayoutEffect(() => {
    if (!pathname.startsWith("/product/")) return;
    const capture = () => {
      const image = document.querySelector<HTMLImageElement>(".gallery img");
      if (image?.naturalWidth) productSnapshot = { path: pathname, image, rect: imageRect(image) };
    };
    capture();
    const image = document.querySelector<HTMLImageElement>(".gallery img");
    let active = true;
    void image?.decode().then(() => { if (active) capture(); }).catch(() => {});
    window.addEventListener("scroll", capture, { passive: true });
    window.addEventListener("resize", capture);
    return () => {
      active = false;
      window.removeEventListener("scroll", capture);
      window.removeEventListener("resize", capture);
    };
  });

  return (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/"]');
    if (anchor?.hasAttribute("data-quarterzip-product") && (anchor.dataset.busy === "true" || anchor.closest<HTMLElement>(".qz-stage")?.dataset.swiped === "true")) {
      event.preventDefault();
      return;
    }
    pending?.cancel();
    if (!anchor) return;
    const href = anchor.getAttribute("href")!;
    const destination = new URL(anchor.href).pathname;
    if (destination === pathname || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    if (destination.startsWith("/product/") && !pathname.startsWith("/product/")) {
      origins.set(destination, { pathname, scroll: window.scrollY });
    }
    if (reduceMotion()) return;
    if (anchor.hasAttribute("data-quarterzip-product")) {
      const model = cardImage(anchor);
      if (model?.naturalWidth) {
        event.preventDefault();
        beginQuarterZip(model, destination);
        router.push(href, { scroll: false });
        return;
      }
    }
    if (isCategoryChange(pathname, destination)) {
      event.preventDefault();
      router.push(href, { scroll: false });
      return;
    }
    const reverse = pathname.startsWith("/product/") && !destination.startsWith("/product/");
    const img = reverse ? document.querySelector<HTMLImageElement>(".gallery img")
      : cardImage(anchor);
    event.preventDefault();
    if (anchor.classList.contains("brand") || !img?.naturalWidth || (!reverse && !destination.startsWith("/product/"))) {
      transitionPage(destination, () => router.push(href, { scroll: false }));
      return;
    }
    begin(img, destination, reverse ? pathname : destination, reverse);
    router.push(href, { scroll: false });
  };
}
