import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { resolvePackageBin } from "../bin/run-package-bin.mjs";

const execute = promisify(execFile);
const policyRoot = fileURLToPath(new URL("..", import.meta.url));
const candidatePlugin = path.join(
  policyRoot,
  "oxlint/howells-policy-plugin.mjs"
);
const binary = path.join(policyRoot, "node_modules/.bin/oxlint");
const root = await mkdtemp(
  path.join(realpathSync(tmpdir()), "augmentation-semantics-")
);
const environment = {
  ...process.env,
  OXLINT_TSGOLINT_PATH: resolvePackageBin("oxlint-tsgolint", "tsgolint"),
};
const customRule = "howells(consistent-type-definitions)";
const nativeRule = "typescript(consistent-type-definitions)";

const contracts = `declare module "css-contract" {
  export interface CSSProperties { color?: string; }
}
declare module "table-contract" {
  export interface RowData {}
  export type TableFeatures = object;
  export interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue> { base?: TValue; }
}
`;

const portableCases = [
  {
    id: "css-module-merge",
    source: `import type { CSSProperties } from "css-contract";
declare module "css-contract" {
  interface CSSProperties { [name: \`--\${string}\`]: string | number | undefined; }
}
export const declaration: CSSProperties = { color: "red", "--gap": 12 };
`,
    nativeChanges: true,
  },
  {
    id: "generic-table-module-merge",
    source: `import type { RowData, TableFeatures, ColumnMeta } from "table-contract";
declare module "table-contract" {
  interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue> { align?: "left" | "right"; }
}
export const metadata: ColumnMeta<{}, { id: string }, string> = { base: "header", align: "right" };
export const alignment: "left" | "right" | undefined = metadata.align;
`,
    nativeChanges: true,
  },
  {
    id: "dom-window-global-merge",
    source: `export {};
declare global { interface Window { openai?: { toolOutput?: string }; } }
export const output: string | undefined = window.openai?.toolOutput;
export const title: string = window.document.title;
`,
    nativeChanges: false,
  },
];

