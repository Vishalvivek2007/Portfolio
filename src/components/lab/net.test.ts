import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load, forward, normalise, raster, IN, SIDE, type Stroke } from "./net.ts";

const net = load(JSON.parse(readFileSync("public/lab/digits.json", "utf8")));
const best = (p: Float32Array) => p.indexOf(Math.max(...p));
const read = (strokes: Stroke[]) => best(forward(net, normalise(strokes)).p);

test("the shipped weights read the shipped test digits", () => {
  let right = 0;
  net.labels.forEach((label, i) => {
    const x = Float32Array.from(net.samples.subarray(i * IN, (i + 1) * IN), (v) => v / 255);
    const { p } = forward(net, x);
    assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-4);
    if (best(p) === label) right++;
  });
  assert.ok(right >= net.labels.length - 3, right + " of " + net.labels.length);
});

test("pen strokes are centred on their mass and stay inside the field", () => {
  const x = normalise([[[0.1, 0.1], [0.2, 0.4]], [[0.2, 0.4], [0.15, 0.45]]]); // a small mark in a corner of the pad
  let m = 0, mx = 0, my = 0;
  x.forEach((v, i) => { m += v; mx += v * ((i % SIDE) + 0.5); my += v * (Math.floor(i / SIDE) + 0.5); });
  assert.ok(m > 0 && Math.abs(mx / m - 14) < 0.6 && Math.abs(my / m - 14) < 0.6);
  assert.equal(raster([]).reduce((a, b) => a + b, 0), 0);
});

test("simple drawn shapes are read as the digits they are, wherever and however big they are drawn", () => {
  const ring = (cx: number, cy: number, rx: number, ry: number): Stroke => Array.from({ length: 41 }, (_, i) => [cx + rx * Math.cos((i / 40) * 2 * Math.PI), cy + ry * Math.sin((i / 40) * 2 * Math.PI)]);
  assert.equal(read([ring(0.5, 0.5, 0.22, 0.32)]), 0);
  assert.equal(read([ring(0.25, 0.3, 0.09, 0.14)]), 0);
  assert.equal(read([[[0.5, 0.15], [0.5, 0.85]]]), 1);
  assert.equal(read([[[0.8, 0.55], [0.78, 0.9]]]), 1);
  assert.equal(read([[[0.3, 0.2], [0.7, 0.2], [0.45, 0.85]]]), 7);
  assert.equal(read([[[0.62, 0.15], [0.32, 0.6], [0.75, 0.6]], [[0.62, 0.15], [0.62, 0.88]]]), 4);
});
