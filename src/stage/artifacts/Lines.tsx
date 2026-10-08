"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shared, type SlotCtx } from "../shared";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uPhosphor; uniform float uTime, uMosaic, uPhase, uAspect;
varying vec2 vUv;
void main() {
  vec2 cells = vec2(uMosaic * uAspect, uMosaic);
  vec2 q = (floor(vUv * cells) + 0.5) / cells; // mosaic-quantised
  float glow = 0.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float x = 0.5 + 0.48 * sin(q.y * (0.6 + fi * 0.15) + uTime * (0.15 + fi * 0.03) + fi * 1.9 + uPhase);
    glow += 0.012 / (abs(q.x - x) + 0.006);
  }
  glow = clamp(glow * 0.14, 0.0, 1.0);
  gl_FragColor = vec4(uPhosphor * glow * 0.32, 1.0);
}`;

export default function Lines({ ctx }: { ctx: SlotCtx; id: string }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uPhosphor: shared.uPhosphor, uTime: { value: 0 }, uMosaic: { value: 90 }, uPhase: { value: 0 }, uAspect: { value: 1 } },
  }), []);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const u = mat.uniforms;
    u.uTime.value = s.clock.elapsedTime;
    u.uAspect.value = ctx.aspect;
    u.uMosaic.value = ctx.lofi ? 50 : 100;
    u.uPhase.value = ctx.input.px * 2;
    const a = ctx.aspect;
    mesh.current?.scale.set(a >= 1 ? a : 1, a >= 1 ? 1 : 1 / a, 1);
  });
  return (
    <mesh ref={mesh} material={mat} position={[0, 0, -0.01]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
