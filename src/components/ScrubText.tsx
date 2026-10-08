"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Words brighten from faint to full as the paragraph crosses the middle of the viewport.
export default function ScrubText({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("res-clean")) return;
    gsap.registerPlugin(ScrollTrigger);
    const words = Array.from(el.children);
    const tween = gsap.fromTo(words, { opacity: 0.18 }, {
      opacity: 1, ease: "none", stagger: 0.12,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);
  return (
    <p ref={root} className={className}>
      {text.split(" ").map((w, i, a) => (
        <span key={i}>{w}{i < a.length - 1 ? " " : ""}</span>
      ))}
    </p>
  );
}
