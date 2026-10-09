"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLSL_SCREENS, shared, type SlotCtx } from "../shared";
import { slotEl } from "../slots";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// A halftone sea: warped noise sets the dot size, slow swells roll through it, and the pointer drops ripples.
const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uPhosphor; uniform vec2 uSize, uMouse; uniform float uTime, uCell, uHit;
varying vec2 vUv;
${GLSL_SCREENS}
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return vn(p) * 0.55 + vn(p * 2.03 + 7.1) * 0.3 + vn(p * 4.1 + 3.3) * 0.15; }
void main() {
  vec2 g = vUv * uSize / uCell;
  vec2 q = (floor(g) + 0.5) * uCell / uSize.y; // cell centre, in slot heights
  float t = uTime * 0.11;
  vec2 w = q * 2.6 + vec2(fbm(q * 2.0 + t), fbm(q * 2.0 - t + 4.0)) * 2.2;
  float n = fbm(w + vec2(t * 0.6, -t));
  float swell = 0.5 + 0.5 * sin(n * 24.0 - uTime * 0.8);
  float lum = smoothstep(0.38, 0.72, n) * (0.12 + 0.88 * swell * swell);
  vec2 m = vec2(uMouse.x * uSize.x / uSize.y, uMouse.y);
  float d = distance(q, m);
  lum += exp(-d * d * 14.0) * 0.35;
  lum += exp(-d * 2.2) * 0.5 * max(0.0, sin(d * 26.0 - uHit * 9.0)) * exp(-uHit * 1.6);
  float fade = mix(0.4, 1.0, smoothstep(0.3, 0.95, vUv.x)); // quieter behind the copy on the left
  gl_FragColor = vec4(uPhosphor * dotScreen(fract(g), lum) * (0.07 + lum * 0.4) * fade, 1.0);
}`;

export default function Lines({ ctx }: { ctx: SlotCtx; id: string }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, extensions: { derivatives: true } as never,
    uniforms: { uPhosphor: shared.uPhosphor, uTime: { value: 0 }, uCell: { value: 9 }, uHit: { value: 99 }, uSize: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(0.7, 0.5) } },
  }), []);
  const mesh = useRef<THREE.Mesh>(null);
  const aim = useRef({ x: 0.7, y: 0.5, hit: 99 });

  // the copy sits on top of this slot, so listen on the window rather than the slot
  useEffect(() => {
    const at = (e: PointerEvent) => {
      const r = slotEl.get("lines")?.getBoundingClientRect();
      if (!r || e.clientY < r.top || e.clientY > r.bottom) return false;
      aim.current.x = (e.clientX - r.left) / r.width; aim.current.y = 1 - (e.clientY - r.top) / r.height;
      return true;
    };
    const down = (e: PointerEvent) => { if (at(e)) aim.current.hit = 0; };
    addEventListener("pointermove", at); addEventListener("pointerdown", down);
    return () => { removeEventListener("pointermove", at); removeEventListener("pointerdown", down); };
  }, []);

  useFrame((s, dt) => {
    const u = mat.uniforms, a = ctx.aspect, o = aim.current;
    const w = a >= 1 ? a : 1, h = a >= 1 ? 1 : 1 / a;
    mesh.current?.scale.set(w, h, 1);
    const css = ctx.pxPerUnit / shared.uPixelRatio.value; // slot's short side in CSS px
    u.uSize.value.set(w * css, h * css);
    u.uCell.value = ctx.lofi ? 18 : 9;
    u.uTime.value = s.clock.elapsedTime;
    const k = 1 - Math.pow(0.002, dt);
    u.uMouse.value.x += (o.x - u.uMouse.value.x) * k; u.uMouse.value.y += (o.y - u.uMouse.value.y) * k;
    o.hit += dt; u.uHit.value = o.hit;
  });
  return (
    <mesh ref={mesh} material={mat} position={[0, 0, -0.01]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
