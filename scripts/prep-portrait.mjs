// Packs a photo into RGB: R = luminance, G = depth, B = matte. Run: npm run prep:portrait
// Models run once on the full source, then each crop is cut from the three maps.
import sharp from "sharp";
import { pipeline, RawImage } from "@huggingface/transformers";

const SRC = "assets-src/portrait-full.png";
const JOBS = [
  // crop = [left, top, width, height] as fractions of the source
  { out: "public/relief/portrait.png", crop: [0.12, 0.05, 0.64, 0.30], w: 320, h: 400 },
  { out: "public/relief/figure.png", crop: [0.04, 0.04, 0.92, 0.94], w: 192, h: 500 },
];

const gray = (buf, w, h, ch = 1) => sharp(buf, { raw: { width: w, height: h, channels: ch } });
const oneChannel = async (s, w, h) => {
  const { data, info } = await s.raw().toBuffer({ resolveWithObject: true });
  if (info.channels === 1) return data;
  const out = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) out[i] = data[i * info.channels];
  return out;
};

const raw = await RawImage.read(SRC);
const W = raw.width, H = raw.height;

const depthOut = (await (await pipeline("depth-estimation", "onnx-community/depth-anything-v2-small"))(raw)).depth;
const depthFull = await oneChannel(gray(Buffer.from(depthOut.data), depthOut.width, depthOut.height).resize(W, H), W, H);

const m = await (await pipeline("background-removal", "Xenova/modnet"))(raw);
const mo = Array.isArray(m) ? m[0] : m;
const matteFull = Buffer.alloc(W * H);
const mc = mo.channels;
for (let i = 0; i < W * H; i++) matteFull[i] = mc === 4 ? mo.data[i * 4 + 3] : mo.data[i * mc];

const lumFull = await oneChannel(sharp(SRC).removeAlpha().greyscale(), W, H);

for (const j of JOBS) {
  const region = { left: Math.round(j.crop[0] * W), top: Math.round(j.crop[1] * H), width: Math.round(j.crop[2] * W), height: Math.round(j.crop[3] * H) };
  const cut = (buf) => oneChannel(gray(buf, W, H).extract(region).resize(j.w, j.h, { fit: "cover", position: "top" }), j.w, j.h);
  const lumRaw = await cut(lumFull);
  const d0 = await cut(depthFull);
  const m0 = await cut(matteFull);
  const lum = await oneChannel(gray(lumRaw, j.w, j.h).clahe({ width: 16, height: 16, maxSlope: 3 }).linear(0.75, 30), j.w, j.h);
  // normalise depth inside the matte so the figure spans the full 0..1 range
  let lo = 255, hi = 0;
  for (let i = 0; i < d0.length; i++) if (m0[i] > 128) { lo = Math.min(lo, d0[i]); hi = Math.max(hi, d0[i]); }
  const dn = Buffer.from(d0.map((v) => Math.max(0, Math.min(255, ((v - lo) / Math.max(1, hi - lo)) * 255))));
  const d = await oneChannel(gray(dn, j.w, j.h).blur(1.5), j.w, j.h);
  const px = Buffer.alloc(j.w * j.h * 3);
  for (let i = 0; i < j.w * j.h; i++) {
    px[i * 3] = lum[i];
    px[i * 3 + 1] = d[i];
    px[i * 3 + 2] = m0[i];
  }
  await sharp(px, { raw: { width: j.w, height: j.h, channels: 3 } }).png().toFile(j.out);
  console.log("wrote", j.out);
}
