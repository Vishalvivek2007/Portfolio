import { content } from "@/content";
import Slot from "@/components/Slot";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <Slot id="figure" label="Line-screen figure of Vishal, drawn live" className="h-[70vw] max-h-[78dvh] aspect-[96/250] mx-auto lg:mx-0" />
          </div>
        </div>
        <div className="col-span-12 lg:col-start-5 lg:col-span-8">
          <h2 className="h2 mb-10">About</h2>
          <div className="grid gap-8 max-w-[38ch]">
            {content.about.map((t, i) => (
              <p key={i} className="lead">{t}</p>
            ))}
          </div>
          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-6 max-w-xl">
            {content.facts.map(([k, v]) => (
              <div key={k}>
                <dt className="machine">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
