// Driving school: small neural networks learn to drive a road by trial, crash and inheritance. Pure logic, no DOM.
export type Pt = [number, number];

export const HW = 22; // road half-width, world units
export const CAR = 3; // car radius
const STEP = 10; // spacing of centreline points
const CELL = 4; // grid cell of the distance field
const RMIN = 40; // tightest centreline bend that is still drivable
export const RAYS = [-1.4, -0.8, -0.35, 0, 0.35, 0.8, 1.4]; // sensor directions relative to the heading, radians
export const RANGE = 160; // how far a sensor sees
export const IN = RAYS.length + 1; // the sensors, plus the car's own speed
export const HID = 8;
export const OUT = 2; // steer, throttle
export const GENES = IN * HID + HID + HID * OUT + OUT; // one driver is this many numbers
export const POP = 120;
const LANES = 6; // the starting grid is this many cars wide
const VMIN = 3, VMAX = 7, ACC = 0.1; // units per tick
const TURN = 0.085, GRIP = 0.3; // radians per tick at low speed; less when fast
const BLANK = 0.15; // first brains are numbers this close to zero, so nobody can drive yet
const ELITE = 4, MUT = 0.15, SIGMA = 0.3;

export type Track = {
  x: Float32Array; y: Float32Array; n: number; // centreline, evenly spaced, closed
  step: number; len: number; w: number; h: number;
  gw: number; gh: number; sdf: Float32Array; // distance to the road's edge on a grid: positive on the road
};

// points every `step` along a closed polyline
function resample(p: Pt[], step: number): Pt[] {
  const out: Pt[] = [];
  let t = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!d) continue;
    for (; t < d; t += step) out.push([a[0] + ((b[0] - a[0]) * t) / d, a[1] + ((b[1] - a[1]) * t) / d]);
    t -= d;
  }
  return out;
}
const at = (p: Pt[], i: number) => p[(i + p.length) % p.length];
const smooth = (p: Pt[]): Pt[] => p.map((q, i) => [(at(p, i - 1)[0] + 2 * q[0] + at(p, i + 1)[0]) / 4, (at(p, i - 1)[1] + 2 * q[1] + at(p, i + 1)[1]) / 4]);
const length = (p: Pt[]) => p.reduce((s, q, i) => s + Math.hypot(at(p, i + 1)[0] - q[0], at(p, i + 1)[1] - q[1]), 0);
// radius of the tightest bend
function tightest(p: Pt[]): number {
  let r = Infinity;
  for (let i = 0; i < p.length; i++) {
    const a = at(p, i - 1), q = p[i], b = at(p, i + 1), ux = q[0] - a[0], uy = q[1] - a[1], vx = b[0] - q[0], vy = b[1] - q[1];
    const turn = Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy));
    r = Math.min(r, (Math.hypot(ux, uy) + Math.hypot(vx, vy)) / 2 / Math.max(turn, 1e-6));
  }
  return r;
}

// A closed road from a freehand stroke: joined end to start, then smoothed until no bend is tighter than a car can turn.
// Returns null when the loop is too small to drive.
export function buildTrack(stroke: Pt[], w: number, h: number): Track | null {
  const m = HW + 4;
  let p = resample(stroke.map(([x, y]): Pt => [Math.max(m, Math.min(w - m, x)), Math.max(m, Math.min(h - m, y))]), STEP);
  // resampled after every round: smoothing alone bunches the points up in the corners and then stops rounding them
  for (let k = 0; k < 200 && p.length > 12 && tightest(p) < RMIN; k++) p = resample(smooth(smooth(p)), STEP);
  const len = length(p);
  if (len < 40 * STEP || tightest(p) < RMIN * 0.9) return null;
  p = resample(p, len / Math.round(len / STEP));
  if (Math.hypot(p[0][0] - at(p, -1)[0], p[0][1] - at(p, -1)[1]) < STEP / 2) p.pop(); // rounding can leave one extra point on top of the first
  const n = p.length, gw = Math.ceil(w / CELL) + 1, gh = Math.ceil(h / CELL) + 1, sdf = new Float32Array(gw * gh).fill(-HW);
  for (let i = 0; i < n; i++) {
    // only the grid points near this stretch of centreline can be closer to it than they already are to another
    const [ax, ay] = p[i], [bx, by] = at(p, i + 1), vx = bx - ax, vy = by - ay, vv = vx * vx + vy * vy, R = 2 * HW;
    const x0 = Math.max(0, Math.floor((Math.min(ax, bx) - R) / CELL)), x1 = Math.min(gw - 1, Math.ceil((Math.max(ax, bx) + R) / CELL));
    const y0 = Math.max(0, Math.floor((Math.min(ay, by) - R) / CELL)), y1 = Math.min(gh - 1, Math.ceil((Math.max(ay, by) + R) / CELL));
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
      const px = gx * CELL - ax, py = gy * CELL - ay, t = Math.max(0, Math.min(1, (px * vx + py * vy) / vv));
      const v = HW - Math.hypot(px - t * vx, py - t * vy);
      if (v > sdf[gy * gw + gx]) sdf[gy * gw + gx] = v;
    }
  }
  return { x: Float32Array.from(p, (q) => q[0]), y: Float32Array.from(p, (q) => q[1]), n, step: len / n, len, w, h, gw, gh, sdf };
}

