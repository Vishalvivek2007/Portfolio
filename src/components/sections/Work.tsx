import { content } from "@/content";
import Slot from "@/components/Slot";

export default function Work() {
  const p = content.projects[0];
  return (
    <section id="work" className="section">
      <h2 className="h2 mb-12">Work</h2>
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-7">
          <a href={p.href} target="_blank" rel="noopener" aria-label={"Open " + p.name} className="block">
            <Slot id="receiver" label={p.name + " playing on a broadcast monitor"} className="aspect-[4/3] w-full">
              <span className="machine absolute left-0 -bottom-6">ch 1, {p.name.toLowerCase()}</span>
            </Slot>
          </a>
          <p className="machine mt-14">1 {p.name} &nbsp;&nbsp; 2 no signal &nbsp;&nbsp; 3 no signal</p>
          <p className="machine">Nothing on the other channels yet. The next project is being built.</p>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <h3 className="text-5xl font-medium tracking-tight">{p.name}</h3>
          <p className="lead mt-3 max-w-[30ch]">{p.summary}</p>
          <dl className="mt-8 grid gap-6">
            <div>
              <dt className="machine mb-2">What it does</dt>
              <dd>
                <ul className="grid gap-2">
                  {p.does.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="machine mb-2">Built with</dt>
              <dd>{p.stack}</dd>
            </div>
            <div>
              <dt className="machine mb-2">My part</dt>
              <dd>{p.role}</dd>
            </div>
          </dl>
          <div className="mt-8 flex gap-3">
            <a href={p.href} target="_blank" rel="noopener" className="px-5 py-2.5 bg-[var(--phosphor)] text-black">Open {p.name}</a>
            <a href={p.repo} className="px-5 py-2.5 border border-[var(--phosphor)] inv">Read the code</a>
          </div>
        </div>
      </div>
    </section>
  );
}
