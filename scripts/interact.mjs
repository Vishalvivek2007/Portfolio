import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
p.on("console", (m) => { if (m.type() === "error") logs.push(m.text().slice(0, 200)); });
p.on("pageerror", (e) => logs.push(e.message.slice(0, 200)));
await p.goto("http://localhost:3100/?boot=skip");
await p.waitForTimeout(2500);
// 1. click portrait -> rescan to ascii, hold mid-scan
const r = await p.locator("#slot-portrait").boundingBox();
await p.mouse.move(r.x + r.width * 0.5, r.y + r.height * 0.4);
await p.mouse.click(r.x + r.width * 0.5, r.y + r.height * 0.4);
await p.waitForTimeout(450);
await p.screenshot({ path: "shots/i-scan.png" });
await p.waitForTimeout(1200);
await p.screenshot({ path: "shots/i-ascii.png", clip: { x: r.x - 20, y: r.y - 20, width: r.width + 40, height: r.height + 40 } });
// 2. hover monitor -> colour
await p.evaluate(() => document.querySelector("#work").scrollIntoView());
await p.waitForTimeout(1500);
const m = await p.locator("#slot-receiver").boundingBox();
await p.mouse.move(m.x + m.width * 0.4, m.y + m.height * 0.5);
await p.waitForTimeout(1500);
await p.screenshot({ path: "shots/i-monitor.png" });
console.log(await p.evaluate(() => document.getElementById("readout-portrait")?.textContent));
console.log(logs.join("\n") || "no console errors");
await b.close();
