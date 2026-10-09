import { test } from "node:test";
import assert from "node:assert/strict";
import { allow, picture } from "./guard.ts";

test("a visitor gets six calls a minute and forty a day, and one visitor's limit is not another's", () => {
  const t = 1e9;
  for (let i = 0; i < 6; i++) assert.equal(allow("a", t + i), true);
  assert.equal(allow("a", t + 10), false);
  assert.equal(allow("b", t + 10), true);
  assert.equal(allow("a", t + 61_000), true);
  let ok = 7;
  for (let m = 2; m < 12; m++) for (let i = 0; i < 6; i++) ok += +allow("a", t + m * 61_000 + i);
  assert.equal(ok, 40);
  assert.equal(allow("a", t + 864e5), true); // a new day
});

test("only a small PNG data URL gets through", () => {
  const png = "data:image/png;base64," + "A".repeat(400);
  assert.equal(picture(JSON.stringify({ image: png })), "A".repeat(400));
  for (const bad of ["", "not json", "null", "{}", JSON.stringify({ image: 7 }), JSON.stringify({ image: "data:image/svg+xml;base64," + "A".repeat(400) }),
    JSON.stringify({ image: png + "<script>" }), JSON.stringify({ image: "data:image/png;base64," + "A".repeat(250_000) })]) assert.equal(picture(bad), null);
});