async function run(
  project,
  sourceName,
  kind,
  { fix = false, typecheck = false, mode = "type" } = {}
) {
  const config = {
    categories: { correctness: "off" },
    plugins: ["typescript"],
    rules:
      kind === "compiler"
        ? {}
        : {
            [kind === "native"
              ? "typescript/consistent-type-definitions"
              : "howells/consistent-type-definitions"]: ["error", mode],
          },
  };
  if (kind === "replacement")
    config.jsPlugins = [{ name: "howells", specifier: candidatePlugin }];
  const configPath = path.join(project, `${kind}-lint.json`);
  await writeFile(configPath, JSON.stringify(config));
  const args = [
    "--config",
    configPath,
    "--format",
    "json",
    ...(fix ? ["--fix"] : []),
    ...(typecheck
      ? [
          "--type-aware",
          "--type-check",
          "--tsconfig",
          path.join(project, "tsconfig.json"),
        ]
      : []),
    path.join(project, sourceName),
  ];
  let response;
  try {
    response = {
      status: 0,
      ...(await execute(binary, args, {
        cwd: project,
        env: environment,
        maxBuffer: 5_000_000,
      })),
    };
  } catch (error) {
    response = {
      status: error.code,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
  const report = JSON.parse(response.stdout);
  const diagnostics = report.diagnostics ?? report;
  assert.equal(response.stderr, "");
  return {
    command: [binary, ...args],
    status: response.status,
    diagnostics,
    source: await readFile(path.join(project, sourceName), "utf8"),
  };
}

async function projectFor(id, source, options = {}) {
  const project = path.join(root, id);
  await mkdir(project);
  if (options.packageJson)
    await writeFile(
      path.join(project, "package.json"),
      JSON.stringify(options.packageJson)
    );
  await writeFile(
    path.join(project, "contracts.d.ts"),
    options.contracts ?? contracts
  );
  const name = options.name ?? "augment.ts";
  await writeFile(path.join(project, name), source);
  const tsconfig = options.tsconfig ?? {
    compilerOptions: {
      noEmit: true,
      strict: true,
      skipLibCheck: false,
      target: "ES2023",
      module: "ESNext",
      moduleResolution: "Bundler",
      moduleDetection: "legacy",
      lib: ["ES2023", "DOM"],
      types: [],
    },
    files: [name, "contracts.d.ts"],
  };
  tsconfig.files = [
    name,
    ...(options.tsconfig && !options.includeContracts
      ? []
      : ["contracts.d.ts"]),
  ];
  await writeFile(
    path.join(project, "tsconfig.json"),
    JSON.stringify(tsconfig)
  );
  return { project, name };
}

test("explicit module and global augmentation merges remain intact", async () => {
  for (const fixture of portableCases) {
    const { project, name } = await projectFor(fixture.id, fixture.source);
    const originalCompiler = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(
      originalCompiler.status,
      0,
      `${fixture.id}: original must compile`
    );
    assert.equal(originalCompiler.diagnostics.length, 0);
    const native = await run(project, name, "native");
    assert.equal(
      native.diagnostics.filter((item) => item.code === nativeRule).length,
      1
    );
    const replacement = await run(project, name, "replacement", {
      typecheck: true,
      fix: true,
    });
    assert.equal(replacement.status, 0);
    assert.equal(replacement.diagnostics.length, 0);
    assert.equal(
      replacement.source,
      fixture.source,
      "Augmentation fix must leave source byte-for-byte intact"
    );
    const nativeFixed = await run(project, name, "native", { fix: true });
    assert.equal(nativeFixed.source !== fixture.source, fixture.nativeChanges);
    const nativeFixedCompiler = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(nativeFixedCompiler.status, fixture.nativeChanges ? 1 : 0);
    if (fixture.nativeChanges)
      assert.ok(
        nativeFixedCompiler.diagnostics.some(
          (item) => item.code === "typescript(TS2300)"
        )
      );
    const forcedAlias = fixture.source.replace(
      /interface (CSSProperties|ColumnMeta(?:<[^>]+>)?|Window)\s*\{/u,
      "type $1 = {"
    );
    await writeFile(path.join(project, name), forcedAlias);
    const aliasCompiler = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(aliasCompiler.status, 1);
    assert.ok(
      aliasCompiler.diagnostics.some(
        (item) => item.code === "typescript(TS2300)"
      )
    );
  }
});

const extraCases = [
  {
    id: "plain-declaration-interface",
    name: "owned.d.ts",
    source: "interface NewContract { value: string }",
    mode: "type",
    count: 1,
    changes: true,
  },
  {
    id: "new-ambient-module",
    name: "owned.d.ts",
    source:
      'declare module "owned-module" { interface NewContract { value: string } }',
    mode: "type",
    count: 1,
    changes: true,
  },
  {
    id: "owned-namespace",
    name: "owned.ts",
    source:
      "export {}; namespace Owned { export interface NewContract { value: string } }",
    mode: "type",
    count: 1,
    changes: true,
  },
  {
    id: "nested-global-augmentation",
    name: "owned.ts",
    source:
      "export {}; declare global { namespace Owned { interface NewContract { value: string } } }",
    mode: "type",
    count: 0,
    changes: false,
  },
  {
    id: "opposite-interface-mode",
    name: "owned.ts",
    source: "export type NewContract = (({ value: string }));",
    mode: "interface",
    count: 1,
    changes: true,
  },
  {
    id: "ambiguous-ts-module",
    name: "owned.ts",
    source:
      'declare module "owned-module" { interface NewContract { value: string } }',
    mode: "type",
    count: 1,
    changes: false,
  },
  {
    id: "import-meta-augmentation",
    name: "owned.ts",
    source:
      'void import.meta; declare module "css-contract" { interface CSSProperties { extra?: string } }',
    mode: "type",
    count: 0,
    changes: false,
  },
  {
    id: "unicode-offset-interface",
    name: "owned.ts",
    source:
      'export const prefix = "🌳"; export interface NewContract { value: string }',
    mode: "type",
    count: 1,
    changes: true,
  },
  {
    id: "declare-comment-interface",
    name: "owned.d.ts",
    source:
      "export declare /* interface */ interface NewContract { value: string }",
    mode: "type",
    count: 1,
    changes: true,
  },
];

test("ordinary object declaration preferences still report and fix", async () => {
  for (const fixture of extraCases) {
    const { project, name } = await projectFor(fixture.id, fixture.source, {
      name: fixture.name,
    });
    const originalCompiler = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(
      originalCompiler.status,
      0,
      `${fixture.id}: original should compile`
    );
    const replacement = await run(project, name, "replacement", {
      mode: fixture.mode,
    });
    assert.equal(
      replacement.diagnostics.filter((item) => item.code === customRule).length,
      fixture.count
    );
    const fixed = await run(project, name, "replacement", {
      fix: true,
      mode: fixture.mode,
    });
    assert.equal(fixed.source !== fixture.source, fixture.changes);
    const compilerAfter = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(compilerAfter.status, 0);
  }
});

const implicitCases = [
  {
    id: "forced-ts-augmentation",
    name: "owned.ts",
    module: "ESNext",
    detection: "force",
    count: 1,
    changes: false,
  },
  {
    id: "nodenext-package-augmentation",
    name: "owned.ts",
    module: "NodeNext",
    detection: "auto",
    packageJson: { type: "module" },
    count: 1,
    changes: false,
  },
  {
    id: "mts-auto-augmentation",
    name: "owned.mts",
    module: "NodeNext",
    detection: "auto",
    count: 1,
    changes: false,
  },
  {
    id: "cts-auto-augmentation",
    name: "owned.cts",
    module: "NodeNext",
    detection: "auto",
    count: 1,
    changes: false,
  },
  {
    id: "forced-global-augmentation",
    name: "owned.ts",
    module: "ESNext",
    detection: "force",
    source:
      "declare global { interface Window { openai?: { toolOutput?: string } } }\nconst value: string | undefined = window.openai?.toolOutput;",
    count: 1,
    changes: false,
  },
  {
    id: "nodenext-global-augmentation",
    name: "owned.ts",
    module: "NodeNext",
    detection: "auto",
    packageJson: { type: "module" },
    source:
      "declare global { interface Window { openai?: { toolOutput?: string } } }\nconst value: string | undefined = window.openai?.toolOutput;",
    count: 1,
    changes: false,
  },
];
test("implicit module ambiguity remains reported without unsafe fixes", async () => {
  for (const fixture of implicitCases) {
    const source =
      fixture.source ??
      'declare module "css-contract" { interface CSSProperties { extra?: string } }\nconst value: import("css-contract").CSSProperties = { color: "red", extra: "valid" };\n';
    const tsconfig = {
      compilerOptions: {
        noEmit: true,
        strict: true,
        target: "ES2023",
        module: fixture.module,
        moduleDetection: fixture.detection,
        types: [],
        lib: ["ES2023", "DOM"],
      },
    };
    const { project, name } = await projectFor(fixture.id, source, {
      name: fixture.name,
      tsconfig,
      includeContracts: true,
      packageJson: fixture.packageJson,
    });
    const originalCompiler = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(originalCompiler.status, 0);
    const replacement = await run(project, name, "replacement");
    assert.equal(
      replacement.diagnostics.filter((item) => item.code === customRule).length,
      fixture.count
    );
    const fixed = await run(project, name, "replacement", { fix: true });
    assert.equal(
      fixed.source,
      source,
      "Ambiguous module context must not receive an unsafe fix"
    );
    const compilerAfter = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(compilerAfter.status, 0);
  }
});

test("script declaration files retain ordinary ambient preference checks", async () => {
  for (const fixture of [
    { id: "forced-script-declaration", module: "ESNext", detection: "force" },
    {
      id: "nodenext-script-declaration",
      module: "NodeNext",
      detection: "auto",
      packageJson: { type: "module" },
    },
  ]) {
    const source =
      'declare module "owned-module" { interface NewContract { value: string } }';
    const tsconfig = {
      compilerOptions: {
        noEmit: true,
        strict: true,
        target: "ES2023",
        module: fixture.module,
        moduleDetection: fixture.detection,
        types: [],
        lib: ["ES2023"],
      },
    };
    const { project, name } = await projectFor(fixture.id, source, {
      name: "owned.d.ts",
      tsconfig,
      includeContracts: true,
      packageJson: fixture.packageJson,
    });
    const originalCompiler = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(originalCompiler.status, 0);
    const replacement = await run(project, name, "replacement");
    assert.equal(
      replacement.diagnostics.filter((item) => item.code === customRule).length,
      1
    );
    const fixed = await run(project, name, "replacement", { fix: true });
    assert.notEqual(fixed.source, source);
    const compilerAfter = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(compilerAfter.status, 0);
  }
});

test("declaration fixes preserve comments outside copied declaration text", async () => {
  for (const fixture of [
    {
      id: "comment-between-type-and-name",
      source:
        "export type /* caller contract */ RecordValue = { value: string };",
      mode: "interface",
    },
    {
      id: "comment-before-interface-base",
      source:
        "export interface Base { value: string }\nexport interface RecordValue extends /* public base */ Base { extra: number }",
      mode: "type",
    },
    {
      id: "comment-between-default-export-keywords",
      source:
        "export /* public default */ default interface RecordValue { value: string }",
      mode: "type",
    },
  ]) {
    const { project, name } = await projectFor(fixture.id, fixture.source);
    const compiler = await run(project, name, "compiler", { typecheck: true });
    assert.equal(compiler.status, 0);
    const original = await run(project, name, "replacement", {
      mode: fixture.mode,
    });
    assert.ok(original.diagnostics.some((item) => item.code === customRule));
    const fixed = await run(project, name, "replacement", {
      fix: true,
      mode: fixture.mode,
    });
    assert.ok(
      fixed.source.includes(fixture.source.match(/\/\*.*?\*\//u)[0]),
      `${fixture.id}: autofix must retain the comment`
    );
    assert.ok(fixed.diagnostics.some((item) => item.code === customRule));
    const compilerAfter = await run(project, name, "compiler", {
      typecheck: true,
    });
    assert.equal(compilerAfter.status, 0);
  }
});

after(async () => {
  await rm(root, { recursive: true, force: true });
});
