"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { prefersReducedMotion } from "./motion";

// A composed frame (player in a WO1 tee) for reduced motion and before playback.
const STILL_AT = 5.1;

export function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  const visible = useRef(true);
  // "auto" follows motion preference; a click is an explicit choice that wins.
  const choice = useRef<"auto" | "play" | "pause">("auto");
  const [motionOk, setMotionOk] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const wanted = useCallback(() => choice.current === "play" || (choice.current === "auto" && motionOk), [motionOk]);
  const sync = useCallback(() => {
    const el = video.current;
    if (!el) return;
    if (wanted() && visible.current && !document.hidden) {
      if (el.paused) void el.play().catch(() => {});
    } else if (!el.paused) el.pause();
  }, [wanted]);

  // The element starts loading before hydration, so read its state rather than
  // relying on events React may have missed.
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const prime = () => {
      if (el.readyState >= 1 && el.paused && !wanted() && el.currentTime < 1) el.currentTime = STILL_AT;
      if (el.readyState >= 2) setHasFrame(true);
    };
    prime();
    for (const name of ["loadedmetadata", "loadeddata", "seeked"]) el.addEventListener(name, prime);
    return () => { for (const name of ["loadedmetadata", "loadeddata", "seeked"]) el.removeEventListener(name, prime); };
  }, [wanted]);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionOk(!prefersReducedMotion());
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.muted = true;
    // Off-screen or background tabs don't need to decode video.
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; sync(); }, { threshold: .05 });
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, [sync]);

  if (failed) return null;
  return <>
    <video ref={video} className={`hero-video${hasFrame ? " has-frame" : ""}`}
      src="https://wo1.asasuo.club/temp/wo1-homepage-original-speed.mp4"
      muted loop playsInline preload="auto" aria-hidden="true"
      onPlaying={() => { setHasFrame(true); setPlaying(true); }}
      onPause={() => setPlaying(false)}
      onError={() => setFailed(true)} />
    {hasFrame && <button className="hero-video-toggle" aria-label={playing ? "Pause background video" : "Play background video"}
      onClick={() => { choice.current = playing ? "pause" : "play"; sync(); }}>
      {playing ? <Pause aria-hidden="true" size={14} strokeWidth={1.75} /> : <Play aria-hidden="true" size={14} strokeWidth={1.75} />}
    </button>}
  </>;
}
