// Screenshots of the Lab's driving school: the first heats, later heats, then a road drawn with the mouse.
// Usage: node scripts/drive-shots.mjs [width] [height]
import { chromium } from "playwright";
const [w = "1440", h = "900"] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const phone = +w < 640;
const p = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: phone, isMobile: phone });
p.on("pageerror", (e) => console.log("pageerror: " + e.message.slice(0, 300)));
p.on("console", (m) => { if (m.type() === "error") console.log("console: " + m.text().slice(0, 300)); });
await p.goto("http://localhost:" + (process.env.PORT || 3100) + "/?boot=skip", { waitUntil: "load" });
await p.waitForTimeout(2000);
const read = async () => (await p.locator("#driving .glow").innerText()) + " | " + (await p.locator("#driving .glow + p").innerText()).replace(/\n/g, ", ") + " | " + (await p.locator("#driving .grid > div:last-child > p").first().innerText());
await p.evaluate(() => { document.querySelector("#driving").scrollIntoView(); scrollBy(0, innerWidth < 640 ? 120 : -70); });
await p.waitForTimeout(2500);
await p.screenshot({ path: `shots/drive-early-${w}.png` });
console.log("after 2.5 s: generation", await read());
await p.waitForTimeout(30000);
await p.screenshot({ path: `shots/drive-later-${w}.png` });
console.log("after 32 s:  generation", await read());
if (+w >= 640) {
  // draw a kidney-shaped loop with the mouse
  const box = await p.locator("#driving .slot").boundingBox();
  const at = (t) => { const a = t * 2 * Math.PI, r = 1 + 0.25 * Math.sin(3 * a); return [box.x + box.width * (0.5 + 0.38 * r * Math.cos(a)), box.y + box.height * (0.5 + 0.34 * r * Math.sin(a))]; };
  await p.mouse.move(...at(0)); await p.mouse.down();
  for (let i = 1; i <= 90; i++) { await p.mouse.move(...at(i / 92)); if (i === 45) await p.screenshot({ path: `shots/drive-drawing-${w}.png` }); }
  await p.mouse.up();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `shots/drive-own-early-${w}.png` });
  console.log("own road, after 1 s:  generation", await read());
  await p.waitForTimeout(35000);
  await p.screenshot({ path: `shots/drive-own-later-${w}.png` });
  console.log("own road, after 36 s: generation", await read());
  // a click, and a loop that is too small, must not replace the road
  await p.mouse.click(box.x + 40, box.y + 40);
  await p.mouse.move(box.x + 60, box.y + 60); await p.mouse.down();
  for (let i = 0; i <= 20; i++) await p.mouse.move(box.x + 60 + 30 * Math.cos(i / 3), box.y + 60 + 30 * Math.sin(i / 3));
  await p.mouse.up();
  console.log("after a tiny loop, hint says:", (await p.locator("#driving .slot + p").innerText()).slice(0, 60));
}
else {
  // a finger has to switch drawing on first; then it draws a loop
  console.log("pointer is coarse:", await p.evaluate(() => !matchMedia("(hover: hover) and (pointer: fine)").matches));
  await p.getByRole("button", { name: "Draw a road" }).tap();
  const box = await p.locator("#driving .slot").boundingBox();
  const cdp = await p.context().newCDPSession(p);
  const at = (t) => { const a = t * 2 * Math.PI; return { x: Math.round(box.x + box.width * (0.5 + 0.36 * Math.cos(a))), y: Math.round(box.y + box.height * (0.5 + 0.38 * Math.sin(a))) }; };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [at(0)] });
  for (let i = 1; i <= 60; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [at(i / 62)] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: `shots/drive-own-early-${w}.png` });
  console.log("own road by finger, after 1 s: generation", await read());
  await p.waitForTimeout(30000);
  await p.screenshot({ path: `shots/drive-own-later-${w}.png` });
  console.log("own road by finger, after 31 s: generation", await read());
}
console.log("frames per second in this browser:", await p.evaluate(() => new Promise((done) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else done(Math.round(n / 2)); }; requestAnimationFrame(f); })));
await b.close();
