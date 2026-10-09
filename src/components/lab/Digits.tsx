"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { load, forward, normalise, raster, IN, SIDE, type Net, type Pt, type Stroke } from "./net";

type Box = { x: number; y: number; s: number };
// Where things sit on the canvas, in its own units. Wide screens read left to right, narrow ones top to bottom.
const LAYOUT = {
  wide: { W: 1000, H: 424, pad: { x: 4, y: 26, s: 392 }, inp: { x: 474, y: 152, s: 140 }, hid: { x: 694, y: 134, s: 176 }, out: { x: 964, y: 36, dx: 0, dy: 39 } },
  tall: { W: 400, H: 772, pad: { x: 4, y: 26, s: 392 }, inp: { x: 22, y: 484, s: 140 }, hid: { x: 204, y: 466, s: 176 }, out: { x: 20, y: 716, dx: 40, dy: 0 } },
};
const SCALE = 2; // canvas pixels per layout unit, so the dots stay crisp
const GRID = 8; // the 64 neurons are drawn 8 x 8
// the answer is set in rougher pixel type while the net is unsure and resolves to the clean face as it gets sure
const FACE = ["--font-geist-pixel-line", "--font-geist-pixel-triangle", "--font-geist-pixel-circle", "--font-geist-pixel-grid", "--font-geist-pixel-square", "--font-geist-sans"];
const STEPS = [0.4, 0.55, 0.7, 0.85, 0.95];
const pct = (p: number) => Math.round(p * 100) + "%";
const best = (p: Float32Array, skip = -1) => { let b = -1; p.forEach((v, i) => { if (i !== skip && (b < 0 || v > p[b])) b = i; }); return b; };

