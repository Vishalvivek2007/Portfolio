// Parses the HTML fragment GitHub serves at github.com/users/<user>/contributions.
export type Day = { date: string; row: number; col: number; level: number; tip: string };

export function parseContributions(html: string): { total: string | null; days: Day[] } {
  const tips = new Map([...html.matchAll(/<tool-tip[^>]*for="contribution-day-component-(\d+-\d+)"[^>]*>([^<]*)</g)].map((m) => [m[1], m[2].trim()]));
  const days = [...html.matchAll(/data-date="([\d-]+)" id="contribution-day-component-((\d+)-(\d+))" data-level="(\d)"/g)].map((m) => ({
    date: m[1], row: +m[3], col: +m[4], level: +m[5], tip: tips.get(m[2]) ?? m[1],
  }));
  return { total: html.match(/>\s*([\d,]+)\s+contributions?\s+in the last year/)?.[1] ?? null, days };
}
