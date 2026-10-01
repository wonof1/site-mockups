"use client";

import { useEffect, useRef, useState } from "react";

export function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setEnabled(!preference.matches && new URLSearchParams(location.search).get("motion") !== "reduce" && !document.documentElement.classList.contains("reduced"));
      setReady(false);
      if (preference.matches) video.current?.pause();
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return <>
    {!failed && <video ref={video} className={`hero-video${ready ? " is-playing" : ""}`}
      src="https://wo1.asasuo.club/temp/wo1-homepage-original-speed.mp4"
      autoPlay={enabled} muted loop playsInline preload="auto" aria-hidden="true"
      onPlaying={() => { setReady(true); setPaused(false); }}
      onPause={() => setPaused(true)} onError={() => { setFailed(true); setReady(false); }} />}
    {enabled && ready && !failed && <button className="hero-video-toggle" aria-label={paused ? "Play background video" : "Pause background video"}
      onClick={() => {
        if (video.current?.paused) void video.current.play().catch(() => { setFailed(true); setReady(false); });
        else video.current?.pause();
      }}>{paused ? "Play" : "Pause"}</button>}
  </>;
}
