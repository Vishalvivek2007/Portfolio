// Captures each slot (overlay hidden) into public/posters/<id>.webp, shown in Clean mode. Run with the dev server up.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
mkdirSync("public/posters", { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto("http://localhost:3100/?boot=skip");
await p.addStyleTag({ content: ".screen-overlay,.static-burst,header,[data-game],nextjs-portal{display:none!important}.slot::before,.slot::after,.slot>.br{display:none!important}" });
await p.waitForTimeout(2500);
for (const id of ["portrait", "receiver", "figure", "orrery", "strata"]) {
  await p.evaluate((i) => document.getElementById("slot-" + i).scrollIntoView({ block: "center" }), id);
  await p.waitForTimeout(1800);
  const png = await p.locator("#slot-" + id).screenshot();
  await sharp(png).webp({ quality: 80 }).toFile(`public/posters/${id}.webp`);
  console.log("poster", id);
}
await b.close();
