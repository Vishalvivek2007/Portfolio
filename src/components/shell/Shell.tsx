"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useStore, type Res } from "@/lib/store";
import HalftoneTrail from "@/components/ui/halftone-trail";
import Arcade from "@/components/arcade/Arcade";
import Boot from "./Boot";

const Stage = dynamic(() => import("@/stage/Stage"), { ssr: false });

const SECTIONS = [
  ["home", "Home"],
  ["work", "Work"],
  ["about", "About"],
  ["stack", "Stack"],
  ["experience", "Experience"],
  ["contact", "Contact"],
] as const;

const RES_ORDER: Res[] = ["lofi", "broadcast", "clean"];
const RES_LABEL: Record<Res, string> = { lofi: "1-bit", broadcast: "Broadcast", clean: "Clean" };

export let lenisRef: Lenis | null = null;

export function goTo(i: number) {
  const el = document.getElementById(SECTIONS[i - 1]?.[0] ?? "home");
  if (!el) return;
  if (lenisRef) lenisRef.scrollTo(el, { offset: 0, duration: 1.1 });
  else el.scrollIntoView();
}

export default function Shell() {
  const { res, phosphor, channel, set } = useStore();
  const [fine, setFine] = useState(false);
  const [moved, setMoved] = useState(false);
  const [osd, setOsd] = useState<number | null>(null);
  const [burst, setBurst] = useState(false);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const lastBurst = useRef(0);
  const reduced = useRef(false);

  // classes on <html>
  useEffect(() => {
    const c = document.documentElement.classList;
    RES_ORDER.forEach((r) => c.toggle("res-" + r, r === res));
    c.remove("res-broadcast", ...(res === "broadcast" ? [] : []));
    c.toggle("res-broadcast", res === "broadcast");
    ["white", "green", "amber"].forEach((p) => c.toggle("ph-" + p, p === phosphor && p !== "white"));
  }, [res, phosphor]);

  // capabilities + URL params
  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFine(matchMedia("(hover: hover) and (pointer: fine)").matches);
    addEventListener("pointermove", () => setMoved(true), { once: true });
    const q = new URLSearchParams(location.search);
    const r = q.get("res") as Res | null;
    if (r && RES_ORDER.includes(r)) set({ res: r });
    else if (reduced.current) set({ res: "clean" });
    const p = q.get("phosphor");
    if (p === "green" || p === "amber") set({ phosphor: p });
    set({ booted: true });
  }, [set]);

  // the one clock: gsap ticker drives lenis + scrolltrigger (+ stage via store event)
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef = null;
    };
  }, []);

  // channel detection
  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const n = els.indexOf(e.target as HTMLElement) + 1;
          if (n && n !== useStore.getState().channel) {
            set({ channel: n });
            if (!reduced.current) {
              setOsd(n);
              const now = performance.now();
              if (now - lastBurst.current > 600) {
                lastBurst.current = now;
                setBurst(true);
                setTimeout(() => setBurst(false), 180);
              }
            }
          }
        }),
      { rootMargin: "-49% 0px -49% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [set]);

  useEffect(() => {
    if (osd == null) return;
    const t = setTimeout(() => setOsd(null), 1600);
    return () => clearTimeout(t);
  }, [osd]);

  // keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [data-game]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-6]$/.test(e.key)) goTo(+e.key);
      else if (e.key === "[" || e.key === "]") {
        const i = RES_ORDER.indexOf(useStore.getState().res) + (e.key === "]" ? 1 : -1);
        set({ res: RES_ORDER[Math.max(0, Math.min(2, i))] });
      } else if (e.key === "?") setHelp((h) => !h);
      else if (e.key === "Escape") { setHelp(false); setMenu(false); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [set]);

  // DPR-aware scanline period so lines land on whole device pixels
  useEffect(() => {
    const base = res === "lofi" ? 4 : 3;
    const apply = () => {
      const d = window.devicePixelRatio || 1;
      document.documentElement.style.setProperty("--scan-period", Math.round(base * d) / d + "px");
    };
    apply();
    addEventListener("resize", apply);
    return () => removeEventListener("resize", apply);
  }, [res]);

  const clean = res === "clean";
  const cell = typeof window === "undefined" ? 12 : Math.round(6 * Math.min(window.devicePixelRatio || 1, 2));

  return (
    <>
      <Boot />
      {!clean && <Stage />}
      {!clean && <Arcade />}
      {!clean && fine && moved && (
        <div className="fixed inset-0" style={{ zIndex: 20, mixBlendMode: "difference", pointerEvents: "none" }}>
          <HalftoneTrail color="var(--phosphor)" cellSize={cell} decay={0.965} brushSize={0.045} hoverBrushSize={0.012} hoverOpacity={0.15} speedScale={38} />
        </div>
      )}

      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-[var(--pad)] py-3 text-sm" style={{ paddingTop: "calc(var(--pad) * 0.5 + 8px)" }}>
        <a href="#home" onClick={(e) => { e.preventDefault(); goTo(1); }} aria-label="Home" className="font-[family-name:var(--font-dot)] text-2xl leading-none inv px-1">VV</a>
        <nav aria-label="Sections" className="hidden lg:flex gap-1">
          {SECTIONS.slice(1).map(([id, label], i) => (
            <a key={id} href={"#" + id} onClick={(e) => { e.preventDefault(); goTo(i + 2); }}
              aria-current={channel === i + 2 ? "true" : undefined}
              className={"inv px-2 py-0.5 " + (channel === i + 2 ? "bg-[var(--phosphor)] text-black" : "")}>{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button className="machine inv px-2 py-0.5" onClick={() => set({ res: RES_ORDER[(RES_ORDER.indexOf(res) + 1) % 3] })} aria-label={"Resolution: " + RES_LABEL[res] + ". Press to change."}>
            res: {RES_LABEL[res]}
          </button>
          <button className="lg:hidden inv px-2 py-0.5" onClick={() => setMenu(true)} aria-expanded={menu}>Menu</button>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 bg-black p-[var(--pad)] flex flex-col justify-center gap-4" role="dialog" aria-label="Menu">
          {SECTIONS.map(([id, label], i) => (
            <a key={id} href={"#" + id} onClick={(e) => { e.preventDefault(); setMenu(false); goTo(i + 1); }} className="flex items-baseline gap-4 inv">
              <span className="font-[family-name:var(--font-dot)] text-6xl">{i + 1}</span>
              <span className="h2">{label}</span>
            </a>
          ))}
          <button className="machine inv self-start px-2 py-1" onClick={() => setMenu(false)}>close</button>
        </div>
      )}

      {osd != null && (
        <div aria-hidden className="fixed z-30 right-[var(--pad)] top-20 text-right pointer-events-none">
          <div className="font-[family-name:var(--font-dot)] text-6xl leading-none glow">{osd}</div>
          <div className="machine">{SECTIONS[osd - 1][1].toLowerCase()}</div>
        </div>
      )}

      {help && (
        <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-[var(--rule)] p-6 machine" role="dialog" aria-label="Keyboard shortcuts">
          <p>1 to 6 go to a section</p><p>[ and ] turn the resolution dial</p><p>g opens the game (arrows or WASD, Escape to dock)</p><p>? closes this</p>
        </div>
      )}

      {!clean && (
        <div className="screen-overlay" aria-hidden>
          <div className="scan" /><div className="vig" /><div className="grain" /><div className="frame" />
        </div>
      )}
      {burst && !clean && <div className="static-burst" aria-hidden />}
    </>
  );
}
