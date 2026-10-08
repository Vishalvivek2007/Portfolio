// Screenshots for visual checks. Usage: node scripts/shots.mjs [url-suffix] [out-name] [scrollY|#id] [width] [height]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const [suffix = "?boot=skip", name = "home", where = "0", w = "1440", h = "900"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.type() + ": " + m.text().slice(0, 300)); });
p.on("pageerror", (e) => logs.push("pageerror: " + e.message.slice(0, 300)));
await p.goto("http://localhost:3100/" + suffix, { waitUntil: "load" });
await p.waitForTimeout(2500);
if (where.startsWith("#")) await p.evaluate((id) => { const [sel, off] = id.split("+"); document.querySelector(sel).scrollIntoView(); scrollBy(0, +(off || 0)); }, where);
else await p.evaluate((y) => scrollTo(0, +y), where);
await p.waitForTimeout(2500);
await p.screenshot({ path: `shots/${name}.png` });
console.log(logs.join("\n") || "no console errors");
await b.close();
