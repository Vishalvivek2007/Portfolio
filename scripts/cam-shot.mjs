// Screenshot of "Put yourself on screen" using Chromium's fake camera (a moving test pattern).
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => console.log("pageerror: " + e.message.slice(0, 300)));
p.on("console", (m) => { if (m.type() === "error") console.log("console: " + m.text().slice(0, 300)); });
await p.goto("http://localhost:" + (process.env.PORT || 3100) + "/?boot=skip", { waitUntil: "load" });
await p.waitForTimeout(2500);
await p.getByRole("button", { name: "Put yourself on screen" }).click();
await p.waitForTimeout(3500);
await p.screenshot({ path: "shots/cam-on.png" });
await p.getByRole("button", { name: "Back to Vishal" }).click();
await p.waitForTimeout(1500);
await p.screenshot({ path: "shots/cam-off.png" });
await b.close();
