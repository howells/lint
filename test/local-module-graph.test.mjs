import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs";
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

import { parseSync, Visitor } from "oxc-parser";

import { createNoRuntimeDynamicImportsRule } from "../oxlint/howells-policy-imports.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const loader = 'export const load = () => import("./gallery.mjs");\n';

async function write(root, filename, source) {
  const file = path.join(root, filename);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, source);
}

async function packageFixture(root, directory, manifest, files) {
  await write(root, `${directory}/package.json`, JSON.stringify(manifest));
  for (const [filename, source] of Object.entries(files))
    await write(root, `${directory}/${filename}`, source);
}

async function fixture(t, source = "export const gallery = 1;\n") {
  const root = await mkdtemp(
    path.join(fs.realpathSync(tmpdir()), "howells graph ")
  );
  t.after(() => rm(root, { force: true, recursive: true }));
  await packageFixture(
    root,
    ".",
    {
      name: "graph-owner",
      type: "module",
      exports: {
        "./loader": "./src/loader.mjs",
        "./gallery": "./src/gallery.mjs",
      },
    },
    { "src/loader.mjs": loader, "src/gallery.mjs": source }
  );
  await mkdir(path.join(root, "node_modules"));
  await symlink(root, path.join(root, "node_modules/graph-owner"), "dir");
  return root;
}

function listener(root) {
  const reports = [];
  const visitor = createNoRuntimeDynamicImportsRule({
    filename: path.join(root, "src/loader.mjs"),
    options: [{ allowLocalModules: true }],
    report: (item) => reports.push(item),
  });
  return {
    reports,
    check(source = loader) {
      const parsed = parseSync("loader.mjs", source);
      assert.deepEqual(parsed.errors, []);
      new Visitor(visitor).visit(parsed.program);
      return reports.length;
    },
  };
}

test("a gallery graph traces distinct Node/browser ESM, CommonJS packages, JSON and CSS", async (t) => {
  const root = await fixture(
    t,
    'import { render } from "view/client"; import { Gallery } from "./photos.mjs"; export const mount = () => render(Gallery);'
  );
  await write(
    root,
    "src/photos.mjs",
    'import { Masonry } from "layout"; import { Card } from "viewer"; import "viewer/styles.css"; export const Gallery = [Masonry, Card];'
  );
  await packageFixture(
    root,
    "node_modules/view",
    {
      exports: {
        "./client": { browser: "./browser.mjs", default: "./client.cjs" },
      },
    },
    {
      "browser.mjs":
        'import view from "./index.cjs"; export const render = () => view;',
      "client.cjs":
        'const view = require("./index"); exports.render = () => view;',
      "index.cjs": 'module.exports = require("./version.json");',
      "index.js": 'module.exports = require("./index.cjs");',
      "version.json": '{"version":1}',
    }
  );
  await packageFixture(
    root,
    "node_modules/layout",
    {
      exports: {
        browser: "./browser.js",
        import: "./node.mjs",
        require: "./index.cjs",
      },
    },
    {
      "browser.js": 'export { Masonry } from "./browser-leaf";',
      "browser-leaf.js":
        'import view from "view/client"; export const Masonry = view;',
      "node.mjs":
        'import view from "view/client"; export const Masonry = view;',
      "index.cjs": 'exports.Masonry = require("view/client");',
    }
  );
  await packageFixture(
    root,
    "node_modules/viewer",
    {
      type: "module",
      exports: { ".": "./index.mjs", "./styles.css": "./base.css" },
    },
    {
      "index.mjs": "export const Card = 1;",
      "base.css": ".card { color: red; }",
    }
  );
  assert.equal(listener(root).check(), 0);
});

