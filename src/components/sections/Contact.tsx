"use client";
import { useState } from "react";
import { EnvelopeSimple, FilePdf, GithubLogo, LinkedinLogo } from "@phosphor-icons/react";
import { content } from "@/content";
import Slot from "@/components/Slot";

function power() {
  const body = document.body;
  const done = () => { try { sessionStorage.removeItem("raster-booted"); } catch { /* ignore */ } history.scrollRestoration = "manual"; scrollTo(0, 0); location.href = location.pathname; };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  [0, 12, 24, 36, 45, 49.9].forEach((v, i) => setTimeout(() => { body.style.clipPath = "inset(" + v + "% 0)"; }, i * 40));
  setTimeout(() => { body.style.clipPath = "inset(49.9% 49.9%)"; }, 280);
  setTimeout(done, 1100);
}

// Phosphor has no LeetCode mark; this is the Simple Icons path.
const LeetCode = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
  </svg>
);
const ICON: Record<string, React.ComponentType<{ size: number }>> = { GitHub: GithubLogo, LinkedIn: LinkedinLogo, LeetCode, "Résumé": FilePdf };

export default function Contact() {
  const [copied, setCopied] = useState(false);
  return (
    <section id="contact" className="section flex flex-col justify-between">
      <Slot id="lines" label="Lines of light, drawn live" className="absolute inset-0 !cursor-auto" />
      <div className="relative">
        <h2 className="h-name !normal-case max-w-[12ch]">Let&apos;s build something people use.</h2>
        <button
          className="mt-10 inv text-left font-medium tracking-tight leading-none text-[clamp(1.1rem,4.2vw,3.75rem)]"
          onClick={() => {
            navigator.clipboard?.writeText(content.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {content.email}
        </button>
        <p className="machine mt-2 flex items-center gap-2"><EnvelopeSimple size={16} aria-hidden />{copied ? "Copied" : "Copy email"}</p>
        <ul className="mt-14 border-t border-[var(--rule)] max-w-3xl">
          {content.links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noopener" className="flex items-center gap-4 py-3 border-b border-[var(--rule)] inv px-1">
                {(() => { const I = ICON[l.label]; return I ? <I size={24} aria-hidden /> : null; })()}
                <span className="flex-1">{l.label}</span>
                <span className="machine">{l.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <footer className="relative mt-20 flex flex-wrap justify-between gap-4 machine sm:pr-[calc(182px-var(--pad))]">
        <p>Vellore, India</p>
        <button className="inv px-2" onClick={power}>Power</button>
        <p>Built by hand with three.js and GLSL.</p>
      </footer>
    </section>
  );
}
