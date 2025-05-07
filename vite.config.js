import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // disable sourcemaps in dev build
  build: {
    sourcemap: false,
  },
  server: {
    // bind to all network interfaces
    host: "0.0.0.0",
    // use port 5000
    port: 5000,
    // turn off the red‐screen overlay for HMR errors
    hmr: {
      overlay: false,
    },
  },
});
