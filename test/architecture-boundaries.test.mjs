import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootPath = fileURLToPath(new URL("../", import.meta.url));
const presetUrl = new URL("../oxlint/boundaries.mjs", import.meta.url).href;

test("upstream boundary analysis preserves next-feature layers and aliases", async () => {
  const root = await realpath(
    await mkdtemp(path.join(tmpdir(), "lint-boundaries-"))
  );
  try {
    await writeFile(
      path.join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } },
      })
    );
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import { createNextFeatureBoundaryConfig } from ${JSON.stringify(presetUrl)};
export default { categories: { correctness: "off" }, ...createNextFeatureBoundaryConfig(${JSON.stringify(root)}) };`
    );

    const layers = {
      app: 4,
      pages: 4,
      components: 3,
      features: 2,
      entities: 1,
      lib: 0,
      shared: 0,
    };
    const forbidden = [];
    for (const [from, level] of Object.entries(layers)) {
      await mkdir(path.join(root, "src", from), { recursive: true });
      await writeFile(
        path.join(root, "src", from, "target.ts"),
        "export const value = 1;\n"
      );
      for (const [to, targetLevel] of Object.entries(layers)) {
        if (from === to) continue;
        const filename = `src/${from}/use-${to}.ts`;
        await writeFile(
          path.join(root, filename),
          `export { value } from "../${to}/target";\n`
        );
        if (level < targetLevel) forbidden.push(filename);
      }
    }
    await writeFile(
      path.join(root, "src/lib/alias.ts"),
      'export { value } from "@/components/target";\n'
    );
    forbidden.push("src/lib/alias.ts");
    await writeFile(
      path.join(root, "src/app/allowed-alias.ts"),
      'export { value } from "@/lib/target";\n'
    );

    for (const [name, source] of Object.entries({
      "dynamic.ts":
        'export const load = () => import("@/components/target");\n',
      "commonjs.ts": 'const target = require("@/components/target");\n',
      "static.ts":
        'import { value } from "@/components/target";\nexport { value };\n',
      "side-effect.ts": 'import "@/components/target";\n',
      "type.ts": 'import type { value } from "@/components/target";\n',
    })) {
      await writeFile(path.join(root, "src/lib", name), source);
      forbidden.push(`src/lib/${name}`);
    }
    await writeFile(
      path.join(root, "src/app/allowed-dynamic.ts"),
      'export const load = () => import("@/lib/target");\n'
    );
    await writeFile(
      path.join(root, "src/app/allowed-commonjs.ts"),
      'const target = require("@/lib/target");\n'
    );

    let stdout;
    try {
      ({ stdout } = await execFileAsync(
        "node",
        [
          path.join(rootPath, "bin/howells-oxlint.mjs"),
          "--config",
          path.join(root, "oxlint.config.mjs"),
          "--format=json",
          "src",
        ],
        { cwd: root, encoding: "utf8" }
      ));
      assert.fail("forbidden imports must fail the command");
    } catch (error) {
      assert.equal(error.code, 1);
      stdout = error.stdout;
    }
    const findings = JSON.parse(stdout).diagnostics;
    assert.equal(findings.length, forbidden.length);
    assert.deepEqual(
      findings.map((finding) => finding.filename).sort(),
      forbidden.sort()
    );
    assert.ok(
      findings.every((finding) => finding.code === "boundaries(dependencies)")
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
