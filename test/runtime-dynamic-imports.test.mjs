import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import core from "../oxlint/core.mjs";
import { createNoRuntimeDynamicImportsRule } from "../oxlint/howells-policy-imports.mjs";
import next from "../oxlint/next.mjs";
import playwright from "../oxlint/playwright.mjs";
import react from "../oxlint/react.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const oxlintBin = path.join(repoRoot, "node_modules/.bin/oxlint");
const pluginUrl = new URL(
  "../oxlint/howells-policy-plugin.mjs",
  import.meta.url
).href;
const coreUrl = new URL("../oxlint/core.mjs", import.meta.url).href;
const boundariesUrl = new URL("../oxlint/boundaries.mjs", import.meta.url).href;
const ruleName = "howells/no-runtime-dynamic-imports";
const ruleCode = "howells(no-runtime-dynamic-imports)";

async function writeFixture(root, filename, source) {
  const file = path.join(root, filename);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, source);
}

async function fixture(t) {
  const root = await mkdtemp(
    path.join(realpathSync(tmpdir()), "howells local modules ")
  );
  t.after(() => rm(root, { force: true, recursive: true }));
  await writeFixture(root, "package.json", '{"type":"module"}\n');
  return root;
}

async function writeConfig(root, options) {
  await writeFixture(
    root,
    "oxlint.config.mjs",
    `export default {
  categories: { correctness: "off" },
  jsPlugins: [{ name: "howells", specifier: ${JSON.stringify(pluginUrl)} }],
  rules: { ${JSON.stringify(ruleName)}: ${JSON.stringify(options === undefined ? "error" : ["error", options])} },
};\n`
  );
}

async function lint(root, targets = ["src"], flag) {
  let result;
  try {
    result = await execFileAsync(
      oxlintBin,
      [
        "--config",
        path.join(root, "oxlint.config.mjs"),
        "--format",
        "json",
        ...(flag ? [flag] : []),
        ...targets,
      ],
      { cwd: root, maxBuffer: 5_000_000 }
    );
  } catch (error) {
    assert.equal(error.code, 1, error.stderr);
    result = error;
  }
  const diagnostics = JSON.parse(result.stdout).diagnostics;
  assert.ok(
    !diagnostics.some((item) =>
      item.message.startsWith("Error running JS plugin")
    ),
    result.stdout
  );
  return diagnostics;
}

const importCases = [
  ["local", 'import("./target.ts")', 0],
  ["local-parent", 'import("../src/target.ts")', 0],
  ["local-dot-segment", 'import("./folder/../target.ts")', 0],
  ["local-js", 'import("./target.mjs")', 0],
  ["package", 'import("heavy-package")', 1],
  ["scoped-package", 'import("@scope/heavy/internal")', 1],
  ["builtin", 'import("node:fs")', 1],
  ["computed", "import(moduleName)", 1],
  ["computed-relative", 'import("./" + moduleName)', 1],
  ["computed-template", "import(`./${moduleName}.ts`)", 1],
  [
    "constant-binding",
    '(() => { const name = "./target.ts"; return import(name); })()',
    1,
  ],
  ["literal-template", "import(`./target.ts`)", 1],
  ["conditional", 'import(flag ? "./target.ts" : "./target.mjs")', 1],
  ["url-constructor", 'import(new URL("./target.ts", import.meta.url))', 1],
  ["file-url", 'import("file:///tmp/target.ts")', 1],
  ["data-url", 'import("data:text/javascript,export default 1")', 1],
  ["package-alias", 'import("#target")', 1],
  ["unresolved", 'import("./missing.ts")', 1],
  ["extension-search", 'import("./target")', 1],
  ["directory", 'import("./folder")', 1],
  ["query", 'import("./target.ts?copy")', 1],
  ["fragment", 'import("./target.ts#copy")', 1],
  ["encoded-name", 'import("./%74arget.ts")', 1],
  ["encoded-local-parent", 'import("./%2e%2e/src/target.ts")', 1],
  ["encoded-slash", 'import("./folder%2ftarget.ts")', 1],
  ["encoded-backslash", 'import("./folder%5ctarget.ts")', 1],
  ["malformed-encoding", 'import("./bad%xx.ts")', 1],
  ["control-character", 'import("./target.ts\\n")', 1],
  ["trailing-url-space", 'import("./target.ts ")', 1],
  ["backslash", 'import("./folder\\\\../target.ts")', 1],
];

