"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shared, type SlotCtx } from "../shared";
import { content } from "@/content";
import { useStore } from "@/lib/store";

// Ordered-dither shading in screen space: the pattern stays still while the object turns.
const VERT = /* glsl */ `
varying vec3 vN;
void main() {
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uPhosphor;
uniform float uBlock;
uniform float uHot;
uniform float uBase;
varying vec3 vN;
float bayer4(vec2 p) {
  int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0));
  int i = y * 4 + x;
  float m[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
  return (m[i] + 0.5) / 16.0;
}
void main() {
  vec3 n = normalize(vN);
  float lum = clamp(dot(n, normalize(vec3(-0.4, 0.6, 0.7))) * 0.6 + 0.45, 0.0, 1.0);
  lum += pow(1.0 - abs(n.z), 2.0) * 0.35;
  lum = clamp(lum * uBase + uHot, 0.0, 1.0);
  float thr = bayer4(floor(gl_FragCoord.xy / uBlock));
  if (lum < thr) discard;
  gl_FragColor = vec4(uPhosphor, 1.0);
}`;

const mat = () =>
  new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uPhosphor: shared.uPhosphor, uBlock: { value: 2 }, uHot: { value: 0 }, uBase: { value: 1 } },
  });

function rnd(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const RADII = [0.28, 0.36, 0.44];

export default function Orrery({ ctx }: { ctx: SlotCtx; id: string }) {
  const root = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group[]>([]);
  const st = useRef({ clicks: 0, lastDrag: 0, rx: 0.4, ry: 0, tilts: [] as number[][], target: [] as number[][] });
  const groups = useMemo(() => Object.entries(content.stack), []);
  const hover = useStore((s) => s.hoverSkill);

  const { core, ringMats, beadMats } = useMemo(() => ({
    core: mat(),
    ringMats: RADII.map(() => mat()),
    beadMats: groups.map(([, skills]) => skills.map(() => mat())),
  }), [groups]);

  const reseed = (seed: number) => {
    const r = rnd(seed);
    st.current.target = RADII.map(() => [(r() - 0.5) * 1.6, (r() - 0.5) * 1.6, r() * Math.PI * 2]);
    const el = document.getElementById("readout-orrery");
    if (el) el.textContent = String(seed).padStart(5, "0");
  };
  if (!st.current.target.length) {
    reseed(4211);
    st.current.tilts = st.current.target.map((t) => [...t]);
  }

  useFrame((s, dt) => {
    const o = st.current, inp = ctx.input;
    if (inp.clicks !== o.clicks) { o.clicks = inp.clicks; reseed(Math.floor(Math.random() * 99999)); }
    const k = 1 - Math.pow(0.02, dt);
    o.tilts.forEach((t, i) => t.forEach((_, j) => { t[j] += (o.target[i][j] - t[j]) * k; }));
    o.ry += 0.002 + (inp.dragX - o.lastDrag) * 0.6;
    o.lastDrag = inp.dragX;
    o.rx += (inp.dragY * 0.3 + 0.4 - o.rx) * 0.05;
    if (root.current) { root.current.rotation.y = o.ry; root.current.rotation.x = o.rx; }
    const t = s.clock.elapsedTime;
    rings.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.set(o.tilts[i][0], o.tilts[i][1], o.tilts[i][2] + t * (0.12 + i * 0.05) * (i % 2 ? -1 : 1));
    });
    ringMats.forEach((m, i) => { m.uniforms.uHot.value = hover && groups[i][1].includes(hover) ? 0.35 : 0; });
    beadMats.forEach((row, gi) => row.forEach((m, si) => { m.uniforms.uHot.value = groups[gi][1][si] === hover ? 1 : 0; }));
    const b = 2 * (ctx.lofi ? 2 : 1) * shared.uPixelRatio.value;
    core.uniforms.uBlock.value = b;
    ringMats.forEach((m) => (m.uniforms.uBlock.value = b));
    beadMats.flat().forEach((m) => (m.uniforms.uBlock.value = b));
  });

  return (
    <group ref={root}>
      <mesh material={core}><icosahedronGeometry args={[0.16, 2]} /></mesh>
      {RADII.map((r, i) => (
        <group key={i} ref={(g) => { if (g) rings.current[i] = g; }}>
          <mesh material={ringMats[i]}><torusGeometry args={[r, 0.004, 8, 96]} /></mesh>
          {groups[i][1].map((skill, si) => {
            const a = (si / groups[i][1].length) * Math.PI * 2;
            return (
              <mesh key={skill} material={beadMats[i][si]} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} scale={hover === skill ? 1.6 : 1}>
                <sphereGeometry args={[0.02, 12, 8]} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
