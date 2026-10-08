"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { COLS, ROWS, anySafe, bfs, init, step, type Dir, type State } from "./snake";
import { useStore } from "@/lib/store";

const CELL = 12;
const KEYS: Record<string, Dir> = { ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R", w: "U", s: "D", a: "L", d: "R" };

export default function Arcade() {
  const booted = useStore((s) => s.booted);
  const set = useStore((s) => s.set);
  const [open, setOpen] = useState(false);
  const [ops, setOps] = useState<string[]>([]);
  const [info, setInfo] = useState("");
  const [high, setHigh] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<{ s: State; queue: Dir[]; player: boolean; paused: boolean }>({ s: init(), queue: [], player: false, paused: false });
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setHigh(+(localStorage.getItem("snake-high") || 0)); } catch { /* storage blocked */ }
  }, []);

  const draw = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const col = getComputedStyle(document.documentElement).getPropertyValue("--phosphor").trim() || "#edebdd";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = col;
    const dot = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, r, 0, 7); ctx.fill(); };
    const { s } = game.current;
    s.body.forEach((p, i) => dot(p.x, p.y, i === 0 ? 5.2 : 4));
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = col;
    ctx.beginPath(); ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, 4.5, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

  const reset = useCallback((player: boolean) => {
    game.current = { s: init(), queue: [], player, paused: false };
    setInfo("");
    draw();
  }, [draw]);

  // game loop: 8 moves/s, +1 per 5 food, capped at 14
  useEffect(() => {
    if (!booted) return;
    let timer = 0;
    const loop = () => {
      const g = game.current;
      const hz = Math.min(14, 8 + Math.floor(g.s.score / 5));
      if (!document.hidden && !g.paused) {
        if (g.s.dead) {
          if (!g.player) reset(false);
        } else {
          let want: Dir | null = null;
          if (g.player) want = g.queue.shift() ?? null;
          else { const r = bfs(g.s); want = r.dir ?? anySafe(g.s); setInfo("bfs() " + r.visited + " visited"); }
          g.s = step(g.s, want);
          setOps(g.s.ops);
          if (g.player) {
            if (g.s.score >= 10) set({ unlocked: ["white", "green", ...(g.s.score >= 25 ? (["amber"] as const) : [])] });
            if (g.s.dead) {
              setInfo("game over, score " + g.s.score + ", press space");
              if (g.s.score > high) { setHigh(g.s.score); try { localStorage.setItem("snake-high", String(g.s.score)); } catch { /* ignore */ } }
            }
          }
          draw();
        }
      }
      timer = window.setTimeout(loop, 1000 / (g.player ? hz : 12));
    };
    loop();
    return () => clearTimeout(timer);
  }, [booted, draw, reset, set, high]);

  // keys only while the panel has focus, plus 'g' to open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "g" && !t.closest("input, textarea, select")) { setOpen(true); root.current?.querySelector<HTMLElement>("[data-game-focus]")?.focus(); return; }
      if (!root.current?.contains(document.activeElement)) return;
      if (e.key === "Escape") { setOpen(false); game.current.paused = false; return; }
      if (e.key === " " && game.current.s.dead) { e.preventDefault(); reset(true); return; }
      const d = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (d) {
        e.preventDefault();
        if (!game.current.player) reset(true);
        if (game.current.queue.length < 2) game.current.queue.push(d);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [reset]);

  // swipe on touch
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current, e0 = e.changedTouches[0];
    if (!t) return;
    const dx = e0.clientX - t.x, dy = e0.clientY - t.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U";
    if (!game.current.player) reset(true);
    if (game.current.queue.length < 2) game.current.queue.push(d);
  };

  if (!booted) return null;
  return (
    <div ref={root} data-game className="fixed z-40 right-4 bottom-4" onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) game.current.paused = open; }} onFocus={() => (game.current.paused = false)}>
      <div className={"bg-black border border-[var(--rule)] " + (open ? "p-3" : "p-1")}>
        <button
          data-game-focus
          aria-label={open ? "Snake game, use arrow keys or WASD. Escape to dock." : "Play snake"}
          onClick={() => { if (!open) { setOpen(true); reset(true); } }}
          onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
          onTouchEnd={onTouchEnd}
          className="block"
          style={{ cursor: open ? "default" : "pointer" }}
        >
          <canvas className={open ? "" : "max-sm:hidden"} ref={canvas} width={COLS * CELL} height={ROWS * CELL} style={{ width: open ? 288 : 144, height: open ? 216 : 108, imageRendering: "pixelated", display: "block", touchAction: "none" }} />
        </button>
        {open && (
          <div className="machine mt-2 w-[288px]">
            <p>score {game.current.s.score}, best {high}</p>
            <p className="text-[var(--faint)]">{ops.join("  ")}</p>
            <p>{info}</p>
            <button className="inv px-1 mt-1" onClick={() => setOpen(false)}>dock</button>
          </div>
        )}
        {!open && <button className="machine block w-full text-center mt-1 max-sm:mt-0 max-sm:px-2 max-sm:py-1" onClick={() => { setOpen(true); reset(true); }}>Play</button>}
      </div>
    </div>
  );
}
