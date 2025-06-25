import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only chunk vendor libraries for client build, not SSR
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
  server: {
    host: "0.0.0.0",
    port: 5000,
    hmr: {
      overlay: false,
    },
  },
  ssr: {
    // Don't externalize firebase-admin for SSR
    noExternal: ['firebase-admin'],
  },
  define: {
    // Make sure environment variables are available in SSR
    'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
    'process.env.FIREBASE_CLIENT_EMAIL': JSON.stringify(process.env.FIREBASE_CLIENT_EMAIL),
    'process.env.FIREBASE_PRIVATE_KEY': JSON.stringify(process.env.FIREBASE_PRIVATE_KEY),
  }
});