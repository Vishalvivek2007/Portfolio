import { test } from "node:test";
import assert from "node:assert/strict";
import { shuffled, quicksort, mergesort, search, COLS } from "./algorithms.ts";

const last = <T,>(g: Generator<T>) => { let v: T | undefined; for (const x of g) v = x; return v!; };
const sorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);

test("quicksort and mergesort end sorted and keep the same values", () => {
  for (let t = 0; t < 20; t++) {
    const input = shuffled();
    const want = [...input].sort((a, b) => a - b);
    assert.deepEqual(last(quicksort(input)).arr, want);
    assert.deepEqual(last(mergesort(input)).arr, want);
  }
});

test("counters grow with work and stay plausible", () => {
  const f = last(quicksort(shuffled()));
  assert.ok(f.cmp >= COLS - 1 && f.cmp < COLS * COLS);
});

test("bfs and a* both find the shortest path; a* looks at fewer cells", () => {
  const walls = new Set<number>();
  for (let y = 2; y < 18; y++) walls.add(y * COLS + 30); // a wall with gaps at the ends
  const b = last(search("bfs", walls)), a = last(search("astar", walls));
  assert.equal(b.path.length, a.path.length);
  assert.ok(b.path.length > 0);
  assert.ok(a.cmp < b.cmp);
  assert.ok(b.path.every((c) => !walls.has(c)));
});

test("no route gives an empty path", () => {
  const walls = new Set<number>();
  for (let y = 0; y < 20; y++) walls.add(y * COLS + 30);
  assert.equal(last(search("bfs", walls)).path.length, 0);
});
