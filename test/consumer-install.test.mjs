import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("packed package installs with a valid peer graph and loads the Next preset", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "howells-lint-consumer-"));

  try {
    const { stdout: packOutput } = await execFileAsync(
      "pnpm",
      ["pack", "--pack-destination", root, "--json"],
      { cwd: repoRoot }
    );
    const { filename } = JSON.parse(packOutput);

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
      path.join(root, "oxfmt.config.ts"),
      'export { default } from "@howells/lint/oxfmt";\n'
    );
    await writeFile(
      path.join(root, "portrait.ts"),
      "export const portrait = 1;\n"
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
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
