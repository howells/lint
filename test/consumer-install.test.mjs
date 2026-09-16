import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

test("packed package installs without ESLint and loads the Next, Playwright and shadcn presets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "howells-lint-consumer-"));

  try {
    // The destination is a fresh directory, so the tarball is whatever lands in
    // it. Reading the name from disk rather than from `pnpm pack --json` keeps
    // the test immune to anything a lifecycle script writes to stdout.
    await execFileAsync("pnpm", ["pack", "--pack-destination", root], {
      cwd: repoRoot,
    });
    const packed = await readdir(root);
    const tarballs = packed.filter((entry) => entry.endsWith(".tgz"));
    assert.equal(tarballs.length, 1, `expected one tarball, got ${tarballs}`);
    const filename = path.join(root, tarballs[0]);

    await writeFile(
      path.join(root, "package.json"),
      `${JSON.stringify(
        {
          private: true,
          type: "module",
          dependencies: {
            "@howells/lint": `file:${filename}`,
          },
        },
        null,
        2
      )}\n`
    );
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      'export { default } from "@howells/lint/oxlint/next";\n'
    );
    await writeFile(
      path.join(root, "playwright.oxlint.config.mjs"),
      'export { default } from "@howells/lint/oxlint/playwright";\n'
    );
    await writeFile(
      path.join(root, "oxfmt.config.ts"),
      'export { default } from "@howells/lint/oxfmt";\n'
    );
    await writeFile(
      path.join(root, "portrait.ts"),
      "export const portrait = 1;\n"
    );
    await writeFile(
      path.join(root, "portrait.tsx"),
      'export const Portrait = () => <figure className="p-[13px]" />;\n'
    );

    const installResult = await execFileAsync(
      "pnpm",
      ["install", "--ignore-scripts"],
      {
        cwd: root,
      }
    );

    assert.doesNotMatch(
      `${installResult.stdout}${installResult.stderr}`,
      /Issues with peer dependencies|unmet peer/i
    );

    // Oxlint is the only engine. A dependency that declares ESLint as a
    // required peer would have pnpm install it here anyway.
    const installedPackages = await readdir(
      path.join(root, "node_modules", ".pnpm")
    );
    assert.deepEqual(
      installedPackages.filter((entry) => entry.startsWith("eslint@")),
      []
    );

    const packageJson = JSON.parse(
      await readFile(
        path.join(root, "node_modules", "@howells", "lint", "package.json"),
        "utf8"
      )
    );
    const oxlintBin = path.join(
      root,
      "node_modules",
      "@howells",
      "lint",
      packageJson.bin["howells-oxlint"]
    );
    const oxfmtBin = path.join(
      root,
      "node_modules",
      "@howells",
      "lint",
      packageJson.bin["howells-oxfmt"]
    );

    const formatResult = await execFileAsync(
      process.execPath,
      [oxfmtBin, "--check", "portrait.ts"],
      { cwd: root }
    );

    assert.doesNotMatch(
      `${formatResult.stdout}${formatResult.stderr}`,
      /No config found/
    );

    const { stderr } = await execFileAsync(
      process.execPath,
      [oxlintBin, "--config", "oxlint.config.mjs", "portrait.ts"],
      { cwd: root }
    );

    assert.doesNotMatch(stderr, /Failed to (load|parse)/);

    // The Playwright rules ship as a vendored file, so this proves it made it
    // into the tarball and loads from there.
    const { stderr: playwrightStderr } = await execFileAsync(
      process.execPath,
      [oxlintBin, "--config", "playwright.oxlint.config.mjs", "portrait.ts"],
      { cwd: root }
    );

    assert.doesNotMatch(playwrightStderr, /Failed to (load|parse)/);

    // The shadcn rules are vendored too, and the bundle is ESM inside a
    // CommonJS package, so it only loads if `vendor/shadcn-lint/package.json`
    // reached the tarball alongside it. A finding proves both.
    const shadcnResult = await execFileAsync(
      process.execPath,
      [oxlintBin, "--config", "oxlint.config.mjs", "portrait.tsx"],
      { cwd: root }
    ).catch((error) => error);

    assert.doesNotMatch(
      `${shadcnResult.stdout}${shadcnResult.stderr}`,
      /Failed to (load|parse)/
    );
    assert.match(
      `${shadcnResult.stdout}${shadcnResult.stderr}`,
      /shadcn\(no-arbitrary-values\)/
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
