import { content } from "@/content";
import { parseContributions } from "@/lib/contrib";

const LIT = [0.1, 0.38, 0.58, 0.8, 1]; // brightness per GitHub activity level

// The real GitHub contribution calendar as pixel squares, re-fetched once a day. Renders nothing if GitHub is unreachable.
export default async function GitGrid() {
  const url = "https://github.com/" + content.github;
  const html = await fetch("https://github.com/users/" + content.github + "/contributions", { next: { revalidate: 86400 } })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");
  const { total, days } = parseContributions(html);
  if (!days.length) return null;
  const cols = Math.max(...days.map((d) => d.col)) + 1;
  return (
    <div className="mt-20">
      <h3 className="h2 !text-4xl md:!text-5xl mb-3">Commits</h3>
      <p className="machine mb-6">
        {total ? total + " contributions in the last year, " : ""}
        <a href={url} target="_blank" rel="noopener" className="inv underline underline-offset-4">github.com/{content.github}</a>
      </p>
      <div className="slot border border-[var(--rule)] p-3 sm:p-5 !cursor-auto">
        <span className="br" />
        <svg viewBox={`0 0 ${cols * 12} 84`} className="block w-full text-[var(--phosphor)]" shapeRendering="crispEdges" role="img" aria-label={(total ?? "") + " GitHub contributions in the last year, one square per day"}>
          {days.map((d) => (
            <rect key={d.date} x={d.col * 12 + 1} y={d.row * 12 + 1} width={10} height={10} fill="currentColor" opacity={LIT[d.level]}>
              <title>{d.tip}</title>
            </rect>
          ))}
        </svg>
      </div>
      <p className="machine mt-3">one square per day, brighter means more commits</p>
    </div>
  );
}
