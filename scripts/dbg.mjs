import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:" + (process.env.PORT || 3100) + "/?boot=skip");
await p.waitForTimeout(2000);
await p.evaluate(() => document.querySelector("#contact").scrollIntoView());
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => {
  const o = {};
  document.querySelectorAll("[data-slot]").forEach((e) => { const r = e.getBoundingClientRect(); o[e.dataset.slot] = [Math.round(r.top), Math.round(r.height), getComputedStyle(e).position]; });
  return o;
})));
await b.close();
