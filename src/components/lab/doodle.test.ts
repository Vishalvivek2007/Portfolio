import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load, forward, render, best, IN, SIDE, type Stroke } from "./doodle.ts";

const bin = readFileSync("public/lab/doodles.bin");
const net = load(JSON.parse(readFileSync("public/lab/doodles.json", "utf8")), bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength) as ArrayBuffer);

test("a drawing is scaled to 24 cells and centred, wherever and however large it was drawn", () => {
  const row = (x: Float32Array, y: number) => Array.from(x.subarray(y * SIDE, (y + 1) * SIDE));
  const full = (x: Float32Array, y: number) => row(x, y).map((v) => +(v > 0.9)).join("");
  for (const line of [[[10, 500], [900, 500]], [[0.2, 0.1], [0.3, 0.1]]] as Stroke[]) {
    const x = render([line]);
    for (const y of [13, 14]) assert.equal(full(x, y), "0011111111111111111111111100"); // the two rows the line runs between
    assert.equal(Math.max(...row(x, 11), ...row(x, 16)), 0);
  }
  assert.equal(render([]).some((v) => v > 0), false);
  assert.equal(render([[[5, 5]]]).some(Number.isNaN), false); // one tap is a dot, not a division by zero
  assert.ok(render([[[5, 5]]])[14 * SIDE + 14] > 0.2);
});

test("the net on the page gives the answers the trained net gave", () => {
  const fx = JSON.parse(readFileSync("src/components/lab/doodle.fixture.json", "utf8")), px = Buffer.from(fx.x, "base64");
  fx.top.forEach((top: number[], n: number) => {
    const p = forward(net, Float32Array.from(px.subarray(n * IN, (n + 1) * IN), (v) => v / 255));
    assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-4);
    top.forEach((label, k) => assert.ok(Math.abs(p[label] - fx.p[n][k]) < 1e-3, `doodle ${n}, label ${label}: ${p[label]} against ${fx.p[n][k]}`));
  });
});

test("every demo doodle is read correctly from its strokes", () => {
  assert.ok(net.demo.length >= 6);
  for (const d of net.demo) {
    const strokes = d.strokes.map((s) => Array.from({ length: s.length / 2 }, (_, i) => [s[i * 2], s[i * 2 + 1]] as [number, number]));
    assert.equal(net.labels[best(forward(net, render(strokes)), 1)[0]], net.labels[d.label]);
  }
});
