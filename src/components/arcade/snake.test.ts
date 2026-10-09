import { test } from "node:test";
import assert from "node:assert/strict";
import { init, step, bfs, anySafe, COLS, ROWS } from "./snake.ts";

const fixed = () => 0.5;

test("moves one cell and keeps length without food", () => {
  const s = init(fixed);
  s.food = { x: 20, y: 2 };
  const n = step(s, null, fixed);
  assert.equal(n.body.length, 3);
  assert.deepEqual(n.body[0], { x: 6, y: 9 });
  assert.deepEqual(n.ops, ["push_front(6,9)", "pop_back()"]);
});

test("eating grows and scores", () => {
  const s = init(fixed);
  s.food = { x: 6, y: 9 };
  const n = step(s, null, fixed);
  assert.equal(n.body.length, 4);
  assert.equal(n.score, 1);
});

test("reversing is ignored", () => {
  const n = step(init(fixed), "L", fixed);
  assert.equal(n.dir, "R");
});

test("walls are fatal", () => {
  let s = init(fixed);
  s.food = { x: 0, y: 0 };
  for (let i = 0; i < COLS; i++) s = step(s, null, fixed);
  assert.equal(s.dead, true);
});

// seeded: with truly random food the BFS player does trap itself now and then (the dock just restarts it)
test("bfs plays itself for 600 ticks without dying", () => {
  let seed = 1;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  let s = init(rnd);
  for (let i = 0; i < 600; i++) {
    const { dir } = bfs(s);
    s = step(s, dir ?? anySafe(s), rnd);
    assert.equal(s.dead, false, "died at tick " + i);
  }
  assert.ok(s.score > 5);
  assert.ok(s.body.length <= COLS * ROWS);
});
