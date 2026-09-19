import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.dirname(
  fileURLToPath(new URL("../package.json", import.meta.url))
);

// This package's own dependency graph must resolve every peer, because an
// unmet peer here is what lets a second linter (ESLint, by way of a preset
// that still expects one) back into a consumer's install. It is a fact about
// the installed tree rather than about source, so nothing types or lints it.
test("the installed tree leaves no peer dependency unmet", async () => {
  const { stdout } = await execFileAsync("pnpm", ["peers", "check"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, npm_config_color: "false" },
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.match(stdout, /No peer dependency issues found/u);
});
