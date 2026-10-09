// Screenshots of the Lab's drawing board: the replay, a house drawn with the mouse, the big model's answer (the real
// route first, then a stubbed reply), and the drawing on the hero. Usage: node scripts/board-shots.mjs [width] [height]
import { chromium } from "playwright";
const [w = 1440, h = 900] = process.argv.slice(2).map(Number), tag = w < 640 ? "-m" : "";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: w, height: h } });
p.on("pageerror", (e) => console.log("pageerror: " + e.message.slice(0, 300)));
p.on("console", (m) => { if (m.type() === "error") console.log("console: " + m.text().slice(0, 300)); });
const guess = async () => (await p.locator("#board .glow").first().innerText()) + " | " + (await p.locator("#board .glow + p").first().innerText()).replace(/\n/g, ", ");
const verdict = async () => (await p.locator("#board [aria-live] p").allInnerTexts()).join(" | ");
const toBoard = () => p.evaluate(() => { document.querySelector("#board").scrollIntoView(); scrollBy(0, innerWidth < 640 ? -70 : -90); });

await p.goto("http://localhost:" + (process.env.PORT || 3100) + "/?boot=skip", { waitUntil: "load" });
await p.waitForTimeout(1500);
await toBoard();
await p.waitForTimeout(4200);
console.log("replay:", await guess());
await p.screenshot({ path: `shots/board-replay${tag}.png` });

const box = await p.locator("#board .slot").boundingBox();
const stroke = async (pts) => {
  await p.mouse.move(box.x + box.width * pts[0][0], box.y + box.height * pts[0][1]);
  await p.mouse.down();
  for (const [x, y] of pts.slice(1)) await p.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 10 });
  await p.mouse.up();
};
await stroke([[0.38, 0.5], [0.38, 0.85], [0.62, 0.85], [0.62, 0.5], [0.38, 0.5]]); // walls
console.log("after the walls:", await guess());
await stroke([[0.34, 0.5], [0.5, 0.2], [0.66, 0.5]]); // roof
await stroke([[0.47, 0.85], [0.47, 0.66], [0.53, 0.66], [0.53, 0.85]]); // door
await p.waitForTimeout(300);
console.log("a house:", await guess());
await p.screenshot({ path: `shots/board-house${tag}.png` });

let t = Date.now();
await p.getByRole("button", { name: "Ask the big model" }).click();
await p.locator("#board [aria-live] .glow").waitFor({ timeout: 30000 });
console.log("real route, " + (Date.now() - t) + " ms:", await verdict());
await p.route("**/api/doodle", (r) => r.fulfill({ json: { label: "a little house", line: "Cosy. The door is a nice touch." } }));
await p.getByRole("button", { name: "Ask the big model" }).click();
await p.waitForTimeout(600);
console.log("stubbed reply:", await verdict());
await p.screenshot({ path: `shots/board-verdict${tag}.png` });

await p.getByRole("button", { name: "Put it on the big screen" }).click();
await p.waitForTimeout(3200);
console.log("hero says:", (await p.locator("#home p.absolute span").last().innerText()) || "(nothing)");
await p.screenshot({ path: `shots/board-hero${tag}.png` });
await p.getByRole("button", { name: "Back to Vishal" }).click();
await p.waitForTimeout(1200);
await p.screenshot({ path: `shots/board-hero-back${tag}.png` });
await b.close();
