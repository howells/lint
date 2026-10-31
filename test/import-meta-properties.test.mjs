import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { resolvePackageBin } from "../bin/run-package-bin.mjs";
import core from "../oxlint/core.mjs";
import next from "../oxlint/next.mjs";
import playwright from "../oxlint/playwright.mjs";
import react from "../oxlint/react.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const oxlintBin = path.join(repoRoot, "node_modules/.bin/oxlint");
const pluginUrl = pathToFileURL(
  path.join(repoRoot, "oxlint/howells-policy-plugin.mjs")
).href;
const ruleName = "howells/prefer-supported-import-meta-properties";
const ruleCode = "howells(prefer-supported-import-meta-properties)";
const nativeRuleName = "unicorn/prefer-import-meta-properties";
const nativeRuleCode = "unicorn(prefer-import-meta-properties)";
const tsgolintPath = resolvePackageBin("oxlint-tsgolint", "tsgolint");

async function fixtureRoot() {
  const root = await mkdtemp(
    path.join(realpathSync(tmpdir()), "howells module metadata ")
  );
  await symlink(
    path.join(repoRoot, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
  await writeFile(path.join(root, "package.json"), '{"type":"module"}\n');
  return root;
}

async function writeRuleConfig(root, rule = ruleName) {
  await writeFile(
    path.join(root, "oxlint.config.mjs"),
    `export default {
  categories: { correctness: "off" },
  jsPlugins: [{name: "howells", specifier: ${JSON.stringify(pluginUrl)}}],
  rules: {${JSON.stringify(rule)}: "error"},
};\n`
  );
}

async function runOxlint(root, target, fix = false) {
  let result;
  try {
    result = {
      status: 0,
      ...(await execFileAsync(
        oxlintBin,
        [
          "--config",
          path.join(root, "oxlint.config.mjs"),
          "--format",
          "json",
          ...(fix ? ["--fix"] : []),
          target,
        ],
        {
          cwd: root,
          env: { ...process.env, OXLINT_TSGOLINT_PATH: tsgolintPath },
          maxBuffer: 5_000_000,
        }
      )),
    };
  } catch (error) {
    result = { status: error.code, stdout: error.stdout, stderr: error.stderr };
  }
  const report = JSON.parse(result.stdout);
  result.diagnostics = report.diagnostics ?? report;
  assert.ok(
    !result.diagnostics.some((item) =>
      item.message.startsWith("Error running JS plugin")
    ),
    result.stdout
  );
  return result;
}

function resolvedRules(preset, rules = {}) {
  for (const extended of preset.extends ?? []) resolvedRules(extended, rules);
  Object.assign(rules, preset.rules ?? {});
  return rules;
}

const imports =
  'import path from "node:path";\nimport { fileURLToPath } from "node:url";\n\n';
const dirname = "path.dirname(fileURLToPath(import.meta.url))";
const filename = "fileURLToPath(import.meta.url)";
const guard = (body, property = "dirname") =>
  `if (typeof import.meta.${property} === "string") { ${body} }`;
const use = (expression) => `console.log(${expression});`;
const nativePathProperty = process.platform === "win32" ? "win32" : "posix";
const metadataWrites = [
  [
    "object-destructuring",
    '({ value: import.meta.filename } = { value: "changed" });',
  ],
  [
    "nested-destructuring",
    '({ value: [import.meta.filename] } = { value: ["changed"] });',
  ],
  ["array-destructuring", '[import.meta.filename] = ["changed"];'],
  ["object-default", '({ value: import.meta.filename = "changed" } = {});'],
  ["array-default", '[import.meta.filename = "changed"] = [];'],
  ["object-rest", "({...import.meta.filename} = { changed: true });"],
  ["array-rest", '[...import.meta.filename] = ["changed"];'],
  ["for-of", 'for (import.meta.filename of ["changed"]) {}'],
  ["for-in", "for (import.meta.filename in { changed: true }) {}"],
  ["nested-for-of", 'for ([import.meta.filename] of [["changed"]]) {}'],
];
const uninitializedAliases = [
  [
    "hoisted-helper",
    `run();\nconst directory = path.dirname;\nfunction run() { ${guard(`return directory(${filename});`)} }`,
  ],
  [
    "hoisted-filename",
    `run();\nconst name = ${filename};\nfunction run() { ${guard("return path.dirname(name);")} }`,
  ],
  [
    "hoisted-module-alias",
    `run();\nconst paths = path;\nfunction run() { ${guard(`return paths.dirname(${filename});`)} }`,
  ],
  [
    "switch-helper",
    `switch ("read") { case "init": const directory = path.dirname; break; case "read": ${guard(`return directory(${filename});`)} }`,
    true,
  ],
  [
    "switch-filename",
    `switch ("read") { case "init": const name = ${filename}; break; case "read": ${guard("return path.dirname(name);")} }`,
    true,
  ],
];
const mutationRoutes = [
  [
    "outer-alias-write",
    'const paths = path; function mutate() { paths.dirname = () => "changed"; } mutate();',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "outer-alias-escape",
    'const paths = path; function mutate() { Object.assign(paths, { dirname: () => "changed" }); } mutate();',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "outer-alias-chain-write",
    'const paths = path; const borrowed = paths; function mutate() { borrowed.dirname = () => "changed"; } mutate();',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "outer-builtin-lookup-alias-write",
    'const paths = process.getBuiltinModule("node:path"); function mutate() { paths.dirname = () => "changed"; } mutate();',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "global-object-alias-escape",
    'const host = globalThis; const OriginalURL = URL; host.URL = class extends OriginalURL { constructor() { super("file:///changed"); } };',
    "fileURLToPath(new URL(import.meta.url))",
    "filename",
    "/changed",
  ],
  [
    "global-object-call-escape",
    'const OriginalURL = URL; Object.assign(globalThis, { URL: class extends OriginalURL { constructor() { super("file:///changed"); } } });',
    "fileURLToPath(new URL(import.meta.url))",
    "filename",
    "/changed",
  ],
  [
    "process-object-alias-escape",
    'const host = process; host.getBuiltinModule = () => ({ fileURLToPath: () => "changed" });',
    'process.getBuiltinModule("node:url").fileURLToPath(import.meta.url)',
    "filename",
    "changed",
  ],
  [
    "computed-global-process-escape",
    'const key = "process"; const host = globalThis[key]; host.getBuiltinModule = () => ({ fileURLToPath: () => "changed" });',
    'process.getBuiltinModule("node:url").fileURLToPath(import.meta.url)',
    "filename",
    "changed",
  ],
  [
    "global-process-property-write",
    'globalThis.process.getBuiltinModule = () => ({ fileURLToPath: () => "changed" });',
    'process.getBuiltinModule("node:url").fileURLToPath(import.meta.url)',
    "filename",
    "changed",
  ],
  [
    "constructor-prototype-escape",
    'Object.defineProperty(URL.prototype, "pathname", { get: () => "/changed" });',
    "fileURLToPath(new URL(import.meta.url))",
    "filename",
    "/changed",
  ],
  [
    "imported-process-write",
    'import runtime from "node:process"; runtime.getBuiltinModule = () => ({ fileURLToPath: () => "changed" });',
    'process.getBuiltinModule("node:url").fileURLToPath(import.meta.url)',
    "filename",
    "changed",
  ],
  [
    "imported-default-process-write",
    'import { default as runtime } from "node:process"; runtime.getBuiltinModule = () => ({ fileURLToPath: () => "changed" });',
    'process.getBuiltinModule("node:url").fileURLToPath(import.meta.url)',
    "filename",
    "changed",
  ],
  [
    "imported-namespace-url-prototype-escape",
    'import urls from "node:url"; Object.defineProperty(urls.URL.prototype, "pathname", { get: () => "/changed" });',
    "fileURLToPath(new URL(import.meta.url))",
    "filename",
    "/changed",
  ],
  [
    "imported-named-url-prototype-escape",
    'import { URL as NativeURL } from "node:url"; Object.defineProperty(NativeURL.prototype, "pathname", { get: () => "/changed" });',
    "fileURLToPath(new URL(import.meta.url))",
    "filename",
    "/changed",
  ],
  [
    "extracted-builtin-lookup",
    'const lookup = process.getBuiltinModule; lookup("node:path").dirname = () => "changed";',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "computed-builtin-lookup",
    'process["getBuiltinModule"]("node:path").dirname = () => "changed";',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "bound-builtin-lookup",
    'const lookup = process.getBuiltinModule.bind(null); lookup("node:path").dirname = () => "changed";',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "namespace-default-object",
    'import * as paths from "node:path"; paths.default.dirname = () => "changed";',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "native-submodule-object",
    `path.${nativePathProperty}.dirname = () => "changed";`,
    dirname,
    "dirname",
    "changed",
  ],
  [
    "nested-submodule-object",
    `path.${nativePathProperty}.${nativePathProperty}.dirname = () => "changed";`,
    dirname,
    "dirname",
    "changed",
  ],
  [
    "namespace-default-call-escape",
    'import * as paths from "node:path"; Object.assign(paths.default, { dirname: () => "changed" });',
    dirname,
    "dirname",
    "changed",
  ],
  [
    "submodule-alias-call-escape",
    `const paths = path.${nativePathProperty}; Object.assign(paths, { dirname: () => "changed" });`,
    dirname,
    "dirname",
    "changed",
  ],
  [
    "computed-submodule-alias",
    `const key = "${nativePathProperty}"; const paths = path[key]; paths.dirname = () => "changed";`,
    dirname,
    "dirname",
    "changed",
  ],
  [
    "optional-submodule-escape",
    `Object.assign(path?.${nativePathProperty}, { dirname: () => "changed" });`,
    dirname,
    "dirname",
    "changed",
  ],
  [
    "optional-namespace-default-escape",
    'import * as paths from "node:path"; Object.assign(paths?.default, { dirname: () => "changed" });',
    dirname,
    "dirname",
    "changed",
  ],
  ...["node:", ""].map((prefix) => [
    `path-subpath-import-${prefix ? "node" : "bare"}`,
    `import variant from "${prefix}path/${nativePathProperty}"; const paths = variant; function mutate() { paths.dirname = () => "changed"; } mutate();`,
    dirname,
    "dirname",
    "changed",
  ]),
  [
    "path-subpath-namespace-default",
    `import * as variant from "node:path/${nativePathProperty}"; variant.default.dirname = () => "changed";`,
    dirname,
    "dirname",
    "changed",
  ],
  [
    "computed-imported-url-prototype",
    'import { URL as NodeURL } from "node:url"; const key = "prototype"; Object.defineProperty(NodeURL[key], "pathname", { get: () => "/changed" });',
    filename,
    "filename",
    "/changed",
  ],
  [
    "computed-namespace-url-constructor",
    'import * as urls from "node:url"; const key = "URL"; Object.defineProperty(urls[key].prototype, "pathname", { get: () => "/changed" });',
    filename,
    "filename",
    "/changed",
  ],
  [
    "url-prototype-constructor-chain",
    'Object.defineProperty(URL.prototype.constructor.prototype, "pathname", { get: () => "/changed" });',
    filename,
    "filename",
    "/changed",
  ],
  ...["global", "globalThis.global"].map((access) => [
    `node-global-alias-${access}`,
    `${access}.process.getBuiltinModule = () => ({ fileURLToPath: () => "changed" });`,
    'process.getBuiltinModule("node:url").fileURLToPath(import.meta.url)',
    "filename",
    "changed",
  ]),
  ...["globalThis[key]", "globalThis.URL", 'globalThis["URL"]'].map(
    (access, index) => [
      `global-constructor-write-${index}`,
      `const OriginalURL = URL; const key = "URL"; ${access} = class extends OriginalURL { constructor() { super("file:///changed"); } };`,
      "fileURLToPath(new URL(import.meta.url))",
      "filename",
      "/changed",
    ]
  ),
  ...[
    "process[key]",
    "process.getBuiltinModule",
    'process["getBuiltinModule"]',
  ].map((access, index) => [
    `global-builtin-lookup-write-${index}`,
    `const key = "getBuiltinModule"; ${access} = () => ({ fileURLToPath: () => "changed" });`,
    'process.getBuiltinModule("node:url").fileURLToPath(import.meta.url)',
    "filename",
    "changed",
  ]),
];
const cases = [
  ["unguarded-dirname", imports + use(dirname), 0],
  ["unguarded-filename", imports + use(filename), 0],
  ["guarded-dirname", imports + guard(use(dirname)), 1],
  ["guarded-filename", imports + guard(use(filename), "filename"), 1],
  ...mutationRoutes.map(([name, mutation, expression, property]) => [
    `mutation-route-${name}`,
    imports + mutation + guard(use(expression), property),
    0,
  ]),
  [
    "unrelated-literal-global-write",
    imports + 'globalThis["unrelated"] = true;' + guard(use(dirname)),
    1,
  ],
  [
    "unrelated-literal-process-write",
    imports + 'process["unrelated"] = true;' + guard(use(dirname)),
    1,
  ],
  [
    "unknown-computed-global-read",
    imports + 'const key = "URL"; void globalThis[key];' + guard(use(dirname)),
    1,
  ],
  [
    "global-names-as-property-keys-are-not-references",
    imports +
      'const names = { process: "unrelated", URL: "unrelated", globalThis: "unrelated" }; console.log(names.process, names.URL, names.globalThis);' +
      guard(use(dirname)),
    1,
  ],
  [
    "imported-process-property-read",
    imports +
      'import runtime from "node:process"; console.log(runtime.pid);' +
      guard(use(dirname)),
    1,
  ],
  [
    "imported-url-construction-read",
    imports +
      'import { URL as NativeURL } from "node:url"; const target = new NativeURL(import.meta.url); console.log(target.href);' +
      guard(use(filename), "filename"),
    1,
  ],
  [
    "namespace-default-property-read",
    imports +
      'import * as paths from "node:path"; console.log(paths.default.sep);' +
      guard(use(dirname)),
    1,
  ],
  [
    "submodule-alias-property-read",
    imports +
      `const paths = path.${nativePathProperty}; console.log(paths.sep);` +
      guard(use(dirname)),
    1,
  ],
  [
    "computed-module-property-read",
    imports + 'const key = "sep"; void path[key];' + guard(use(dirname)),
    1,
  ],
  [
    "optional-module-property-read",
    imports +
      `console.log(path?.${nativePathProperty}.sep);` +
      guard(use(dirname)),
    1,
  ],
  [
    "computed-url-prototype-read",
    imports +
      'const key = "prototype"; void URL[key];' +
      guard(use(filename), "filename"),
    1,
  ],
  [
    "shadowed-global-aliases",
    imports +
      "{ const global = {}, window = {}, self = {}; void [global, window, self]; }" +
      guard(use(dirname)),
    1,
  ],
  [
    "node-global-property-read",
    imports + "console.log(global.process.pid);" + guard(use(dirname)),
    1,
  ],
  [
    "path-subpath-property-read",
    imports +
      `import variant from "node:path/${nativePathProperty}"; console.log(variant.sep);` +
      guard(use(dirname)),
    1,
  ],
  [
    "path-subpath-does-not-expand-positive-fixes",
    `import variant from "node:path/${nativePathProperty}"; import { fileURLToPath } from "node:url";` +
      guard(use("variant.dirname(fileURLToPath(import.meta.url))")),
    0,
  ],
  [
    "guarded-both-no-overlap",
    imports + guard(guard(use(dirname), "filename")),
    1,
  ],
  ["dirname-does-not-prove-filename", imports + guard(use(filename)), 0],
  [
    "native-filename-also-needs-availability",
    imports + guard(use("path.dirname(import.meta.filename)")),
    0,
  ],
  [
    "guarded-native-filename-to-dirname",
    imports +
      guard(guard(use("path.dirname(import.meta.filename)"), "filename")),
    1,
  ],
  [
    "native-filename-alias-also-needs-availability",
    imports +
      `const name = import.meta.filename;\n${guard(use("path.dirname(name)"))}`,
    0,
  ],
  [
    "guarded-native-filename-alias",
    imports +
      `const name = import.meta.filename;\n${guard(guard(use("path.dirname(name)"), "filename"))}`,
    1,
  ],
  ["filename-only-inner-fix", imports + guard(use(dirname), "filename"), 1],
  [
    "ternary-fallback",
    imports +
      `console.log(typeof import.meta.dirname === "string" ? import.meta.dirname : ${dirname});`,
    0,
  ],
  [
    "nullish-fallback",
    imports + `console.log(import.meta.dirname ?? ${dirname});`,
    0,
  ],
  [
    "or-fallback",
    imports + `console.log(import.meta.dirname || ${dirname});`,
    0,
  ],
  [
    "negative-short-circuit",
    imports + `typeof import.meta.dirname !== "string" && ${use(dirname)}`,
    0,
  ],
  [
    "positive-short-circuit",
    imports + `typeof import.meta.dirname === "string" && ${use(dirname)}`,
    1,
  ],
  [
    "positive-else",
    imports +
      `if (typeof import.meta.dirname !== "string") {} else { ${use(dirname)} }`,
    1,
  ],
  [
    "positive-negation",
    imports +
      `if (!(typeof import.meta.dirname !== "string")) { ${use(dirname)} }`,
    1,
  ],
  [
    "positive-conjunction",
    imports +
      `if (typeof import.meta.dirname === "string" && Boolean(Date.now())) { ${use(dirname)} }`,
    1,
  ],
  [
    "disjunction-does-not-prove",
    imports +
      `if (typeof import.meta.dirname === "string" || Boolean(Date.now())) { ${use(dirname)} }`,
    0,
  ],
  [
    "false-disjunction-proves",
    imports +
      `if (typeof import.meta.dirname !== "string" || Boolean(Date.now())) {} else { ${use(dirname)} }`,
    1,
  ],
  [
    "guard-not-carried-into-closure",
    imports + guard(`setTimeout(() => { ${use(dirname)} });`),
    0,
  ],
  [
    "guard-inside-function",
    imports +
      `export const locate = () => { ${guard(`return ${dirname};`)} return "unavailable"; };`,
    1,
  ],
  [
    "shadowed-path",
    imports + `export const locate = (path) => { ${guard(use(dirname))} };`,
    0,
  ],
  [
    "shadowed-decoder",
    imports +
      `export const locate = (fileURLToPath) => { ${guard(use(dirname))} };`,
    0,
  ],
  [
    "shadowed-url",
    imports +
      `export const locate = (URL) => { ${guard(use("fileURLToPath(new URL(import.meta.url))"), "filename")} };`,
    0,
  ],
  [
    "namespace-and-constant-aliases",
    'import * as paths from "node:path";\nimport * as urls from "node:url";\nconst p = paths;\nconst u = urls;\n' +
      guard(use("p.dirname(u.fileURLToPath(import.meta.url))")),
    1,
  ],
  [
    "destructured-aliases",
    'import paths from "node:path";\nimport urls from "node:url";\nconst {dirname: directory} = paths;\nconst {fileURLToPath: decode} = urls;\n' +
      guard(use("directory(decode(import.meta.url))")),
    1,
  ],
  [
    "named-import-aliases",
    'import {dirname as directory} from "node:path";\nimport {fileURLToPath as decode} from "node:url";\n' +
      guard(use("directory(decode(import.meta.url))")),
    1,
  ],
  [
    "process-builtin-modules",
    'const {dirname: directory} = process.getBuiltinModule("node:path");\nconst {fileURLToPath: decode} = process.getBuiltinModule("node:url");\n' +
      guard(use("directory(decode(import.meta.url))")),
    1,
  ],
  [
    "inline-process-builtin-modules",
    guard(
      use(
        'process.getBuiltinModule("node:path").dirname(process.getBuiltinModule("node:url").fileURLToPath(import.meta.url))'
      )
    ),
    1,
  ],
  [
    "shadowed-process",
    `export const locate = (process) => { ${guard(use('process.getBuiltinModule("node:path").dirname(process.getBuiltinModule("node:url").fileURLToPath(import.meta.url))'))} };`,
    0,
  ],
  [
    "mutable-helper-alias",
    imports +
      `let directory = path.dirname;\n${guard(use("directory(fileURLToPath(import.meta.url))"))}`,
    0,
  ],
  [
    "constant-filename-alias-chain",
    imports +
      `const name = fileURLToPath(import.meta.url);\nconst again = name;\n${guard(use("path.dirname(again)"))}`,
    1,
  ],
  ...uninitializedAliases.map(([name, body, insideFunction]) => [
    `uninitialized-alias-${name}`,
    imports +
      (insideFunction ? `export const locate = () => { ${body} };` : body),
    0,
  ]),
  [
    "outer-helper-not-assumed-in-deferred-function",
    imports +
      `const directory = path.dirname;\nexport const locate = () => { ${guard(`return directory(${filename});`)} };`,
    0,
  ],
  [
    "local-function-helper-initialized-before-use",
    imports +
      `export const locate = () => { const directory = path.dirname; ${guard(`return directory(${filename});`)} };`,
    1,
  ],
  [
    "same-switch-case-initialized-before-use",
    imports +
      `switch ("read") { case "read": const directory = path.dirname; ${guard(use(`directory(${filename})`))} }`,
    1,
  ],
  [
    "same-declaration-list-initialized-before-use",
    imports +
      `const directory = path.dirname, value = typeof import.meta.dirname === "string" ? directory(${filename}) : "missing"; console.log(value);`,
    1,
  ],
  [
    "exported-alias-initialized-before-use",
    imports +
      `export const directory = path.dirname;\n${guard(use(`directory(${filename})`))}`,
    1,
  ],
  [
    "meta-object-escape",
    imports + `const meta = import.meta;\n${guard(use(dirname))}`,
    0,
  ],
  [
    "meta-property-assignment",
    imports + `import.meta.dirname = "custom";\n${guard(use(dirname))}`,
    0,
  ],
  [
    "meta-property-delete",
    imports + `delete import.meta.dirname;\n${guard(use(dirname))}`,
    0,
  ],
  ...metadataWrites.map(([name, write]) => [
    `indirect-meta-write-${name}`,
    imports + guard(`${write}\n${use(filename)}`, "filename"),
    0,
  ]),
  [
    "typed-assignment-target",
    imports +
      guard(
        '({ value: import.meta.filename! } = { value: "changed" });\n' +
          use(filename),
        "filename"
      ),
    0,
    { target: "source.mts" },
  ],
  [
    "destructured-core-module-mutation",
    imports +
      `({ value: path.dirname } = { value: () => "custom" });\n${guard(use(dirname))}`,
    0,
  ],
  [
    "loop-core-module-mutation",
    imports +
      `for (path.dirname of [() => "custom"]) {}\n${guard(use(dirname))}`,
    0,
  ],
  [
    "destructured-global-constructor-mutation",
    imports +
      `({ URL } = { URL: class {} });\n${guard(use("fileURLToPath(new URL(import.meta.url))"), "filename")}`,
    0,
  ],
  [
    "default-initializer-is-a-read",
    imports +
      guard(
        `const { value = import.meta.filename } = {};\n${use(filename)}\nvoid value;`,
        "filename"
      ),
    1,
  ],
  [
    "computed-pattern-key-is-a-read",
    imports +
      guard(
        `const { [import.meta.filename]: value } = {};\n${use(filename)}\nvoid value;`,
        "filename"
      ),
    1,
  ],
  [
    "loop-iterable-is-a-read",
    imports +
      guard(
        `for (const value of [import.meta.filename]) void value;\n${use(filename)}`,
        "filename"
      ),
    1,
  ],
  [
    "core-module-mutation",
    imports + `path.dirname = () => "custom";\n${guard(use(dirname))}`,
    0,
  ],
  [
    "core-module-escape",
    imports + `unknownOperation(path);\n${guard(use(dirname))}`,
    0,
  ],
  [
    "lookup-result-module-escape",
    imports +
      `unknownOperation(process.getBuiltinModule("node:path"));\n${guard(use(dirname))}`,
    0,
  ],
  [
    "helper-alias-tdz",
    imports +
      `${guard(use("directory(fileURLToPath(import.meta.url))"))}\nconst directory = path.dirname;`,
    0,
  ],
  [
    "filename-alias-tdz",
    imports +
      `${guard(use("path.dirname(name)"))}\nconst name = fileURLToPath(import.meta.url);`,
    0,
  ],
  [
    "url-constructor-reassigned",
    imports +
      `URL = class {};\n${guard(use("fileURLToPath(new URL(import.meta.url))"), "filename")}`,
    0,
  ],
  [
    "global-url-constructor-reassigned",
    imports +
      `globalThis.URL = class {};\n${guard(use("fileURLToPath(new URL(import.meta.url))"), "filename")}`,
    0,
  ],
  [
    "directory-url-separator",
    imports + guard(use('fileURLToPath(new URL(".", import.meta.url))')),
    0,
  ],
  [
    "directory-url-slash-separator",
    imports + guard(use('fileURLToPath(new URL("./", import.meta.url))')),
    0,
  ],
  [
    "url-object-filename",
    imports + guard(use("fileURLToPath(new URL(import.meta.url))"), "filename"),
    1,
  ],
  [
    "windows-option-not-equivalent",
    imports +
      guard(use("fileURLToPath(import.meta.url, {windows: true})"), "filename"),
    0,
  ],
  [
    "untrusted-helper",
    'import {fileURLToPath} from "some-other-url-library";\n' +
      guard(use(filename), "filename"),
    0,
  ],
  ["already-preferred", guard(use("import.meta.dirname")), 0],
  [
    "presence-is-not-a-string-contract",
    imports + `if ("dirname" in import.meta) { ${use(dirname)} }`,
    0,
  ],
  [
    "truthiness-is-not-a-string-contract",
    imports + `if (import.meta.dirname) { ${use(dirname)} }`,
    0,
  ],
  [
    "early-return-not-inferred",
    imports +
      `export const locate = () => { if (typeof import.meta.dirname !== "string") return "missing"; return ${dirname}; };`,
    0,
  ],
  [
    "comment-preserved-report-only",
    imports +
      guard(
        use(
          "path.dirname(/* retained rationale */ fileURLToPath(import.meta.url))"
        )
      ),
    1,
    { noFix: true },
  ],
];

for (const [name, source, expected, options = {}] of cases) {
  test(`module metadata: ${name}`, async () => {
    const root = await fixtureRoot();
    try {
      await writeRuleConfig(root);
      const target = options.target ?? "source.mjs";
      await writeFile(path.join(root, target), source + "\n");
      const before = await runOxlint(root, target);
      assert.equal(before.diagnostics.length, expected, before.stdout);
      assert.ok(
        before.diagnostics.every((diagnostic) => diagnostic.code === ruleCode)
      );
      assert.equal(before.status, expected === 0 ? 0 : 1);
      const fixed = await runOxlint(root, target, true);
      const after = await readFile(path.join(root, target), "utf8");
      if (expected === 0 || options.noFix) {
        assert.equal(
          after,
          source + "\n",
          "portable/fallback/boundary source must stay intact"
        );
        assert.equal(fixed.status, expected === 0 ? 0 : 1);
      } else {
        assert.notEqual(after, source + "\n");
        assert.equal(fixed.status, 0, fixed.stdout);
        assert.equal(fixed.diagnostics.length, 0, fixed.stdout);
        assert.match(after, /import\.meta\.(?:dirname|filename)/u);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

// Give the type-aware preset a small Node API surface without depending on a
// consumer's @types/node installation. Runtime tests below use the actual Node
// builtins, not these declarations.
const nodeApiDeclarations = `declare module "node:path" {
  const path: {dirname(value: string): string};
  export default path;
}
declare module "node:url" {
  export function fileURLToPath(value: string | URL): string;
}
interface ImportMeta {url: string; dirname?: string; filename?: string;}
`;

const presetEntries = [
  ["core", core],
  ["react", react],
  ["next", next],
  ["playwright", playwright],
];

for (const [name, preset] of presetEntries) {
  test(`${name} inherits the supported metadata rule and keeps portable resolution valid`, async () => {
    const rules = resolvedRules(preset);
    assert.equal(rules[ruleName], "error");
    assert.equal(rules[nativeRuleName], "off");
    const root = await fixtureRoot();
    try {
      const presetUrl = pathToFileURL(
        path.join(repoRoot, "oxlint", `${name}.mjs`)
      ).href;
      await writeFile(
        path.join(root, "oxlint.config.mjs"),
        `import preset from ${JSON.stringify(presetUrl)};\nexport default {extends: [preset]};\n`
      );
      await writeFile(path.join(root, "node-api.d.ts"), nodeApiDeclarations);
      await writeFile(
        path.join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            allowJs: true,
            checkJs: true,
            strict: true,
            noEmit: true,
            target: "ES2023",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            lib: ["ES2023", "DOM"],
            types: [],
          },
          files: ["node-api.d.ts", "source.mjs"],
        })
      );
      const source =
        imports +
        `export const portable = ${dirname};\nexport const nativePreferred = import.meta.dirname ?? ${dirname};\n`;
      await writeFile(path.join(root, "source.mjs"), source);
      const portable = await runOxlint(root, "source.mjs");
      assert.equal(portable.status, 0, portable.stdout + portable.stderr);
      assert.equal(portable.diagnostics.length, 0);

      await writeFile(
        path.join(root, "source.mjs"),
        imports + guard(use(dirname)) + "\n"
      );
      const guarded = await runOxlint(root, "source.mjs");
      assert.equal(
        guarded.diagnostics.filter((diagnostic) => diagnostic.code === ruleCode)
          .length,
        1,
        guarded.stdout
      );
      assert.equal(
        guarded.diagnostics.filter(
          (diagnostic) => diagnostic.code === nativeRuleCode
        ).length,
        0,
        guarded.stdout
      );
      // The capability refinement does not cut the independent typeof policy.
      assert.equal(
        guarded.diagnostics.filter(
          (diagnostic) => diagnostic.code === "anti-slop(no-runtime-typeof)"
        ).length,
        1,
        guarded.stdout
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

const evaluateSource = async (root, target, flags = []) => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      ...flags,
      "--input-type=module",
      "--eval",
      'import {pathToFileURL} from "node:url"; const module = await import(pathToFileURL(process.argv[1])); console.log(JSON.stringify(module.getLocation()));',
      path.join(root, target),
    ],
    { cwd: root }
  );
  return JSON.parse(stdout);
};

test("metadata writes through patterns and loop targets retain runtime results", async () => {
  const root = await fixtureRoot();
  try {
    await writeRuleConfig(root);
    const target = "mutated.mjs";
    for (const [name, write] of metadataWrites) {
      const source =
        imports +
        `export const getLocation = () => {
  if (typeof import.meta.filename === "string") {
    ${write}
    return fileURLToPath(import.meta.url);
  }
  return "unavailable";
};\n`;
      await writeFile(path.join(root, target), source);
      const original = await evaluateSource(root, target);
      assert.equal(original, path.join(root, target), name);
      const fixed = await runOxlint(root, target, true);
      assert.equal(fixed.status, 0, `${name}: ${fixed.stdout}`);
      assert.equal(fixed.diagnostics.length, 0, name);
      assert.equal(
        await readFile(path.join(root, target), "utf8"),
        source,
        name
      );
      assert.equal(await evaluateSource(root, target), original, name);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const [name, mutation, expression, property, expected] of mutationRoutes) {
  test(`metadata fixes retain mutation through ${name}`, async () => {
    const root = await fixtureRoot();
    try {
      await writeRuleConfig(root);
      const target = "mutation-route.mjs";
      const source =
        imports +
        `${mutation}\nexport const getLocation = () => { ${guard(`return ${expression};`, property)} };\n`;
      await writeFile(path.join(root, target), source);
      const original = await evaluateSource(root, target);
      assert.equal(original, expected);
      const fixed = await runOxlint(root, target, true);
      assert.equal(fixed.status, 0, fixed.stdout);
      assert.equal(fixed.diagnostics.length, 0);
      assert.equal(await readFile(path.join(root, target), "utf8"), source);
      assert.equal(await evaluateSource(root, target), original);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("metadata fixes preserve alias initialization failures and caught results", async () => {
  const root = await fixtureRoot();
  try {
    await writeRuleConfig(root);
    const target = "initialization.mjs";
    for (const [name, body, insideFunction] of uninitializedAliases) {
      const runBody = insideFunction
        ? `function run() { ${body} }\ntry { observed = run(); } catch (error) { observed = error.name; }`
        : body.replace(
            "run();",
            "try { observed = run(); } catch (error) { observed = error.name; }"
          );
      const source =
        imports +
        `let observed;\n${runBody}\nexport const getLocation = () => observed;\n`;
      await writeFile(path.join(root, target), source);
      const original = await evaluateSource(root, target);
      assert.equal(original, "ReferenceError", name);
      const fixed = await runOxlint(root, target, true);
      assert.equal(fixed.status, 0, `${name}: ${fixed.stdout}`);
      assert.equal(fixed.diagnostics.length, 0, name);
      assert.equal(
        await readFile(path.join(root, target), "utf8"),
        source,
        name
      );
      assert.equal(await evaluateSource(root, target), original, name);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("proven local aliases retain supported fixes and native runtime results", async () => {
  const root = await fixtureRoot();
  try {
    await writeRuleConfig(root);
    const target = "initialized.mjs";
    for (const [name, body] of [
      [
        "function-local",
        `const directory = path.dirname; ${guard(`return directory(${filename});`)}`,
      ],
      [
        "same-switch-case",
        `switch ("read") { case "read": const directory = path.dirname; ${guard(`return directory(${filename});`)} }`,
      ],
      [
        "same-declaration-list",
        `const directory = path.dirname, value = typeof import.meta.dirname === "string" ? directory(${filename}) : "missing"; return value;`,
      ],
    ]) {
      const source =
        imports + `export const getLocation = () => { ${body} };\n`;
      await writeFile(path.join(root, target), source);
      const original = await evaluateSource(root, target);
      assert.equal(original, root, name);
      const before = await runOxlint(root, target);
      assert.equal(before.diagnostics.length, 1, `${name}: ${before.stdout}`);
      const fixed = await runOxlint(root, target, true);
      assert.equal(fixed.status, 0, `${name}: ${fixed.stdout}`);
      assert.equal(fixed.diagnostics.length, 0, name);
      assert.notEqual(
        await readFile(path.join(root, target), "utf8"),
        source,
        name
      );
      assert.equal(await evaluateSource(root, target), original, name);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// Model another host that exposes import.meta.url but may omit either native
// path property. This built-in VM test runs in CI without Next or webpack.
const hostProbe = `import vm from "node:vm";
import path from "node:path";
import * as url from "node:url";
import {readFile} from "node:fs/promises";
const filename = process.argv[1];
const support = process.argv[2];
const context = vm.createContext({URL});
const paths = new vm.SyntheticModule(["default"], function () {this.setExport("default", path);}, {context});
const urls = new vm.SyntheticModule(["fileURLToPath"], function () {this.setExport("fileURLToPath", url.fileURLToPath);}, {context});
const module = new vm.SourceTextModule(await readFile(filename, "utf8"), {
  context,
  identifier: url.pathToFileURL(filename).href,
  initializeImportMeta(meta) {
    meta.url = url.pathToFileURL(filename).href;
    if (support.includes("d")) meta.dirname = path.dirname(filename);
    if (support.includes("f")) meta.filename = filename;
  },
});
await module.link((specifier) => specifier === "node:path" ? paths : urls);
await module.evaluate();
console.log(JSON.stringify(module.namespace.getLocation()));
`;

async function evaluateHost(root, target, support) {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      "--experimental-vm-modules",
      "--input-type=module",
      "--eval",
      hostProbe,
      path.join(root, target),
      support,
    ],
    { cwd: root }
  );
  return JSON.parse(stdout);
}

test("metadata fixes preserve native and missing-property host behavior, including directory separators", async () => {
  const root = await fixtureRoot();
  try {
    await writeRuleConfig(root);
    const target = "location.mjs";
    const source =
      imports +
      `export const getLocation = () => {
  if (typeof import.meta.dirname === "string" && typeof import.meta.filename === "string") {
    return {dirname: ${dirname}, filename: ${filename}, directory: fileURLToPath(new URL(".", import.meta.url))};
  }
  return {dirname: ${dirname}, filename: ${filename}, directory: fileURLToPath(new URL(".", import.meta.url))};
};\n`;
    await writeFile(path.join(root, target), source);
    const originalNative = await evaluateSource(root, target);
    const originalHosts = {};
    for (const support of ["", "d", "f", "df"])
      originalHosts[support] = await evaluateHost(root, target, support);
    const before = await runOxlint(root, target);
    assert.equal(before.diagnostics.length, 2, before.stdout);
    const fixed = await runOxlint(root, target, true);
    assert.equal(fixed.status, 0, fixed.stdout);
    const afterSource = await readFile(path.join(root, target), "utf8");
    assert.match(
      afterSource,
      /dirname: import\.meta\.dirname, filename: import\.meta\.filename/u
    );
    assert.ok(
      afterSource.includes(
        `return {dirname: ${dirname}, filename: ${filename}, directory: fileURLToPath(new URL(".", import.meta.url))};`
      ),
      "fallback source must remain portable"
    );
    assert.equal(
      afterSource.split('fileURLToPath(new URL(".", import.meta.url))').length,
      3,
      "both directory-URL strings must remain intact"
    );
    assert.deepEqual(await evaluateSource(root, target), originalNative);
    for (const support of ["", "d", "f", "df"]) {
      assert.deepEqual(
        await evaluateHost(root, target, support),
        originalHosts[support]
      );
      assert.deepEqual(originalHosts[support], originalNative);
    }
    assert.equal(originalNative.directory, originalNative.dirname + path.sep);
    assert.ok(originalNative.filename.includes("howells module metadata "));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
