"use client";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { slotEl, type SlotId } from "./slots";
import { shared, refreshPhosphor, type SlotCtx, type SlotInput } from "./shared";
import { useStore } from "@/lib/store";
import Relief from "./artifacts/Relief";
import Orrery from "./artifacts/Orrery";
import Receiver from "./artifacts/Receiver";
import Strata from "./artifacts/Strata";
import Lines from "./artifacts/Lines";

type Artifact = ComponentType<{ ctx: SlotCtx; id: SlotId }>;
const ARTIFACTS: Record<SlotId, Artifact> = {
  portrait: Relief, figure: Relief, orrery: Orrery, receiver: Receiver, strata: Strata, lines: Lines,
};

function pickTier(): 1 | 2 | 3 {
  const q = new URLSearchParams(location.search).get("tier");
  if (q === "1" || q === "2" || q === "3") return +q as 1 | 2 | 3;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = matchMedia("(pointer: coarse)").matches;
  if (coarse) return mem >= 6 ? 2 : 1;
  return cores >= 8 && mem >= 8 ? 3 : 2;
}

// Tracks pointer + drag on a slot's DOM element. No raycasting; the canvas never gets events.
function useSlotInput(el: HTMLElement | undefined): SlotInput {
  const input = useRef<SlotInput>({ px: 0, py: 0, inside: false, dragX: 0, dragY: 0, clicks: 0 }).current;
  useEffect(() => {
    if (!el) return;
    let down = false, moved = 0, lx = 0, ly = 0;
    const pos = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      input.px = (e.clientX - r.left) / r.width - 0.5;
      input.py = 0.5 - (e.clientY - r.top) / r.height;
    };
    const enter = () => { input.inside = true; };
    const leave = () => { input.inside = false; down = false; };
    const move = (e: PointerEvent) => {
      pos(e);
      if (down) {
        input.dragX += (e.clientX - lx) * 0.01;
        input.dragY += (e.clientY - ly) * 0.01;
        moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
        lx = e.clientX; ly = e.clientY;
      }
    };
    const dn = (e: PointerEvent) => { down = true; moved = 0; lx = e.clientX; ly = e.clientY; };
    const up = () => { if (down && moved < 6) input.clicks++; down = false; };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", dn);
    addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", dn);
      removeEventListener("pointerup", up);
    };
  }, [el, input]);
  return input;
}

function SlotGroup({ id, el, tier, lofi }: { id: SlotId; el: HTMLElement; tier: 1 | 2 | 3; lofi: boolean }) {
  const g = useRef<THREE.Group>(null);
  const input = useSlotInput(el);
  const ctx = useMemo<SlotCtx>(() => ({ aspect: 1, tier, lofi, pxPerUnit: 1, input }), [tier, lofi, input]);
  const { size, gl } = useThree();
  // Updated every frame by the Placer below via userData; the artifact reads ctx.
  useEffect(() => {
    const group = g.current!;
    group.userData.place = () => {
      const r = el.getBoundingClientRect();
      const vh = innerHeight, vw = innerWidth;
      const visible = r.bottom > -vh * 0.2 && r.top < vh * 1.2 && r.width > 0;
      group.visible = visible;
      if (!visible) return;
      const s = Math.min(r.width, r.height);
      group.position.set(r.left + r.width / 2 - vw / 2, vh / 2 - (r.top + r.height / 2), 0);
      group.scale.setScalar(s);
      ctx.aspect = r.width / r.height;
      ctx.pxPerUnit = s * gl.getPixelRatio();
    };
  }, [el, ctx, size, gl]);
  const Art = ARTIFACTS[id];
  return (
    <group ref={g} name={"slot-" + id}>
      <Art ctx={ctx} id={id} />
    </group>
  );
}

// One clock: gsap's ticker drives the canvas, after lenis + ScrollTrigger (registered first in Shell).
function Clock({ root }: { root: React.RefObject<THREE.Group | null> }) {
  const { advance, camera, size, gl } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = (2 * Math.atan(size.height / 2000) * 180) / Math.PI;
    cam.position.set(0, 0, 1000);
    cam.updateProjectionMatrix();
    shared.uPixelRatio.value = gl.getPixelRatio();
  }, [camera, size, gl]);
  useEffect(() => {
    const tick = (t: number) => {
      if (document.hidden) return;
      shared.uTime.value = t;
      let any = false;
      root.current?.children.forEach((c) => {
        c.userData.place?.();
        any ||= c.visible;
      });
      if (any) advance(t);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [advance, root]);
  return null;
}

export default function Stage() {
  const res = useStore((s) => s.res);
  const phosphor = useStore((s) => s.phosphor);
  const [tier, setTier] = useState<1 | 2 | 3>(2);
  const [ids, setIds] = useState<SlotId[]>([]);
  const root = useRef<THREE.Group>(null);

  useEffect(() => {
    setTier(pickTier());
    // slots register in their own effects; read them after mount
    const t = setTimeout(() => setIds([...slotEl.keys()]), 50);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { requestAnimationFrame(refreshPhosphor); }, [phosphor, res]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      <Canvas
        frameloop="never"
        dpr={[1, tier === 3 ? 2 : tier === 2 ? 1.5 : 1]}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        camera={{ near: 1, far: 4000, position: [0, 0, 1000] }}
        style={{ pointerEvents: "none" }}
      >
        <Clock root={root} />
        <group ref={root}>
          {ids.map((id) => (
            <SlotGroup key={id} id={id} el={slotEl.get(id)!} tier={tier} lofi={res === "lofi"} />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
