"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildTrack, newSchool, tickSchool, edge, ray, heading, HOME, HW, CAR, RAYS, IN, HID, OUT, GENES, POP, type Pt, type School, type Track } from "./school";

const SIZE = { wide: [1000, 440], tall: [400, 520] } as const; // world units; narrow screens get the tall one
const BRAIN = [300, 184] as const;
const SCALE = 2; // canvas pixels per unit, so the dots stay crisp
const BARS = 30; // generations shown in the progress chart

// the road does not change while it is being driven, so it is drawn once and reused
function paintRoad(t: Track, col: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = t.w * SCALE; c.height = t.h * SCALE;
  const ctx = c.getContext("2d")!;
  ctx.scale(SCALE, SCALE); ctx.fillStyle = col;
  const dot = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  ctx.globalAlpha = 0.14;
  for (let y = 4; y < t.h; y += 8) for (let x = 4; x < t.w; x += 8) if (edge(t, x, y) > 4) dot(x, y, 1.2);
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < t.n; i++) {
    const [dx, dy] = heading(t, i);
    for (const side of [-HW, HW]) {
      const x = t.x[i] - dy * side, y = t.y[i] + dx * side;
      if (Math.abs(edge(t, x, y)) < 2.5) dot(x, y, 1.5); // skipped where another stretch of road covers this edge
    }
  }
  ctx.globalAlpha = 1;
  const [dx, dy] = heading(t, 0);
  for (let k = -HW + 3; k <= HW - 3; k += 6) ctx.fillRect(t.x[0] - dy * k - 2, t.y[0] + dx * k - 2, 4, 4); // start line
  return c;
}