test("the plugin default and explicit false retain the blanket dynamic-import ban", async (t) => {
  const root = await fixture(t);
  await writeFixture(root, "src/target.ts", "export const value = 1;\n");
  for (const [name, expression] of importCases)
    await writeFixture(
      root,
      `src/${name}.ts`,
      `export const load = () => ${expression};\n`
    );
  for (const options of [undefined, { allowLocalModules: false }]) {
    await writeConfig(root, options);
    const findings = await lint(root);
    assert.equal(findings.length, importCases.length);
    assert.ok(findings.every((item) => item.code === ruleCode));
    assert.ok(
      findings.every((item) =>
        item.message.includes("Use a static import instead")
      )
    );
  }
});

test("local deferred imports require existing literal file targets and canonical URL paths", async (t) => {
  const root = await fixture(t);
  await writeFixture(root, "src/target.ts", "export const value = 1;\n");
  await writeFixture(root, "src/target.mjs", "export const value = 1;\n");
  await writeFixture(root, "src/folder/index.ts", "export const value = 1;\n");
  for (const [name, expression] of importCases)
    await writeFixture(
      root,
      `src/${name}.ts`,
      `export const load = () => ${expression};\n`
    );
  await writeConfig(root, { allowLocalModules: true });
  for (const flag of [undefined, "--fix", "--fix-dangerously"]) {
    const findings = await lint(root, ["src"], flag);
    assert.ok(findings.every((item) => item.code === ruleCode));
    assert.deepEqual(
      findings.map((item) => path.basename(item.filename, ".ts")).sort(),
      importCases
        .filter(([, , count]) => count)
        .map(([name]) => name)
        .sort()
    );
    for (const [name, expression] of importCases)
      assert.equal(
        await readFile(path.join(root, `src/${name}.ts`), "utf8"),
        `export const load = () => ${expression};\n`
      );
  }
});

test("local imports cannot escape a package through relatives, encoded parents, nested owners or symlinks", async (t) => {
  const root = await fixture(t);
  for (const directory of [
    "packages/one",
    "packages/two",
    "apps/web",
    "packages/one/nested",
  ])
    await writeFixture(
      root,
      `${directory}/package.json`,
      '{"type":"module"}\n'
    );
  for (const filename of [
    "outside.ts",
    "packages/two/target.ts",
    "apps/web/target.ts",
    "packages/one/nested/target.ts",
    "packages/one/node_modules/foreign/index.ts",
    "packages/missing/target.ts",
  ])
    await writeFixture(root, filename, "export const value = 1;\n");
  const expressions = [
    'import("../../outside.ts")',
    'import("../two/target.ts")',
    'import("../../apps/web/target.ts")',
    'import("./%2e%2e/two/target.ts")',
    'import("./%2E./two/target.ts")',
    'import("./.%2e/two/target.ts")',
    'import("./nested/target.ts")',
    'import("./node_modules/foreign/index.ts")',
    'import("./redirect.ts")',
    'import("./redirect-directory/target.ts")',
  ];
  await symlink(
    path.join(root, "packages/two/target.ts"),
    path.join(root, "packages/one/redirect.ts")
  );
  await symlink(
    path.join(root, "packages/two"),
    path.join(root, "packages/one/redirect-directory"),
    "dir"
  );
  await writeFixture(
    root,
    "packages/one/loader.ts",
    expressions
      .map(
        (expression, index) =>
          `export const load${index} = () => ${expression};`
      )
      .join("\n")
  );
  await writeFixture(
    root,
    "packages/missing/loader.ts",
    'export const load = () => import("./target.ts");\n'
  );
  await writeConfig(root, { allowLocalModules: true });
  const findings = await lint(root, [
    "packages/one/loader.ts",
    "packages/missing/loader.ts",
  ]);
  assert.equal(findings.length, expressions.length + 1);
  assert.ok(findings.every((item) => item.code === ruleCode));
});

test("unknown, invalid and redirected importer ownership fails closed", async (t) => {
  const root = await fixture(t);
  await writeFixture(
    root,
    "src/loader.ts",
    'export const load = () => import("./target.ts");\n'
  );
  await writeFixture(root, "src/target.ts", "export const value = 1;\n");
  await writeConfig(root, { allowLocalModules: true });
  await writeFixture(root, "src/package.json", "{invalid");
  assert.equal(
    (await lint(root)).filter((item) => item.code === ruleCode).length,
    1
  );
  await rm(path.join(root, "src/package.json"));
  await rm(path.join(root, "package.json"));
  assert.equal(
    (await lint(root)).filter((item) => item.code === ruleCode).length,
    1
  );
  const reports = [];
  const listener = createNoRuntimeDynamicImportsRule({
    filename: "<input>",
    options: [{ allowLocalModules: true }],
    report: (item) => reports.push(item),
  });
  listener.ImportExpression({
    source: { type: "Literal", value: "./target.ts" },
  });
  assert.equal(reports.length, 1);
  await writeFixture(root, "package.json", '{"type":"module"}\n');
  await writeFixture(
    root,
    "redirected/loader.ts",
    'export const load = () => import("./target.ts");\n'
  );
  await symlink(
    path.join(root, "redirected/loader.ts"),
    path.join(root, "src/redirected.ts")
  );
  assert.equal(
    (await lint(root, ["src/redirected.ts"])).filter(
      (item) => item.code === ruleCode
    ).length,
    1
  );
});