for (const [name, manifest, files] of [
  [
    "browser export",
    { exports: { browser: "./bad.mjs", import: "./good.mjs" } },
    {},
  ],
  [
    "Node import export",
    { exports: { browser: "./good.mjs", import: "./bad.mjs" } },
    {},
  ],
  ["browser main", { main: "./good.mjs", browser: "./bad.mjs" }, {}],
  ["module main", { main: "./good.mjs", module: "./bad.mjs" }, {}],
  [
    "browser relative alias",
    { main: "./index.mjs", browser: { "./good.mjs": "./bad.mjs" } },
    { "index.mjs": 'export * from "./good.mjs";' },
  ],
  [
    "browser package alias",
    { main: "./index.mjs", browser: { missing: "./bad.mjs" } },
    { "index.mjs": 'import "missing";' },
  ],
  [
    "development export",
    { exports: { development: "./bad.mjs", default: "./good.mjs" } },
    {},
  ],
  [
    "production export",
    { exports: { production: "./bad.mjs", default: "./good.mjs" } },
    {},
  ],
]) {
  test(`the graph inspects the actual ${name} branch`, async (t) => {
    const root = await fixture(t, 'export * from "conditional";');
    await packageFixture(root, "node_modules/conditional", manifest, {
      "good.mjs": "export const value = 1;",
      "bad.mjs": "export const load = (name) => import(name);",
      ...files,
    });
    if (name === "browser package alias")
      await packageFixture(
        root,
        "node_modules/missing",
        { main: "./index.cjs" },
        { "index.cjs": "module.exports = 1;" }
      );
    assert.equal(listener(root).check(), 1);
    await write(
      root,
      "node_modules/conditional/bad.mjs",
      "export const value = 2;"
    );
    assert.equal(listener(root).check(), 0);
  });
}

test("CommonJS require uses require conditions, including browser branches", async (t) => {
  const root = await fixture(t, 'import "./bridge.cjs";');
  await write(
    root,
    "src/bridge.cjs",
    'module.exports = require("conditional");'
  );
  await packageFixture(
    root,
    "node_modules/conditional",
    {
      exports: {
        browser: { require: "./browser.cjs", default: "./good.mjs" },
        require: "./node.cjs",
        import: "./good.mjs",
      },
    },
    {
      "good.mjs": "export const value = 1;",
      "browser.cjs": "module.exports = 1;",
      "node.cjs": "module.exports = 2;",
    }
  );
  assert.equal(listener(root).check(), 0);
  for (const filename of ["browser.cjs", "node.cjs"]) {
    await write(
      root,
      `node_modules/conditional/${filename}`,
      "module.exports = require(name);"
    );
    assert.equal(listener(root).check(), 1);
    await write(
      root,
      `node_modules/conditional/${filename}`,
      "module.exports = 1;"
    );
  }
});

