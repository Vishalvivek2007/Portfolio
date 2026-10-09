// The Lab's digit reader: 784 inputs -> 64 ReLU -> 10 softmax. Weights come from scripts/train-digits.mjs.
export const SIDE = 28;
export const IN = SIDE * SIDE;

export type NetFile = { hidden: number; acc: number; train: number; test: number; s1: number; s2: number; w1: string; b1: number[]; w2: string; b2: number[]; samples: string; labels: number[] };
export type Net = {
  hidden: number; acc: number; train: number; test: number;
  w1: Float32Array; // input-major: w1[pixel * hidden + neuron]
  b1: Float32Array; w2: Float32Array; b2: Float32Array;
  samples: Uint8Array; labels: number[]; // a few test digits for the demo loop
};

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const weights = (b64: string, scale: number) => Float32Array.from(new Int8Array(bytes(b64).buffer), (v) => v * scale);

export function load(f: NetFile): Net {
  return {
    hidden: f.hidden, acc: f.acc, train: f.train, test: f.test,
    w1: weights(f.w1, f.s1), b1: Float32Array.from(f.b1), w2: weights(f.w2, f.s2), b2: Float32Array.from(f.b2),
    samples: bytes(f.samples), labels: f.labels,
  };
}

// h = each hidden neuron's activation, p = probability of each digit
export function forward(net: Net, x: Float32Array): { h: Float32Array; p: Float32Array } {
  const H = net.hidden, h = Float32Array.from(net.b1), p = Float32Array.from(net.b2);
  for (let k = 0; k < IN; k++) { const v = x[k]; if (v) for (let j = 0, o = k * H; j < H; j++) h[j] += net.w1[o + j] * v; }
  for (let j = 0; j < H; j++) if (h[j] < 0) h[j] = 0;
  for (let c = 0; c < 10; c++) for (let j = 0, o = c * H; j < H; j++) p[c] += net.w2[o + j] * h[j];
  const top = Math.max(...p);
  let sum = 0;
  for (let c = 0; c < 10; c++) sum += p[c] = Math.exp(p[c] - top);
  for (let c = 0; c < 10; c++) p[c] /= sum;
  return { h, p };
}

export type Pt = [number, number];
export type Stroke = Pt[]; // pen positions, 0..1 across the pad

// Ink per cell for strokes mapped into cell units: full within `core` cells of the pen line, gone one cell further out.
function ink(strokes: Stroke[], map: (p: Pt) => Pt, core: number): Float32Array {
  const out = new Float32Array(IN), reach = core + 1;
  for (const s of strokes) {
    const pts = s.map(map);
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[i]; // the first point alone is a dot
      const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - reach)), x1 = Math.min(SIDE - 1, Math.ceil(Math.max(ax, bx) + reach));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by) - reach)), y1 = Math.min(SIDE - 1, Math.ceil(Math.max(ay, by) + reach));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5 - ax, py = y + 0.5 - ay;
        const t = len2 ? Math.max(0, Math.min(1, (px * vx + py * vy) / len2)) : 0;
        const v = 1 - Math.max(0, Math.min(1, Math.hypot(px - t * vx, py - t * vy) - core));
        if (v > out[y * SIDE + x]) out[y * SIDE + x] = v;
      }
    }
  }
  return out;
}

// What the pad shows: the strokes where they were drawn.
export const raster = (strokes: Stroke[]) => ink(strokes, ([x, y]) => [x * SIDE, y * SIDE], 0.6);

// What the net is fed, prepared the way its training digits were: scaled so the drawing's longer side spans
// 20 cells, then shifted so its centre of mass sits in the middle of the 28 x 28 field.
export function normalise(strokes: Stroke[]): Float32Array {
  const pts = strokes.flat();
  if (!pts.length) return new Float32Array(IN);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  const scale = 20 / Math.max(w, h, 0.04), cx = x0 + w / 2, cy = y0 + h / 2;
  const at = (dx: number, dy: number) => ink(strokes, ([x, y]) => [(x - cx) * scale + SIDE / 2 + dx, (y - cy) * scale + SIDE / 2 + dy], 0.9);
  const first = at(0, 0);
  let m = 0, mx = 0, my = 0;
  first.forEach((v, i) => { m += v; mx += v * ((i % SIDE) + 0.5); my += v * (Math.floor(i / SIDE) + 0.5); });
  return at(SIDE / 2 - mx / m, SIDE / 2 - my / m);
}
