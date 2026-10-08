import { content } from "@/content";
import Slot from "@/components/Slot";

export default function Home() {
  const { name, tagline, school, next } = content;
  return (
    <section id="home" className="relative min-h-[100dvh] px-[var(--pad)] pt-24 pb-10 flex flex-col">
      <div className="flex-1 flex justify-center items-center">
        <Slot id="portrait" label="Halftone portrait of Vishal, drawn live" className="h-[50dvh] lg:h-[56dvh] aspect-[4/5]">
          <p className="machine absolute left-full ml-4 bottom-0 hidden lg:block whitespace-nowrap">mode <span id="readout-portrait">halftone</span><br />drag to tilt,<br />click to rescan</p>
        </Slot>
      </div>
      <h1 className="h-name glow relative -mt-[0.5em] flex justify-between w-full" style={{ mixBlendMode: "difference" }}>
        <span>{name.first}</span>
        <span>{name.last}</span>
      </h1>
      <div className="mt-8 grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 lg:col-span-5">
          <p className="lead max-w-[32ch]">{tagline}</p>
          <div className="mt-6 flex gap-3">
            <a href="#work" className="px-5 py-2.5 bg-[var(--phosphor)] text-black">See the work</a>
            <a href="#contact" className="px-5 py-2.5 border border-[var(--phosphor)] inv">Get in touch</a>
          </div>
        </div>
        <div className="col-span-12 lg:col-start-9 lg:col-span-4 machine lg:text-right">
          <p>{school}</p>
          <p>{next}</p>
        </div>
      </div>
    </section>
  );
}