const opaqueLoaders = [
  [
    "createRequire",
    'import { createRequire } from "node:module"; const load = createRequire(import.meta.url); export const value = load("foreign-package");',
  ],
  [
    "factory alias",
    'import { createRequire as factory } from "module"; const load = factory(import.meta.url); load("./missing.cjs");',
  ],
  [
    "factory escape",
    'import { createRequire } from "node:module"; export const factory = createRequire;',
  ],
  [
    "loader escape",
    'import { createRequire } from "node:module"; export default createRequire(import.meta.url);',
  ],
  [
    "module namespace",
    'import * as nodeModule from "node:module"; const load = nodeModule.createRequire(import.meta.url); load("foreign");',
  ],
  [
    "module default",
    'import nodeModule from "module"; const load = nodeModule.createRequire(import.meta.url); load("foreign");',
  ],
  [
    "computed factory",
    'import * as nodeModule from "node:module"; const load = nodeModule[factory](import.meta.url); load("foreign");',
  ],
  [
    "destructured factory",
    'import nodeModule from "node:module"; const { createRequire: factory } = nodeModule; factory(import.meta.url)("foreign");',
  ],
  [
    "namespace default factory",
    'import * as nodeModule from "node:module"; nodeModule.default.createRequire(import.meta.url)("foreign");',
  ],
  [
    "factory re-export",
    'export { createRequire as factory } from "node:module";',
  ],
  ["namespace re-export", 'export * as factories from "node:module";'],
  ["default re-export", 'export { default as factory } from "node:module";'],
  [
    "Module factory",
    'import { Module as owner } from "node:module"; const { createRequire: factory } = owner; factory(import.meta.url)("foreign");',
  ],
  [
    "named builtin factory",
    'import { getBuiltinModule as get } from "node:process"; const { createRequire: factory } = get("module"); factory(import.meta.url)("foreign");',
  ],
  ["require in ESM", 'export const value = require("./leaf.cjs");'],
  [
    "require alias",
    'const load = require; module.exports = load("./leaf.cjs");',
    "cjs",
  ],
  ["require escape", "module.exports = require;", "cjs"],
  ["require call", 'module.exports = require.call(null, "./leaf.cjs");', "cjs"],
  ["optional require", 'module.exports = require?.("./leaf.cjs");', "cjs"],
  ["computed require", "module.exports = require(name);", "cjs"],
  [
    "shadowed require",
    'function run(require) { return require("./leaf.cjs"); } module.exports = run;',
    "cjs",
  ],
  [
    "declared require",
    'const require = (name) => name; module.exports = require("./leaf.cjs");',
    "cjs",
  ],
  ["module require", "module.exports = module.require(name);", "cjs"],
  [
    "module require alias",
    'const { require: load } = module; module.exports = load("foreign");',
    "cjs",
  ],
  [
    "module escape",
    'const owner = module; module.exports = owner[key]("foreign");',
    "cjs",
  ],
  [
    "required factory",
    'const { createRequire } = require("node:module"); module.exports = createRequire(__filename)("foreign");',
    "cjs",
  ],
  [
    "builtin factory access",
    'const owner = process.getBuiltinModule("module"); owner.createRequire(import.meta.url)("foreign");',
  ],
  ["global require", 'globalThis["require"]("foreign");'],
  ["dynamic evaluator", 'const run = eval; run("require(name)");'],
];

for (const [name, source, extension = "mjs"] of opaqueLoaders) {
  test(`an unproved loader keeps the deferred import reported: ${name}`, async (t) => {
    const root = await fixture(t, source);
    await write(root, "src/leaf.cjs", "module.exports = 1;");
    if (extension === "cjs") {
      await write(root, "src/gallery.cjs", source);
      await write(root, "src/gallery.mjs", 'import "./gallery.cjs";');
    }
    assert.equal(listener(root).check(), 1);
  });
}

test("explicit TypeScript type-only loader and cyclic dependencies stay erased", async (t) => {
  const root = await fixture(t, 'export * from "./types.ts";');
  await write(
    root,
    "src/types.ts",
    `
import type { createRequire } from "node:module";
import { type Module } from "missing-package";
import type Loader = require("missing-package");
export type { createRequire } from "module";
export type * from "./loader.mjs";
export const value = 1;
`
  );
  assert.equal(listener(root).check(), 0);
});

test("canonical CommonJS belongs to a real CommonJS file and traces every literal edge", async (t) => {
  const root = await fixture(t, 'import "legacy";');
  await packageFixture(
    root,
    "node_modules/legacy",
    { main: "./index.js" },
    {
      "index.js": 'module.exports = require("./leaf");',
      "leaf.js": "exports.value = 1;",
    }
  );
  assert.equal(listener(root).check(), 0);
  await write(
    root,
    "node_modules/legacy/leaf.js",
    'module.exports = require("./index");'
  );
  assert.equal(listener(root).check(), 1);
  await write(root, "node_modules/legacy/leaf.js", "exports.value = 1;");
  await write(
    root,
    "node_modules/legacy/package.json",
    '{"type":"module","main":"./index.js"}'
  );
  assert.equal(listener(root).check(), 1);
});

