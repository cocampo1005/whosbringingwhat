import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { version as viteVersion } from "vite";

// build-info.json in the portfolio shell's schema (schemaVersion 1): what its project card, its
// fleet strip and its /under-the-hood page read for every remote — the version and commit this
// app was deployed as, beside the federation facts of the built manifest. Nightward and ominous
// assemble the same file in CI with jq; this app deploys by hand from a checkout, so the build
// itself writes it, next to mf-manifest.json in dist.

/** `git rev-parse <argument>` in the build's checkout, or null when git cannot answer. */
export function gitRevParse(argument) {
  try {
    return execFileSync("git", ["rev-parse", ...argument.split(" ")], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** The payload, from the built manifest (absent in a build without federation) and the build's identity. */
export function buildInfoFrom({ manifest, packageVersion, shareStrategy, commit, ref, now }) {
  const shared = (manifest?.shared ?? []).map(({ name, version, requiredVersion }) => ({
    name,
    version,
    requiredVersion,
  }));
  const builtAt = now.toISOString();
  return {
    schemaVersion: 1,
    generatedAt: builtAt,
    bundler: { name: "vite", version: viteVersion, mode: "production" },
    moduleFederation: {
      pluginVersion: manifest?.metaData?.pluginVersion,
      options: { shareStrategy },
      shared,
    },
    summary: {
      remoteCount: manifest?.remotes?.length ?? 0,
      exposeCount: manifest?.exposes?.length ?? 0,
      sharedCount: shared.length,
    },
    build: { commit, ref, builtAt, version: packageVersion },
  };
}

/**
 * Writes dist/build-info.json once the bundle — and the federation plugin's mf-manifest.json —
 * is on disk. `enforce: "post"` puts this plugin's closeBundle after the federation plugin's.
 */
export function buildInfoPlugin({ shareStrategy }) {
  let root = process.cwd();
  let outDir = "dist";
  return {
    name: "wbw:build-info",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      root = config.root;
      outDir = config.build.outDir;
    },
    closeBundle() {
      const distDir = path.resolve(root, outDir);
      const manifestFile = path.join(distDir, "mf-manifest.json");
      const manifest = existsSync(manifestFile)
        ? JSON.parse(readFileSync(manifestFile, "utf8"))
        : undefined;
      const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
      const payload = buildInfoFrom({
        manifest,
        packageVersion: packageJson.version,
        shareStrategy,
        commit: process.env.GITHUB_SHA ?? gitRevParse("HEAD"),
        ref: process.env.GITHUB_REF_NAME ?? gitRevParse("--abbrev-ref HEAD"),
        now: new Date(),
      });
      writeFileSync(path.join(distDir, "build-info.json"), `${JSON.stringify(payload, null, 2)}\n`);
    },
  };
}
