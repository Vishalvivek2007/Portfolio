import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
mkdirSync("shots", { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
p.on("console", (m) => { if (m.type() === "error") logs.push(m.text().slice(0, 200)); });
p.on("pageerror", (e) => logs.push(e.message.slice(0, 200)));
await p.goto("http://localhost:3100/", { waitUntil: "commit" });
for (const t of [300, 700, 1200, 1700, 2200, 3200]) {
  await p.waitForTimeout(t - (globalThis.last || 0)); globalThis.last = t;
  await p.screenshot({ path: `shots/boot-${t}.png` });
}
console.log(logs.join("\n") || "no errors");
await b.close();