for (const [name, source] of [
  ["owned exported back edge", 'export * from "graph-owner/loader";'],
  ["owned exported self edge", 'export * from "graph-owner/gallery";'],
  ["external static cycle", 'export * from "./other.mjs";'],
  ["external computed loading", "export const load = (name) => import(name);"],
  [
    "external bare dynamic loading",
    'export const load = () => import("foreign");',
  ],
  ["external unresolved loading", 'export * from "./missing.mjs";'],
]) {
  test(`resolved packages cannot conceal ${name}`, async (t) => {
    const root = await fixture(t, 'import "dependency";');
    await write(root, "src/leaf.mjs", "export const value = 1;");
    await packageFixture(
      root,
      "node_modules/dependency",
      { type: "module", main: "./index.mjs" },
      {
        "index.mjs": 'export * from "graph-owner/leaf";',
        "other.mjs": 'export * from "./index.mjs";',
      }
    );
    const manifest = JSON.parse(
      await readFile(path.join(root, "package.json"), "utf8")
    );
    manifest.exports["./leaf"] = "./src/leaf.mjs";
    await write(root, "package.json", JSON.stringify(manifest));
    assert.equal(listener(root).check(), 0);
    await write(root, "node_modules/dependency/index.mjs", source);
    assert.equal(listener(root).check(), 1);
  });
}

test("conditional exports and browser aliases cannot hide owned workspace cycles", async (t) => {
  const root = await fixture(t, 'import "workspace-link";');
  await packageFixture(
    root,
    "packages/linked",
    {
      name: "workspace-link",
      type: "module",
      exports: { browser: "./browser.mjs", default: "./node.mjs" },
    },
    {
      "node.mjs": "export const value = 1;",
      "browser.mjs": 'export * from "graph-owner/loader";',
    }
  );
  await mkdir(path.join(root, "node_modules"), { recursive: true });
  await symlink(
    path.join(root, "packages/linked"),
    path.join(root, "node_modules/workspace-link"),
    "dir"
  );
  await mkdir(path.join(root, "packages/linked/node_modules"));
  await symlink(
    root,
    path.join(root, "packages/linked/node_modules/graph-owner"),
    "dir"
  );
  assert.equal(listener(root).check(), 1);
  await write(root, "packages/linked/browser.mjs", "export const value = 1;");
  assert.equal(listener(root).check(), 0);
  await write(
    root,
    "packages/linked/package.json",
    JSON.stringify({
      name: "workspace-link",
      type: "module",
      main: "./node.mjs",
      browser: { "./node.mjs": "./browser.mjs" },
    })
  );
  await write(
    root,
    "packages/linked/browser.mjs",
    'export * from "graph-owner/loader";'
  );
  assert.equal(listener(root).check(), 1);
});

test("transitive relative edges cannot cross owners or redirected files", async (t) => {
  const root = await fixture(t, 'import "dependency";');
  await packageFixture(
    root,
    "node_modules/dependency",
    { type: "module", main: "./index.mjs" },
    {
      "index.mjs": 'export * from "./leaf.mjs";',
      "leaf.mjs": "export const value = 1;",
    }
  );
  assert.equal(listener(root).check(), 0);
  await packageFixture(
    root,
    "node_modules/other",
    { type: "module" },
    { "leaf.mjs": "export const value = 1;" }
  );
  await write(
    root,
    "node_modules/dependency/index.mjs",
    'export * from "../other/leaf.mjs";'
  );
  assert.equal(listener(root).check(), 1);
  await write(
    root,
    "node_modules/dependency/index.mjs",
    'export * from "./leaf.mjs";'
  );
  await rm(path.join(root, "node_modules/dependency/leaf.mjs"));
  await symlink(
    path.join(root, "node_modules/other/leaf.mjs"),
    path.join(root, "node_modules/dependency/leaf.mjs")
  );
  assert.equal(listener(root).check(), 1);
});

