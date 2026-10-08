// Pure snake logic. The body is a deque: head at index 0, tail at the end.
export const COLS = 24;
export const ROWS = 18;

export type P = { x: number; y: number };
export type Dir = "U" | "D" | "L" | "R";
export type State = { body: P[]; dir: Dir; food: P; score: number; dead: boolean; ops: string[] };

const D: Record<Dir, P> = { U: { x: 0, y: -1 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, R: { x: 1, y: 0 } };
const OPP: Record<Dir, Dir> = { U: "D", D: "U", L: "R", R: "L" };
const key = (p: P) => p.x + "," + p.y;
const inside = (p: P) => p.x >= 0 && p.y >= 0 && p.x < COLS && p.y < ROWS;

export function placeFood(body: P[], rnd: () => number): P {
  const taken = new Set(body.map(key));
  const free: P[] = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!taken.has(x + "," + y)) free.push({ x, y });
  return free[Math.floor(rnd() * free.length)] ?? { x: 0, y: 0 };
}

export function init(rnd: () => number = Math.random): State {
  const body = [{ x: 5, y: 9 }, { x: 4, y: 9 }, { x: 3, y: 9 }];
  return { body, dir: "R", food: placeFood(body, rnd), score: 0, dead: false, ops: [] };
}

export function step(s: State, want: Dir | null, rnd: () => number = Math.random): State {
  if (s.dead) return s;
  const dir = want && want !== OPP[s.dir] ? want : s.dir;
  const head = { x: s.body[0].x + D[dir].x, y: s.body[0].y + D[dir].y };
  const eats = head.x === s.food.x && head.y === s.food.y;
  // the tail cell frees up this tick unless the snake grows
  const body = s.body.slice(0, eats ? undefined : -1);
  if (!inside(head) || body.some((p) => p.x === head.x && p.y === head.y)) return { ...s, dir, dead: true, ops: ["collide(" + head.x + "," + head.y + ")"] };
  const next = [head, ...body];
  const ops = ["push_front(" + head.x + "," + head.y + ")"];
  if (!eats) ops.push("pop_back()");
  return { body: next, dir, food: eats ? placeFood(next, rnd) : s.food, score: s.score + (eats ? 1 : 0), dead: false, ops };
}

// Shortest path from head to food over free cells. Returns the first direction to take, or null.
export function bfs(s: State): { dir: Dir | null; visited: number } {
  const start = s.body[0];
  const blocked = new Set(s.body.slice(0, -1).map(key)); // tail will move away
  const q: P[] = [start];
  const from = new Map<string, { p: P; d: Dir } | null>([[key(start), null]]);
  let visited = 0;
  while (q.length) {
    const c = q.shift()!;
    visited++;
    if (c.x === s.food.x && c.y === s.food.y) {
      let cur = c, first: Dir | null = null;
      while (from.get(key(cur))) { const f = from.get(key(cur))!; first = f.d; cur = f.p; }
      return { dir: first, visited };
    }
    for (const d of ["U", "D", "L", "R"] as Dir[]) {
      const n = { x: c.x + D[d].x, y: c.y + D[d].y };
      if (!inside(n) || blocked.has(key(n)) || from.has(key(n))) continue;
      from.set(key(n), { p: c, d });
      q.push(n);
    }
  }
  return { dir: null, visited };
}

// Fallback when no path exists: any safe neighbour.
export function anySafe(s: State): Dir | null {
  for (const d of ["U", "R", "D", "L"] as Dir[]) {
    if (d === OPP[s.dir]) continue;
    const n = { x: s.body[0].x + D[d].x, y: s.body[0].y + D[d].y };
    if (inside(n) && !s.body.slice(0, -1).some((p) => p.x === n.x && p.y === n.y)) return d;
  }
  return null;
}
