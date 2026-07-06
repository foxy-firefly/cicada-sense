import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const generatorApiTarget = process.env.VITE_GENERATOR_PROXY_TARGET ?? "http://live-data-generator-api:3100";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/frontend",
    target: "esnext",
  },
  server: {
    allowedHosts: ["live-data-generator", "generator.cicada-sense.localhost"],
    host: "0.0.0.0",
    port: 5174,
    proxy: {
      "/api": generatorApiTarget,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["dist", "dist-types", "node_modules"],
    setupFiles: ["src/frontend/test/setup.ts"],
  },
});
