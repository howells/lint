import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import core from "../oxlint/core.mjs";
import gdp from "../oxlint/gdp.mjs";
import next from "../oxlint/next.mjs";
import playwright from "../oxlint/playwright.mjs";
import react from "../oxlint/react.mjs";
import shadcn from "../oxlint/shadcn.mjs";
import {
  corePresetUrl,
  diagnosticsForRule,
  execFileAsync,
  gdpPresetUrl,
  makeFixtureRoot,
  nextPresetUrl,
  oxlintBin,
  playwrightPresetUrl,
  reactPresetUrl,
  resolvedJsPluginNames,
  resolvedRules,
  ruleNamesWithPrefix,
  runOxlint,
  tsgolintPath,
  writeFixture,
  writeTypedFixtureConfig,
} from "./preset-harness.mjs";

test("core preset enables type-aware linting", async () => {
  assert.equal(core.options?.typeAware, true);
});

test("core enables GDP by default and rejects proof creation and assertions outside trusted modules", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import core from "${corePresetUrl}";\nexport default { extends: [core] };\n`
    );
    await writeFixture(
      root,
      "src/forged.ts",
      [
        'import { defineProof } from "@gdp-ts/core";',
        'import type { Proof } from "@gdp-ts/core";',
        "",
        'export const prover = defineProof("UserIsProjectAdmin");',
        'export const forged = {} as Proof<"UserIsProjectAdmin", []>;',
        'export const assertion = "alice" as string;',
        'export const constant = "alice" as const;',
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    assert.equal(result.status, 1);
    assert.equal(
      diagnosticsForRule(result.stdout, "gdp-ts(no-define-proof)").length,
      1
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "gdp-ts(no-proof-assertion)").length,
      1
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "gdp-ts(no-type-assertion)").length,
      2
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

for (const [name, presetUrl] of [
  ["React", reactPresetUrl],
  ["Next", nextPresetUrl],
  ["Playwright", playwrightPresetUrl],
]) {
  test(`${name} inherits GDP's assertion ban without an extra preset`, async () => {
    const root = await makeFixtureRoot();

    try {
      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import preset from "${presetUrl}";\nexport default { extends: [preset] };\n`
      );
      await writeFixture(
        root,
        "src/assertion.ts",
        'export const assertion = (value: string | number): string => value as string;\nexport const constant = "alice" as const;\n'
      );
      const result = await runOxlint(root);
      assert.equal(result.status, 1);
      assert.equal(
        diagnosticsForRule(result.stdout, "gdp-ts(no-type-assertion)").length,
        1
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
}

test("GDP trusted modules may mint proofs but cannot export the prover", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import core from "${corePresetUrl}";\nexport default { extends: [core] };\n`
    );
    const trustedSource = [
      'import { defineProof } from "@gdp-ts/core";',
      'import type { Named, Proof } from "@gdp-ts/core";',
      "",
      'const prover = defineProof("UserIsProjectAdmin");',
      "",
      "export interface UserIsProjectAdmin<U, P>",
      '  extends Proof<"UserIsProjectAdmin", [U, P]> {}',
      "",
      "export const checkProjectAdmin = <U, P>(",
      "  user: Named<U, string>,",
      "  project: Named<P, string>",
      "): UserIsProjectAdmin<U, P> | null =>",
      '  user.value === "alice" && project.value === "demo"',
      "    ? prover.prove(user, project)",
      "    : null;",
      "",
    ].join("\n");
    await writeFixture(root, "src/proofs/project-admin.ts", trustedSource);

    const accepted = await runOxlint(root);
    assert.equal(accepted.status, 0, `${accepted.stdout}${accepted.stderr}`);

    await writeFixture(
      root,
      "src/proofs/project-admin.ts",
      `${trustedSource}export { prover };\n`
    );
    const rejected = await runOxlint(root);
    assert.equal(rejected.status, 1);
    assert.equal(
      diagnosticsForRule(rejected.stdout, "gdp-ts(no-exported-prover)").length,
      1
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("GDP branded-ID exception permits ID assertions but still rejects forged proofs", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import gdp from "${gdpPresetUrl}";\nexport default { extends: [gdp] };\n`
    );
    const idsSource = [
      'import type { Proof } from "@gdp-ts/core";',
      'export type UserId = string & { readonly brand: "UserId" };',
      "export const userId = (value: string): UserId => value as UserId;",
      "",
    ].join("\n");
    await writeFixture(root, "src/lib/ids.ts", idsSource);
    const accepted = await runOxlint(root);
    assert.equal(accepted.status, 0, `${accepted.stdout}${accepted.stderr}`);

    await writeFixture(
      root,
      "src/lib/ids.ts",
      `${idsSource}export const forged = {} as Proof<"UserIsProjectAdmin", []>;\n`
    );
    const rejected = await runOxlint(root);
    assert.equal(rejected.status, 1);
    assert.equal(
      diagnosticsForRule(rejected.stdout, "gdp-ts(no-proof-assertion)").length,
      1
    );
    assert.equal(
      diagnosticsForRule(rejected.stdout, "gdp-ts(no-type-assertion)").length,
      0
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("tsgolint executable resolves from this package's dependency tree", () => {
  // The binaries pass this path to Oxlint via OXLINT_TSGOLINT_PATH so type-aware
  // mode works even when a consumer runs from a directory where tsgolint is not
  // on the cwd-relative `node_modules/.bin` search path.
  assert.ok(
    existsSync(tsgolintPath),
    `expected tsgolint to exist at ${tsgolintPath}`
  );
});

test("core preset rejects app imports across workspace boundaries", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    await writeFixture(root, "apps/web/nav.ts", "export const nav = 1;\n");
    await writeFixture(
      root,
      "apps/web/local.ts",
      'import { nav } from "./nav";\nexport const local = nav;\n'
    );
    await writeFixture(
      root,
      "apps/admin/page.ts",
      'import { nav } from "../web/nav";\nexport const page = nav;\n'
    );
    await writeFixture(
      root,
      "packages/ui/index.ts",
      'import { nav } from "../../apps/web/nav";\nexport const ui = nav;\n'
    );
    await writeFixture(
      root,
      "packages/design/index.ts",
      'import { ui } from "../ui";\nexport const design = ui;\n'
    );

    const result = await runOxlint(root, ["apps", "packages"]);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-cross-workspace-app-imports)"
    );
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    assert.equal(ruleDiagnostics.length, 2);
    assert.match(ruleOutput, /packages\/ui\/index\.ts/);
    assert.match(ruleOutput, /Packages must not import from apps/);
    assert.match(ruleOutput, /apps\/admin\/page\.ts/);
    assert.match(ruleOutput, /Apps must not import from other apps/);
    assert.doesNotMatch(ruleOutput, /apps\/web\/local\.ts/);
    assert.doesNotMatch(ruleOutput, /packages\/design\/index\.ts/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("core preset rejects runtime dynamic imports", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    await writeFixture(
      root,
      "src/loader.ts",
      'import { staticValue } from "./static-value";\n\nexport async function loadKnownPackage() {\n  return import("heavy-package");\n}\n\nexport async function loadNamedPackage(packageName: string) {\n  return import(packageName);\n}\n\nexport const value = staticValue;\n'
    );
    await writeFixture(
      root,
      "src/static-value.ts",
      "export const staticValue = 1;\n"
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-runtime-dynamic-imports)"
    );
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    assert.equal(ruleDiagnostics.length, 2);
    assert.match(ruleOutput, /loader\.ts/);
    assert.match(ruleOutput, /"line":4/);
    assert.match(ruleOutput, /"line":8/);
    assert.match(ruleOutput, /Use a static import instead/);
    assert.doesNotMatch(ruleOutput, /static-value/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("core preset requires a reason on every disable comment", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    await writeFixture(
      root,
      "src/disables.ts",
      [
        "// oxlint-disable-next-line no-console",
        'console.log("bare");',
        "// oxlint-disable-next-line no-console --",
        'console.log("empty");',
        "// oxlint-disable-next-line no-console -- the CLI prints its report.",
        'console.log("reasoned");',
        "export {};",
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    const ruleOutput = JSON.stringify(
      diagnosticsForRule(result.stdout, "howells(require-disable-reason)")
    );

    assert.match(ruleOutput, /"line":1/);
    assert.match(ruleOutput, /"line":3/);
    assert.doesNotMatch(ruleOutput, /"line":5/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// `vitest/prefer-import-in-mock` demands that the module named in `vi.mock` be
// written as `import("./dep")` so the factory's `importOriginal()` is typed,
// and `howells/no-runtime-dynamic-imports` reports every import expression.
// Before 3.3.5 that made a `vi.mock` call report under one rule or the other
// whichever way it was written, and neither report was clearable — 1,013 of
// them across the fleet. The core preset now scopes the dynamic-import ban off
// for test files, so the fixture below is the form `prefer-import-in-mock`
// asks for and neither rule has anything to say about it.
test("core preset lets a test file mock through a dynamic import", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    await writeFixture(root, "src/dep.ts", "export const value = 1;\n");
    await writeFixture(
      root,
      "src/dep.test.ts",
      'import { describe, expect, test, vi } from "vitest";\n\nvi.mock(import("./dep"), async (importOriginal) => {\n  const actual = await importOriginal();\n  return { ...actual, value: 2 };\n});\n\ndescribe("dep", () => {\n  test("mocks", () => {\n    expect(1).toBe(1);\n  });\n});\n'
    );

    const result = await runOxlint(root);
    const stdout = result.stdout ?? "[]";

    assert.deepEqual(
      diagnosticsForRule(stdout, "howells(no-runtime-dynamic-imports)"),
      []
    );
    assert.deepEqual(
      diagnosticsForRule(stdout, "vitest(prefer-import-in-mock)"),
      []
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("core preset lets promise-typed stubs be async without awaiting", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    // `typescript/promise-function-async` forces `async` onto every
    // promise-returning function; core `require-await` would then reject this
    // stub — the only lawful implementation of its promise-typed signature.
    // The preset keeps the typed rule and turns the untyped one off.
    await writeFixture(
      root,
      "src/passthrough.ts",
      "export const passthrough: (items: string[]) => Promise<string[]> = async (items) => items;\n"
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "eslint(require-await)"
    );

    assert.equal(ruleDiagnostics.length, 0);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

for (const [name, presetUrl] of [
  ["Core", corePresetUrl],
  ["React", reactPresetUrl],
  ["Next", nextPresetUrl],
  ["Playwright", playwrightPresetUrl],
]) {
  test(`${name} permits callback Promise bridges while rejecting async executors`, async () => {
    const root = await makeFixtureRoot();
    try {
      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import preset from "${presetUrl}";\nexport default { extends: [preset] };\n`
      );
      await writeFixture(
        root,
        "src/callback.ts",
        "export const wait = async (): Promise<void> => { await new Promise<void>((resolve) => { setTimeout(resolve, 10); }); };\n"
      );
      await writeFixture(
        root,
        "src/unsafe.ts",
        "export const unsafe = async (): Promise<void> => { await new Promise<void>(async (resolve) => { await Promise.resolve(); resolve(); }); };\n"
      );
      await writeFixture(
        root,
        "src/returned.ts",
        "export const returned = async (): Promise<void> => { await new Promise<void>((resolve) => { resolve(); return 1; }); };\n"
      );
      const result = await runOxlint(root);
      assert.equal(result.status, 1, result.stdout);
      assert.equal(
        JSON.parse(result.stdout).diagnostics.filter((finding) =>
          finding.filename.endsWith("callback.ts")
        ).length,
        0,
        result.stdout
      );
      assert.equal(
        diagnosticsForRule(result.stdout, "promise(avoid-new)").length,
        0,
        result.stdout
      );
      assert.equal(
        diagnosticsForRule(result.stdout, "eslint(no-async-promise-executor)")
          .length,
        1,
        result.stdout
      );
      assert.equal(
        diagnosticsForRule(result.stdout, "eslint(no-promise-executor-return)")
          .length,
        1,
        result.stdout
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
}

test("core preset lets a hash use its bitwise operators", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    // FNV-1a is defined by XOR folding and an unsigned 32-bit result; there is
    // no non-bitwise way to write it. TypeScript already rejects `&` and `|`
    // between booleans (TS2447), which is the mistake `no-bitwise` guards.
    await writeFixture(
      root,
      "src/fnv1a.ts",
      "export const fnv1a = (value: string): number => {\n  let hash = 0x81_1c_9d_c5;\n  for (const char of value) {\n    hash ^= char.codePointAt(0) ?? 0;\n    hash = Math.imul(hash, 0x01_00_01_93) >>> 0;\n  }\n  return hash;\n};\n"
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "eslint(no-bitwise)"
    );

    assert.equal(ruleDiagnostics.length, 0);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("core lane no longer loads SonarJS function naming", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    // No JSX here, so PascalCase carries no framework meaning and the strict
    // default is right. This is what stops the React widening leaking into
    // Node packages.
    await writeFixture(
      root,
      "src/thing.ts",
      "export function Widget() {\n  return 1;\n}\n"
    );

    const result = await runOxlint(root);

    assert.deepEqual(
      diagnosticsForRule(result.stdout, "sonarjs(function-name)"),
      []
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("core preset carries anti-slop and the Vitest rules", () => {
  const rules = resolvedRules(core);

  assert.equal(
    rules["anti-slop/require-safety-comment-for-type-assertion"],
    "error"
  );
  assert.equal(rules["anti-slop/no-unknown-parameters"], "error");

  // Anti-slop must be extended after Ultracite's core preset: these two rules
  // deadlock against `anti-slop/no-known-value-widening`, so the "off" has to
  // be the one that survives.
  assert.equal(rules["typescript/consistent-indexed-object-style"], "off");
  assert.equal(rules["unicorn/no-immediate-mutation"], "off");

  // Ultracite scopes the Vitest rules to test files through an override, so
  // they do not appear in the flattened top-level rule set.
  const vitestOverrides = (core.extends ?? []).flatMap(
    (preset) => preset.overrides ?? []
  );
  const vitestRules = vitestOverrides.flatMap((override) =>
    Object.keys(override.rules ?? {}).filter((ruleName) =>
      ruleName.startsWith("vitest/")
    )
  );

  assert.ok(vitestRules.includes("vitest/no-focused-tests"));
  assert.ok(vitestRules.length > 40);
});

// RUL-251. `vitest/prefer-to-be-truthy` and `vitest/prefer-to-be-falsy` carry
// autofixes that change what a test asserts: `toBe(true)` fails on "yes" and on
// 1, `toBeTruthy()` passes both. Because `howells-fix` runs from a pre-commit
// hook in every consumer, the rewrite lands in a commit nobody reviewed — 276
// assertions in colorscope, 121 in motif, one of which broke an env test.
//
// This asserts the fixer's output, not the rule table, because severity does
// not stop a fix: motif had both rules at "warn" and its tests were rewritten
// anyway. Whatever a later Ultracite bump does to the defaults, the only
// question that matters is whether a `toBe(true)` survives the fixer.
test("the fixer leaves an exact boolean assertion alone", async () => {
  const root = await makeFixtureRoot();
  const source =
    'import { expect, test } from "vitest";\n\nconst isEnabled = (): boolean => true;\n\ntest("strict boolean contract", () => {\n  expect(isEnabled()).toBe(true);\n  expect(isEnabled()).toBe(false);\n});\n';

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    await writeFixture(root, "src/contract.test.ts", source);

    await execFileAsync(
      oxlintBin,
      [
        "--config",
        path.join(root, "oxlint.config.mjs"),
        "--fix",
        path.join(root, "src"),
      ],
      { cwd: root, env: { ...process.env, OXLINT_TSGOLINT_PATH: tsgolintPath } }
    ).catch((error) => error);

    const fixed = await readFile(
      path.join(root, "src/contract.test.ts"),
      "utf8"
    );

    assert.match(fixed, /toBe\(true\)/u);
    assert.match(fixed, /toBe\(false\)/u);
    assert.doesNotMatch(fixed, /toBeTruthy|toBeFalsy/u);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("core preset reports anti-slop and Vitest findings on real files", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`
    );
    await writeFixture(
      root,
      "src/parse.ts",
      "export const parse = (input: string) => JSON.parse(input) as { id: string };\n"
    );
    await writeFixture(
      root,
      "src/parse.test.ts",
      'import { describe, expect, it } from "vitest";\n\nimport { parse } from "./parse";\n\ndescribe("parse", () => {\n  it.only("reads an id", () => {\n    expect(parse(\'{"id":"a"}\')).toBeTruthy();\n  });\n});\n'
    );

    const result = await runOxlint(root);

    assert.equal(
      diagnosticsForRule(
        result.stdout,
        "anti-slop(require-safety-comment-for-type-assertion)"
      ).length,
      1
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "vitest(no-focused-tests)").length,
      1
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// RUL-244. Ultracite scopes its Vitest rules to `*.test.*`, `*.spec.*` and
// `__tests__` through an override, and a Playwright spec matches. The rules
// then lint against a runner that is not there:
// `vitest/prefer-importing-vitest-globals` matches the names `expect` and
// `test` rather than the import source, and `vitest/consistent-test-filename`
// demands the rename that Playwright's own project matching forbids. Neither
// is fixable at the call site, so the overlay owes the lane the exemption
// rather than leaving each consumer to write suppressions.

const MANIFEST_READING_RULES = [
  "sonarjs/no-default-utility-imports",
  "sonarjs/no-forced-browser-interaction",
  "sonarjs/no-implicit-dependencies",
  "sonarjs/no-skipped-tests",
  "sonarjs/prefer-specific-assertions",
  "sonarjs/stable-tests",
];

test("no preset loads a manifest-reading plugin", () => {
  for (const [name, preset] of [
    ["core", core],
    ["gdp", gdp],
    ["next", next],
    ["playwright", playwright],
    ["react", react],
    ["shadcn", shadcn],
  ]) {
    assert.ok(
      !resolvedJsPluginNames(preset).includes("sonarjs"),
      `${name} preset loads the sonarjs plugin`
    );
    assert.deepEqual(
      ruleNamesWithPrefix(preset, "sonarjs/"),
      [],
      `${name} preset enables sonarjs rules`
    );
    const resolved = resolvedRules(preset);
    for (const rule of MANIFEST_READING_RULES) {
      assert.ok(
        !(rule in resolved),
        `${name} preset enables ${rule}, which reads a dependency manifest`
      );
    }
  }
});

test("linting a catalogued workspace writes no dependency-resolution noise", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `export { default } from ${JSON.stringify(reactPresetUrl)};\n`
    );
    // The shape that produced the noise: a `catalog:` reference with no entry
    // for it in the catalog, which is what the resolver reported on.
    await writeFile(
      path.join(root, "package.json"),
      `${JSON.stringify(
        {
          name: "catalogued-fixture",
          private: true,
          type: "module",
          dependencies: { cn: "catalog:", react: "catalog:" },
          devDependencies: { oxlint: "catalog:tooling" },
        },
        null,
        2
      )}\n`
    );
    await writeFile(
      path.join(root, "pnpm-workspace.yaml"),
      'packages:\n  - "packages/*"\n\ncatalog:\n  zod: 4.1.13\n\ncatalogs:\n  tooling:\n    oxfmt: 0.67.0\n'
    );
    await writeFixture(
      root,
      "src/panel.tsx",
      "export const Panel = () => <div>hi</div>;\n"
    );

    const result = await runOxlint(root);
    // The resolver wrote through `console.debug`, which is stdout, so a JSON run
    // came back with those lines interleaved in the report as well. Both
    // channels are asserted, and the report still has to parse.
    const output = `${result.stdout}\n${result.stderr ?? ""}`;

    assert.doesNotMatch(output, /could not be resolved for catalog/u);
    assert.doesNotMatch(output, /catalog/iu);
    assert.doesNotThrow(() => JSON.parse(result.stdout));
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// These fixtures exercise the pinned binary, including controls with each option
// removed. Oxlint silently ignores unknown rule options, so shape checks alone
// cannot establish that a shared preset changes lint behaviour.
test("switch options reject redundant defaults and require open-type defaults independently", async () => {
  const root = await makeFixtureRoot();
  try {
    await writeTypedFixtureConfig(
      root,
      `import core from "${corePresetUrl}"; export default { extends: [core] };`
    );
    const sources = {
      "union.ts": [
        'export const choose = (value: "a" | "b"): number => {',
        "  let result = 0;",
        "",
        "  switch (value) {",
        '    case "a": {',
        "      result = 1;",
        "      break;",
        "    }",
        "",
        '    case "b": {',
        "      result = 2;",
        "      break;",
        "    }",
        "  }",
        "",
        "  return result;",
        "};",
        "",
      ].join("\n"),
      "redundant-default.ts":
        'export const choose = (value: "a" | "b"): number => { switch (value) { case "a": { return 1; } case "b": { return 2; } default: { return 3; } } };',
      "missing-union.ts":
        'export const choose = (value: "a" | "b"): number => { switch (value) { case "a": { return 1; } } return 0; };',
      "open.ts":
        'export const choose = (value: string): number => { switch (value) { case "a": { return 1; } } return 0; };',
      "open-default.ts": [
        "export const choose = (value: string): number => {",
        "  switch (value) {",
        '    case "a": {',
        "      return 1;",
        "    }",
        "",
        "    default: {",
        "      return 0;",
        "    }",
        "  }",
        "};",
        "",
      ].join("\n"),
      "useless-case.ts":
        'export const choose = (value: string): number => { switch (value) { case "a": default: { return 0; } } };',
    };
    for (const [name, source] of Object.entries(sources)) {
      await writeFixture(root, `src/${name}`, source);
    }
    const code = "typescript(switch-exhaustiveness-check)";
    const result = await runOxlint(root);
    const findings = diagnosticsForRule(result.stdout, code);
    assert.equal(findings.length, 3, result.stdout);
    for (const name of [
      "redundant-default.ts",
      "missing-union.ts",
      "open.ts",
    ]) {
      assert.ok(
        findings.some((finding) => finding.filename.endsWith(name)),
        result.stdout
      );
    }
    assert.equal(
      diagnosticsForRule(result.stdout, "eslint(default-case)").length,
      0
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "unicorn(no-useless-switch-case)")
        .length,
      1
    );
    const accepted = await runOxlint(root, [
      "src/union.ts",
      "src/open-default.ts",
    ]);
    assert.equal(accepted.status, 0, `${accepted.stdout}${accepted.stderr}`);
    for (const [option, target] of [
      ["allowDefaultCaseForExhaustiveSwitch", "redundant-default.ts"],
      ["requireDefaultForNonUnion", "open.ts"],
    ]) {
      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import core from "${corePresetUrl}";
const [severity, options] = core.rules["typescript/switch-exhaustiveness-check"];
const { ${option}: removed, ...rest } = options;
export default { extends: [core], rules: { "typescript/switch-exhaustiveness-check": [severity, rest] } };`
      );
      const control = await runOxlint(root, [`src/${target}`]);
      assert.equal(
        diagnosticsForRule(control.stdout, code).length,
        0,
        control.stdout
      );
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("class method options exempt implements and override independently while ordinary methods still report", async () => {
  const root = await makeFixtureRoot();
  try {
    await writeTypedFixtureConfig(
      root,
      `import core from "${corePresetUrl}"; export default { extends: [core] };`
    );
    await writeFixture(
      root,
      "src/implements.ts",
      'interface Reader { read(): string; } export class InterfaceReader implements Reader { read(): string { return "value"; } private helper(): string { return "helper"; } }'
    );
    await writeFixture(
      root,
      "src/override.ts",
      'abstract class Base { abstract read(): string; } export class Reader extends Base { override read(): string { return "value"; } }'
    );
    await writeFixture(
      root,
      "src/plain.ts",
      'export class Reader { read(): string { return "value"; } }'
    );
    const code = "eslint(class-methods-use-this)";
    const result = await runOxlint(root);
    const findings = diagnosticsForRule(result.stdout, code);
    assert.equal(findings.length, 1, result.stdout);
    assert.ok(findings[0].filename.endsWith("plain.ts"));
    for (const [option, target, count] of [
      ["ignoreClassesWithImplements", "implements.ts", 2],
      ["ignoreOverrideMethods", "override.ts", 1],
    ]) {
      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import core from "${corePresetUrl}";
const [severity, options] = core.rules["class-methods-use-this"];
const { ${option}: removed, ...rest } = options;
export default { extends: [core], rules: { "class-methods-use-this": [severity, rest] } };`
      );
      const control = await runOxlint(root, [`src/${target}`]);
      assert.equal(
        diagnosticsForRule(control.stdout, code).length,
        count,
        control.stdout
      );
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("unsafe matcher exceptions cover test spellings, retain call and return checks, and leave production strict", async () => {
  const root = await makeFixtureRoot();
  try {
    await writeTypedFixtureConfig(
      root,
      `import core from "${corePresetUrl}"; export default { extends: [core] };`
    );
    // Mirror Vitest's intentional asymmetric matcher return types without adding
    // a test-runner dependency to every consumer of this toolchain.
    await writeFixture(
      root,
      "src/vitest.d.ts",
      `declare module "vitest" {
export const expect: { any(value: unknown): any; objectContaining(value: unknown): any; };
}`
    );
    const source = `import { expect } from "vitest";
declare function accept(value: string): void;
export const matcher: { name: string } = expect.objectContaining({ name: "test" });
accept(expect.any(String));
export const member: unknown = expect.objectContaining({ name: "test" }).name;
expect.any(String)();
export function unsafeReturn(): string { return expect.any(String); }
`;
    const targets = [
      "src/matcher.test.ts",
      "src/matcher.spec.ts",
      "src/matcher.test.mts",
      "src/matcher.spec.cts",
      "src/matcher.test-d.ts",
      "src/matcher.spec-d.ts",
      "src/__tests__/matcher.ts",
      "src/__tests__/matcher.mts",
      "src/vitest.setup.ts",
      "src/test/setup.ts",
      "src/production.ts",
    ];
    for (const target of targets) {
      await writeFixture(root, target, source);
    }
    const result = await runOxlint(root);
    for (const rule of [
      "no-unsafe-assignment",
      "no-unsafe-argument",
      "no-unsafe-member-access",
    ]) {
      const findings = diagnosticsForRule(result.stdout, `typescript(${rule})`);
      assert.equal(findings.length, 1, result.stdout);
      assert.ok(findings[0].filename.endsWith("production.ts"));
    }
    for (const rule of ["no-unsafe-call", "no-unsafe-return"]) {
      assert.equal(
        diagnosticsForRule(result.stdout, `typescript(${rule})`).length,
        targets.length,
        result.stdout
      );
    }
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import core from "${corePresetUrl}";
export default { extends: [{ ...core, overrides: core.overrides.filter(override => !Object.hasOwn(override.rules, "typescript/no-unsafe-assignment")) }] };`
    );
    const control = await runOxlint(root, ["src/matcher.test.ts"]);
    for (const rule of [
      "no-unsafe-assignment",
      "no-unsafe-argument",
      "no-unsafe-member-access",
    ]) {
      assert.equal(
        diagnosticsForRule(control.stdout, `typescript(${rule})`).length,
        1,
        control.stdout
      );
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("generated ignores require a root spread and preserve consumer ignores and ordinary findings", async () => {
  const root = await makeFixtureRoot();
  try {
    const targets = [
      "src/normal.ts",
      "src/types.generated.ts",
      "src/generated/client.ts",
      "src/nested/generated/client.ts",
      "src/consumer-only.ts",
      "src/dist/output.ts",
    ];
    for (const target of targets) {
      await writeFixture(root, target, "debugger;");
    }
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import core from "${corePresetUrl}"; export default { extends: [core] };`
    );
    const inherited = await runOxlint(root);
    assert.equal(
      diagnosticsForRule(inherited.stdout, "eslint(no-debugger)").length,
      targets.length,
      inherited.stdout
    );
    for (const [spread, expected] of [
      [false, 5],
      [true, 1],
    ]) {
      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import core, { ignorePatterns } from "${corePresetUrl}";
export default { extends: [core], ignorePatterns: [${spread ? "...ignorePatterns," : ""} "**/consumer-only.ts"] };`
      );
      const result = await runOxlint(root);
      const findings = diagnosticsForRule(result.stdout, "eslint(no-debugger)");
      assert.equal(findings.length, expected, result.stdout);
      assert.ok(
        findings.some((finding) => finding.filename.endsWith("normal.ts"))
      );
      const explicit = await runOxlint(root, targets);
      assert.equal(
        diagnosticsForRule(explicit.stdout, "eslint(no-debugger)").length,
        expected,
        explicit.stdout
      );
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("valid-expect accepts literal and template messages natively, variables with maxArgs, and still rejects invalid calls", async () => {
  const root = await makeFixtureRoot();
  try {
    await writeTypedFixtureConfig(
      root,
      `import core from "${corePresetUrl}"; export default { extends: [core] };`
    );
    const messages = {
      literal: '"message"',
      template: "`message ${value}`",
      variable: "message",
    };
    for (const [name, message] of Object.entries(messages)) {
      await writeFixture(
        root,
        `src/${name}.test.ts`,
        `import { expect } from "vitest"; const value = 1; const message: string = "message"; expect(value, ${message}).toBe(1);`
      );
    }
    await writeFixture(
      root,
      "src/invalid.test.ts",
      'import { expect } from "vitest"; expect().toBe(1); expect(1, "message", "extra").toBe(1); expect(1);'
    );
    const code = "vitest(valid-expect)";
    const result = await runOxlint(root);
    const findings = diagnosticsForRule(result.stdout, code);
    assert.equal(findings.length, 3, result.stdout);
    assert.ok(
      findings.every((finding) => finding.filename.endsWith("invalid.test.ts"))
    );
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import core from "${corePresetUrl}";
export default { extends: [core], overrides: [{ files: ["**/*.test.ts"], plugins: ["vitest"], rules: { "vitest/valid-expect": "error" } }] };`
    );
    const control = await runOxlint(root);
    const native = diagnosticsForRule(control.stdout, code);
    assert.equal(native.length, 4, control.stdout);
    assert.equal(
      native.filter((finding) => finding.filename.endsWith("variable.test.ts"))
        .length,
      1
    );
    for (const name of ["literal", "template"]) {
      assert.equal(
        native.filter((finding) => finding.filename.endsWith(`${name}.test.ts`))
          .length,
        0
      );
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

for (const [name, presetUrl] of [
  ["Core", corePresetUrl],
  ["React", reactPresetUrl],
  ["Next", nextPresetUrl],
  ["Playwright", playwrightPresetUrl],
]) {
  test(`${name} uses semantic declaration style with the same default and explicit preference`, async () => {
    const root = await makeFixtureRoot();
    try {
      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import preset from "${presetUrl}";\nexport default { extends: [preset] };\n`
      );
      await writeFixture(
        root,
        "src/preference.ts",
        "export type RecordValue = { value: string };\n"
      );
      const defaultResult = await runOxlint(root, ["src/preference.ts"]);
      assert.equal(defaultResult.status, 1);
      const defaultReport = JSON.parse(defaultResult.stdout);
      assert.equal((defaultReport.diagnostics ?? defaultReport).length, 1);
      assert.equal(
        diagnosticsForRule(
          defaultResult.stdout,
          "howells(consistent-type-definitions)"
        ).length,
        1
      );
      assert.equal(
        diagnosticsForRule(
          defaultResult.stdout,
          "typescript(consistent-type-definitions)"
        ).length,
        0
      );

      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import preset from "${presetUrl}";\nexport default { extends: [preset], rules: { "howells/consistent-type-definitions": ["error", "type"] } };\n`
      );
      await writeFixture(
        root,
        "src/contract.ts",
        "export interface Contract { value: string }\n"
      );
      await writeFixture(
        root,
        "src/preference.ts",
        [
          'import type { Contract } from "./contract";',
          "",
          'declare module "./contract" { interface Contract { extra?: string } }',
          "",
          'export const contract: Contract = { extra: "extra", value: "value" };',
          "",
          "export interface RecordValue { value: string }",
          "",
        ].join("\n")
      );
      const typeResult = await runOxlint(root, ["src/preference.ts"]);
      assert.equal(typeResult.status, 1);
      const typeReport = JSON.parse(typeResult.stdout);
      assert.equal((typeReport.diagnostics ?? typeReport).length, 1);
      assert.equal(
        diagnosticsForRule(
          typeResult.stdout,
          "howells(consistent-type-definitions)"
        ).length,
        1
      );
      assert.equal(
        diagnosticsForRule(
          typeResult.stdout,
          "typescript(consistent-type-definitions)"
        ).length,
        0
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
}
