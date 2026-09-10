import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { configDefaults } from "vitest/config";

// Production asset URLs are absolute to the Firebase origin: the manifest the portfolio loads
// must point at chunks the portfolio's origin does not serve. Development is absolute too, for
// the same reason: the portfolio shell runs on a different origin (http://[::1]:3000) and
// resolves remoteEntry.js and its chunks against whatever origin the manifest's publicPath
// names, not its own — a relative "/" here would 404 every asset the shell tries to load.
const remoteOrigin = "https://whos-bringing-what.web.app/";
const devOrigin = "http://localhost:5173/";

export default defineConfig(({ command }) => ({
  // Load-bearing, not cosmetic: the host injects this remote's CSS by prefixing the
  // preload helper's asset paths with this absolute base, and `vite preview` fetches
  // production assets from it too (there is no local "/" fallback once this is set for build).
  base: command === "build" ? remoteOrigin : devOrigin,
  server: {
    port: 5173,
    strictPort: true,
  },
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
            // Vite itself strips the origin off an absolute `base` in serve mode (it always
            // resolves dev's internal `config.base` down to a path — see resolveBaseUrl in
            // vite/dist/node/chunks/config.js), so the dev manifest reports publicPath "/" no
            // matter what `base` above is set to. The plugin's own `publicPath` option (not the
            // SDK's `getPublicPath`, which the dev manifest route never reads) is what its dev
            // manifest route actually honors, so set it explicitly for dev.
            publicPath: command === "build" ? undefined : devOrigin,
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
