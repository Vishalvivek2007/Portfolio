"use client";
import { useStore } from "@/lib/store";

// Swaps the hero portrait for the visitor's own camera, drawn through the same halftone relief.
export default function CamButton() {
  const cam = useStore((s) => s.cam);
  const res = useStore((s) => s.res);
  const set = useStore((s) => s.set);
  if (res === "clean") return null; // no live canvas in Clean mode
  return (
    <p className="machine absolute left-0 top-full mt-3 flex flex-col items-start gap-1 lg:left-auto lg:right-full lg:mr-4 lg:top-20 lg:mt-0 lg:items-end whitespace-nowrap" data-late>
      <button className="btn inv" aria-pressed={cam === "on"} onClick={() => set({ cam: cam === "on" ? "off" : "on" })}>
        {cam === "on" ? "Back to Vishal" : "Put yourself on screen"}
      </button>
      <span>{cam === "on" ? "your camera, never leaves this page" : cam === "blocked" ? "camera unavailable or blocked" : ""}</span>
    </p>
  );
}
