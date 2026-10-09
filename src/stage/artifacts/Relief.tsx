"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { GLSL_SCREENS, shared, type SlotCtx } from "../shared";
import type { SlotId } from "../slots";
import { useStore } from "@/lib/store";

const VERT = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uGrid;
uniform vec2 uHalf;      // half extents of the field in unit-box space
uniform float uBlock;    // boot: cells grouped in blocks of this many
uniform float uInflate;
uniform float uCell;
uniform vec2 uPointer;
uniform float uPress;
uniform float uDissolve;
uniform float uSkip;     // lo-fi: draw every second cell
uniform vec2 uShear;     // slot offset from screen centre / camera distance
uniform float uCam;      // 1 = uTex is a live camera frame
uniform vec2 uCamFit;    // crops the camera frame to the slot
attribute vec2 aCell;
varying vec2 vCell;
varying vec3 vTex;
varying float vLum;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main() {
  vec2 cell = aCell;
  vec2 q = floor(cell / uBlock) * uBlock + 0.5 * uBlock;
  vec2 uv = clamp(q / uGrid, 0.0, 1.0);
  vec3 t = texture2D(uTex, uv).rgb;
  if (uCam > 0.5) { // mirrored camera: brightness doubles as depth, everything is in the matte
    vec3 c = texture2D(uTex, (vec2(1.0 - uv.x, uv.y) - 0.5) * uCamFit + 0.5).rgb;
    float l = smoothstep(0.04, 0.9, dot(c, vec3(0.299, 0.587, 0.114)));
    t = vec3(l, 0.35 + l * 0.45, 1.0);
  }
  vTex = t;
  vec2 p = (aCell + 0.5) / uGrid;
  vec2 pos = vec2(mix(-uHalf.x, uHalf.x, p.x), mix(-uHalf.y, uHalf.y, p.y));
  float z = (t.g - 0.35) * 0.22 * uInflate;
  float d = length(pos - uPointer);
  float lift = exp(-d * d / 0.012) * uPress;
  z += lift * 0.12;
  float size = uCell * (1.0 + lift * 0.4);
  float visible = step(0.12, t.b);
  float gone = step(uDissolve, h(aCell * 0.37 + 1.7));
  if (uSkip > 0.5 && (mod(aCell.x, 2.0) > 0.5 || mod(aCell.y, 2.0) > 0.5)) visible = 0.0;
  vCell = aCell;
  vLum = t.r;
  pos -= z * uShear; // cancel the sideways parallax a slot away from screen centre would get, so the relief reads head-on
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, z, 1.0);
  gl_PointSize = size * visible * (1.0 - step(0.5, uDissolve) * (1.0 - gone));
  if (visible < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uPhosphor;
uniform float uModeA;
uniform float uModeB;
uniform float uScan;
uniform float uMorph;
uniform float uGridY;
varying vec2 vCell;
varying vec3 vTex;
varying float vLum;
${GLSL_SCREENS}
float shape(float mode, vec2 p, float lum) {
  if (mode < 0.5) return dotScreen(p, lum) * 1.0;
  if (mode < 1.5) { // ascii-ish glyph ladder
    float l = lum;
    vec2 c = p - 0.5;
    if (l < 0.15) return 0.0;
    if (l < 0.35) return step(length(c), 0.09);
    if (l < 0.55) return max(step(length(c - vec2(0.0, 0.17)), 0.08), step(length(c + vec2(0.0, 0.17)), 0.08));
    if (l < 0.78) return max(step(abs(c.x), 0.06) * step(abs(c.y), 0.34), step(abs(c.y), 0.06) * step(abs(c.x), 0.34));
    return max(step(abs(c.x - 0.15), 0.06), step(abs(c.x + 0.15), 0.06)) * step(abs(c.y), 0.38) + max(step(abs(c.y - 0.15), 0.06), step(abs(c.y + 0.15), 0.06)) * step(abs(c.x), 0.38);
  }
  if (mode < 2.5) return barScreen(vec2(p.x, p.y), lum * 1.1);
  return step(0.5, blockScreen(lum) + 0.17) * 0.0 + (blockScreen(lum) > 0.01 ? (0.25 + 0.75 * blockScreen(lum)) : 0.0) * step(max(abs(p.x - 0.5), abs(p.y - 0.5)), 0.5);
}
void main() {
  vec2 p = gl_PointCoord;
  p.y = 1.0 - p.y;
  float lum = pow(clamp(vTex.r, 0.0, 1.0), 0.9);
  float scanLine = vCell.y / uGridY; // top of image is high y in cell space (flipped in the vertex stage)
  float useB = step(scanLine, uScan);
  float mode = mix(uModeA, uModeB, useB);
  // boot morph: blocks first, then the real mode
  mode = mix(3.0, mode, step(0.5, uMorph));
  float a = shape(mode, p, lum);
  float halo = smoothstep(0.5, 0.0, length(p - 0.5)) * 0.18 * lum;
  float k = clamp(a + (mode < 0.5 ? halo : 0.0), 0.0, 1.0);
  if (k < 0.01) discard;
  gl_FragColor = vec4(uPhosphor * (0.35 + 0.65 * lum) * k, k);
}`;

const MODES = ["halftone", "ascii", "line", "block"];
const SRC: Record<string, { url: string; grid: [number, number]; mode: number }> = {
  portrait: { url: "/relief/portrait.png", grid: [200, 250], mode: 0 },
  figure: { url: "/relief/figure.png", grid: [96, 250], mode: 2 },
};

export default function Relief({ ctx, id }: { ctx: SlotCtx; id: SlotId }) {
  const cfg = SRC[id];
  const gridScale = ctx.tier === 3 ? 1 : ctx.tier === 2 ? 0.75 : 0.5;
  const grid: [number, number] = [Math.round(cfg.grid[0] * gridScale), Math.round(cfg.grid[1] * gridScale)];
  const group = useRef<THREE.Group>(null);
  const fit = id === "figure" ? 0.94 : 1; // the figure's near parts are drawn larger by perspective; this keeps the feet inside the brackets
  const state = useRef({ press: 0, tx: 0, ty: 0, scanning: false, mode: cfg.mode, clicks: 0 });

  const { geometry, material } = useMemo(() => {
    const n = grid[0] * grid[1];
    const cells = new Float32Array(n * 2);
    for (let y = 0; y < grid[1]; y++) for (let x = 0; x < grid[0]; x++) { cells[(y * grid[0] + x) * 2] = x; cells[(y * grid[0] + x) * 2 + 1] = y; }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aCell", new THREE.BufferAttribute(cells, 2));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    const tex = new THREE.TextureLoader().load(cfg.url);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.colorSpace = THREE.NoColorSpace;
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      extensions: { derivatives: true } as never,
      uniforms: {
        uTex: { value: tex }, uGrid: { value: new THREE.Vector2(...grid) }, uHalf: { value: new THREE.Vector2(0.5, 0.5) },
        uBlock: { value: 32 }, uInflate: { value: 0 }, uCell: { value: 4 }, uPointer: { value: new THREE.Vector2(9, 9) },
        uPress: { value: 0 }, uDissolve: { value: 0 }, uSkip: { value: 0 },
        uShear: { value: new THREE.Vector2() }, uCam: { value: 0 }, uCamFit: { value: new THREE.Vector2(1, 1) },
        uModeA: { value: cfg.mode }, uModeB: { value: cfg.mode }, uScan: { value: -1 }, uMorph: { value: 0 }, uGridY: { value: grid[1] },
        uPhosphor: shared.uPhosphor,
      },
    });
    return { geometry: g, material: m };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid[0], grid[1], id]);

  // boot: coarse blocks resolve to fine cells, then blocks become the real mode and the relief inflates
  useEffect(() => {
    const u = material.uniforms;
    const skipBoot = document.documentElement.dataset.boot !== "run" || id === "figure";
    if (skipBoot) { u.uBlock.value = 1; u.uMorph.value = 1; u.uInflate.value = 1; return; }
    const tl = gsap.timeline({ delay: 0.15 });
    [32, 16, 8, 4, 2, 1].forEach((b, i) => tl.set(u.uBlock, { value: b }, i * 0.2));
    tl.set(u.uMorph, { value: 1 }, 1.3);
    tl.to(u.uInflate, { value: 1, duration: 0.7, ease: "power2.out" }, 1.3);
    return () => { tl.kill(); };
  }, [material, id]);

  // "Put yourself on screen": the visitor's camera replaces the photo. Frames never leave the page.
  const cam = useStore((st) => st.cam);
  useEffect(() => {
    if (id !== "portrait" || cam !== "on") return;
    const u = material.uniforms, still = u.uTex.value;
    const video = document.createElement("video");
    video.muted = true; video.playsInline = true;
    let stream: MediaStream | null = null, live: THREE.VideoTexture | null = null, dead = false;
    (navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false }) ?? Promise.reject())
      .then(async (ms) => {
        stream = ms;
        if (dead) return ms.getTracks().forEach((t) => t.stop());
        video.srcObject = ms;
        await video.play();
        live = new THREE.VideoTexture(video);
        live.colorSpace = THREE.NoColorSpace;
        const va = video.videoWidth / video.videoHeight, sa = 4 / 5;
        u.uCamFit.value.set(Math.min(1, sa / va), Math.min(1, va / sa));
        u.uTex.value = live; u.uCam.value = 1;
      })
      .catch(() => useStore.getState().set({ cam: "blocked" }));
    return () => { dead = true; stream?.getTracks().forEach((t) => t.stop()); u.uTex.value = still; u.uCam.value = 0; live?.dispose(); };
  }, [cam, id, material]);

  useFrame((_, dt) => {
    const s = state.current, u = material.uniforms, inp = ctx.input;
    const slot = group.current?.parent;
    if (slot) u.uShear.value.set(slot.position.x / 1000, slot.position.y / 1000); // camera sits 1000 px back
    const k = 1 - Math.pow(0.0005, dt);
    const aspect = ctx.aspect;
    const half = aspect >= 1 ? [0.5 * aspect, 0.5] : [0.5, 0.5 / aspect];
    u.uHalf.value.set(half[0], half[1]);
    u.uCell.value = ((half[0] * 2) / grid[0]) * ctx.pxPerUnit * 1.04 * fit * (ctx.lofi ? 2 : 1);
    u.uSkip.value = ctx.lofi ? 1 : 0;
    s.press += ((inp.inside ? 1 : 0) - s.press) * k;
    u.uPress.value = s.press;
    u.uPointer.value.set(inp.px * 2 * half[0], inp.py * 2 * half[1]);
    if (id === "portrait") {
      s.tx += ((-inp.py * 0.3 + inp.dragY * 0.2) - s.tx) * k;
      s.ty += ((inp.px * 0.3 + inp.dragX * 0.2) - s.ty) * k;
      if (group.current) { group.current.rotation.x = s.tx; group.current.rotation.y = s.ty; }
    } else if (group.current) group.current.rotation.y = -0.25; // the figure stands on the right, turned slightly toward the copy
    if (inp.clicks !== s.clicks && !s.scanning) {
      s.clicks = inp.clicks; s.scanning = true;
      const next = (s.mode + 1) % 4;
      u.uModeB.value = next; u.uModeA.value = s.mode; u.uScan.value = 0;
      gsap.to(u.uScan, { value: 1.001, duration: 0.9, ease: "none", onComplete: () => {
        u.uModeA.value = next; u.uScan.value = -1; s.mode = next; s.scanning = false;
        const el = document.getElementById("readout-" + id); if (el) el.textContent = MODES[next];
      } });
    }
  });

  return (
    <group ref={group} scale={fit} position={[0, (1 - fit) * 1.9, 0]}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
