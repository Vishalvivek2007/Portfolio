"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { COLS, ROWS, mergesort, quicksort, search, shuffled, type PathFrame, type SortFrame } from "./algorithms";

type Kind = "quicksort" | "mergesort" | "bfs" | "astar";
const LABEL: Record<Kind, string> = { quicksort: "Quicksort", mergesort: "Merge sort", bfs: "BFS", astar: "A*" };
const BIG_O: Record<Kind, string> = { quicksort: "O(n log n) average", mergesort: "O(n log n)", bfs: "O(V + E)", astar: "O(E log V) with a good heuristic" };
const CELL = 12;
const START = 10 * COLS + 2, GOAL = 10 * COLS + 61;

export default function Theatre() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<Kind>("quicksort");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(3);
  const [stats, setStats] = useState({ cmp: 0, ops: 0, done: false });
  const S = useRef({
    arr: shuffled(), walls: new Set<number>(), gen: null as Generator<SortFrame | PathFrame> | null,
    frame: null as SortFrame | PathFrame | null, painting: false, acc: 0,
  });

  const restart = useCallback((k: Kind, fresh = false) => {
    const s = S.current;
    if (fresh && (k === "quicksort" || k === "mergesort")) s.arr = shuffled();
    s.frame = null;
    s.gen = k === "quicksort" ? quicksort(s.arr) : k === "mergesort" ? mergesort(s.arr) : search(k, s.walls);
    setStats({ cmp: 0, ops: 0, done: false });
  }, []);

  useEffect(() => { restart(kind); }, [kind, restart]);

  const draw = useCallback(() => {
    const c = canvas.current, ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const col = getComputedStyle(document.documentElement).getPropertyValue("--phosphor").trim() || "#edebdd";
    const s = S.current, f = s.frame;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = col; ctx.strokeStyle = col;
    const dot = (x: number, y: number, r: number, fill = true) => {
      ctx.beginPath(); ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, r, 0, 7);
      if (fill) ctx.fill(); else ctx.stroke();
    };
    if (kind === "quicksort" || kind === "mergesort") {
      const arr = (f as SortFrame | null)?.arr ?? s.arr, hi = new Set((f as SortFrame | null)?.hi ?? []);
      arr.forEach((v, x) => {
        for (let r = 0; r < v; r++) {
          const y = ROWS - 1 - r;
          if (hi.has(x)) { ctx.fillStyle = col; ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2); }
          else { ctx.globalAlpha = 0.85; dot(x, y, 3.2); ctx.globalAlpha = 1; }
        }
      });
    } else {
      const pf = f as PathFrame | null;
      s.walls.forEach((n) => { ctx.fillRect((n % COLS) * CELL + 1, Math.floor(n / COLS) * CELL + 1, CELL - 2, CELL - 2); });
      pf?.seen.forEach((n) => { ctx.globalAlpha = 0.35; dot(n % COLS, Math.floor(n / COLS), 2); });
      ctx.globalAlpha = 0.8;
      pf?.edge.forEach((n) => dot(n % COLS, Math.floor(n / COLS), 3.6, false));
      ctx.globalAlpha = 1;
      pf?.path.forEach((n) => dot(n % COLS, Math.floor(n / COLS), 4.6));
      [START, GOAL].forEach((n) => { ctx.lineWidth = 1.5; dot(n % COLS, Math.floor(n / COLS), 5.5, false); });
    }
  }, [kind]);

  // one rAF loop; `speed` operations per frame
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = S.current;
      if (playing && s.gen && !document.hidden) {
        s.acc += speed * speed * 0.25;
        while (s.acc >= 1 && s.gen) {
          s.acc -= 1;
          const r = s.gen.next();
          if (r.done) { s.gen = null; setStats((o) => ({ ...o, done: true })); break; }
          s.frame = r.value;
          const v = r.value as SortFrame & PathFrame;
          if ("done" in v && v.done) { s.gen = null; setStats({ cmp: v.cmp, ops: v.path.length, done: true }); break; }
          if (s.acc < 1) setStats({ cmp: v.cmp, ops: v.ops ?? v.seen?.length ?? 0, done: false });
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, draw]);

  const step = () => {
    const s = S.current;
    if (!s.gen) return;
    const r = s.gen.next();
    if (r.done) { s.gen = null; return; }
    s.frame = r.value;
    const v = r.value as SortFrame & PathFrame;
    setStats({ cmp: v.cmp, ops: v.ops ?? v.path?.length ?? 0, done: !!v.done });
  };

  const paint = (e: React.PointerEvent) => {
    if (kind !== "bfs" && kind !== "astar") return;
    const c = canvas.current!, r = c.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * COLS), y = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
    const n = y * COLS + x;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS || n === START || n === GOAL) return;
    const w = S.current.walls;
    if (e.shiftKey || e.button === 2) w.delete(n); else w.add(n);
    restart(kind);
  };

  const isPath = kind === "bfs" || kind === "astar";
  const pathStatus = isPath && stats.done ? (S.current.frame as PathFrame | null)?.path.length : null;
  return (
    <div className="mt-20">
      <h3 className="h2 !text-4xl md:!text-5xl mb-6">Algorithm theatre</h3>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Algorithm">
        {(Object.keys(LABEL) as Kind[]).map((k) => (
          <button key={k} role="tab" aria-selected={k === kind} onClick={() => setKind(k)} className={"px-3 py-1 border border-[var(--rule)] inv " + (k === kind ? "bg-[var(--phosphor)] text-black" : "")}>{LABEL[k]}</button>
        ))}
      </div>
      <div className="slot border border-[var(--rule)]" style={{ cursor: isPath ? "crosshair" : "default" }}>
        <span className="br" />
        <canvas
          ref={canvas} width={COLS * CELL} height={ROWS * CELL} className="block w-full touch-none" style={{ imageRendering: "pixelated" }}
          role="img" aria-label={LABEL[kind] + " running on a dot matrix"}
          onPointerDown={(e) => { S.current.painting = true; (e.target as Element).setPointerCapture(e.pointerId); paint(e); }}
          onPointerMove={(e) => { if (S.current.painting) paint(e); }}
          onPointerUp={() => (S.current.painting = false)}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button className="px-3 py-1 border border-[var(--rule)] inv" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
        <button className="px-3 py-1 border border-[var(--rule)] inv" onClick={step}>Step</button>
        <button className="px-3 py-1 border border-[var(--rule)] inv" onClick={() => { if (isPath) S.current.walls.clear(); restart(kind, true); }}>{isPath ? "Clear walls" : "Shuffle"}</button>
        <label className="machine flex items-center gap-2">speed
          <input type="range" min={1} max={10} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="accent-[var(--phosphor)]" />
        </label>
      </div>
      <p className="machine mt-3" aria-live="off">
        {isPath ? "cells searched " + stats.cmp : "comparisons " + stats.cmp + "   writes " + stats.ops}
        {pathStatus != null ? (pathStatus ? "   path " + pathStatus + " cells" : "   no route") : ""}
        {"   " + BIG_O[kind]}
        {isPath ? "   drag to paint walls, shift-drag to erase" : ""}
      </p>
    </div>
  );
}
