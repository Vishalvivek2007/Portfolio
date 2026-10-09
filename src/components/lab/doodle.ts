// The Lab's doodle reader: a small convolutional net over a 28 x 28 picture of the strokes.
// Weights come from scripts/train-doodles.py. `render` below also drew every picture the net was trained on
// (scripts/fetch-doodles.mjs), so a drawing on the page reaches the net looking the way its training doodles did.
export const SIDE = 28;
export const IN = SIDE * SIDE;
const SPAN = 24; // the drawing's longer side, in cells
const CORE = 0.5; // full ink within this many cells of the pen line, gone one cell further out

export type Pt = [number, number];
export type Stroke = Pt[];

// The drawing scaled so its longer side spans SPAN cells and centred in the field. `min` stops a stray tap being blown up to full size.
export function render(strokes: Stroke[], min = 0): Float32Array {
  const out = new Float32Array(IN), reach = CORE + 1;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of strokes) for (const [x, y] of s) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x0 > x1) return out;
  const scale = SPAN / (Math.max(x1 - x0, y1 - y0, min) || 1), ox = SIDE / 2 - ((x0 + x1) / 2) * scale, oy = SIDE / 2 - ((y0 + y1) / 2) * scale;
  for (const s of strokes) {
    for (let i = 0; i < s.length; i++) {
      const a = s[Math.max(0, i - 1)], b = s[i]; // the first point alone is a dot
      const ax = a[0] * scale + ox, ay = a[1] * scale + oy, bx = b[0] * scale + ox, by = b[1] * scale + oy;
      const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy;
      const cx0 = Math.max(0, Math.floor(Math.min(ax, bx) - reach)), cx1 = Math.min(SIDE - 1, Math.ceil(Math.max(ax, bx) + reach));
      const cy0 = Math.max(0, Math.floor(Math.min(ay, by) - reach)), cy1 = Math.min(SIDE - 1, Math.ceil(Math.max(ay, by) + reach));
      for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) {
        const px = x + 0.5 - ax, py = y + 0.5 - ay;
        const t = len2 ? Math.max(0, Math.min(1, (px * vx + py * vy) / len2)) : 0;
        const v = 1 - Math.max(0, Math.min(1, Math.hypot(px - t * vx, py - t * vy) - CORE));
        if (v > out[y * SIDE + x]) out[y * SIDE + x] = v;
      }
    }
  }
  return out;
}

type Layer = { conv: boolean; cin: number; cout: number; w: Float32Array; b: Float32Array };
export type NetFile = {
  labels: string[]; train: number; test: number; top1: number; top3: number;
  layers: { conv: boolean; cin: number; cout: number; scale: number[]; bias: number[] }[]; // weights are int8 in the .bin, one scale per output
  demo: { label: number; strokes: number[][] }[]; // a few doodles from the test set, as flat x,y lists in 0..255
};
export type Net = Omit<NetFile, "layers"> & { layers: Layer[]; weights: number };

export function load(f: NetFile, bin: ArrayBuffer): Net {
  const q = new Int8Array(bin);
  let at = 0;
  const layers = f.layers.map((l) => {
    const per = l.cin * (l.conv ? 9 : 1), w = new Float32Array(l.cout * per);
    for (let o = 0; o < l.cout; o++) for (let k = 0, s = Math.fround(l.scale[o]); k < per; k++) w[o * per + k] = q[at++] * s;
    return { conv: l.conv, cin: l.cin, cout: l.cout, w, b: Float32Array.from(l.bias) };
  });
  if (at !== q.length) throw new Error("doodle weights do not match their description");
  return { ...f, layers, weights: at + layers.reduce((n, l) => n + l.cout, 0) };
}

// 3 x 3 convolution with a one-cell zero border, ReLU, then the larger of each 2 x 2 block
function conv(x: Float32Array, S: number, { cin, cout, w, b }: Layer): Float32Array {
  const A = S * S, y = new Float32Array(cout * A);
  for (let o = 0; o < cout; o++) {
    const out = y.subarray(o * A, (o + 1) * A).fill(b[o]);
    for (let i = 0; i < cin; i++) {
      const inp = x.subarray(i * A, (i + 1) * A), k = (o * cin + i) * 9;
      for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
        const v = w[k + (ky + 1) * 3 + kx + 1];
        const ya = Math.max(0, -ky), yb = Math.min(S, S - ky), xa = Math.max(0, -kx), xb = Math.min(S, S - kx);
        for (let yy = ya; yy < yb; yy++) for (let xx = xa, ro = yy * S, ri = (yy + ky) * S + kx; xx < xb; xx++) out[ro + xx] += v * inp[ri + xx];
      }
    }
  }
  const P = S >> 1, z = new Float32Array(cout * P * P);
  for (let o = 0; o < cout; o++) for (let py = 0; py < P; py++) for (let px = 0; px < P; px++) {
    const at = o * A + py * 2 * S + px * 2;
    z[o * P * P + py * P + px] = Math.max(0, y[at], y[at + 1], y[at + S], y[at + S + 1]);
  }
  return z;
}

// probability of each label for one rendered drawing
export function forward(net: Net, x: Float32Array): Float32Array {
  let a = x, S = SIDE;
  net.layers.forEach((l, n) => {
    if (l.conv) { a = conv(a, S, l); S >>= 1; return; }
    const y = Float32Array.from(l.b), last = n === net.layers.length - 1;
    for (let o = 0; o < l.cout; o++) { let sum = 0; for (let k = 0, at = o * l.cin; k < l.cin; k++) sum += l.w[at + k] * a[k]; y[o] = last ? y[o] + sum : Math.max(0, y[o] + sum); }
    a = y;
  });
  const top = a.reduce((m, v) => Math.max(m, v), -Infinity);
  let sum = 0;
  for (let c = 0; c < a.length; c++) sum += a[c] = Math.exp(a[c] - top);
  return a.map((v) => v / sum);
}

// the n most likely labels, best first
export function best(p: Float32Array, n: number): number[] {
  return Array.from(p.keys()).sort((a, b) => p[b] - p[a]).slice(0, n);
}
