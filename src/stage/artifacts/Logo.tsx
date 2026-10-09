"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { shared, type SlotCtx } from "../shared";
import { slotEl, type SlotId } from "../slots";
import { content } from "@/content";

// A flat logo given thickness: the same alpha-tested plane stacked LAYERS deep. Outer layers are lit, inner ones dim.
const LAYERS = 28, DEPTH = 0.09;

const VERT = /* glsl */ `
varying vec2 vUv; varying float vFace;
void main() {
  vUv = uv;
  vFace = step(${(DEPTH / 2 - 0.0001).toFixed(5)}, abs(position.z));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex; uniform vec3 uPhosphor; uniform float uColor;
varying vec2 vUv; varying float vFace;
void main() {
  vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y); // reads the right way round from behind too
  vec4 t = texture2D(uTex, uv);
  if (t.a < 0.5) discard;
  float chroma = max(t.r, max(t.g, t.b)) - min(t.r, min(t.g, t.b));
  vec3 col = mix(uPhosphor, t.rgb, uColor * smoothstep(0.08, 0.25, chroma));
  gl_FragColor = vec4(col * mix(0.3, 1.0, vFace), 1.0);
}`;

export default function Logo({ ctx, id }: { ctx: SlotCtx; id: SlotId }) {
  const i = +id.slice(-1);
  const mesh = useRef<THREE.Mesh>(null);
  const s = useRef({ col: 0, hover: false, spin: i * 2.1, tilt: 0 });
  const { geometry, material, tex } = useMemo(() => {
    const geometry = mergeGeometries(Array.from({ length: LAYERS }, (_, k) => new THREE.PlaneGeometry(1, 1).translate(0, 0, (k / (LAYERS - 1) - 0.5) * DEPTH)));
    const tex = new THREE.TextureLoader().load(content.experience[i].logo);
    tex.colorSpace = THREE.NoColorSpace;
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide,
      uniforms: { uTex: { value: tex }, uPhosphor: shared.uPhosphor, uColor: { value: 0 } },
    });
    return { geometry, material, tex };
  }, [i]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); tex.dispose(); }, [geometry, material, tex]);

  // the whole card is the hover target, not just the window
  useEffect(() => {
    const card = slotEl.get(id)?.closest("[data-card]");
    if (!card) return;
    const on = () => { s.current.hover = true; }, off = () => { s.current.hover = false; };
    card.addEventListener("pointerenter", on); card.addEventListener("pointerleave", off);
    return () => { card.removeEventListener("pointerenter", on); card.removeEventListener("pointerleave", off); };
  }, [id]);

  useFrame((_, dt) => {
    const o = s.current, m = mesh.current, img = tex.image as HTMLImageElement | undefined;
    if (!m || !img?.width) return;
    const k = 1 - Math.pow(0.001, dt);
    o.col += ((o.hover || matchMedia("(pointer: coarse)").matches ? 1 : 0) - o.col) * k;
    material.uniforms.uColor.value = o.col;
    const ta = img.width / img.height, w = Math.min(ctx.aspect * 0.78, 0.6 * ta);
    m.scale.set(w, w / ta, 1);
    o.spin += dt * (0.45 + o.col * 0.9);
    o.tilt += (-ctx.input.py * 0.5 - o.tilt) * k;
    m.rotation.set(o.tilt, o.spin + ctx.input.dragX, 0);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} />;
}
