import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTrack, edge, ray, spawn, newSchool, tickSchool, HOME, HW, RANGE, type Pt } from "./school.ts";

// a small seeded generator so failures repeat
const seeded = (s: number) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const box: Pt[] = [[500, 60], [920, 60], [920, 380], [80, 380], [80, 60]]; // starts in the middle of the top side

test("a stroke becomes a closed, evenly spaced road with its corners rounded; a tiny loop is refused", () => {
  for (const stroke of [box, [[100, 380], [500, 50], [900, 380]] as Pt[]]) {
    const t = buildTrack(stroke, 1000, 440)!;
    assert.ok(t.n > 40);
    for (let i = 0; i < t.n; i++) {
      const j = (i + 1) % t.n, k = (i + 2) % t.n, ux = t.x[j] - t.x[i], uy = t.y[j] - t.y[i], vx = t.x[k] - t.x[j], vy = t.y[k] - t.y[j];
      assert.ok(Math.abs(Math.hypot(ux, uy) - t.step) < 0.5, "spacing at " + i + ": " + Math.hypot(ux, uy));
      assert.ok(t.step / Math.max(Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)), 1e-9) > 30, "bend too tight at " + i);
      assert.ok(Math.abs(edge(t, t.x[i], t.y[i]) - HW) < 2.5, "the centreline is the middle of the road");
    }
    assert.ok(edge(t, 500, 220) < 0, "the middle of the canvas is not road");
  }
  assert.equal(buildTrack([[100, 100], [180, 100], [180, 160], [100, 160]], 1000, 440), null);
  assert.ok(buildTrack(HOME.map(([u, v]): Pt => [u * 1000, v * 440]), 1000, 440), "the home road, wide");
  assert.ok(buildTrack(HOME.map(([u, v]): Pt => [v * 400, u * 520]), 400, 520), "the home road, tall");
});

test("sensors read the distance to the edge of the road", () => {
  const t = buildTrack(box, 1000, 440)!;
  const c = { ...spawn(t, 0), x: t.x[0], y: t.y[0] }; // on the centreline of a straight, pointing along it
  assert.equal(ray(t, c, 0), RANGE); // nothing ahead within range
  for (const a of [-1.4, 1.4]) assert.ok(Math.abs(ray(t, c, a) - HW / Math.sin(1.4)) < 2.5, "side sensor reads " + ray(t, c, a));
});

test("drivers that start with blank brains learn to finish a lap, also on a road that crosses itself", () => {
  const eight = Array.from({ length: 80 }, (_, i): Pt => { const a = (i / 80) * 2 * Math.PI; return [500 + 380 * Math.sin(a), 220 + 160 * Math.sin(2 * a)]; });
  for (const stroke of [HOME.map(([u, v]): Pt => [u * 1000, v * 440]), eight]) {
    const rnd = seeded(7), s = newSchool(buildTrack(stroke, 1000, 440)!, rnd);
    while (!s.bestLap && s.gen <= 40) tickSchool(s, rnd);
    assert.ok(s.history[0] < 0.5, "generation 1 got " + s.history[0] + " of the lap");
    assert.ok(s.bestLap > 0, "nobody finished a lap in 40 generations");
  }
});
