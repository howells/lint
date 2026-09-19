import assert from "node:assert/strict";
import { mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { measureFormatting } from "../bin/ratchet-measure.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

// oxfmt is resolved by walking up from this file's own node_modules, so a
// fixture outside the repo needs the same symlink the other fixtures use.
const scratch = async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ratchet-measure-"));
  await symlink(
    path.join(repoRoot, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
  return root;
};

// The unit's own oxfmt.config.mjs turns semicolons off, and its file is
// written to match. The repo root (this process's cwd during the test run)
// keeps the packaged default, which requires them - so a formatting check
// that resolved its config from the wrong directory would flag this file.
test("measureFormatting reads the unit's own oxfmt config, not the caller's cwd", async () => {
  const unitDir = await scratch();

  await writeFile(
    path.join(unitDir, "oxfmt.config.mjs"),
    "export default { semi: false }\n"
  );
  await writeFile(
    path.join(unitDir, "a.js"),
    "export const a = (value) => {\n  return value\n}\n"
  );

  const result = measureFormatting(
    { dir: unitDir, targets: ["."], counted: false },
    { counted: false }
  );

  assert.deepEqual(result, { unformatted: 0 });
});

// Without the unit's config, the same file fails the repo default's
// semicolon requirement - confirming the passing case above is because the
// local config was read, not because the file happens to satisfy both.
test("measureFormatting fails that file under the packaged default", async () => {
  const unitDir = await scratch();

  await writeFile(
    path.join(unitDir, "a.js"),
    "export const a = (value) => {\n  return value\n}\n"
  );

  const result = measureFormatting(
    { dir: unitDir, targets: ["."], counted: false },
    { counted: false }
  );

  assert.match(result.failure, /formatting/u);
});
