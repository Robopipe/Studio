import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import { createRequire } from "module";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite"

// ts-ebml's peer "ebml" ships a broken IIFE as its browser field — Vite picks
// it and loses the `tools` export, causing "Cannot read properties of undefined
// (reading 'readVint')". Override to the UMD build which exports correctly.
const _require = createRequire(import.meta.url);
const ebmlUmd = path.resolve(
  path.dirname(_require.resolve("ts-ebml/package.json")),
  "../ebml/lib/ebml.umd.js",
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss(), sentryVitePlugin({
    org: "koala-42",
    project: "robopipe-fe"
  })],

  resolve: {
    alias: {
      ebml: ebmlUmd,
    },
  },

  build: {
    sourcemap: true
  }
});