export default function Drive() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const brain = useRef<HTMLCanvasElement>(null);
  const [tall, setTall] = useState(false);
  const [fine, setFine] = useState(true); // a mouse draws straight on the screen; a finger has to switch drawing on first, so it can still scroll past
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [note, setNote] = useState("");
  const [, bump] = useState(0); // re-render the readouts
  const S = useRef({
    school: null as School | null, stroke: null as Pt[] | null,
    road: null as HTMLCanvasElement | null, roadOf: null as Track | null, roadCol: "",
    acc: 0, frame: 0, visible: false, dirty: true,
  });

  useEffect(() => {
    const t = matchMedia("(max-width: 639px)").matches, [w, h] = SIZE[t ? "tall" : "wide"];
    setTall(t);
    setFine(matchMedia("(hover: hover) and (pointer: fine)").matches);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
    S.current.school = newSchool(buildTrack(HOME.map(([u, v]): Pt => (t ? [v * w, u * h] : [u * w, v * h])), w, h)!);
    const io = new IntersectionObserver(([e]) => { S.current.visible = e.isIntersecting; });
    if (canvas.current) io.observe(canvas.current);
    return () => io.disconnect();
  }, []);

  const draw = useCallback(() => {
    const c = canvas.current, ctx = c?.getContext("2d"), s = S.current, sc = s.school;
    if (!c || !ctx || !sc) return;
    const css = getComputedStyle(document.documentElement), col = css.getPropertyValue("--phosphor").trim() || "#edebdd", t = sc.track;
    if (s.roadOf !== t || s.roadCol !== col) { s.road = paintRoad(t, col); s.roadOf = t; s.roadCol = col; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(s.road!, 0, 0);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
    let lead = -1;
    sc.cars.forEach((car, i) => {
      ctx.beginPath(); ctx.arc(car.x, car.y, CAR - 0.5, 0, 7);
      if (!car.alive) { ctx.globalAlpha = 0.35; ctx.stroke(); return; } // where it crashed
      ctx.globalAlpha = 0.9; ctx.fill();
      if (lead < 0 || car.dist > sc.cars[lead].dist) lead = i;
    });
    if (lead >= 0) {
      const L = sc.cars[lead];
      for (const r of RAYS) {
        const d = ray(t, L, r), x = L.x + Math.cos(L.a + r) * d, y = L.y + Math.sin(L.a + r) * d;
        ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(L.x, L.y, CAR + 2, 0, 7); ctx.fill();
    }
    if (s.stroke) { ctx.globalAlpha = 1; s.stroke.forEach(([x, y]) => ctx.fillRect(x - 2, y - 2, 4, 4)); }

    // the leader's brain: what it senses, its neurons, what it does. Wires are brighter the more signal they carry.
    const b = brain.current?.getContext("2d");
    if (!b) return;
    b.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    b.globalAlpha = 1; b.fillStyle = "#000"; b.fillRect(0, 0, BRAIN[0], BRAIN[1]);
    if (lead < 0) return;
    const act = sc.cars[lead].act, g = sc.pop[lead];
    const at = (layer: number, k: number): Pt => (layer < 2 ? [30 + layer * 120, 12 + k * 23] : [270, 58 + k * 69]);
    b.fillStyle = col; b.strokeStyle = col; b.lineWidth = 1;
    const wire = (from: Pt, to: Pt, signal: number) => {
      const a = Math.min(0.7, Math.abs(signal) * 0.9);
      if (a < 0.04) return;
      b.globalAlpha = a; b.beginPath(); b.moveTo(from[0], from[1]); b.lineTo(to[0], to[1]); b.stroke();
    };
    for (let j = 0; j < HID; j++) {
      for (let i = 0; i < IN; i++) wire(at(0, i), at(1, j), g[j * IN + i] * act[i]);
      for (let o = 0; o < OUT; o++) wire(at(1, j), at(2, o), g[IN * HID + HID + o * HID + j] * act[IN + j]);
    }
    [IN, HID, OUT].forEach((count, layer) => {
      for (let k = 0; k < count; k++) {
        const v = act[[0, IN, IN + HID][layer] + k], [x, y] = at(layer, k);
        b.globalAlpha = 0.4 + 0.6 * Math.abs(v);
        b.beginPath(); b.arc(x, y, 1.5 + 6.5 * Math.sqrt(Math.abs(v)), 0, 7);
        if (v >= 0) b.fill(); else b.stroke(); // solid = positive, ring = negative
      }
    });
    b.globalAlpha = 0.6;
    b.font = "400 10px " + (css.getPropertyValue("--font-geist-pixel-square").trim() || "monospace");
    b.fillText("steer", 255, 36); b.fillText("speed", 255, 152);
  }, []);

  // one rAF loop: the school runs while it is on screen, `speed` times real time
  useEffect(() => {
    let raf = 0, prev = 0;
    S.current.dirty = true;
    const tick = (now: number) => {
      const s = S.current, dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (s.school && playing && s.visible && !document.hidden) {
        s.acc += dt * 60 * speed;
        for (let n = Math.min(48, Math.floor(s.acc)); n > 0; n--) tickSchool(s.school);
        s.acc %= 1;
        s.dirty = true;
        if (++s.frame % 6 === 0) bump((n) => n + 1);
      }
      if (s.dirty) { s.dirty = false; draw(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, tall, draw]);

  const [w, h] = SIZE[tall ? "tall" : "wide"];
  const world = (e: React.PointerEvent): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * h];
  };
  // the stroke becomes the new road and a new school starts on it from blank brains
  const finish = () => {
    const s = S.current, stroke = s.stroke;
    s.stroke = null; s.dirty = true;
    if (!stroke || stroke.length < 8) return; // a click, not a drawing
    const track = buildTrack(stroke, w, h);
    if (track) { s.school = newSchool(track); setArmed(false); }
    setNote(track ? "" : "That loop is too small to drive. Draw a bigger one.");
  };

  const s = S.current, sc = s.school;
  const alive = sc ? sc.cars.filter((c) => c.alive).length : 0;
  const best = sc ? Math.max(0, ...sc.history, ...sc.cars.map((c) => c.dist / sc.track.len)) : 0;
  const bars = sc ? sc.history.slice(-BARS) : [];
  return (
    <div id="driving">
      <h3 className="h2 !text-4xl md:!text-5xl mb-3">Driving school</h3>
      <p className="max-w-[62ch] text-[var(--dim)] mb-6">
        Draw a road. {POP} small neural networks will learn to drive it while you watch. Nobody tells them how: after each heat the ones that got furthest have children, and a few numbers in each child are nudged at random.
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button className="btn inv" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
        <button className="btn inv" onClick={() => { if (sc) { s.school = newSchool(sc.track); s.dirty = true; bump((n) => n + 1); } }}>Start over</button>
        {!fine && <button className={"btn inv" + (armed ? " bg-[var(--phosphor)] text-black" : "")} aria-pressed={armed} onClick={() => setArmed((a) => !a)}>Draw a road</button>}
        <label className="machine flex items-center gap-2 ml-2">speed
          <input type="range" min={1} max={8} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="accent-[var(--phosphor)]" />
        </label>
      </div>
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-9">
          <div
            className="slot border border-[var(--rule)]" style={{ touchAction: fine || armed ? "none" : "auto" }}
            onPointerDown={(e) => { if (!fine && !armed) return; e.currentTarget.setPointerCapture(e.pointerId); s.stroke = [world(e)]; s.dirty = true; }}
            onPointerMove={(e) => {
              const last = s.stroke?.[s.stroke.length - 1], p = world(e);
              if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) > 6) { s.stroke!.push(p); s.dirty = true; }
            }}
            onPointerUp={finish} onPointerCancel={finish}
          >
            <span className="br" />
            <canvas ref={canvas} width={w * SCALE} height={h * SCALE} className="block w-full" style={{ aspectRatio: w + " / " + h }} role="img" aria-label="A road seen from above, with a swarm of small cars learning to drive around it" />
          </div>
          <p className="machine mt-3">
            {note || (fine ? "drag on the screen to draw your own road" : armed ? "now draw a loop with your finger" : "press Draw a road to make your own")}
            {" "}&nbsp; big dot = the leader, with what it senses &nbsp; rings = crashes
          </p>
          <p className="mt-4 max-w-[62ch] text-[var(--dim)]">Each driver is {GENES} numbers. They all start close to zero, so generation 1 drives straight into the first wall.</p>
        </div>
        <div className="col-span-12 lg:col-span-3 grid gap-5 content-start">
          <div className="flex items-end gap-4">
            <p className="glow text-8xl leading-[0.8] font-[family-name:var(--font-dot)]" aria-label={"Generation " + (sc?.gen ?? 1)}>{sc?.gen ?? 1}</p>
            <p className="machine pb-1">generation<br />{alive} of {POP} still driving</p>
          </div>
          <p>
            {sc?.bestLap
              ? "Best lap so far: " + (sc.bestLap / 60).toFixed(1) + " s on the race clock. Now the fastest one wins each heat."
              : "Nobody has finished a lap yet. The best so far got " + Math.round(best * 100) + "% of the way round."}
          </p>
          <div>
            <p className="machine mb-2">how far the best of each generation got</p>
            <svg viewBox={`0 0 ${BARS * 6} 36`} className="block w-full text-[var(--phosphor)]" shapeRendering="crispEdges" role="img" aria-label={"Progress over the last " + bars.length + " generations"}>
              {bars.map((v, i) => (
                <rect key={i} x={i * 6} y={36 - Math.max(1, v * 36)} width={4} height={Math.max(1, v * 36)} fill="currentColor" opacity={v >= 1 ? 1 : 0.5} />
              ))}
            </svg>
          </div>
          <div>
            <p className="machine mb-2">the leader&apos;s brain, live</p>
            <canvas ref={brain} width={BRAIN[0] * SCALE} height={BRAIN[1] * SCALE} className="block w-full max-w-[300px]" role="img" aria-label="The leading car's neural network: eight inputs, eight neurons, two outputs" />
            <p className="machine mt-2">left: seven distances and its own speed<br />middle: {HID} neurons</p>
          </div>
        </div>
      </div>
    </div>
  );
}
