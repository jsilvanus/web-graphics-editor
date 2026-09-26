import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Resolve the editor package from source so the demo runs without a prior package build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@jsilvanus/graphics-editor": fileURLToPath(
        new URL("../../packages/graphics-editor/src/index.ts", import.meta.url),
      ),
    },
  },
});
