"use client";
import { useEffect, useState } from "react";
import gsap from "gsap";

// Power-on, boot log (every line is a real measurement), staged reveal. Any input skips.
export default function Boot() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const d = document.documentElement;
    const mode = d.dataset.boot;
    if (mode !== "run" && mode !== "short") return;
    const run = mode === "run";
    const body = document.body;
    const calls: gsap.core.Tween[] = [];
    let dead = false;
    const at = (t: number, fn: () => void) => { if (!dead) calls.push(gsap.delayedCall(t, fn)); };
    const log = (s: string) => setLines((l) => [...l, s]);

    const finish = () => {
      dead = true;
      calls.forEach((c) => c.kill());
      body.style.clipPath = "";
      d.dataset.boot = "done";
      setLines([]);
      try { sessionStorage.setItem("raster-booted", "1"); } catch { /* storage blocked */ }
      dispatchEvent(new Event("raster:skip"));
      removeEventListener("keydown", skip); removeEventListener("pointerdown", skip); removeEventListener("wheel", skip);
    };
    const skip = () => finish();
    addEventListener("keydown", skip); addEventListener("pointerdown", skip); addEventListener("wheel", skip, { passive: true });

    // power on: the line opens to a full screen in six steps
    const open = [49.9, 40, 28, 16, 6, 0];
    open.forEach((v, i) => at(0.05 + i * 0.04, () => { body.style.clipPath = "inset(" + v + "% 0)"; }));
    if (!run) { at(0.4, finish); return () => { dead = true; calls.forEach((c) => c.kill()); }; }

    // boot log, each line when its real event is known, at least 120 ms apart
    let t = 0.25;
    const next = () => (t += 0.14);
    at(next(), () => log("vv-bios 3.0"));
    let hz = 0;
    let n = 0, t0 = 0;
    const raf = (ts: number) => { if (!t0) t0 = ts; if (++n < 10) requestAnimationFrame(raf); else hz = Math.round((9 * 1000) / (ts - t0)); };
    requestAnimationFrame(raf);
    at(next(), () => log("display " + innerWidth + "x" + innerHeight + " @ " + (hz || 60) + " Hz  ok"));
    at(next(), () => {
      let gpu = "unknown";
      try {
        const gl = document.createElement("canvas").getContext("webgl");
        const ext = gl?.getExtension("WEBGL_debug_renderer_info");
        if (gl && ext) gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).replace(/\(.*?\)|ANGLE|Direct3D\d+|vs_\d_\d|ps_\d_\d/g, "").trim().slice(0, 28) || "unknown";
      } catch { /* no webgl */ }
      log("adapter " + gpu + "  ok");
    });
    document.fonts.ready.then(() => at(next(), () => log("fonts  ok")));
    const img = new Image();
    img.onload = () => at(next(), () => log("portrait decoded  ok"));
    img.src = "/relief/portrait.png";

    // staged reveal of the supporting copy, then done
    at(2.1, () => { setLines([]); d.dataset.boot = "late1"; });
    at(2.2, () => { d.dataset.boot = "late2"; });
    at(2.3, finish);

    return () => { dead = true; calls.forEach((c) => c.kill()); removeEventListener("keydown", skip); removeEventListener("pointerdown", skip); removeEventListener("wheel", skip); };
  }, []);

  if (!lines.length) return null;
  return (
    <pre aria-hidden className="machine fixed z-[55] left-[calc(var(--pad)+8px)] top-24 pointer-events-none" style={{ color: "var(--phosphor)" }}>
      {lines.join("\n")}
    </pre>
  );
}
