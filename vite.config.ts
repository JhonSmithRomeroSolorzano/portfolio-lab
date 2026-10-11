import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  // Native dynamic imports also recover in WebKit after a failed optional load.
  // Preloading a game's shared dependencies can keep that failed module cached.
  build: { modulePreload: false },
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
