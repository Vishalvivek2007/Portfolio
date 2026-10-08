"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

// The server renders final text in Geist Sans. On first boot each character steps through the
// pixel variants (Line, Triangle, Circle, Grid, Square) and lands on the clean face.
const STEPS = ["var(--font-p-line)", "var(--font-p-tri)", "var(--font-dot)", "var(--font-p-grid)", "var(--font-machine)"];

export default function TypeResolve({ text, delay = 0 }: { text: string; delay?: number }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || document.documentElement.dataset.boot !== "run") return;
    const chars = Array.from(el.children) as HTMLElement[];
    // lock each glyph to its final width so nothing reflows while the face changes
    chars.forEach((c) => { c.style.width = c.getBoundingClientRect().width + "px"; c.style.opacity = "0"; });
    const calls = chars.flatMap((c, i) => [
      ...STEPS.map((f, k) => gsap.delayedCall(delay + i * 0.025 + k * 0.06, () => { c.style.opacity = "1"; c.style.fontFamily = f; })),
      gsap.delayedCall(delay + i * 0.025 + STEPS.length * 0.06, () => { c.style.fontFamily = ""; c.style.width = ""; }),
    ]);
    const skip = () => { calls.forEach((t) => t.kill()); chars.forEach((c) => { c.style.opacity = "1"; c.style.fontFamily = ""; c.style.width = ""; }); };
    addEventListener("raster:skip", skip, { once: true });
    return () => { calls.forEach((t) => t.kill()); removeEventListener("raster:skip", skip); };
  }, [delay]);

  return (
    <span ref={root} aria-label={text} className="inline-flex">
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden className="inline-block">{ch}</span>
      ))}
    </span>
  );
}
