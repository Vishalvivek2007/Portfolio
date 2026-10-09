// Collects real doodles from Google's public Quick, Draw! set (CC BY 4.0) and renders each to 28 x 28 with the same
// `render` the page uses, so the net is trained on exactly what it will be shown. Only the head of each category is fetched.
// Run: node --experimental-strip-types scripts/fetch-doodles.mjs [dir] [train per category] [test per category]
import { mkdirSync, openSync, writeSync, closeSync, writeFileSync } from "node:fs";
import { render, IN } from "../src/components/lab/doodle.ts";

const [dir = "assets-src/doodles", TRAIN = "3000", TEST = "250"] = process.argv.slice(2);
const nTrain = +TRAIN, nTest = +TEST;
const BASE = "https://storage.googleapis.com/quickdraw_dataset/full/simplified/";
const CHUNK = 1 << 20, CAP = 60; // bytes per request, requests per category at most

async function get(url, headers) {
  for (let tries = 0; ; tries++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
      return Buffer.from(await res.arrayBuffer()).toString("latin1");
    } catch (e) { if (tries === 4) throw e; await new Promise((r) => setTimeout(r, 1500 * (tries + 1))); }
  }
}

const labels = (await get("https://raw.githubusercontent.com/googlecreativelab/quickdraw-dataset/master/categories.txt")).trim().split("\n").map((s) => s.trim());
mkdirSync(dir, { recursive: true });
const train = openSync(dir + "/train.bin", "w"), test = openSync(dir + "/test.bin", "w");
const pool = []; // a few test doodles per category with their strokes and their row in test.bin, for the page's demo loop

// The first nTest doodles of a category are its test set, whatever they look like. Training takes the ones after that
// which the original game recognised, so scribbles that are not the thing do not teach the net.
async function category(c) {
  const tr = new Uint8Array(nTrain * IN), te = new Uint8Array(nTest * IN), keep = [];
  let nTr = 0, nTe = 0, rest = "";
  for (let part = 0; nTr < nTrain; part++) {
    if (part >= CAP) throw new Error(labels[c] + ": ran out of doodles");
    const lines = (rest + (await get(BASE + encodeURIComponent(labels[c]) + ".ndjson", { Range: `bytes=${part * CHUNK}-${(part + 1) * CHUNK - 1}` }))).split("\n");
    rest = lines.pop();
    for (const line of lines) {
      if (!line) continue;
      const d = JSON.parse(line);
      const px = Uint8Array.from(render(d.drawing.map(([xs, ys]) => xs.map((x, i) => [x, ys[i]]))), (v) => Math.round(v * 255));
      if (nTe < nTest) {
        if (keep.length < 6 && d.recognized) keep.push({ at: c * nTest + nTe, strokes: d.drawing.map(([xs, ys]) => xs.flatMap((x, i) => [x, ys[i]])) });
        te.set(px, nTe++ * IN);
      } else if (d.recognized && nTr < nTrain) tr.set(px, nTr++ * IN);
    }
  }
  writeSync(train, tr, 0, tr.length, c * tr.length);
  writeSync(test, te, 0, te.length, c * te.length);
  pool[c] = keep;
}

let next = 0, done = 0;
const t0 = Date.now();
await Promise.all(Array.from({ length: 12 }, async () => {
  while (next < labels.length) {
    await category(next++);
    if (++done % 25 === 0 || done === labels.length) console.log(done + " of " + labels.length + " categories, " + Math.round((Date.now() - t0) / 1000) + " s");
  }
}));
closeSync(train); closeSync(test);
writeFileSync(dir + "/meta.json", JSON.stringify({ labels, train: nTrain, test: nTest, pool }));
console.log("wrote " + dir + ": " + labels.length * nTrain + " training and " + labels.length * nTest + " test doodles");
