// Builds public/logos/*.png (RGBA, light-on-transparent) for the spinning logos in Experience. Run: node scripts/prep-logos.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
mkdirSync("public/logos", { recursive: true });
const LIGHT = [237, 235, 221];

// alpha(r, g, b) decides what is logo; pixels with no colour of their own become LIGHT so they show on black
async function cutout(src, out, scale, alpha) {
  const meta = await sharp(src).metadata();
  const { data, info } = await sharp(src).removeAlpha().resize(meta.width * scale, null, { kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += 3, o += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const a = Math.max(0, Math.min(1, alpha(r, g, b)));
    const hasColour = Math.max(r, g, b) - Math.min(r, g, b) > 60;
    const c = hasColour && a > 0.5 ? [r, g, b] : LIGHT;
    px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = a * 255;
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(out);
  console.log("wrote", out);
}

const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
// white mark on a brown photo background
await cutout("assets-src/logo-deepterrain.png", "public/logos/deepterrain.png", 4, (r, g, b) => (lum(r, g, b) - 140) / 35);
// dark and blue type on white
await cutout("assets-src/logo-innova.png", "public/logos/innova.png", 3, (r, g, b) => (255 - Math.min(r, g, b)) / 70);

const sq = (x, y, c) => `<rect x="${x}" y="${y}" width="236" height="236" fill="${c}"/>`;
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${sq(8, 8, "#f25022")}${sq(268, 8, "#7fba00")}${sq(8, 268, "#00a4ef")}${sq(268, 268, "#ffb900")}</svg>`)).png().toFile("public/logos/microsoft.png");
console.log("wrote public/logos/microsoft.png");