test("resolver aliases cannot redirect a relative edge across package ownership", async (t) => {
  const root = await fixture(t, 'import "dependency";');
  await packageFixture(
    root,
    "node_modules/dependency",
    {
      type: "module",
      main: "./index.mjs",
      browser: { "./leaf.mjs": "other" },
    },
    {
      "index.mjs": 'export * from "./leaf.mjs";',
      "leaf.mjs": "export const value = 1;",
    }
  );
  await packageFixture(
    root,
    "node_modules/other",
    { main: "./index.cjs" },
    { "index.cjs": "module.exports = 1;" }
  );
  assert.equal(listener(root).check(), 1);
});

test("assets have fixed supported formats and cannot conceal additional loading", async (t) => {
  const root = await fixture(t, 'import "./asset.json"; import "./asset.css";');
  await write(root, "src/asset.json", '{"value":1}');
  await write(root, "src/asset.css", ".gallery { color: red; }");
  assert.equal(listener(root).check(), 0);
  for (const [filename, invalid, original] of [
    ["asset.json", "{broken", '{"value":1}'],
    ["asset.css", '@import "missing.css";', ".gallery { color: red; }"],
  ]) {
    await write(root, `src/${filename}`, invalid);
    assert.equal(listener(root).check(), 1);
    await write(root, `src/${filename}`, original);
  }
  await write(root, "src/gallery.mjs", 'import "./asset.wasm";');
  await write(root, "src/asset.wasm", "opaque");
  assert.equal(listener(root).check(), 1);
});

test("the initial deferred edge stays literal, unescaped and same-package", async (t) => {
  const root = await fixture(t);
  for (const expression of [
    'import("graph-owner/gallery")',
    'import("./gall\\u0065ry.mjs")',
    'import("./gallery\\x2emjs")',
    'import("./gallery.mjs?copy")',
    'import("./gallery.mjs#copy")',
    'import("./gallery.mjs", { with: { type: "custom" } })',
    "import(`./gallery.mjs`)",
    "import(name)",
  ])
    assert.equal(
      listener(root).check(`export const load = () => ${expression};`),
      1,
      expression
    );
});

test("graph and resolver caches are scoped to the rule context", async (t) => {
  const root = await fixture(t, 'import "dependency";');
  await packageFixture(
    root,
    "node_modules/dependency",
    { main: "./index.cjs" },
    {
      "index.cjs": "module.exports = 1;",
      "bad.cjs": "module.exports = require(name);",
    }
  );
  const first = listener(root);
  assert.equal(first.check(), 0);
  assert.equal(first.check(), 0);
  await write(
    root,
    "node_modules/dependency/index.cjs",
    "module.exports = require(name);"
  );
  assert.equal(listener(root).check(), 1);
  await write(root, "node_modules/dependency/index.cjs", "module.exports = 1;");
  assert.equal(listener(root).check(), 0);
  await write(
    root,
    "node_modules/dependency/package.json",
    '{"main":"./bad.cjs"}'
  );
  assert.equal(listener(root).check(), 1);
});

test("a new context rechecks a redirected installed package", async (t) => {
  const root = await fixture(t, 'import "dependency";');
  for (const [directory, source] of [
    ["first", "module.exports = 1;"],
    ["second", "module.exports = require(name);"],
  ])
    await packageFixture(
      root,
      `installed/${directory}`,
      { main: "./index.cjs" },
      { "index.cjs": source }
    );
  const link = path.join(root, "node_modules/dependency");
  await symlink(path.join(root, "installed/first"), link, "dir");
  assert.equal(listener(root).check(), 0);
  await rm(link);
  await symlink(path.join(root, "installed/second"), link, "dir");
  assert.equal(listener(root).check(), 1);
});

