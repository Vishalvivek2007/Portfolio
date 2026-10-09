"use client";
import { useStore } from "@/lib/store";

// Swaps the hero portrait for the visitor's own camera, drawn through the same halftone relief, and hands it back
// when the camera or a drawing from the Lab is on screen.
export default function CamButton() {
  const cam = useStore((s) => s.cam);
  const doodle = useStore((s) => s.doodle);
  const res = useStore((s) => s.res);
  const set = useStore((s) => s.set);
  if (res === "clean") return null; // no live canvas in Clean mode
  const on = cam === "on" || !!doodle;
  return (
    <p className="machine absolute left-0 top-full mt-3 flex flex-col items-start gap-1 lg:left-auto lg:right-full lg:mr-4 lg:top-20 lg:mt-0 lg:items-end whitespace-nowrap" data-late>
      <button className="btn inv" aria-pressed={on} onClick={() => set(on ? { cam: "off", doodle: null } : { cam: "on" })}>
        {on ? "Back to Vishal" : "Put yourself on screen"}
      </button>
      <span>{doodle ? "your drawing, from the Lab" : cam === "on" ? "your camera, never leaves this page" : cam === "blocked" ? "camera unavailable or blocked" : ""}</span>
    </p>
  );
}
