import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Imperative three.js / canvas code mutates uniforms and refs by design; the trail component is pasted verbatim.
  {
    files: ["src/stage/**", "src/components/arcade/**", "src/components/theatre/**", "src/components/shell/**"],
    rules: { "react-hooks/immutability": "off", "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/halftone-trail.tsx",
  ]),
]);

export default eslintConfig;