test("local graph proof rejects dynamic/static cycles and unproved transitive loading", async (t) => {
  const root = await fixture(t);
  const cases = [
    ["static-local", 'import { value } from "./leaf.ts"; export { value };', 0],
    ["builtin", 'import { readFile } from "node:fs"; export { readFile };', 0],
    ["reexport", 'export * from "./leaf.ts";', 0],
    [
      "type-only",
      'import type { Load } from "./loader.ts"; export const value = 1;',
      0,
    ],
    [
      "type-specifier",
      'import { type Load } from "./loader.ts"; export const value = 1;',
      0,
    ],
    [
      "type-reexport",
      'export type { Load } from "./loader.ts"; export const value = 1;',
      0,
    ],
    ["dynamic-local", 'export const load = () => import("./leaf.ts");', 0],
    [
      "static-back-edge",
      'import { load } from "./loader.ts"; export { load };',
      1,
    ],
    [
      "dynamic-back-edge",
      'export const load = () => import("./loader.ts");',
      1,
    ],
    ["self-edge", 'export const load = () => import("./target.ts");', 1],
    ["static-cycle", 'export { value } from "./cycle.ts";', 1],
    [
      "foreign-dependency",
      'import { value } from "foreign-package"; export { value };',
      1,
    ],
    ["unresolved-dependency", 'export { value } from "./missing.ts";', 1],
    ["computed-dependency", "export const load = (name) => import(name);", 1],
    [
      "template-dependency",
      "export const load = () => import(`./leaf.ts`);",
      1,
    ],
    ["require-dependency", 'export const value = require("./leaf.ts");', 1],
    ["encoded-dependency", 'export { value } from "./%6ceaf.ts";', 1],
    ["invalid-module", "export const broken = ;", 1],
  ];
  const targets = [];
  for (const [name, source] of cases) {
    const loader = `src/${name}/loader.ts`;
    targets.push(loader);
    await writeFixture(
      root,
      loader,
      'export const load = () => import("./target.ts"); export interface Load {}\n'
    );
    await writeFixture(root, `src/${name}/target.ts`, source);
    await writeFixture(
      root,
      `src/${name}/leaf.ts`,
      "export const value = 1;\n"
    );
    await writeFixture(
      root,
      `src/${name}/cycle.ts`,
      'export { value } from "./target.ts";\n'
    );
  }
  await writeConfig(root, { allowLocalModules: true });
  const findings = await lint(root, targets);
  assert.ok(findings.every((item) => item.code === ruleCode));
  assert.deepEqual(
    findings.map((item) => path.basename(path.dirname(item.filename))).sort(),
    cases
      .filter(([, , count]) => count)
      .map(([name]) => name)
      .sort()
  );
});

