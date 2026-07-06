import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const backendTarget = process.env.VITE_DEV_PROXY_TARGET ?? "http://backend:3000";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
  },
  server: {
    allowedHosts: ["frontend", "cicada-sense.localhost"],
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": backendTarget,
      "/socket.io": {
        target: backendTarget,
        ws: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["dist", "dist-types", "node_modules"],
    setupFiles: ["src/test/setup.ts"],
  },
});
