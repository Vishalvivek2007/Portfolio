"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shared, type SlotCtx } from "../shared";
import { content } from "@/content";

const VERT = /* glsl */ `
uniform float uSeed, uAmp, uFreq, uRidge, uTime;
varying vec2 vUv;
varying float vH;
float h2(vec2 p) { return fract(sin(dot(p + uSeed, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vUv = uv;
  vec2 p = vec2(uv.x * 6.0, uv.y * 3.0 + uTime * 0.05) * uFreq;
  float n = vn(p) * 0.6 + vn(p * 2.1) * 0.3 + vn(p * 4.3) * 0.1;
  float ridge = exp(-pow((uv.x - 0.5) * 4.0, 2.0)) * uRidge;
  float h = (n * uAmp + ridge) * smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);
  vH = h;
  vec3 pos = position; pos.z += h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;
const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uPhosphor; uniform float uRows, uDash;
varying vec2 vUv; varying float vH;
void main() {
  float f = abs(fract(vUv.y * uRows) - 0.5);
  float aa = max(fwidth(vUv.y * uRows), 0.02);
  float line = 1.0 - smoothstep(0.04, 0.04 + aa, f);
  if (uDash > 0.5) line *= step(0.5, fract(vUv.x * 120.0));
  gl_FragColor = vec4(uPhosphor * line * (0.35 + vH * 3.0), 1.0); // opaque black elsewhere: nearer ridges hide farther lines
}`;

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

export default function Strata({ ctx }: { ctx: SlotCtx; id: string }) {
  const entries = content.experience;
  const params = useMemo(() => entries.map((e) => {
    const h = hash(e.company);
    return { seed: (h % 997) / 10, amp: e.upcoming ? 0.03 : 0.12 + ((h >> 3) % 10) / 100, freq: 0.7 + ((h >> 5) % 10) / 12, ridge: e.upcoming ? 0.14 : 0.03, dash: e.upcoming ? 1 : 0, label: "0x" + h.toString(16).slice(0, 4) };
  }), [entries]);
  const rows = ctx.tier === 3 ? 96 : ctx.tier === 2 ? 64 : 40;
  const mesh = useRef<THREE.Mesh>(null);
  const st = useRef({ i: 0, clicks: 0, cur: { ...params[0] } });
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, extensions: { derivatives: true } as never,
    uniforms: { uSeed: { value: params[0].seed }, uAmp: { value: params[0].amp }, uFreq: { value: params[0].freq }, uRidge: { value: params[0].ridge }, uTime: { value: 0 }, uPhosphor: shared.uPhosphor, uRows: { value: rows }, uDash: { value: params[0].dash } },
    side: THREE.DoubleSide,
  }), [params, rows]);

  useFrame((s, dt) => {
    const o = st.current, u = mat.uniforms, inp = ctx.input;
    if (inp.clicks !== o.clicks) {
      o.clicks = inp.clicks; o.i = (o.i + 1) % params.length;
      const el = document.getElementById("readout-strata");
      if (el) el.textContent = "seed " + params[o.i].label + ", " + entries[o.i].company;
    }
    const t = params[o.i], k = 1 - Math.pow(0.02, dt);
    (["seed", "amp", "freq", "ridge"] as const).forEach((key) => { o.cur[key] += (t[key] - o.cur[key]) * k; });
    u.uSeed.value = o.cur.seed; u.uAmp.value = o.cur.amp; u.uFreq.value = o.cur.freq; u.uRidge.value = o.cur.ridge;
    if (mesh.current) mesh.current.scale.x = ctx.aspect * 1.15;
    u.uDash.value = t.dash; u.uTime.value = s.clock.elapsedTime; u.uRows.value = ctx.lofi ? rows / 2 : rows;
  });

    return (
    <group rotation={[-1.0, 0, 0]} position={[0, -0.1, 0]}>
      <mesh ref={mesh} material={mat}><planeGeometry args={[1, 1.6, 256, 96]} /></mesh>
    </group>
  );
}
