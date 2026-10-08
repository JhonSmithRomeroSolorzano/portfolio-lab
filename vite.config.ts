import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    proxy: {
      "/local-api": {
        target: "http://127.0.0.1:3001",
        rewrite: (path) => path.replace(/^\/local-api/, ""),
      },
    },
  },
  // The API client is development-only, including when serving a built preview.
  preview: { proxy: {} },
});
