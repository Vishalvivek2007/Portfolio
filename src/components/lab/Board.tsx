"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { load, forward, render, best, IN, SIDE, type Net, type Pt, type Stroke } from "./doodle";
import { useStore } from "@/lib/store";
import { goTo } from "@/components/shell/Shell";

const SIZE = { wide: [800, 500], tall: [400, 400] } as const; // the board in its own units
const SCALE = 2; // canvas pixels per unit, so the ink stays crisp
const TAP = 40; // a drawing smaller than this many units is treated as a dot, not blown up to fill the net's view
const DRAW = 2.4, HOLD = 4.2; // demo: seconds to replay a doodle, then when the next one starts
// the guess is set in rougher pixel type while the net is unsure and resolves to the clean face as it gets sure
const FACE = ["--font-geist-pixel-line", "--font-geist-pixel-triangle", "--font-geist-pixel-circle", "--font-geist-pixel-grid", "--font-geist-pixel-square", "--font-geist-sans"];
const STEPS = [0.2, 0.35, 0.5, 0.7, 0.85];
const pct = (p: number) => Math.round(p * 100) + "%";
type Verdict = { label: string; line: string; mine: boolean };

// one stroke, as a smooth line through the visitor's points or straight between a demo doodle's corners
function trace(ctx: CanvasRenderingContext2D, s: Stroke, curved = true) {
  ctx.beginPath();
  ctx.moveTo(s[0][0], s[0][1]);
  for (let i = 1; i < s.length - 1; i++) {
    if (curved) ctx.quadraticCurveTo(s[i][0], s[i][1], (s[i][0] + s[i + 1][0]) / 2, (s[i][1] + s[i + 1][1]) / 2);
    else ctx.lineTo(s[i][0], s[i][1]);
  }
  ctx.lineTo(s[s.length - 1][0], s[s.length - 1][1] + 0.01); // the nudge turns a single tap into a dot
  ctx.stroke();
}

// the first `k` of a drawing by pen travel, so a replay moves like a pen instead of popping in corner by corner
function upTo(strokes: Stroke[], k: number): Stroke[] {
  const len = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  let left = k * strokes.reduce((sum, s) => sum + s.reduce((n, p, i) => n + (i ? len(s[i - 1], p) : 0), 0), 0);
  const out: Stroke[] = [];
  for (const s of strokes) {
    if (left <= 0 && k < 1) break;
    const part: Stroke = [s[0]];
    for (let i = 1; i < s.length; i++) {
      const d = len(s[i - 1], s[i]);
      if (d > left && k < 1) { const t = left / d; part.push([s[i - 1][0] + (s[i][0] - s[i - 1][0]) * t, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * t]); left = 0; break; }
      part.push(s[i]); left -= d;
    }
    out.push(part);
  }
  return out;
}

// three box blurs in each direction come close to a soft round blur
function blur(a: Float32Array, w: number, h: number, r: number): Float32Array {
  for (let pass = 0; pass < 3; pass++) for (const [len, lines, step, jump] of [[w, h, 1, w], [h, w, w, 1]]) {
    const out = new Float32Array(a.length);
    for (let l = 0; l < lines; l++) {
      let sum = 0;
      for (let i = -r; i < len; i++) {
        if (i + r < len) sum += a[l * jump + (i + r) * step];
        if (i - r - 1 >= 0) sum -= a[l * jump + (i - r - 1) * step];
        if (i >= 0) out[l * jump + i * step] = sum / (2 * r + 1);
      }
    }
    a = out;
  }
  return a;
}