test("package import aliases resolve actual sources and retain owned cycles", async (t) => {
  const root = await fixture(t, 'export * from "#target";');
  const manifest = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8")
  );
  manifest.imports = { "#target": "./src/leaf.mjs" };
  await write(root, "src/leaf.mjs", "export const value = 1;");
  await write(root, "package.json", JSON.stringify(manifest));
  assert.equal(listener(root).check(), 0);
  manifest.imports["#target"] = "./src/loader.mjs";
  await write(root, "package.json", JSON.stringify(manifest));
  assert.equal(listener(root).check(), 1);
});

test("browser aliases on the initial edge cannot hide a cycle or ignored target", async (t) => {
  const root = await fixture(t);
  const manifest = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8")
  );
  manifest.browser = { "./src/gallery.mjs": "./src/alternate.mjs" };
  await write(root, "src/alternate.mjs", "export const value = 1;");
  await write(root, "package.json", JSON.stringify(manifest));
  assert.equal(listener(root).check(), 0);
  manifest.browser["./src/gallery.mjs"] = "./src/loader.mjs";
  await write(root, "package.json", JSON.stringify(manifest));
  assert.equal(listener(root).check(), 1);
  manifest.browser["./src/gallery.mjs"] = false;
  await write(root, "package.json", JSON.stringify(manifest));
  assert.equal(listener(root).check(), 1);
});

test("a browser alias of a builtin traces the replacement source instead of treating it as a leaf", async (t) => {
  const root = await fixture(t);
  const manifest = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8")
  );
  for (const specifier of ["fs", "node:fs"]) {
    await write(
      root,
      "src/gallery.mjs",
      `import ${JSON.stringify(specifier)};`
    );
    manifest.browser = { [specifier]: "./src/shim.mjs" };
    await write(root, "package.json", JSON.stringify(manifest));
    await write(root, "src/shim.mjs", "export const value = 1;");
    assert.equal(listener(root).check(), 0);
    await write(root, "src/shim.mjs", 'export * from "./loader.mjs";');
    assert.equal(listener(root).check(), 1);
    manifest.browser[specifier] = "./missing.mjs";
    await write(root, "package.json", JSON.stringify(manifest));
    assert.equal(listener(root).check(), 1);
    manifest.browser[specifier] = false;
    await write(root, "package.json", JSON.stringify(manifest));
    assert.equal(listener(root).check(), 1);
  }
});

test("a fixed computed CommonJS loader key retains its literal dependency edge", async (t) => {
  const root = await fixture(t, 'import "./hidden.cjs";');
  await write(root, "src/leaf.cjs", "module.exports = 1;");
  const source = `
function load() {
  try {
    var key = ("require" + Math.random()).slice(0, 7);
    return (module && module[key]).call(module, "./leaf.cjs");
  } catch { return null; }
}
module.exports = load;
`;
  await write(root, "src/hidden.cjs", source);
  assert.equal(listener(root).check(), 0);
  for (const invocation of [
    'module.require("./leaf.cjs")',
    'module["require"]("./leaf.cjs")',
    'module["requ" + "ire"]("./leaf.cjs")',
    '(module && module["require"]).call(module, "./leaf.cjs")',
  ]) {
    await write(root, "src/hidden.cjs", `module.exports = ${invocation};`);
    assert.equal(listener(root).check(), 0, invocation);
  }
  await write(root, "src/hidden.cjs", source);
  await write(
    root,
    "src/leaf.cjs",
    'module.exports = require("./hidden.cjs");'
  );
  assert.equal(listener(root).check(), 1);
  await write(root, "src/leaf.cjs", "module.exports = 1;");
  await write(
    root,
    "src/hidden.cjs",
    source.replace('"./leaf.cjs"', '"./missing.cjs"')
  );
  assert.equal(listener(root).check(), 1);
});

