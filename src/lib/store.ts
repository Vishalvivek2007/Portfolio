"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Res = "lofi" | "broadcast" | "clean";
export type Phosphor = "white" | "green" | "amber";

interface AppState {
  booted: boolean;
  channel: number;
  res: Res;
  phosphor: Phosphor;
  unlocked: Phosphor[];
  hoverSkill: string | null;
  cam: "off" | "on" | "blocked"; // visitor's camera standing in for the portrait
  doodle: HTMLCanvasElement | null; // or their drawing from the Lab, packed the way the relief reads a picture
  set: (p: Partial<AppState>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      booted: false,
      channel: 1,
      res: "broadcast",
      phosphor: "white",
      unlocked: ["white"],
      hoverSkill: null,
      cam: "off",
      doodle: null,
      set: (p) => set(p),
    }),
    { name: "raster", partialize: (s) => ({ res: s.res, phosphor: s.phosphor, unlocked: s.unlocked }) },
  ),
);