test("feature-layer, workspace, dependency and cycle checks remain enforced beside the local allowance", async (t) => {
  const root = await fixture(t);
  await writeFixture(
    root,
    "tsconfig.json",
    '{"compilerOptions":{"baseUrl":"."}}\n'
  );
  await writeFixture(
    root,
    "oxlint.config.mjs",
    `import core from ${JSON.stringify(coreUrl)};
import { createNextFeatureBoundaryConfig } from ${JSON.stringify(boundariesUrl)};
export default { ...createNextFeatureBoundaryConfig(${JSON.stringify(root)}), extends: [core], options: { typeAware: false }, rules: {
  ...createNextFeatureBoundaryConfig(${JSON.stringify(root)}).rules,
  "howells/no-deep-package-imports": ["error", { prefixes: [{ prefix: "@scope/dependency", depth: 1 }] }],
  "howells/no-out-of-bounds-package-imports": ["error", { packages: ["@scope/dependency"], within: ["src/owner"] }],
} };\n`
  );
  await symlink(
    path.join(repoRoot, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
  const sources = {
    "src/components/target.ts": "export const value = 1;\n",
    "src/lib/forbidden.ts":
      'export const load = () => import("../components/target.ts");\n',
    "src/lib/target.ts": "export const value = 1;\n",
    "src/components/allowed.ts":
      'export const load = () => import("../lib/target.ts");\n',
    "src/lib/dependency.ts":
      'import { value } from "@scope/dependency/internal/deep"; export const load = () => import("@scope/dependency/internal/deep"); export { value };\n',
    "src/lib/cycle-a.ts":
      'export const loadA = () => import("./cycle-b.ts");\n',
    "src/lib/cycle-b.ts":
      'export const loadB = () => import("./cycle-a.ts");\n',
    "src/lib/static-cycle-a.ts":
      'export { b } from "./static-cycle-b.ts"; export const a = 1;\n',
    "src/lib/static-cycle-b.ts":
      'export { a } from "./static-cycle-a.ts"; export const b = 1;\n',
    "src/lib/stream.ts":
      'import { Readable } from "node:stream"; export const shards = Readable.from(indices).map(readShard, { concurrency: 4 });\n',
    "src/lib/array.ts":
      "export const shards = indices.map(readShard, { concurrency: 4 });\n",
    "packages/one/package.json": '{"name":"one","type":"module"}\n',
    "apps/web/package.json": '{"name":"web","type":"module"}\n',
    "apps/web/target.ts": "export const value = 1;\n",
    "packages/one/forbidden.ts":
      'import { value } from "../../apps/web/target.ts"; export const load = () => import("../../apps/web/target.ts"); export { value };\n',
  };
  for (const [filename, source] of Object.entries(sources))
    await writeFixture(root, filename, source);
  const findings = await lint(root, ["src", "packages/one/forbidden.ts"]);
  const forCode = (code) => findings.filter((item) => item.code === code);
  assert.equal(forCode("boundaries(dependencies)").length, 1);
  assert.match(
    forCode("boundaries(dependencies)")[0].filename,
    /forbidden\.ts$/u
  );
  assert.equal(forCode("howells(no-cross-workspace-app-imports)").length, 1);
  assert.equal(forCode("howells(no-deep-package-imports)").length, 2);
  assert.equal(forCode("howells(no-out-of-bounds-package-imports)").length, 1);
  assert.equal(forCode(ruleCode).length, 4);
  assert.equal(forCode("import(no-cycle)").length, 2);
  assert.equal(forCode("howells(no-array-method-this-argument)").length, 1);
  assert.match(
    forCode("howells(no-array-method-this-argument)")[0].filename,
    /array\.ts$/u
  );
  assert.equal(forCode("unicorn(no-array-method-this-argument)").length, 0);
  assert.ok(
    !findings.some(
      (item) =>
        item.filename.endsWith("allowed.ts") &&
        [ruleCode, "boundaries(dependencies)"].includes(item.code)
    )
  );
});

test("accepted local chunks retain deferred module evaluation and caching without a rewrite", async (t) => {
  const root = await fixture(t);
  const loader =
    'export const utility = 1;\nexport const load = async () => import("./chunk.mjs");\n';
  await writeFixture(root, "src/loader.mjs", loader);
  await writeFixture(
    root,
    "src/chunk.mjs",
    "globalThis.chunkEvaluations = (globalThis.chunkEvaluations ?? 0) + 1;\nexport const schemes = [1, 2, 3];\n"
  );
  await writeConfig(root, { allowLocalModules: true });
  assert.deepEqual(
    await lint(root, ["src/loader.mjs"], "--fix-dangerously"),
    []
  );
  assert.equal(
    await readFile(path.join(root, "src/loader.mjs"), "utf8"),
    loader
  );
  await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import assert from "node:assert/strict";
const { utility, load } = await import("./src/loader.mjs");
assert.equal(utility, 1);
assert.equal(globalThis.chunkEvaluations, undefined);
const first = await load();
assert.deepEqual(first.schemes, [1, 2, 3]);
assert.equal(await load(), first);
assert.equal(globalThis.chunkEvaluations, 1);`,
    ],
    { cwd: root }
  );
});

test("all inherited presets enable the narrow option and preserve dependency checks", () => {
  const resolved = (preset, rules = {}) => {
    for (const parent of preset.extends ?? []) resolved(parent, rules);
    Object.assign(rules, preset.rules ?? {});
    return rules;
  };
  for (const preset of [core, react, next, playwright]) {
    const rules = resolved(preset);
    assert.deepEqual(rules[ruleName], ["error", { allowLocalModules: true }]);
    for (const name of [
      "import/no-cycle",
      "import/no-self-import",
      "howells/no-cross-workspace-app-imports",
      "typescript/strict-void-return",
    ])
      assert.equal(rules[name], "error", name);
  }
});
