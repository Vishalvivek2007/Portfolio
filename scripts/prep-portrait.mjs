// Packs a photo into RGB: R = luminance, G = depth, B = matte. Run: npm run prep:portrait
// Models run on each job's full source, then the crop is cut from the three maps.
import sharp from "sharp";
import { pipeline, RawImage } from "@huggingface/transformers";

const JOBS = [
  // crop = [left, top, width, height] as fractions of the source; fade = [sides, bottom] as fractions of the output that thin out to nothing
  { src: "assets-src/mirror.png", out: "public/relief/portrait.png", crop: [0.239, 0.29, 0.411, 0.289], w: 400, h: 500, fade: [0.08, 0.28] },
  { src: "assets-src/portrait-full.png", out: "public/relief/figure.png", crop: [0.04, 0.04, 0.92, 0.94], w: 192, h: 500 },
];

const gray = (buf, w, h, ch = 1) => sharp(buf, { raw: { width: w, height: h, channels: ch } });
const oneChannel = async (s, w, h) => {
  const { data, info } = await s.raw().toBuffer({ resolveWithObject: true });
  if (info.channels === 1) return data;
  const out = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) out[i] = data[i * info.channels];
  return out;
};

const depth = await pipeline("depth-estimation", "onnx-community/depth-anything-v2-small");
const matte = await pipeline("background-removal", "Xenova/modnet");

for (const j of JOBS) {
  const raw = await RawImage.read(j.src);
  const W = raw.width, H = raw.height;

  const depthOut = (await depth(raw)).depth;
  const depthFull = await oneChannel(gray(Buffer.from(depthOut.data), depthOut.width, depthOut.height).resize(W, H), W, H);

  const m = await matte(raw);
  const mo = Array.isArray(m) ? m[0] : m;
  const matteFull = Buffer.alloc(W * H);
  const mc = mo.channels;
  for (let i = 0; i < W * H; i++) matteFull[i] = mc === 4 ? mo.data[i * 4 + 3] : mo.data[i * mc];

  const lumFull = await oneChannel(sharp(j.src).removeAlpha().greyscale(), W, H);
  const region = { left: Math.round(j.crop[0] * W), top: Math.round(j.crop[1] * H), width: Math.round(j.crop[2] * W), height: Math.round(j.crop[3] * H) };
  const cut = (buf) => oneChannel(gray(buf, W, H).extract(region).resize(j.w, j.h, { fit: "cover", position: "top" }), j.w, j.h);
  const lumRaw = await cut(lumFull);
  const d0 = await cut(depthFull);
  const m0 = await cut(matteFull);
  // tone: light denoise and gentle local contrast, then stretch to the range found inside the matte and lift the mid-tones
  const soft = await oneChannel(gray(lumRaw, j.w, j.h).blur(0.7).clahe({ width: 24, height: 24, maxSlope: 2 }), j.w, j.h);
  const tones = [...soft].filter((_, i) => m0[i] > 128).sort((a, b) => a - b);
  const t0 = tones[Math.floor(tones.length * 0.01)], t1 = tones[Math.floor(tones.length * 0.995)];
  const ramp = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
  const [fx, fy] = j.fade ?? [0, 0];
  const lum = Buffer.from(soft.map((v, i) => {
    const x = (i % j.w) / j.w, y = Math.floor(i / j.w) / j.h;
    const edge = (fx ? ramp(Math.min(x, 1 - x), 0, fx) : 1) * (fy ? ramp(1 - y, 0, fy) : 1);
    return 255 * Math.pow(ramp(v, t0, t1), 0.8) * edge * edge;
  }));
  // normalise depth inside the matte so the figure spans the full 0..1 range
  const inside = [...d0].filter((_, i) => m0[i] > 128).sort((a, b) => a - b);
  const lo = inside[Math.floor(inside.length * 0.02)], hi = inside[Math.floor(inside.length * 0.98)]; // percentiles: matte edges do not set the range
  const dn = Buffer.from(d0.map((v) => Math.max(0, Math.min(255, ((v - lo) / Math.max(1, hi - lo)) * 255))));
  // blur depth among matte pixels only (blurred depth*matte over blurred matte), so the background never bleeds into the silhouette's edge
  const dm = await oneChannel(gray(Buffer.from(dn.map((v, i) => (v * m0[i]) / 255)), j.w, j.h).blur(3), j.w, j.h);
  const mb = await oneChannel(gray(m0, j.w, j.h).blur(3), j.w, j.h);
  const d = Buffer.from(dm.map((v, i) => (mb[i] > 8 ? Math.min(255, (v * 255) / mb[i]) : 0)));
  const px = Buffer.alloc(j.w * j.h * 3);
  for (let i = 0; i < j.w * j.h; i++) {
    px[i * 3] = lum[i];
    px[i * 3 + 1] = d[i];
    px[i * 3 + 2] = m0[i];
  }
  await sharp(px, { raw: { width: j.w, height: j.h, channels: 3 } }).png().toFile(j.out);
  console.log("wrote", j.out);
}
