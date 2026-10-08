import * as THREE from "three";

// Uniforms shared by every artifact material.
export const shared = {
  uTime: { value: 0 },
  uPhosphor: { value: new THREE.Vector3(0.93, 0.92, 0.87) },
  uPixelRatio: { value: 1 },
};

export function refreshPhosphor() {
  const probe = document.createElement("span");
  probe.style.color = "var(--phosphor)";
  document.body.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g);
  probe.remove();
  if (m) shared.uPhosphor.value.set(+m[0] / 255, +m[1] / 255, +m[2] / 255);
}

// Shader helpers shared by every artifact so dot shapes match across the site.
export const GLSL_SCREENS = /* glsl */ `
float dotScreen(vec2 p, float lum) {
  float r = 0.47 * sqrt(clamp(lum, 0.0, 1.0));
  float d = length(p - 0.5);
  float aa = max(fwidth(d), 0.02);
  return 1.0 - smoothstep(r - aa, r + aa, d);
}
float barScreen(vec2 p, float lum) {
  float h = 0.5 * clamp(lum, 0.0, 1.0);
  float d = abs(p.y - 0.5);
  float aa = max(fwidth(d), 0.02);
  return 1.0 - smoothstep(h - aa, h + aa, d);
}
float blockScreen(float lum) { return floor(clamp(lum, 0.0, 0.999) * 4.0) / 3.0; }
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

export type SlotInput = {
  px: number; // pointer x in -0.5..0.5 across the slot
  py: number;
  inside: boolean;
  dragX: number; // accumulated drag rotation (radians), eased by the artifact
  dragY: number;
  clicks: number;
};

export type SlotCtx = {
  aspect: number;
  tier: 1 | 2 | 3;
  lofi: boolean;
  pxPerUnit: number; // device pixels per unit-box unit
  input: SlotInput;
};
