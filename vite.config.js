import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { configDefaults } from "vitest/config";

// Production asset URLs are absolute to the Firebase origin: the manifest the portfolio loads
// must point at chunks the portfolio's origin does not serve. Development keeps "/" so the
// dev server and the shell's dev registry entry (http://localhost:5173) resolve locally.
const remoteOrigin = "https://whos-bringing-what.web.app/";

export default defineConfig(({ command }) => ({
  // Load-bearing, not cosmetic: the host injects this remote's CSS by prefixing the
  // preload helper's asset paths with this absolute base, and `vite preview` fetches
  // production assets from it too (there is no local "/" fallback once this is set for build).
  base: command === "build" ? remoteOrigin : "/",
  plugins: [
    react(),
    // Vitest loads this config too; the federation plugin has nothing to do in a test run.
    ...(process.env.VITEST
      ? []
      : [
          federation({
            name: "wbw",
            filename: "remoteEntry.js",
            manifest: true,
            // This is a JS-only project (no tsconfig.json); the plugin's default type
            // generation shells out to tsc looking for one, which crashes the dev server
            // (an uncaught exception in its forked worker) and errors loudly on build.
            dts: false,
            exposes: { "./app": "./src/federation/export-app.jsx" },
            shared: {
              react: { singleton: true, requiredVersion: "^19" },
              "react-dom": { singleton: true, requiredVersion: "^19" },
            },
            // The host is on React 19.2, this remote on 19.3; "loaded-first" (rather than the
            // runtime's "version-first" default) makes both sides prefer whichever singleton
            // copy is already loaded instead of racing to load a second React by version.
            shareStrategy: "loaded-first",
          }),
        ]),
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    globals: true,
    include: ["src/unit-tests/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: [...configDefaults.exclude, "functions/**"],
    environmentMatchGlobs: [
      ["src/unit-tests/firestore/**/*.{test,spec}.{js,jsx,ts,tsx}", "node"],
    ],
  },
  build: {
    // The federation runtime uses top-level await; the plugin documents this floor.
    target: "chrome89",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // The federation plugin ignores the object form of manualChunks (it claims
        // federation-owned modules first and needs the function form for everything else),
        // so Firebase is grouped by id instead of by package-name list.
        manualChunks(id) {
          if (
            id.includes("node_modules/@firebase") ||
            id.includes("node_modules/firebase/")
          ) {
            return "firebase";
          }
        },
      },
    },
  },
}));
