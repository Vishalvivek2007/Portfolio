// Captures a tall scrolling strip of the live VMAXX site for the Work monitor. Usage: npm run capture:work
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
mkdirSync("public/work", { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 960 } });
await p.goto("https://vmaxx.vercel.app/", { waitUntil: "networkidle" });
await p.waitForTimeout(4000);
const tiles = [];
for (let i = 0; i < 4; i++) {
  tiles.push(await p.screenshot());
  await p.mouse.wheel(0, 760);
  await p.waitForTimeout(1800);
}
await b.close();
const strip = await sharp({ create: { width: 1280, height: 960 * 4, channels: 3, background: "#000" } })
  .composite(tiles.map((input, i) => ({ input, top: i * 960, left: 0 }))).png().toBuffer();
await sharp(strip).resize(640, 1920).webp({ quality: 82 }).toFile("public/work/vmaxx-strip.webp");
console.log("wrote public/work/vmaxx-strip.webp");