// distance to the road's edge at a point: positive on the road, negative off it
export function edge(t: Track, x: number, y: number): number {
  const fx = x / CELL, fy = y / CELL;
  if (fx < 0 || fy < 0 || fx >= t.gw - 1 || fy >= t.gh - 1) return -HW;
  const ix = fx | 0, iy = fy | 0, ax = fx - ix, ay = fy - iy, i = iy * t.gw + ix, s = t.sdf;
  return (s[i] * (1 - ax) + s[i + 1] * ax) * (1 - ay) + (s[i + t.gw] * (1 - ax) + s[i + t.gw + 1] * ax) * ay;
}

// direction of travel at centreline point i, as a unit vector
export function heading(t: Track, i: number): Pt {
  const a = (i + t.n - 1) % t.n, b = (i + 1) % t.n, dx = t.x[b] - t.x[a], dy = t.y[b] - t.y[a], d = Math.hypot(dx, dy);
  return [dx / d, dy / d];
}

export type Car = {
  x: number; y: number; a: number; v: number; alive: boolean;
  seg: number; base: number; dist: number; // nearest centreline point, points passed since the start, distance driven along the road
  far: number; idle: number; // furthest distance so far, ticks since it last grew
  act: Float32Array; // what the brain drawing shows: inputs, then hidden neurons, then outputs
};

// Car i's place on the starting grid: rows of LANES behind the line, pointing along the road.
// Distance is counted from its own grid slot, so every car has to cover one full lap.
export function spawn(t: Track, i: number): Car {
  const seg = (t.n - Math.floor(i / LANES)) % t.n, [dx, dy] = heading(t, seg), side = ((i % LANES) - (LANES - 1) / 2) * 6;
  return { x: t.x[seg] - dy * side, y: t.y[seg] + dx * side, a: Math.atan2(dy, dx), v: VMIN, alive: true, seg, base: 0, dist: 0, far: 0, idle: 0, act: new Float32Array(IN + HID + OUT) };
}

// how far a sensor sees before the road ends: march along the ray, each step as long as the nearest edge is far
export function ray(t: Track, c: Car, angle: number): number {
  const dx = Math.cos(c.a + angle), dy = Math.sin(c.a + angle);
  let d = 0;
  for (let k = 0; k < 24 && d < RANGE; k++) {
    const s = edge(t, c.x + dx * d, c.y + dy * d);
    if (s <= 0) break;
    d += Math.max(s, 1.5);
  }
  return Math.min(d, RANGE);
}

// genome layout: hidden weights (HID x IN), hidden biases, output weights (OUT x HID), output biases
export function think(g: Float32Array, act: Float32Array) {
  for (let j = 0; j < HID; j++) {
    let s = g[IN * HID + j];
    for (let i = 0; i < IN; i++) s += g[j * IN + i] * act[i];
    act[IN + j] = Math.tanh(s);
  }
  const w2 = IN * HID + HID;
  for (let o = 0; o < OUT; o++) {
    let s = g[w2 + HID * OUT + o];
    for (let j = 0; j < HID; j++) s += g[w2 + o * HID + j] * act[IN + j];
    act[IN + HID + o] = Math.tanh(s);
  }
}

