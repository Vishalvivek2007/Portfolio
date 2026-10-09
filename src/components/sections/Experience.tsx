import { content } from "@/content";
import Slot from "@/components/Slot";
import type { SlotId } from "@/stage/slots";

export default function Experience() {
  return (
    <section id="experience" className="section">
      <h2 className="h2 mb-12">Experience</h2>
      <ol className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {content.experience.map((e, i) => (
          <li key={e.company} data-card className={"group border border-[var(--rule)] hover:border-[var(--dim)] p-6 flex flex-col " + (e.upcoming ? "border-dashed" : "")}>
            <p className="machine flex justify-between">
              <span className={e.upcoming ? "bg-[var(--phosphor)] text-black px-1" : ""}>{e.upcoming ? "Up next" : <time>{e.when}</time>}</span>
              <span>{e.role.toLowerCase()}</span>
            </p>
            <Slot id={("logo" + i) as SlotId} label={e.company + " logo, turning"} className="w-full aspect-[4/3] my-6 !cursor-grab" />
            <h3 className="text-3xl lg:text-4xl font-medium tracking-tight text-[var(--dim)] group-hover:text-[var(--phosphor)]">{e.company}</h3>
            {e.points.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {e.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <p className="machine mt-4">hover a card for colour, drag a logo to spin it</p>
    </section>
  );
}
