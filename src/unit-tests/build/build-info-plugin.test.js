// @vitest-environment node
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildInfoFrom, buildInfoPlugin } from "../../../build-info-plugin.js";

const manifest = {
  metaData: { name: "wbw", pluginVersion: "1.21.5" },
  remotes: [],
  exposes: [{ id: "wbw:app", name: "app" }],
  shared: [
    { name: "react", version: "19.3.0", requiredVersion: "^19", extra: "dropped" },
    { name: "react-dom", version: "19.3.0", requiredVersion: "^19" },
  ],
};
const fixedNow = new Date("2026-09-19T15:00:00.000Z");

describe("buildInfoFrom", () => {
  it("carries the version and commit this build deploys as, in the shell's schema", () => {
    const info = buildInfoFrom({
      manifest,
      packageVersion: "1.0.0",
      shareStrategy: "loaded-first",
      commit: "a".repeat(40),
      ref: "main",
      now: fixedNow,
    });
    expect(info.schemaVersion).toBe(1);
    expect(info.build).toEqual({
      commit: "a".repeat(40),
      ref: "main",
      builtAt: "2026-09-19T15:00:00.000Z",
      version: "1.0.0",
    });
    expect(info.moduleFederation).toEqual({
      pluginVersion: "1.21.5",
      options: { shareStrategy: "loaded-first" },
      shared: [
        { name: "react", version: "19.3.0", requiredVersion: "^19" },
        { name: "react-dom", version: "19.3.0", requiredVersion: "^19" },
      ],
    });
    expect(info.summary).toEqual({ remoteCount: 0, exposeCount: 1, sharedCount: 2 });
    expect(info.bundler.name).toBe("vite");
  });

  it("still describes a build with no manifest and no git, rather than throwing", () => {
    const info = buildInfoFrom({
      manifest: undefined,
      packageVersion: "1.0.0",
      shareStrategy: "loaded-first",
      commit: null,
      ref: null,
      now: fixedNow,
    });
    expect(info.build).toEqual({
      commit: null,
      ref: null,
      builtAt: "2026-09-19T15:00:00.000Z",
      version: "1.0.0",
    });
    expect(info.moduleFederation.pluginVersion).toBeUndefined();
    expect(info.summary).toEqual({ remoteCount: 0, exposeCount: 0, sharedCount: 0 });
  });
});

describe("buildInfoPlugin", () => {
  it("writes build-info.json beside the built manifest", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "wbw-build-info-"));
    await writeFile(path.join(root, "package.json"), '{"name":"wbw","version":"1.2.3"}');
    await mkdir(path.join(root, "out"));
    await writeFile(path.join(root, "out", "mf-manifest.json"), JSON.stringify(manifest));

    const plugin = buildInfoPlugin({ shareStrategy: "loaded-first" });
    plugin.configResolved({ root, build: { outDir: "out" } });
    plugin.closeBundle();

    const written = JSON.parse(await readFile(path.join(root, "out", "build-info.json"), "utf8"));
    expect(written.build.version).toBe("1.2.3");
    expect(written.moduleFederation.pluginVersion).toBe("1.21.5");
    expect(written.summary.sharedCount).toBe(2);
    // A temp dir is not a checkout, so the commit is whatever the environment says, or null.
    expect(written.build.commit === null || typeof written.build.commit === "string").toBe(true);
  });
});