// one tick for one car: sense, think, move, then check whether it is still on the road and getting anywhere
export function drive(t: Track, c: Car, g: Float32Array) {
  RAYS.forEach((r, i) => { c.act[i] = 1 - ray(t, c, r) / RANGE; });
  c.act[RAYS.length] = (c.v - VMIN) / (VMAX - VMIN);
  think(g, c.act);
  c.v = Math.max(VMIN, Math.min(VMAX, c.v + c.act[IN + HID + 1] * ACC));
  c.a += c.act[IN + HID] * Math.min(TURN, GRIP / c.v);
  c.x += Math.cos(c.a) * c.v; c.y += Math.sin(c.a) * c.v;
  if (edge(t, c.x, c.y) < CAR) { c.alive = false; return; }
  // progress: the nearest centreline point among the few just behind and ahead, plus the position along that stretch.
  // Looking only nearby keeps a car on its own branch where a road crosses itself.
  let bi = c.seg, bd = Infinity;
  for (let k = -3; k <= 8; k++) {
    const i = (c.seg + k + t.n) % t.n, d = (t.x[i] - c.x) ** 2 + (t.y[i] - c.y) ** 2;
    if (d < bd) { bd = d; bi = i; }
  }
  let d = bi - c.seg;
  if (d > t.n / 2) d -= t.n; else if (d < -t.n / 2) d += t.n;
  c.base += d; c.seg = bi;
  const [dx, dy] = heading(t, bi);
  c.dist = c.base * t.step + (c.x - t.x[bi]) * dx + (c.y - t.y[bi]) * dy;
  if (c.dist > c.far + 0.5) { c.far = c.dist; c.idle = 0; } else if (++c.idle > 60 || c.dist < -40) c.alive = false;
}

const gauss = (rnd: () => number) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

// The next generation: the best few unchanged, the rest children of the better half
// (each number from one parent or the other, now and then nudged).
export function breed(pop: Float32Array[], fit: number[], rnd = Math.random): Float32Array[] {
  const order = fit.map((_, i) => i).sort((a, b) => fit[b] - fit[a]);
  const parent = () => { let b = order.length; for (let k = 0; k < 3; k++) b = Math.min(b, Math.floor(rnd() * order.length * 0.5)); return pop[order[b]]; };
  const next = order.slice(0, ELITE).map((i) => pop[i].slice());
  while (next.length < pop.length) {
    const a = parent(), b = rnd() < 0.5 ? a : parent();
    next.push(Float32Array.from(a, (v, g) => (rnd() < 0.5 ? v : b[g]) + (rnd() < MUT ? gauss(rnd) * SIGMA : 0)));
  }
  return next;
}

export type School = {
  track: Track; pop: Float32Array[]; cars: Car[];
  gen: number; tick: number; cap: number; // a heat ends when a car finishes the lap, when every car is out, or at the cap
  history: number[]; // how much of the lap the best car of each generation covered, 0..1
  bestLap: number; // fastest finished lap in ticks, 0 while nobody has finished
};

export function newSchool(track: Track, rnd = Math.random): School {
  const pop = Array.from({ length: POP }, () => Float32Array.from({ length: GENES }, () => gauss(rnd) * BLANK));
  return { track, pop, cars: pop.map((_, i) => spawn(track, i)), gen: 1, tick: 0, cap: Math.ceil(track.len / (VMIN * 0.9)), history: [], bestLap: 0 };
}

// One tick for every car still on the road. Returns true when the heat ended and the next generation was bred.
export function tickSchool(s: School, rnd = Math.random): boolean {
  const { track, cars, pop } = s;
  s.tick++;
  let alive = 0, lead = 0;
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    if (!c.alive) continue;
    drive(track, c, pop[i]);
    if (c.alive) alive++;
    lead = Math.max(lead, c.dist);
  }
  const finished = lead >= track.len;
  if (alive && !finished && s.tick < s.cap) return false;
  const fit = cars.map((c) => c.dist);
  s.history.push(Math.min(1, Math.max(0, ...fit) / track.len));
  if (finished && (!s.bestLap || s.tick < s.bestLap)) s.bestLap = s.tick;
  s.pop = breed(pop, fit, rnd);
  s.cars = s.pop.map((_, i) => spawn(track, i));
  s.gen++; s.tick = 0;
  return true;
}

// the road shown before anyone draws one, as fractions of the canvas
export const HOME: Pt[] = [[0.1, 0.5], [0.16, 0.2], [0.4, 0.14], [0.53, 0.42], [0.66, 0.14], [0.88, 0.18], [0.92, 0.55], [0.78, 0.86], [0.52, 0.7], [0.3, 0.88], [0.13, 0.8]];
