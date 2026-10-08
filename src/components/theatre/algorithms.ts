// Real algorithms as generators: each yield is one operation, so counters are true counts.
export const COLS = 64;
export const ROWS = 20;

export type SortFrame = { arr: number[]; hi: number[]; cmp: number; ops: number };
export type PathFrame = { seen: number[]; edge: number[]; path: number[]; cmp: number; done: boolean };

export function shuffled(n = COLS, max = ROWS, rnd = Math.random): number[] {
  return Array.from({ length: n }, () => 1 + Math.floor(rnd() * max));
}

export function* quicksort(input: number[]): Generator<SortFrame> {
  const a = [...input];
  let cmp = 0, ops = 0;
  const stack: [number, number][] = [[0, a.length - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop()!;
    if (lo >= hi) continue;
    const p = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      cmp++;
      if (a[j] < p) { [a[i], a[j]] = [a[j], a[i]]; ops++; i++; }
      yield { arr: [...a], hi: [j, hi], cmp, ops };
    }
    [a[i], a[hi]] = [a[hi], a[i]]; ops++;
    yield { arr: [...a], hi: [i], cmp, ops };
    stack.push([lo, i - 1], [i + 1, hi]);
  }
  yield { arr: [...a], hi: [], cmp, ops };
}

export function* mergesort(input: number[]): Generator<SortFrame> {
  let a = [...input];
  let cmp = 0, ops = 0;
  for (let w = 1; w < a.length; w *= 2) {
    const out = [...a];
    for (let lo = 0; lo < a.length; lo += 2 * w) {
      const mid = Math.min(lo + w, a.length), hi = Math.min(lo + 2 * w, a.length);
      let i = lo, j = mid, k = lo;
      while (i < mid && j < hi) {
        cmp++;
        out[k++] = a[i] <= a[j] ? a[i++] : a[j++];
        ops++;
        yield { arr: [...out.slice(0, k), ...a.slice(k)], hi: [k - 1], cmp, ops };
      }
      while (i < mid) { out[k++] = a[i++]; ops++; }
      while (j < hi) { out[k++] = a[j++]; ops++; }
    }
    a = out;
    yield { arr: [...a], hi: [], cmp, ops };
  }
  yield { arr: [...a], hi: [], cmp, ops };
}

const idx = (x: number, y: number) => y * COLS + x;

export function* search(kind: "bfs" | "astar", walls: Set<number>, start = idx(2, 10), goal = idx(61, 10)): Generator<PathFrame> {
  const gx = goal % COLS, gy = Math.floor(goal / COLS);
  const h = (n: number) => (kind === "astar" ? Math.abs((n % COLS) - gx) + Math.abs(Math.floor(n / COLS) - gy) : 0);
  const g = new Map<number, number>([[start, 0]]);
  const from = new Map<number, number>();
  const open: number[] = [start];
  const seen = new Set<number>();
  let cmp = 0;
  while (open.length) {
    // pop the best f = g + h; ties keep insertion order, so BFS (h = 0) is a plain queue
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (g.get(open[i])! + h(open[i]) < g.get(open[bi])! + h(open[bi])) bi = i;
    const c = open.splice(bi, 1)[0];
    if (seen.has(c)) continue;
    seen.add(c); cmp++;
    if (c === goal) {
      const path = [c];
      while (from.has(path[path.length - 1])) path.push(from.get(path[path.length - 1])!);
      yield { seen: [...seen], edge: [], path: path.reverse(), cmp, done: true };
      return;
    }
    const x = c % COLS, y = Math.floor(c / COLS);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const n = idx(nx, ny);
      if (walls.has(n) || seen.has(n)) continue;
      const ng = g.get(c)! + 1;
      if (!g.has(n) || ng < g.get(n)!) { g.set(n, ng); from.set(n, c); open.push(n); }
    }
    yield { seen: [...seen], edge: [...open], path: [], cmp, done: false };
  }
  yield { seen: [...seen], edge: [], path: [], cmp, done: true };
}
