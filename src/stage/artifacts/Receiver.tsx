"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { GLSL_SCREENS, shared, type SlotCtx } from "../shared";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec3 uPhosphor;
uniform float uColor, uStatic, uRoll, uScroll, uTime, uLines;
varying vec2 vUv;
${GLSL_SCREENS}
void main() {
  vec2 c = vUv * 2.0 - 1.0;
  c *= 1.0 + 0.12 * dot(c, c);
  vec2 uv = c * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  uv.y = fract(uv.y + uRoll);
  // the capture is a tall strip: a 4:3 window pans down it
  vec2 tuv = vec2(uv.x, uScroll + (1.0 - uv.y) * 0.25);
  tuv.y = 1.0 - tuv.y;
  vec3 col = texture2D(uTex, tuv).rgb;
  float stripe = mod(floor(uv.x * 640.0), 3.0);
  vec3 mask = vec3(stripe < 1.0 ? 1.0 : 0.55, (stripe >= 1.0 && stripe < 2.0) ? 1.0 : 0.55, stripe >= 2.0 ? 1.0 : 0.55);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 mono = uPhosphor * pow(l, 0.8) * 1.4;
  vec3 rgb = mix(mono, col * mask * 1.15, uColor);
  float line = 0.55 + 0.45 * smoothstep(0.0, 0.5, abs(fract(uv.y * uLines) - 0.5) * 2.0);
  rgb *= line;
  float snow = hash12(floor(uv * vec2(320.0, 240.0)) + floor(uTime * 24.0));
  rgb = mix(rgb, uPhosphor * snow, uStatic);
  float edge = smoothstep(0.0, 0.08, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  gl_FragColor = vec4(rgb * edge, 1.0);
}`;

export default function Receiver({ ctx }: { ctx: SlotCtx; id: string }) {
  const group = useRef<THREE.Group>(null);
  const s = useRef({ tuned: false, rx: 0, ry: 0, col: 0 });
  const material = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/work/vmaxx-strip.webp");
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, extensions: { derivatives: true } as never,
      uniforms: { uTex: { value: tex }, uPhosphor: shared.uPhosphor, uColor: { value: 0 }, uStatic: { value: 1 }, uRoll: { value: 0 }, uScroll: { value: 0 }, uTime: { value: 0 }, uLines: { value: 240 } },
    });
  }, []);
  useEffect(() => () => { material.dispose(); }, [material]);

  useFrame((state, dt) => {
    const o = s.current, u = material.uniforms, inp = ctx.input;
    if (group.current?.parent?.visible && !o.tuned) {
      o.tuned = true;
      gsap.to(u.uStatic, { value: 0, duration: 0.6, ease: "steps(8)" });
      gsap.fromTo(u.uRoll, { value: 0.35 }, { value: 0, duration: 0.6, ease: "steps(6)" });
    }
    const k = 1 - Math.pow(0.001, dt);
    const target = inp.inside || matchMedia("(pointer: coarse)").matches ? 1 : 0;
    o.col += (target - o.col) * k;
    u.uColor.value = o.tuned ? o.col : 0;
    u.uTime.value = state.clock.elapsedTime;
    u.uLines.value = ctx.lofi ? 120 : 240;
    u.uScroll.value = (Math.sin(state.clock.elapsedTime * 0.12) * 0.5 + 0.5) * 0.7;
    o.ry += ((inp.px * 0.35 + inp.dragX * 0.1) - o.ry) * k;
    o.rx += ((-inp.py * 0.2 + inp.dragY * 0.1) - o.rx) * k;
    if (group.current) { group.current.rotation.y = o.ry - 0.12; group.current.rotation.x = o.rx; }
  });

  const W = 1.08, H = 0.82, D = 0.34;
  return (
    <group ref={group}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[-1, 1.2, 2]} intensity={3.2} color="#e6e6e6" />
      <directionalLight position={[1.5, -0.2, -1]} intensity={2.4} color="#b0b0b0" />
      <RoundedBox args={[W, H, D]} radius={0.05} smoothness={4}>
        <meshStandardMaterial color="#4a4a4a" roughness={0.5} metalness={0.3} />
      </RoundedBox>
      <RoundedBox args={[W * 0.78, H * 0.78, 0.04]} radius={0.03} position={[-0.09, 0, D / 2 - 0.005]}>
        <meshStandardMaterial color="#0b0b0b" roughness={0.9} />
      </RoundedBox>
      <mesh position={[-0.09, 0, D / 2 + 0.017]} material={material}>
        <planeGeometry args={[W * 0.72, H * 0.72, 1, 1]} />
      </mesh>
      {[0.2, -0.04].map((y, i) => (
        <mesh key={i} position={[0.43, y, D / 2 + 0.02]} rotation={[Math.PI / 2, 0, i ? 0.6 : -0.3]}>
          <cylinderGeometry args={[0.04, 0.045, 0.05, 24]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.35} metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0.43, 0.32, D / 2 + 0.02]}>
        <sphereGeometry args={[0.012, 12, 8]} />
        <meshBasicMaterial color="#ede9d8" />
      </mesh>
    </group>
  );
}
