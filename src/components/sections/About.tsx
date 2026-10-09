import { content } from "@/content";
import Slot from "@/components/Slot";
import ScrubText from "@/components/ScrubText";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <h2 className="h2 mb-10">About</h2>
          <div className="grid gap-8 max-w-[36rem]">
            {content.about.map((t, i) => (
              <ScrubText key={i} text={t} className="lead" />
            ))}
          </div>
        </div>
        {/* desktop: the facts stand as a spec column between the copy and the figure */}
        <dl className="col-span-12 lg:col-start-7 lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-6 content-start self-start max-lg:mt-8 lg:border-l lg:border-[var(--rule)] lg:pl-6">
          {content.facts.map(([k, v]) => (
            <div key={k}>
              <dt className="machine">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="col-span-12 lg:col-start-9 lg:col-span-4 max-lg:order-first">
          {/* the right padding keeps the figure clear of the game dock in the corner; the width keeps it on one screen under the heading line */}
          <div className="flex justify-center lg:justify-end lg:pr-[calc(182px-var(--pad))]">
            <Slot id="figure" label="Line-screen figure of Vishal, drawn live" className="max-lg:h-[70vw] max-lg:max-h-[78dvh] lg:w-full lg:max-w-[calc((100dvh-13.5rem)*0.384)] aspect-[96/250]" />
          </div>
        </div>
      </div>
    </section>
  );
}