// The drawing as a picture the hero's relief can read: red is brightness, green is height, blue marks where dots exist.
function pack(strokes: Stroke[]): HTMLCanvasElement {
  const W = 200, H = 250, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!, pts = strokes.flat();
  const x0 = Math.min(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1]));
  const w = Math.max(...pts.map((p) => p[0])) - x0, h = Math.max(...pts.map((p) => p[1])) - y0, k = Math.min((W * 0.74) / Math.max(w, TAP), (H * 0.74) / Math.max(h, TAP));
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(k, 0, 0, k, W / 2 - (x0 + w / 2) * k, H / 2 - (y0 + h / 2) * k);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 3.6 / k; ctx.lineCap = ctx.lineJoin = "round";
  strokes.forEach((s) => trace(ctx, s));
  const img = ctx.getImageData(0, 0, W, H), ink = Float32Array.from({ length: W * H }, (_, i) => img.data[i * 4] / 255);
  const lum = blur(ink, W, H, 1), height = blur(ink, W, H, 4), near = blur(ink, W, H, 2);
  for (let i = 0; i < W * H; i++) {
    img.data[i * 4] = 255 * Math.min(1, lum[i] * 1.7);
    img.data[i * 4 + 1] = 255 * (0.35 + 0.6 * Math.min(1, height[i] * 2.6));
    img.data[i * 4 + 2] = near[i] > 0.02 ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export default function Board() {
  const canvas = useRef<HTMLCanvasElement>(null), eye = useRef<HTMLCanvasElement>(null);
  const [tall, setTall] = useState(false);
  const [demo, setDemo] = useState(true); // replaying real doodles until the visitor draws
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [asking, setAsking] = useState(false);
  const [, bump] = useState(0); // re-render the readouts
  const res = useStore((st) => st.res), phosphor = useStore((st) => st.phosphor), set = useStore((st) => st.set);
  const S = useRef({ net: null as Net | null, strokes: [] as Stroke[], p: null as Float32Array | null, x: new Float32Array(IN) as Float32Array, drawing: false, visible: false, dirty: true, thought: 0, di: 0, clock: 0, shown: -1 });
  const [W, H] = SIZE[tall ? "tall" : "wide"];

  useEffect(() => {
    setTall(matchMedia("(max-width: 639px)").matches);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setDemo(false);
    let asked = false;
    // the net is half a megabyte, so it is fetched when the board is about to scroll into view
    const io = new IntersectionObserver(([e]) => {
      S.current.visible = e.isIntersecting;
      if (!e.isIntersecting || asked) return;
      asked = true;
      Promise.all([fetch("/lab/doodles.json").then((r) => r.json()), fetch("/lab/doodles.bin").then((r) => r.arrayBuffer())])
        .then(([file, bin]) => { S.current.net = load(file, bin); S.current.dirty = true; bump((n) => n + 1); })
        .catch(() => setDemo(false)); // the board still draws, and the big model can still be asked
    }, { rootMargin: "50% 0px" });
    if (canvas.current) io.observe(canvas.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => { S.current.dirty = true; }, [phosphor, tall]);

  // run the net on whatever is on the board
  const think = useCallback(() => {
    const s = S.current;
    s.thought = performance.now();
    s.x = render(s.strokes, TAP);
    s.p = s.net && s.strokes.length ? forward(s.net, s.x) : null;
    s.dirty = true;
    bump((n) => n + 1);
  }, []);

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"), s = S.current;
    if (!ctx) return;
    const col = getComputedStyle(document.documentElement).getPropertyValue("--phosphor").trim() || "#edebdd";
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = col; ctx.globalAlpha = 0.16;
    for (let y = 10; y < H; y += 20) for (let x = 10; x < W; x += 20) ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
    ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = tall ? 4 : 5; ctx.lineCap = ctx.lineJoin = "round"; ctx.shadowColor = col; ctx.shadowBlur = 10;
    s.strokes.forEach((st) => trace(ctx, st, !demo));
    // what the net is actually given: the same drawing at 28 x 28
    const e = eye.current?.getContext("2d");
    if (!e) return;
    e.globalAlpha = 1; e.fillStyle = "#000"; e.fillRect(0, 0, SIDE * 4, SIDE * 4); e.fillStyle = col;
    s.x.forEach((v, i) => { if (v > 0.04) { e.globalAlpha = 0.35 + 0.65 * v; e.beginPath(); e.arc((i % SIDE) * 4 + 2, Math.floor(i / SIDE) * 4 + 2, 1.9 * Math.sqrt(v), 0, 7); e.fill(); } });
  }, [W, H, tall, demo]);

  // one rAF loop: the demo replays test doodles while the board is on screen, and the canvas is redrawn when something changed
  useEffect(() => {
    let raf = 0, prev = 0;
    S.current.dirty = true;
    const tick = (t: number) => {
      const s = S.current, list = s.net?.demo, dt = Math.min(0.1, (t - prev) / 1000);
      prev = t;
      if (demo && list?.length && s.visible && !document.hidden) {
        if ((s.clock += dt) > HOLD) { s.clock = 0; s.di = (s.di + 1) % list.length; }
        const k = Math.min(1, s.clock / DRAW);
        if (k !== s.shown) {
          s.shown = k;
          const pts = list[s.di].strokes.map((f) => Array.from({ length: f.length / 2 }, (_, i): Pt => [f[i * 2], f[i * 2 + 1]]));
          const all = pts.flat(), z = (H * 0.62) / 255, cx = Math.max(...all.map((p) => p[0])) / 2, cy = Math.max(...all.map((p) => p[1])) / 2; // the set's doodles sit in a 0..255 box, top left
          s.strokes = upTo(pts, k).map((st) => st.map(([x, y]): Pt => [W / 2 + (x - cx) * z, H / 2 + (y - cy) * z]));
          if (k === 1 || t - s.thought > 90) think();
          s.dirty = true;
        }
      }
      if (s.dirty) { s.dirty = false; draw(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [demo, draw, think, W, H]);

  const pen = (e: React.PointerEvent): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * W, Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) * H];
  };
  const wipe = (strokes: Stroke[]) => { S.current.strokes = strokes; setVerdict(null); think(); };

  // the final word: the drawing goes to a vision model on the server, and the board's own net answers if that fails
  const ask = async () => {
    const s = S.current, c = document.createElement("canvas"), ctx = c.getContext("2d")!;
    c.width = 320; c.height = (320 * H) / W;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.scale(320 / W, 320 / W); ctx.lineWidth = tall ? 5 : 8; ctx.lineCap = ctx.lineJoin = "round";
    s.strokes.forEach((st) => trace(ctx, st));
    setAsking(true); setVerdict(null);
    const r = await fetch("/api/doodle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image: c.toDataURL("image/png") }) }).catch(() => null);
    if (r?.ok) setVerdict({ ...((await r.json()) as { label: string; line: string }), mine: false });
    else setVerdict({
      label: s.net && s.p ? s.net.labels[best(s.p, 1)[0]] : "no idea", mine: true,
      line: (r?.status === 429 ? "That is a lot of drawings, and the big model needs a minute." : "The big model is not answering right now.") + " This is my own net's guess.",
    });
    setAsking(false);
  };

  const s = S.current, net = s.net, top = s.p ? best(s.p, 3) : [], conf = s.p && top.length ? s.p[top[0]] : 0, mine = !demo && s.strokes.length > 0;
  return (
    <div id="board" className="grid grid-cols-12 gap-6 items-start">
      <div className="col-span-12 lg:col-span-8">
        <div className="relative">
          <canvas ref={canvas} width={W * SCALE} height={H * SCALE} className="block w-full" style={{ aspectRatio: W + " / " + H }} role="img" aria-label="A drawing board. A neural network reads whatever is drawn on it, while it is being drawn." />
          <div
            className="slot absolute inset-0 touch-none" data-hover
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              if (demo) { setDemo(false); s.strokes = []; }
              setVerdict(null);
              s.drawing = true; s.strokes.push([pen(e)]);
              think();
            }}
            onPointerMove={(e) => {
              const stroke = s.strokes[s.strokes.length - 1];
              if (!s.drawing || !stroke) return;
              const at = pen(e), last = stroke[stroke.length - 1];
              if (Math.hypot(at[0] - last[0], at[1] - last[1]) < 3) return;
              stroke.push(at); s.dirty = true;
              if (performance.now() - s.thought > 90) think();
            }}
            onPointerUp={() => { if (s.drawing) { s.drawing = false; think(); } }} onPointerCancel={() => { s.drawing = false; }}
          >
            <span className="br" />
          </div>
          {!demo && !s.strokes.length && <p className="machine absolute inset-0 grid place-items-center pointer-events-none">draw anything here</p>}
        </div>
        <p className="machine mt-3">{demo ? "replaying a stranger's doodle from the test set. Start drawing to take over" : "mouse or finger. The guess changes while you draw"}</p>
      </div>

      <div className="col-span-12 lg:col-span-4 grid gap-5 content-start">
        <div>
          <p className="machine mb-2">my own net, running on your device</p>
          <p className="glow text-5xl leading-[0.95] min-h-[1.9em] break-words" style={{ fontFamily: "var(" + FACE[top.length ? STEPS.filter((t) => conf >= t).length : 4] + ")" }}>
            {top.length ? net!.labels[top[0]] : net ? "?" : "..."}
          </p>
          <p className="machine mt-2">
            {top.length ? pct(conf) + " sure" : "waiting for ink"}
            {top.length > 2 && <><br />or {net!.labels[top[1]]} {pct(s.p![top[1]])}, {net!.labels[top[2]]} {pct(s.p![top[2]])}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn inv disabled:opacity-40 disabled:pointer-events-none" disabled={!mine} onClick={() => wipe(s.strokes.slice(0, -1))}>Undo</button>
          <button className="btn inv" onClick={() => { setDemo(false); wipe([]); }}>Clear</button>
          <button className="btn inv" aria-pressed={demo} onClick={() => { s.clock = 0; s.shown = -1; wipe([]); setDemo((d) => !d); }}>{demo ? "Stop the replays" : "Replay test doodles"}</button>
        </div>
        <div className="border-t border-[var(--rule)] pt-5" aria-live="polite">
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-[var(--phosphor)] text-black disabled:opacity-40" disabled={!mine || asking} onClick={ask}>{asking ? "Looking..." : "Ask the big model"}</button>
            {res !== "clean" && (
              <button className="btn inv disabled:opacity-40 disabled:pointer-events-none" disabled={!mine} title="Shows your drawing in place of the portrait at the top of the page" onClick={() => { set({ doodle: pack(s.strokes), cam: "off" }); goTo(1); }}>
                Put it on the big screen
              </button>
            )}
          </div>
          {verdict ? (
            <>
              <p className="machine mt-4 mb-1">{verdict.mine ? "my own net says" : "the big model says"}</p>
              <p className="glow text-4xl leading-none break-words">{verdict.label}</p>
              <p className="mt-2">{verdict.line}</p>
            </>
          ) : (
            <p className="machine mt-3">The big model knows far more than my net does. Asking sends this one drawing to a vision model on a server.</p>
          )}
        </div>
        <div className="flex gap-4 items-start">
          <canvas ref={eye} width={SIDE * 4} height={SIDE * 4} className="w-20 shrink-0" role="img" aria-label="The drawing as the network sees it: 28 by 28 dots" />
          {net && (
            <p className="text-[var(--dim)] text-sm">
              What my net sees: 28 by 28 dots. It is {net.weights.toLocaleString("en")} numbers that I trained on {net.train.toLocaleString("en")} doodles from Google&apos;s Quick, Draw! set (CC BY 4.0), and it knows {net.labels.length} things.
              On {net.test.toLocaleString("en")} doodles it had never seen, its first guess is right {(net.top1 * 100).toFixed(0)}% of the time and the answer is in its top three {(net.top3 * 100).toFixed(0)}%.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
