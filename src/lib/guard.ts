// Fences for /api/doodle, which spends money on every call: a few calls per visitor, and only a small PNG gets through.
const PER_MINUTE = 6, PER_DAY = 40, EVERYONE_PER_DAY = 1500, DAY = 864e5;
const calls = new Map<string, number[]>();
let since = 0, total = 0;

// ponytail: these counters live in one server instance's memory, so each warm instance allows its own quota and a cold
// start forgets them. The spend limit set on the AI Gateway is the hard stop; move the counts to a shared store if the
// endpoint is ever abused.
export function allow(who: string, now: number): boolean {
  if (now - since >= DAY) { since = now; total = 0; calls.clear(); }
  const mine = calls.get(who) ?? [];
  if (total >= EVERYONE_PER_DAY || mine.length >= PER_DAY || mine.filter((t) => now - t < 6e4).length >= PER_MINUTE) return false;
  calls.set(who, [...mine, now]);
  total++;
  return true;
}

// the base64 of the PNG in a request body, or null if the body is anything else
export function picture(body: string): string | null {
  if (body.length > 200_000) return null;
  let image: unknown;
  try { image = (JSON.parse(body) as { image?: unknown } | null)?.image; } catch { return null; }
  const m = typeof image === "string" ? /^data:image\/png;base64,([A-Za-z0-9+/]{100,}={0,2})$/.exec(image) : null;
  return m ? m[1] : null;
}
