// Screenshots of the Lab's digit reader: the demo loop, a digit drawn with the mouse, and a neuron being inspected.
import { chromium } from "playwright";
const [w = "1440", h = "900"] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on("pageerror", (e) => console.log("pageerror: " + e.message.slice(0, 300)));
p.on("console", (m) => { if (m.type() === "error") console.log("console: " + m.text().slice(0, 300)); });
await p.goto("http://localhost:" + (process.env.PORT || 3100) + "/?boot=skip", { waitUntil: "load" });
await p.waitForTimeout(2000);
await p.evaluate(() => { document.querySelector("#digits").scrollIntoView(); scrollBy(0, innerWidth < 640 ? 60 : -80); });
await p.waitForTimeout(4000);
await p.screenshot({ path: `shots/lab-demo-${w}.png` });
// draw a 7 on the pad: across the top, then down to the lower left
// the pad's position is read again for every stroke, because clicking a button below it can scroll the page
const stroke = async (pts) => {
  await p.locator("#digits .slot").scrollIntoViewIfNeeded();
  const pad = await p.locator("#digits .slot").boundingBox();
  const at = (x, y) => [pad.x + pad.width * x, pad.y + pad.height * y];
  await p.mouse.move(...at(...pts[0])); await p.mouse.down();
  for (const q of pts.slice(1)) await p.mouse.move(...at(...q), { steps: 12 });
  await p.mouse.up();
};
await stroke([[0.25, 0.2], [0.72, 0.2], [0.42, 0.85]]);
await p.waitForTimeout(400);
await p.screenshot({ path: `shots/lab-seven-${w}.png` });
console.log("drew a 7, page says:", await p.locator("#digits p.glow").first().innerText(), "/", (await p.locator("#digits p.glow + p").first().innerText()).replace(/\n/g, ", "));
await p.locator("#digits").getByRole("button", { name: "Clear" }).click();
await stroke([[0.55, 0.2], [0.3, 0.3], [0.3, 0.5], [0.6, 0.5], [0.68, 0.7], [0.5, 0.85], [0.28, 0.78]]);
console.log("drew a 5, page says:", await p.locator("#digits p.glow").first().innerText());
await p.locator("#digits").getByRole("button", { name: "Clear" }).click();
await stroke([[0.35, 0.25], [0.5, 0.15], [0.65, 0.28], [0.55, 0.48], [0.4, 0.5], [0.55, 0.48], [0.68, 0.68], [0.5, 0.85], [0.32, 0.75]]);
console.log("drew a 3, page says:", await p.locator("#digits p.glow").first().innerText());
const cv = await p.locator("#digits canvas").first().boundingBox();
if (+w >= 640) { await p.mouse.move(cv.x + cv.width * 0.77, cv.y + cv.height * 0.5); await p.waitForTimeout(400); await p.screenshot({ path: `shots/lab-neuron-${w}.png` }); }
await b.close();
