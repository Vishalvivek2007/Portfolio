import { content } from "@/content";
import Slot from "@/components/Slot";

export default function Experience() {
  return (
    <section id="experience" className="section">
      <h2 className="h2 mb-10">Experience</h2>
      <Slot id="strata" label="Scanline terrain, drawn live" className="w-full aspect-[21/9] mb-12" />
      <p className="machine -mt-8 mb-10" id="readout-strata">seed 0x{"0000"}, click to change entry</p>
      <ol className="border-t border-[var(--rule)]">
        {content.experience.map((e, i) => (
          <li key={i} className={"grid grid-cols-12 gap-6 py-6 border-b border-[var(--rule)] " + (e.upcoming ? "text-[var(--dim)] border-dashed" : "")}>
            <p className="col-span-12 md:col-span-2 machine">{e.upcoming ? "Upcoming" : <time>{e.when}</time>}</p>
            <div className="col-span-12 md:col-span-4">
              <h3 className="text-2xl font-medium">{e.company}</h3>
              <p className="text-[var(--dim)]">{e.role}</p>
            </div>
            <ul className="col-span-12 md:col-span-6 grid gap-2">
              {e.points.map((p, j) => (
                <li key={j}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
