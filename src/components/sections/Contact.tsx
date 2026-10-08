"use client";
import { useState } from "react";
import { content } from "@/content";
import Slot from "@/components/Slot";
import { goTo } from "@/components/shell/Shell";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  return (
    <section id="contact" className="section flex flex-col justify-between">
      <Slot id="lines" label="Lines of light, drawn live" className="absolute inset-0 !cursor-auto" />
      <div className="relative">
        <h2 className="h-name !normal-case max-w-[12ch]">Let&apos;s build something people use.</h2>
        <button
          className="h2 mt-10 inv text-left"
          onClick={() => {
            navigator.clipboard?.writeText(content.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {content.email}
        </button>
        <p className="machine mt-2">{copied ? "Copied" : "Copy email"}</p>
        <ul className="mt-14 border-t border-[var(--rule)] max-w-3xl">
          {content.links.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="flex justify-between py-3 border-b border-[var(--rule)] inv px-1">
                <span>{l.label}</span>
                <span className="machine">{l.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <footer className="relative mt-20 flex flex-wrap justify-between gap-4 machine">
        <p>Vellore, India</p>
        <button className="inv px-2" onClick={() => goTo(1)}>Power</button>
        <p>Built by hand with three.js and GLSL.</p>
      </footer>
    </section>
  );
}
