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
      set: (p) => set(p),
    }),
    { name: "raster", partialize: (s) => ({ res: s.res, phosphor: s.phosphor, unlocked: s.unlocked }) },
  ),
);
