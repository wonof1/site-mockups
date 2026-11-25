// Shared timing so the intro, rail, page and product transitions read as one system.
export const ease = "cubic-bezier(.22,.8,.2,1)";
export const easeInOut = "cubic-bezier(.65,0,.2,1)";

// Honour both the OS setting and the ?motion=reduce preview flag (html.reduced).
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return matchMedia("(prefers-reduced-motion: reduce)").matches
    || document.documentElement.classList.contains("reduced")
    || new URLSearchParams(location.search).get("motion") === "reduce";
}

export const scrollBehavior = (): ScrollBehavior => prefersReducedMotion() ? "instant" : "smooth";