test("the reported CommonJS alias escape and alias back edge retain their findings", async (t) => {
  const root = await fixture(t);
  const originalLoader =
    'export const load = async () => await import("./chunk.cjs");\n';
  await write(root, "src/loader.mjs", originalLoader);
  await packageFixture(
    root,
    "src/foreign",
    { type: "commonjs" },
    { "side-effect.cjs": 'console.log("foreign-loaded");\n' }
  );
  for (const source of [
    'const load = require;\n\nload("./foreign/side-effect.cjs");\nmodule.exports = 42;\n',
    'const load = require;\n\nload("./loader.mjs");\nmodule.exports = 42;\n',
  ]) {
    await write(root, "src/chunk.cjs", "module.exports = 42;\n");
    assert.equal(listener(root).check(originalLoader), 0);
    await write(root, "src/chunk.cjs", source);
    assert.equal(listener(root).check(originalLoader), 1);
  }
});

test("unproved computed loader keys and receiver escapes stay reported", async (t) => {
  const root = await fixture(t, 'import "./hidden.cjs";');
  await write(root, "src/leaf.cjs", "module.exports = 1;");
  for (const source of [
    'function suffix() { return require(name); } const key = ("require" + suffix()).slice(0, 7); module[key]("./leaf.cjs");',
    'const key = ("require" + Math.random()).slice(0, 8); module[key]("./leaf.cjs");',
    'var key = "require"; key = name; module[key]("./leaf.cjs");',
    'module[key]("./leaf.cjs"); var key = "require";',
    'function run() { module[key]("./leaf.cjs"); } const key = "require";',
    'const key = "require"; function run(key) { module[key]("./leaf.cjs"); }',
    'const key = "require"; const load = module[key]; load("./leaf.cjs");',
    'const key = "require"; module[key].call(other, "./leaf.cjs");',
    'String.prototype.slice = custom; const key = ("require" + Math.random()).slice(0, 7); module[key]("./leaf.cjs");',
    'const world = globalThis; world[name] = custom; const key = ("require" + Math.random()).slice(0, 7); module[key]("./leaf.cjs");',
  ]) {
    await write(root, "src/hidden.cjs", source);
    assert.equal(listener(root).check(), 1, source);
  }
});

test("bounded loader-key slices use known UTF-16 prefixes without evaluating unknown suffixes", async (t) => {
  const root = await fixture(t, 'import "./hidden.cjs";');
  await write(root, "src/leaf.cjs", "module.exports = 1;");
  for (const expression of [
    '("require" + opaque()).slice(0, 7)',
    '("require" + opaque() + another()).slice(0, 7)',
    '("xxrequire" + opaque()).slice(2, 9)',
    '("💥require" + opaque()).slice(2, 9)',
    '("required" + opaque()).slice(0, 7)',
    '("requ" + "ire" + opaque()).slice(0, 7)',
    '("\\u0072equire" + opaque()).slice(0, 7)',
  ]) {
    await write(
      root,
      "src/hidden.cjs",
      `
function opaque() { throw new Error("do not evaluate this suffix"); }
function another() { throw new Error("do not evaluate this suffix either"); }
const key = ${expression};
module.exports = (module && module[key]).call(module, "./leaf.cjs");
`
    );
    assert.equal(listener(root).check(), 0, expression);
  }
  for (const expression of [
    '("requir" + opaque()).slice(0, 7)',
    '("requires" + opaque()).slice(0, 8)',
    '("💥require" + opaque()).slice(1, 8)',
    '(opaque() + "require").slice(0, 7)',
    '("require" + opaque()).slice(start, 7)',
    '("require" + opaque()).slice(0, end)',
    '("require" + opaque()).slice(-1, 7)',
    '("require" + opaque()).slice(0, -1)',
    '("require" + opaque()).slice(0, 8)',
    '("require" + opaque()).slice(7, 0)',
    '("require" + opaque()).slice(0.5, 7)',
    '("require" + opaque()).slice("0", 7)',
    '("require" + opaque()).slice(0)',
  ]) {
    await write(
      root,
      "src/hidden.cjs",
      `const key = ${expression}; module[key]("./leaf.cjs");`
    );
    assert.equal(listener(root).check(), 1, expression);
  }
});

