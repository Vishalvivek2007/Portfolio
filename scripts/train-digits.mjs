// Trains the Lab's digit reader from scratch: 784 inputs -> 64 ReLU -> 10 softmax, per-sample SGD, no ML library.
// Downloads MNIST into assets-src/mnist on first run, then writes public/lab/digits.json
// (int8 weights, the measured test accuracy, and a few test digits for the demo loop). Run: npm run train:digits
import { gunzipSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const DIR = "assets-src/mnist", BASE = "https://storage.googleapis.com/cvdf-datasets/mnist/";
const H = 64, IN = 784, EPOCHS = 14, DEMO = 30;
mkdirSync(DIR, { recursive: true });
mkdirSync("public/lab", { recursive: true });

const load = async (name, header) => {
  const path = DIR + "/" + name;
  if (!existsSync(path)) {
    const res = await fetch(BASE + name);
    if (!res.ok) throw new Error("could not download " + name + ": " + res.status);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return gunzipSync(readFileSync(path)).subarray(header);
};
const trainX = await load("train-images-idx3-ubyte.gz", 16), trainY = await load("train-labels-idx1-ubyte.gz", 8);
const testX = await load("t10k-images-idx3-ubyte.gz", 16), testY = await load("t10k-labels-idx1-ubyte.gz", 8);
const nTrain = trainY.length, nTest = testY.length;

// seeded, so a rerun gives the same network
let seed = 20261009;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const randn = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

// w1 is stored input-major (w1[k * H + j]) so the loop over one input pixel's weights is contiguous
const w1 = Float32Array.from({ length: IN * H }, () => randn() * Math.sqrt(2 / IN)), b1 = new Float32Array(H);
const w2 = Float32Array.from({ length: 10 * H }, () => randn() * Math.sqrt(2 / H)), b2 = new Float32Array(10);

const x = new Float32Array(IN), h = new Float32Array(H), p = new Float32Array(10), dh = new Float32Array(H);
// copies image i into x, shifted by (dx, dy) pixels
const sample = (src, i, dx = 0, dy = 0) => {
  x.fill(0);
  for (let y = 0; y < 28; y++) {
    const sy = y - dy;
    if (sy < 0 || sy > 27) continue;
    for (let xx = 0; xx < 28; xx++) { const sx = xx - dx; if (sx >= 0 && sx < 28) x[y * 28 + xx] = src[i * IN + sy * 28 + sx] / 255; }
  }
};
const forward = (W1, W2) => {
  h.set(b1);
  for (let k = 0; k < IN; k++) { const v = x[k]; if (v) for (let j = 0, o = k * H; j < H; j++) h[j] += W1[o + j] * v; }
  for (let j = 0; j < H; j++) if (h[j] < 0) h[j] = 0;
  let m = -Infinity;
  for (let c = 0; c < 10; c++) { let s = b2[c]; for (let j = 0, o = c * H; j < H; j++) s += W2[o + j] * h[j]; p[c] = s; if (s > m) m = s; }
  let sum = 0;
  for (let c = 0; c < 10; c++) sum += p[c] = Math.exp(p[c] - m);
  for (let c = 0; c < 10; c++) p[c] /= sum;
};
const accuracy = (W1, W2) => {
  let right = 0;
  for (let i = 0; i < nTest; i++) { sample(testX, i); forward(W1, W2); if (p.indexOf(Math.max(...p)) === testY[i]) right++; }
  return right / nTest;
};

const order = Uint32Array.from({ length: nTrain }, (_, i) => i);
let lr = 0.02;
for (let e = 0; e < EPOCHS; e++) {
  for (let i = nTrain - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  for (let n = 0; n < nTrain; n++) {
    const i = order[n];
    // every digit is seen nudged by up to two pixels, so the net does not depend on exact placement
    sample(trainX, i, Math.floor(rnd() * 5) - 2, Math.floor(rnd() * 5) - 2);
    forward(w1, w2);
    p[trainY[i]] -= 1; // p is now the gradient at the output
    dh.fill(0);
    for (let c = 0; c < 10; c++) {
      const g = p[c] * lr;
      for (let j = 0, o = c * H; j < H; j++) { dh[j] += w2[o + j] * p[c]; w2[o + j] -= g * h[j]; }
      b2[c] -= g;
    }
    for (let j = 0; j < H; j++) { if (h[j] <= 0) dh[j] = 0; b1[j] -= lr * dh[j]; }
    for (let k = 0; k < IN; k++) { const v = x[k] * lr; if (v) for (let j = 0, o = k * H; j < H; j++) w1[o + j] -= v * dh[j]; }
  }
  lr *= 0.88;
  console.log("epoch", e + 1, "test accuracy", (accuracy(w1, w2) * 100).toFixed(2) + "%");
}

// ship as int8: one scale per layer. The accuracy written out is measured on these rounded weights, the ones the page runs.
const pack = (w) => { const s = w.reduce((m, v) => Math.max(m, Math.abs(v)), 0) / 127; return { s, q: Int8Array.from(w, (v) => Math.round(v / s)) }; };
const q1 = pack(w1), q2 = pack(w2);
const acc = accuracy(Float32Array.from(q1.q, (v) => v * q1.s), Float32Array.from(q2.q, (v) => v * q2.s));
const picks = Array.from({ length: DEMO }, () => Math.floor(rnd() * nTest));
const b64 = (bytes) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
writeFileSync("public/lab/digits.json", JSON.stringify({
  hidden: H, acc, train: nTrain, test: nTest, epochs: EPOCHS,
  s1: q1.s, s2: q2.s, w1: b64(q1.q), b1: [...b1], w2: b64(q2.q), b2: [...b2],
  samples: b64(Buffer.concat(picks.map((i) => testX.subarray(i * IN, (i + 1) * IN)))), labels: picks.map((i) => testY[i]),
}));
console.log("wrote public/lab/digits.json, int8 test accuracy", (acc * 100).toFixed(2) + "%");
