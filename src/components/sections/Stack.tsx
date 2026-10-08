"use client";
import { content } from "@/content";
import Slot from "@/components/Slot";
import { useStore } from "@/lib/store";

export default function Stack() {
  const set = useStore((s) => s.set);
  const hover = useStore((s) => s.hoverSkill);
  return (
    <section id="stack" className="section">
      <h2 className="h2 mb-12">Stack</h2>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 content-start">
          {Object.entries(content.stack).map(([group, skills]) => (
            <div key={group}>
              <h3 className="machine mb-3">{group}</h3>
              <ul>
                {skills.map((s) => (
                  <li key={s}>
                    <button
                      className={"inv w-full text-left py-1 px-1 text-xl " + (hover === s ? "bg-[var(--phosphor)] text-black" : "")}
                      onMouseEnter={() => set({ hoverSkill: s })}
                      onMouseLeave={() => set({ hoverSkill: null })}
                      onFocus={() => set({ hoverSkill: s })}
                      onBlur={() => set({ hoverSkill: null })}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="col-span-12 lg:col-span-5">
          <Slot id="orrery" label="Orrery of skills in ordered dither, drawn live" className="aspect-square w-full" />
          <p className="machine mt-3">seed <span id="readout-orrery">04211</span>, drag to turn, click to re-seed</p>
        </div>
      </div>
      <p className="mt-16 max-w-[50ch]">{content.education}</p>
    </section>
  );
}
