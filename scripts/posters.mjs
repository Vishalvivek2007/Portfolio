// Captures each slot (overlay hidden) into public/posters/<id>.webp, shown in Clean mode, then the hero as the share image. Run with the dev server up.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
mkdirSync("public/posters", { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto("http://localhost:" + (process.env.PORT || 3100) + "/?boot=skip");
await p.addStyleTag({ content: ".screen-overlay,header,[data-game],nextjs-portal,.progress,#home p.absolute{display:none!important}.slot::before,.slot::after,.slot>.br{display:none!important}" });
await p.waitForTimeout(2500);
for (const id of ["portrait", "receiver", "figure", "orrery"]) {
  await p.evaluate((i) => document.getElementById("slot-" + i).scrollIntoView({ block: "center" }), id);
  await p.waitForTimeout(1800);
  const png = await p.locator("#slot-" + id).screenshot();
  await sharp(png).webp({ quality: 80 }).toFile(`public/posters/${id}.webp`);
  console.log("poster", id);
}
await p.setViewportSize({ width: 1200, height: 630 });
await p.evaluate(() => scrollTo(0, 0));
await p.waitForTimeout(2000);
await p.screenshot({ path: "src/app/opengraph-image.png" });
console.log("share image");
await b.close();
