import { content } from "@/content";
import Slot from "@/components/Slot";
import TypeResolve from "@/components/TypeResolve";
import CamButton from "@/components/CamButton";

export default function Home() {
  const { name, tagline, school, next } = content;
  return (
    <section id="home" className="relative min-h-[100dvh] px-[var(--pad)] pt-24 pb-10 grid grid-cols-12 gap-x-6 gap-y-10 items-end">
      <div className="col-span-12 lg:col-span-6 order-2 lg:order-1">
        <h1 className="h-name glow flex flex-col">
          <TypeResolve text={name.first} delay={1.5} />
          <TypeResolve text={name.last} delay={1.7} />
        </h1>
        <div data-late className="mt-8">
          <p className="lead max-w-[32ch]">{tagline}</p>
          <div className="mt-6 flex gap-3">
            <a href="#work" className="px-5 py-2.5 bg-[var(--phosphor)] text-black">See the work</a>
            <a href="#contact" className="px-5 py-2.5 border border-[var(--phosphor)] inv">Get in touch</a>
          </div>
          <div className="machine mt-8">
            <p>{school}</p>
            <p>{next}</p>
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-6 order-1 lg:order-2 flex justify-center lg:justify-end max-lg:pb-14">
        <div className="relative w-full max-w-[min(72vw,calc((100dvh-8.5rem)*0.8))] aspect-[4/5]">
          <Slot id="portrait" label="Halftone portrait of Vishal, drawn live" className="absolute inset-0" />
          <p className="machine absolute right-full mr-4 top-0 hidden lg:block whitespace-nowrap text-right">mode <span id="readout-portrait">halftone</span><br />drag to tilt,<br />click to rescan</p>
          <CamButton />
        </div>
      </div>
    </section>
  );
}