export default function Digits() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tall, setTall] = useState(false);
  const [demo, setDemo] = useState(true); // cycling through real test digits until the visitor draws
  const [, bump] = useState(0); // re-render the readouts
  const S = useRef({
    net: null as Net | null, strokes: [] as Stroke[], drawing: false,
    shown: new Float32Array(IN) as Float32Array, // what the pad shows
    x: new Float32Array(IN) as Float32Array, // what the net is fed
    out: null as ReturnType<typeof forward> | null,
    di: -1, clock: 9, demoRight: 0, neuron: -1, dirty: true, visible: false,
  });

  useEffect(() => {
    setTall(matchMedia("(max-width: 639px)").matches);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setDemo(false);
    fetch("/lab/digits.json").then((r) => r.json()).then((file) => {
      const s = S.current, net = load(file);
      s.net = net;
      s.demoRight = net.labels.filter((label, i) => best(forward(net, Float32Array.from(net.samples.subarray(i * IN, (i + 1) * IN), (v) => v / 255)).p) === label).length;
      s.dirty = true;
      bump((n) => n + 1);
    }).catch(() => { /* the section stays an empty pad */ });
    const io = new IntersectionObserver(([e]) => { S.current.visible = e.isIntersecting; });
    if (canvas.current) io.observe(canvas.current);
    return () => io.disconnect();
  }, []);

  // run the net on whatever is on the pad
  const think = useCallback(() => {
    const s = S.current;
    s.shown = raster(s.strokes);
    s.x = normalise(s.strokes);
    s.out = s.net && s.strokes.length ? forward(s.net, s.x) : null;
    s.dirty = true;
    bump((n) => n + 1);
  }, []);
  const clear = useCallback(() => { S.current.strokes = []; think(); }, [think]);

  const draw = useCallback(() => {
    const c = canvas.current, ctx = c?.getContext("2d"), s = S.current, L = LAYOUT[tall ? "tall" : "wide"];
    if (!c || !ctx) return;
    const css = getComputedStyle(document.documentElement), col = css.getPropertyValue("--phosphor").trim() || "#edebdd";
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, L.W, L.H);
    ctx.fillStyle = col; ctx.strokeStyle = col;
    ctx.font = "400 11px " + (css.getPropertyValue("--font-geist-pixel-square").trim() || "monospace");
    const disc = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
    const ring = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); };
    const line = (x0: number, y0: number, x1: number, y1: number) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
    const label = (t: string, b: Box) => { ctx.globalAlpha = 0.6; ctx.fillText(t, b.x, b.y - 9); ctx.globalAlpha = 1; };
    // a 28 x 28 field: solid dots for positive values, rings for negative ones
    const field = (b: Box, v: Float32Array) => {
      const cell = b.s / SIDE;
      for (let i = 0; i < IN; i++) {
        const cx = b.x + ((i % SIDE) + 0.5) * cell, cy = b.y + (Math.floor(i / SIDE) + 0.5) * cell, a = v[i];
        if (Math.abs(a) < 0.05) { ctx.globalAlpha = 0.2; ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1); }
        else if (a > 0) { ctx.globalAlpha = 0.35 + 0.65 * a; disc(cx, cy, cell * 0.5 * Math.sqrt(a)); }
        else { ctx.globalAlpha = 0.85; ctx.lineWidth = 0.6; ring(cx, cy, cell * 0.44 * Math.sqrt(-a)); }
      }
      ctx.globalAlpha = 1;
    };
    // two faint lines from one block's edge to the next: every cell on the left feeds every cell on the right
    const funnel = (a: Box, b: Box, down: boolean) => {
      ctx.globalAlpha = 0.22; ctx.lineWidth = 0.75;
      if (down) { line(a.x, a.y + a.s, b.x, b.y); line(a.x + a.s, a.y + a.s, b.x + b.s, b.y); }
      else { line(a.x + a.s, a.y, b.x, b.y); line(a.x + a.s, a.y + a.s, b.x, b.y + b.s); }
      ctx.globalAlpha = 1;
    };

    const net = s.net, H = net?.hidden ?? GRID * GRID;
    label(demo && net && s.di >= 0 ? "test digit " + (s.di + 1) + " of " + net.labels.length : "draw a digit here", L.pad);
    field(L.pad, s.shown);
    funnel(L.pad, L.inp, tall);

    // hovering a neuron swaps the input view for that neuron's 784 weights
    let seen = s.x;
    if (net && s.neuron >= 0) {
      seen = Float32Array.from({ length: IN }, (_, k) => net.w1[k * H + s.neuron]);
      const top = seen.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9);
      seen = seen.map((v) => v / top);
    }
    label(s.neuron >= 0 ? "neuron " + (s.neuron + 1) + " looks for" : "what the net sees", L.inp);
    field(L.inp, seen);
    funnel(L.inp, L.hid, false);

    const cell = L.hid.s / GRID, h = s.out?.h, p = s.out?.p, win = p ? best(p) : -1;
    const at = (j: number): Pt => [L.hid.x + ((j % GRID) + 0.5) * cell, L.hid.y + (Math.floor(j / GRID) + 0.5) * cell];
    const outAt = (d: number): Pt => [L.out.x + d * L.out.dx, L.out.y + d * L.out.dy];
    // lines from the neurons that pushed hardest for the winning digit
    if (net && h && win >= 0) {
      const push = Array.from(h, (v, j) => v * net.w2[win * H + j]), top = Math.max(...push, 1e-9);
      ctx.lineWidth = 0.75;
      push.forEach((v, j) => { if (v > top * 0.12) { ctx.globalAlpha = 0.65 * (v / top); line(...at(j), ...outAt(win)); } });
      ctx.globalAlpha = 1;
    }
    label(H + " neurons", L.hid);
    const peak = h ? Math.max(...h, 1e-9) : 1;
    for (let j = 0; j < H; j++) {
      const [cx, cy] = at(j), a = h ? h[j] / peak : 0;
      ctx.globalAlpha = a > 0.02 ? 0.35 + 0.65 * a : 0.3;
      disc(cx, cy, a > 0.02 ? cell * 0.44 * Math.sqrt(a) : 1);
      if (j === s.neuron) { ctx.globalAlpha = 1; ctx.lineWidth = 1; ring(cx, cy, cell * 0.5); }
    }
    for (let d = 0; d < 10; d++) {
      const [cx, cy] = outAt(d), v = p ? p[d] : 0;
      ctx.globalAlpha = d === win ? 1 : 0.3 + 0.5 * v;
      disc(cx, cy, 2 + 11 * Math.sqrt(v));
      ctx.fillText(String(d), tall ? cx - 3 : cx - 26, tall ? cy + 30 : cy + 4);
    }
    ctx.globalAlpha = 1;
  }, [tall, demo]);

  // one rAF loop: the demo steps through the test digits while the canvas is on screen
  useEffect(() => {
    let raf = 0, prev = 0;
    S.current.dirty = true;
    const tick = (t: number) => {
      const s = S.current, net = s.net, dt = Math.min(0.1, (t - prev) / 1000);
      prev = t;
      if (net && demo && s.visible && !document.hidden && (s.clock += dt) > 1.3) {
        s.clock = 0;
        s.di = (s.di + 1) % net.labels.length;
        s.shown = s.x = Float32Array.from(net.samples.subarray(s.di * IN, (s.di + 1) * IN), (v) => v / 255);
        s.out = forward(net, s.x);
        s.dirty = true;
        bump((n) => n + 1);
      }
      if (s.dirty) { s.dirty = false; draw(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [demo, draw]);

  const pen = (e: React.PointerEvent): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))];
  };
  const overNeuron = (e: React.PointerEvent) => {
    const s = S.current, L = LAYOUT[tall ? "tall" : "wide"], r = e.currentTarget.getBoundingClientRect();
    const gx = Math.floor(((((e.clientX - r.left) / r.width) * L.W - L.hid.x) / L.hid.s) * GRID), gy = Math.floor(((((e.clientY - r.top) / r.height) * L.H - L.hid.y) / L.hid.s) * GRID);
    const j = gx >= 0 && gy >= 0 && gx < GRID && gy < GRID ? gy * GRID + gx : -1;
    if (j !== s.neuron) { s.neuron = j; s.dirty = true; bump((n) => n + 1); }
  };

  const s = S.current, net = s.net, L = LAYOUT[tall ? "tall" : "wide"];
  const p = s.out?.p, win = p ? best(p) : -1, conf = p ? p[win] : 0, next = p ? best(p, win) : -1;
  const box = (b: Box) => ({ left: (b.x / L.W) * 100 + "%", top: (b.y / L.H) * 100 + "%", width: (b.s / L.W) * 100 + "%", height: (b.s / L.H) * 100 + "%" });
  return (
    <div id="digits" className="mt-28">
      <h3 className="h2 !text-4xl md:!text-5xl mb-3">Digit reader</h3>
      <p className="max-w-[62ch] text-[var(--dim)] mb-8">
        Draw a digit. A small neural network reads it while you draw, and every one of its neurons is on show. It was written and trained from scratch for this page.
      </p>
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-9">
          <div className="relative">
            <canvas
              ref={canvas} width={L.W * SCALE} height={L.H * SCALE} className="block w-full" style={{ aspectRatio: L.W + " / " + L.H }}
              role="img" aria-label="A drawing pad feeding a neural network: the input as the net sees it, its 64 neurons, and the ten possible answers"
              onPointerMove={overNeuron} onPointerDown={overNeuron} onPointerLeave={() => { s.neuron = -1; s.dirty = true; bump((n) => n + 1); }}
            />
            <div
              className="slot absolute touch-none" style={box(L.pad)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                if (demo) { setDemo(false); s.strokes = []; }
                s.drawing = true; s.strokes.push([pen(e)]);
                think();
              }}
              onPointerMove={(e) => {
                const stroke = s.strokes[s.strokes.length - 1];
                if (!s.drawing || !stroke) return;
                const at = pen(e), last = stroke[stroke.length - 1];
                if (Math.hypot(at[0] - last[0], at[1] - last[1]) > 0.012) { stroke.push(at); think(); }
              }}
              onPointerUp={() => { s.drawing = false; }} onPointerCancel={() => { s.drawing = false; }}
            >
              <span className="br" />
            </div>
          </div>
          <p className="machine mt-3">point at a neuron to see what it looks for &nbsp; solid dot = wants ink there &nbsp; ring = wants it empty</p>
        </div>
        <div className="col-span-12 lg:col-span-3 grid gap-5 content-start">
          <div className="flex items-end gap-4">
            <p className="glow text-[9rem] leading-[0.8] w-[0.75em] text-center" style={{ fontFamily: "var(" + FACE[STEPS.filter((t) => conf >= t).length] + ")" }} aria-label={win >= 0 ? "The network reads " + win : "Nothing to read yet"}>
              {win >= 0 ? win : "?"}
            </p>
            <p className="machine pb-1">
              {win >= 0 ? pct(conf) + " sure" : "waiting for ink"}
              {win >= 0 && <><br />next guess {next} at {pct(p![next])}</>}
            </p>
          </div>
          <p>
            {demo && net && s.di >= 0
              ? "This one is from the test set. A person labelled it " + net.labels[s.di] + ". The net reads " + s.demoRight + " of these " + net.labels.length + " correctly."
              : "The answer is set in rough pixel type while the net is unsure, and sharpens as it makes up its mind."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn inv" onClick={() => { setDemo(false); clear(); }}>Clear</button>
            <button className="btn inv" aria-pressed={demo} onClick={() => { clear(); s.clock = 9; setDemo((d) => !d); }}>{demo ? "Stop the test digits" : "Show test digits"}</button>
          </div>
          {net && (
            <p className="text-[var(--dim)]">
              {(IN * net.hidden + net.hidden + net.hidden * 10 + 10).toLocaleString("en")} numbers, learned from {net.train.toLocaleString("en")} handwritten digits.
              On {net.test.toLocaleString("en")} digits it had never seen, it reads {(net.acc * 100).toFixed(1)}% correctly. No ML library is involved, only arithmetic.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