test("CommonJS receivers cannot be shadowed or replaced, including in an ESM file", async (t) => {
  const root = await fixture(t, 'import "./hidden.cjs";');
  await write(root, "src/leaf.cjs", "module.exports = 1;");
  for (const source of [
    'function run(module) { const key = "require"; return module[key]("./leaf.cjs"); }',
    'const module = foreign; const key = "require"; module[key]("./leaf.cjs");',
    'module = foreign; const key = "require"; module[key]("./leaf.cjs");',
    'module.require = foreign; const key = "require"; module[key]("./leaf.cjs");',
    'const key = "require"; (module && module[key]).call(other, "./leaf.cjs");',
    'const key = "require"; (module && module[key]).call(module, name);',
    'const key = "require"; (module && module[key]).call(module, ...names);',
    'const key = "require"; (module && module[key]).call(module, "./leaf.cjs", extra);',
    'const key = "require"; (module && module[key]).apply(module, ["./leaf.cjs"]);',
    'const key = "require"; (other && module[key]).call(module, "./leaf.cjs");',
    'export const value = module.require("./leaf.cjs");',
  ]) {
    await write(root, "src/hidden.cjs", source);
    assert.equal(listener(root).check(), 1, source);
  }
  await write(root, "src/gallery.mjs", 'import "./hidden.mjs";');
  await write(root, "src/hidden.mjs", "export const value = 1;");
  assert.equal(listener(root).check(), 0);
  await write(
    root,
    "src/hidden.mjs",
    'export const value = module.require("./leaf.cjs");'
  );
  assert.equal(listener(root).check(), 1);
});

test("both fixer modes retain the deferred boundary, evaluation order and module cache", async (t) => {
  const root = await fixture(
    t,
    'import value from "dependency"; globalThis.evaluations.push("gallery"); export { value };'
  );
  await packageFixture(
    root,
    "node_modules/dependency",
    { main: "./index.cjs" },
    {
      "index.cjs":
        'globalThis.evaluations.push("dependency"); module.exports = { value: 1 };',
    }
  );
  const pluginUrl = new URL(
    "../oxlint/howells-policy-plugin.mjs",
    import.meta.url
  ).href;
  await write(
    root,
    "oxlint.config.mjs",
    `export default {
categories: { correctness: "off" }, jsPlugins: [{ name: "howells", specifier: ${JSON.stringify(pluginUrl)} }],
rules: { "howells/no-runtime-dynamic-imports": ["error", { allowLocalModules: true }] }
};`
  );
  const original = await readFile(path.join(root, "src/loader.mjs"), "utf8");
  for (const flag of ["--fix", "--fix-dangerously"]) {
    const result = await execFileAsync(
      path.join(repoRoot, "node_modules/.bin/oxlint"),
      [
        "--config",
        path.join(root, "oxlint.config.mjs"),
        "--format",
        "json",
        flag,
        "src/loader.mjs",
      ],
      { cwd: root }
    );
    assert.deepEqual(JSON.parse(result.stdout).diagnostics, []);
    const unchanged = await readFile(path.join(root, "src/loader.mjs"), "utf8");
    assert.equal(unchanged, original);
    const module = parseSync("loader.mjs", unchanged).module;
    assert.equal(module.staticImports.length, 0);
    assert.equal(module.dynamicImports.length, 1);
    await execFileAsync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
import assert from "node:assert/strict";
globalThis.evaluations = [];
const { load } = await import("./src/loader.mjs");
assert.deepEqual(globalThis.evaluations, []);
const first = await load();
assert.deepEqual(globalThis.evaluations, ["dependency", "gallery"]);
assert.deepEqual(first.value, { value: 1 });
assert.equal(await load(), first);
assert.deepEqual(globalThis.evaluations, ["dependency", "gallery"]);
`,
      ],
      { cwd: root }
    );
  }
});
