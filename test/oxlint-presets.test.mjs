import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
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
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { resolvePackageBin } from "../bin/run-package-bin.mjs";
import boundaries from "../oxlint/boundaries.mjs";
import core from "../oxlint/core.mjs";
import neon from "../oxlint/neon.mjs";
import next from "../oxlint/next.mjs";
import playwright from "../oxlint/playwright.mjs";
import { disabledReactDoctorRules } from "../oxlint/react-doctor-rules.mjs";
import react from "../oxlint/react.mjs";
import shadcn from "../oxlint/shadcn.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const oxlintBin = path.join(repoRoot, "node_modules", ".bin", "oxlint");
const corePresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "core.mjs")
).href;
const reactPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "react.mjs")
).href;
const nextPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "next.mjs")
).href;
const playwrightPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "playwright.mjs")
).href;
const shadcnPresetUrl = pathToFileURL(
  path.join(repoRoot, "oxlint", "shadcn.mjs")
).href;

// Oxlint resolves bare jsPlugin specifiers (e.g. Ultracite's opt-in
// github/sonarjs/react-doctor plugins) relative to the root config file's
// node_modules ancestry, and it requires the tsgolint executable whenever
// type-aware mode is on. Each fixture therefore gets a node_modules symlink
// back to this package's own, which gives it the dependency ancestry a real
// consumer install has; resolving tsgolint the way the binaries do proves that
// resolution path keeps working.
//
// The fixtures used to live *inside* the repo's node_modules for the same
// reason. Oxlint 1.78 skips any path it considers ignored — node_modules, a
// dot-prefixed directory, anything matched by .gitignore — even when that path
// is named explicitly on the command line, and `--no-ignore` does not lift it.
// Every fixture came back as "No files found to lint" instead of running the
// presets, so they moved outside the repo entirely.
// realpathSync because macOS resolves os.tmpdir() to a symlink: Oxlint reports
// the symlinked path while the JS-plugin bridge derives its project root from
// the real cwd, and eslint-plugin-sonarjs then throws "is not nested under
// topDir" — which aborts the whole JS-plugin pass for that file, taking the
// `howells/*` rules under test down with it.
const fixtureBase = path.join(
  realpathSync(tmpdir()),
  "howells-lint-preset-fixtures"
);
const tsgolintPath = resolvePackageBin("oxlint-tsgolint", "tsgolint");

async function makeFixtureRoot() {
  await mkdir(fixtureBase, { recursive: true });
  const root = await mkdtemp(path.join(fixtureBase, "case-"));
  await symlink(
    path.join(repoRoot, "node_modules"),
    path.join(root, "node_modules"),
    "dir"
  );
  return root;
}

async function writeFixture(root, relativePath, source) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, source, { flag: "w" });
}

async function runOxlint(root, targets = ["src"]) {
  try {
    const { stderr, stdout } = await execFileAsync(
      oxlintBin,
      [
        "--config",
        path.join(root, "oxlint.config.mjs"),
        "--format",
        "json",
        ...targets.map((target) => path.join(root, target)),
      ],
      { cwd: root, env: { ...process.env, OXLINT_TSGOLINT_PATH: tsgolintPath } }
    );
    // A clean run may print nothing at all, and `diagnosticsForRule` parses
    // whatever comes back, so an empty stdout becomes an empty report.
    return { status: 0, stderr, stdout: stdout.trim() === "" ? "[]" : stdout };
  } catch (error) {
    return {
      status: error.code,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
}

function resolvedRules(preset, resolved = {}) {
  for (const extended of preset.extends ?? []) {
    resolvedRules(extended, resolved);
  }
  Object.assign(resolved, preset.rules ?? {});
  return resolved;
}

function resolvedJsPluginNames(preset, names = []) {
  for (const extended of preset.extends ?? []) {
    resolvedJsPluginNames(extended, names);
  }
  for (const plugin of preset.jsPlugins ?? []) {
    names.push(plugin.name);
  }
  return names;
}

function ruleNamesWithPrefix(preset, prefix) {
  return Object.keys(resolvedRules(preset)).filter((ruleName) =>
    ruleName.startsWith(prefix)
  );
}

function diagnosticsForRule(stdout, code) {
  const report = JSON.parse(stdout);
  const diagnostics = report.diagnostics ?? report;
  return diagnostics.filter((diagnostic) => diagnostic.code === code);
}

test("core preset enables type-aware linting", async () => {
  assert.equal(core.options?.typeAware, true);
});

test("Ultracite JS-plugin coverage remains assigned to the correct presets", () => {
  const coreExtensions = core.extends ?? [];
  const coreJsPluginNames = coreExtensions.flatMap((preset) =>
    (preset.jsPlugins ?? []).map((plugin) => plugin.name)
  );
  const coreRules = Object.assign(
    {},
    ...coreExtensions.map((preset) => preset.rules ?? {})
  );

  assert.ok(!coreJsPluginNames.includes("github"));
  assert.ok(!coreJsPluginNames.includes("sonarjs"));
  assert.ok(!coreJsPluginNames.includes("react-doctor"));
  assert.equal(coreRules["github/no-inner-html"], undefined);
  assert.equal(coreRules["sonarjs/no-duplicate-string"], undefined);

  const reactExtensions = react.extends ?? [];
  const reactJsPluginNames = reactExtensions.flatMap((preset) =>
    (preset.jsPlugins ?? []).map((plugin) => plugin.name)
  );
  const reactRules = Object.assign(
    {},
    ...reactExtensions.map((preset) => preset.rules ?? {})
  );

  assert.ok(reactJsPluginNames.includes("react-doctor"));
  assert.equal(reactRules["react-doctor/no-array-index-as-key"], "error");
});

// Ultracite 7.10.0 moved React Doctor's framework rules out of the base
// JS-plugin preset, which silently emptied the Next.js set from every preset
// here. Assert where each framework family lands so a later upstream move
// cannot drop it again unnoticed.
test("React Doctor framework rules land in the preset that owns the framework", () => {
  assert.equal(ruleNamesWithPrefix(core, "react-doctor/").length, 0);

  assert.equal(ruleNamesWithPrefix(react, "react-doctor/nextjs-").length, 0);
  assert.ok(ruleNamesWithPrefix(next, "react-doctor/nextjs-").length >= 20);
  assert.equal(
    resolvedRules(next)["react-doctor/nextjs-no-img-element"],
    "error"
  );

  // The `query-*` rules only match TanStack Query's own API, so they stay in
  // the standard React lane; `tanstack-start-*` assumes a router this lane
  // does not target.
  assert.ok(ruleNamesWithPrefix(react, "react-doctor/query-").length > 0);
  assert.equal(
    ruleNamesWithPrefix(next, "react-doctor/tanstack-start-").length,
    0
  );
});

// Ultracite requires named components to be arrow functions. Next.js mandates a
// default export per route file and writes it as a function declaration, so the
// Next preset takes the looser position and the React preset keeps upstream's.
test("only the Next preset admits the function-declaration component form", () => {
  const reactSetting =
    resolvedRules(react)["react/function-component-definition"];
  const nextSetting =
    resolvedRules(next)["react/function-component-definition"];

  assert.deepEqual(reactSetting?.[1]?.namedComponents, "arrow-function");
  assert.deepEqual(nextSetting?.[1]?.namedComponents, [
    "arrow-function",
    "function-declaration",
  ]);
});

test("the React Doctor escape hatch covers every rule the presets enable", () => {
  const enabled = [
    ...ruleNamesWithPrefix(react, "react-doctor/"),
    ...ruleNamesWithPrefix(next, "react-doctor/"),
  ];
  const uncovered = enabled.filter(
    (ruleName) => !(ruleName in disabledReactDoctorRules)
  );

  assert.ok(enabled.length > 0);
  assert.deepEqual(uncovered, []);
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

test("Playwright preset rejects brittle E2E test patterns", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nimport { playwrightJsPlugins, playwrightRules } from ${JSON.stringify(playwrightPresetUrl)};\n\nexport default {\n  extends: [next],\n  jsPlugins: playwrightJsPlugins,\n  overrides: [\n    {\n      files: ["tests/**/*.{ts,tsx}"],\n      rules: playwrightRules,\n    },\n  ],\n};\n`
    );
    await writeFixture(
      root,
      "tests/checkout.spec.ts",
      'import { expect, test } from "@playwright/test";\n\ntest("checkout", async ({ page }) => {\n  await page.waitForTimeout(1000);\n  await page.locator("text=Buy").click({ force: true });\n  const button = await page.$("button");\n  expect(button).toBeTruthy();\n  expect(await page.locator("button").isVisible()).toBe(true);\n});\n'
    );

    const result = await runOxlint(root, ["tests"]);
    assert.notEqual(result.status, 0);

    assert.equal(
      diagnosticsForRule(result.stdout, "playwright(no-wait-for-timeout)")
        .length,
      1
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "playwright(no-force-option)").length,
      1
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "playwright(no-element-handle)").length,
      1
    );
    assert.equal(
      diagnosticsForRule(
        result.stdout,
        "playwright(prefer-web-first-assertions)"
      ).length,
      1
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("React preset rejects generic component suffixes", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\nexport default react;\n`
    );
    await mkdir(path.join(root, "src", "app", "orders"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "home"), { recursive: true });
    await writeFixture(
      root,
      "src/user-wrapper.tsx",
      "export function UserWrapper() { return <div />; }\n"
    );
    await writeFixture(
      root,
      "src/checkout-client.tsx",
      "export const CheckoutClient = () => <button />;\n"
    );
    await writeFixture(
      root,
      "src/dashboard-page.tsx",
      "export default function DashboardPage() { return <main />; }\n"
    );
    await writeFixture(
      root,
      "src/account-content.tsx",
      "export function AccountContent() { return <section />; }\n"
    );
    await writeFixture(
      root,
      "src/app/orders/page.tsx",
      "export default function Page() { return <main />; }\n"
    );
    await writeFixture(
      root,
      "src/app/page.tsx",
      "export default function Page() { return <main />; }\n"
    );
    // Component named "HomePage" in a page.tsx should be allowed —
    // the "Page" suffix is natural inside an actual page file.
    await writeFixture(
      root,
      "src/app/home/page.tsx",
      "export default function HomePage() { return <main />; }\n"
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-generic-component-suffix)"
    );
    const messages = ruleDiagnostics.map((diagnostic) => diagnostic.message);
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    assert.equal(
      messages.filter((message) =>
        message.includes("Avoid generic component suffix")
      ).length,
      6
    );
    assert.match(ruleOutput, /user-wrapper\.tsx/);
    assert.match(ruleOutput, /UserWrapper/);
    assert.match(ruleOutput, /checkout-client\.tsx/);
    assert.match(ruleOutput, /CheckoutClient/);
    assert.match(ruleOutput, /dashboard-page\.tsx/);
    assert.match(ruleOutput, /DashboardPage/);
    assert.doesNotMatch(ruleOutput, /account-content\.tsx/);
    assert.doesNotMatch(ruleOutput, /app\/orders\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /app\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /app\/home\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /HomePage/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in no-raw-jsx-elements rule bans raw host elements and honors allow", async () => {
  const root = await makeFixtureRoot();

  try {
    // The rule is opt-in: extend a standard preset (which loads the howells
    // plugin via jsPlugins) and turn the rule on with an `allow` list.
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/no-raw-jsx-elements": ["error", { allow: ["html", "body"] }],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/shell.tsx",
      "export function Shell() {\n  return (\n    <html>\n      <body>\n        <div>\n          <Frame>\n            <span>hi</span>\n          </Frame>\n        </div>\n      </body>\n    </html>\n  );\n}\n"
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-raw-jsx-elements)"
    );
    const messages = ruleDiagnostics.map((diagnostic) => diagnostic.message);
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    // Lowercase hosts <div> and <span> are reported; <html>/<body> are allowed
    // and the uppercase <Frame> component is never a bare host.
    assert.equal(ruleDiagnostics.length, 2);
    assert.match(ruleOutput, /Raw <div> is banned/);
    assert.match(ruleOutput, /Raw <span> is banned/);
    assert.doesNotMatch(ruleOutput, /Raw <html>/);
    assert.doesNotMatch(ruleOutput, /Raw <body>/);
    assert.doesNotMatch(ruleOutput, /Raw <Frame>/);
    assert.equal(
      messages.filter((message) =>
        message.includes("design-system component instead")
      ).length,
      2
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in no-raw-type-utilities rule bans raw typographic utilities and honors context", async () => {
  const root = await makeFixtureRoot();

  try {
    // Generic rule: the sanctioned typographic classes are supplied entirely via
    // `allow` (design-system tokens + the weights/leading this project permits).
    // Everything else typographic — including raw sizes and un-allowed font
    // weights — is governed by the default namespace and reported.
    const allow = [
      "text-caption",
      "text-paragraph*",
      "text-heading*",
      "font-medium",
      "font-semibold",
      "leading-none",
    ];
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/no-raw-type-utilities": ["error", { allow: ${JSON.stringify(allow)} }],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/typography.tsx",
      [
        `import { cva } from "class-variance-authority";`,
        ``,
        `type ComponentSize = "sm" | "lg";`,
        ``,
        `const ToggleGroupItem = (_props: { value: string }) => null;`,
        ``,
        `// Size ladder: Record<*Size, string> is scanned even outside className/cn.`,
        `const SIZES: Record<ComponentSize, string> = {`,
        `  sm: "text-sm font-medium",`,
        `  lg: "text-lg",`,
        `};`,
        ``,
        `const variants = cva("text-xs", {`,
        `  variants: { tone: { loud: "uppercase tracking-widest text-caption" } },`,
        `});`,
        ``,
        `/**`,
        ` * @example <Thing label="One uppercase letter" />`,
        ` */`,
        `export function Thing() {`,
        `  return (`,
        `    <div className={SIZES.sm}>`,
        `      <p className="text-base text-[13px] text-[#fff] leading-none">{variants()}</p>`,
        `      <ToggleGroupItem value="italic" />`,
        `      <span className="text-caption font-semibold font-bold">ok</span>`,
        `      {/* Important and modifier suffixes are the same utility shouted. */}`,
        `      <b className="text-xl! text-2xl/8 !text-3xl">suffixes</b>`,
        `      {/* v3 puts the important marker after the variant; v4's shorthand is a size. */}`,
        `      <u className="hover:!text-5xl text-(length:--my-size)">v3 and v4 spellings</u>`,
        `      {/* Arbitrary colours in every spelling stay the colour rule's. */}`,
        `      <i className="text-[color:var(--ink)] text-[color-mix(in_oklch,red,blue)]">c</i>`,
        `    </div>`,
        `  );`,
        `}`,
        ``,
      ].join("\n")
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-raw-type-utilities)"
    );
    // Assert against the parsed (unescaped) messages, not the JSON string.
    const messages = ruleDiagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");

    // Governed & not allowed → flagged: raw sizes (incl. from the Record<*Size>
    // ladder and the cva base arg), arbitrary length size, tracking, uppercase,
    // and an un-allowed font weight (font-* is in the default namespace).
    assert.match(messages, /Typographic utility "text-sm"/);
    assert.match(messages, /Typographic utility "text-lg"/);
    assert.match(messages, /Typographic utility "text-xs"/);
    assert.match(messages, /Typographic utility "text-base"/);
    assert.match(messages, /Typographic utility "text-\[13px\]"/);
    assert.match(messages, /Typographic utility "tracking-widest"/);
    assert.match(messages, /Typographic utility "uppercase"/);
    assert.match(messages, /Typographic utility "font-bold"/);

    // An arbitrary length gets its own fix — the scale, or a named `@theme` step —
    // while a named size keeps the design-system-token wording. Asserted per
    // diagnostic: across the joined messages the two would cross-match.
    const messageFor = (utility) =>
      ruleDiagnostics.find((diagnostic) =>
        diagnostic.message.includes(`"${utility}"`)
      )?.message ?? "";

    assert.match(
      messageFor("text-[13px]"),
      /add a named step to your `@theme`/
    );
    assert.notEqual(messageFor("text-sm"), "");
    assert.doesNotMatch(
      messageFor("text-sm"),
      /add a named step to your `@theme`/
    );
    assert.match(messageFor("text-sm"), /design-system type tokens/);

    // A size is a size however it is shouted or paired with a leading modifier:
    // v4's suffix `!`, v3's prefix `!`, and `/8` all reduce to the bare utility.
    assert.match(messages, /Typographic utility "text-xl"/);
    assert.match(messages, /Typographic utility "text-2xl"/);
    assert.match(messages, /Typographic utility "text-3xl"/);

    // v3 spells an important utility under a variant as `hover:!text-5xl`, so the
    // marker has to come off after the colon split rather than before it.
    assert.match(messages, /Typographic utility "text-5xl"/);
    // `text-(length:--my-size)` is v4 shorthand for `text-[length:var(--my-size)]`.
    // The colon lives inside parentheses, so depth has to count them too.
    assert.match(messages, /Typographic utility "text-\(length:--my-size\)"/);

    // Sanctioned via `allow`, colour arbitrary (never governed), and — crucially —
    // a same-spelled word in a JSDoc @example or a non-className string prop
    // (Radix `value="italic"`) are all left alone.
    assert.doesNotMatch(messages, /"text-caption"/);
    assert.doesNotMatch(messages, /"text-\[#fff\]"/);
    // Every spelling of an arbitrary colour: the `color:` type hint and
    // `color-mix()` are the colour rule's, not this one's.
    assert.doesNotMatch(messages, /"text-\[color:/);
    assert.doesNotMatch(messages, /"text-\[color-mix/);
    assert.doesNotMatch(messages, /"font-(?:medium|semibold)"/);
    assert.doesNotMatch(messages, /"leading-none"/);
    assert.doesNotMatch(messages, /"(?:not-)?italic"/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("Next preset rejects pages that only pass through to one client component", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nexport default next;\n`
    );
    await mkdir(path.join(root, "src", "app", "account"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "checkout"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "marketing"), {
      recursive: true,
    });

    await writeFixture(
      root,
      "src/app/checkout/page.tsx",
      'import { CheckoutExperience } from "./checkout-experience";\n\nexport default function Page() {\n  return <CheckoutExperience />;\n}\n'
    );
    await writeFixture(
      root,
      "src/app/checkout/checkout-experience.tsx",
      '"use client";\n\nexport function CheckoutExperience() {\n  return <button type="button" />;\n}\n'
    );
    await writeFixture(
      root,
      "src/app/account/page.tsx",
      'import { AccountOverview } from "./account-overview";\n\nexport default async function Page() {\n  const account = await getAccount();\n  return <AccountOverview account={account} />;\n}\n\nasync function getAccount() {\n  return { id: "account_1" };\n}\n'
    );
    await writeFixture(
      root,
      "src/app/account/account-overview.tsx",
      "export function AccountOverview() {\n  return <section />;\n}\n"
    );
    await writeFixture(
      root,
      "src/app/marketing/page.tsx",
      "export default function Page() {\n  return <main />;\n}\n"
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-single-client-component-page)"
    );
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    assert.equal(ruleDiagnostics.length, 1);
    assert.match(ruleOutput, /checkout\/page\.tsx/);
    assert.match(ruleOutput, /CheckoutExperience/);
    assert.match(ruleOutput, /client component/);
    assert.doesNotMatch(ruleOutput, /account\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /marketing\/page\.tsx/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("React and Next lanes accept the casing their frameworks require", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nexport default next;\n`
    );
    // Next dispatches route handlers by these exact names. They are not
    // renameable, so a rule that rejects them is unsatisfiable rather than strict.
    await writeFixture(
      root,
      "src/app/api/things/route.ts",
      "export async function GET() {\n  return Response.json({});\n}\n\nexport async function DELETE() {\n  return Response.json({});\n}\n"
    );
    await writeFixture(
      root,
      "src/widget.tsx",
      "export function Widget() {\n  return <main />;\n}\n"
    );
    // The shape real route pages are written in, and the one the Next preset
    // deliberately re-allows via react/function-component-definition.
    await writeFixture(
      root,
      "src/app/firms/page.tsx",
      "export default async function FirmIndex() {\n  return <main />;\n}\n"
    );
    // camelCase stays valid; this is a widening, not a replacement.
    await writeFixture(
      root,
      "src/helper.ts",
      "export const compute = () => 1;\nexport function alsoCompute() {\n  return 2;\n}\n"
    );
    // SonarJS naming checks are retired, including non-framework helpers.
    await writeFixture(
      root,
      "src/bad.ts",
      "export function _Mixed_Up() {\n  return 3;\n}\n"
    );

    const result = await runOxlint(root);
    const flagged = JSON.stringify(
      diagnosticsForRule(result.stdout, "sonarjs(function-name)")
    );

    assert.doesNotMatch(flagged, /GET/);
    assert.doesNotMatch(flagged, /DELETE/);
    assert.doesNotMatch(flagged, /Widget/);
    assert.doesNotMatch(flagged, /FirmIndex/);
    assert.doesNotMatch(flagged, /alsoCompute/);
    assert.equal(flagged, "[]");
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

test("Next preset keeps the framework's default-export page shape writable", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nexport default next;\n`
    );
    await writeFixture(
      root,
      "src/app/page.tsx",
      "export default function Page() {\n  return <main />;\n}\n"
    );
    await writeFixture(
      root,
      "src/gallery.tsx",
      'export const Gallery = () => <img alt="" src="/a.png" />;\n'
    );

    const result = await runOxlint(root);

    assert.equal(
      diagnosticsForRule(result.stdout, "react(function-component-definition)")
        .length,
      0
    );
    // The Next.js React Doctor rules still have to be reaching the preset.
    assert.equal(
      diagnosticsForRule(result.stdout, "react-doctor(nextjs-no-img-element)")
        .length,
      1
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// React Doctor 0.9.x dropped the framework awareness its port of the
// react-refresh rule used to have, and its replacement is reachable only
// through `settings`, which Oxlint does not merge through `extends`. Every
// Next.js route file exports segment configuration alongside its component, so
// the Next lane runs Oxlint's native rule with an allowlist instead.
test("Next preset accepts a route file's segment exports beside its component", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nexport default next;\n`
    );
    await writeFixture(
      root,
      "src/app/blog/page.tsx",
      'export const dynamic = "force-dynamic";\n\nexport const instant = { level: "warning" };\n\nexport const metadata = { title: "Blog" };\n\nexport default function Page() {\n  return <main />;\n}\n'
    );

    const result = await runOxlint(root);

    assert.equal(
      diagnosticsForRule(result.stdout, "react-doctor(only-export-components)")
        .length,
      0
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "react(only-export-components)").length,
      0
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// Anti-slop and the Vitest preset are part of the standard core lane, not an
// opt-in overlay. Both come from Ultracite, and both are easy to lose silently
// if the extends list is reordered or a rule moves upstream.
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
const playwrightLaneSources = {
  // The empty spec is the positive control for `sonarjs/no-empty-test-file`.
  // Silencing it as collateral is the failure mode this pair of assertions
  // exists to catch — aliasing the Playwright imports to dodge the Vitest rule
  // is exactly what blinds it.
  "e2e/empty.spec.ts": "export const unusedHelper = 1;\n",
  "e2e/plain.spec.ts":
    'import { expect, test } from "@playwright/test";\n\ntest("both plain", async ({ page }) => {\n  await page.goto("/");\n  await expect(page.locator("h1")).toBeVisible();\n});\n',
  "e2e/aliased-both.spec.ts":
    'import { expect as pwExpect, test as pwTest } from "@playwright/test";\n\npwTest("both aliased", async ({ page }) => {\n  await page.goto("/");\n  await pwExpect(page.locator("h1")).toBeVisible();\n});\n',
  "e2e/aliased-expect.spec.ts":
    'import { expect as pwExpect, test } from "@playwright/test";\n\ntest("expect aliased", async ({ page }) => {\n  await page.goto("/");\n  await pwExpect(page.locator("h1")).toBeVisible();\n});\n',
  "e2e/aliased-test.spec.ts":
    'import { expect, test as pwTest } from "@playwright/test";\n\npwTest("test aliased", async ({ page }) => {\n  await page.goto("/");\n  await expect(page.locator("h1")).toBeVisible();\n});\n',
  // Naming is not the subject. Ultracite's globs cover `.test.*` as well, so a
  // project whose Playwright specs are named `.test.ts` draws
  // `prefer-importing-vitest-globals` exactly the same way and has to be
  // exempted too — it just never sees `consistent-test-filename`.
  "e2e/external.test.ts":
    'import { expect, test } from "@playwright/test";\n\ntest("external", async ({ page }) => {\n  await page.goto("/");\n  await expect(page.locator("h1")).toBeVisible();\n});\n',
  // The Playwright lane has to stay live for the zero-Vitest assertion to mean
  // anything. A run where the config failed to load reports zero of everything.
  "e2e/brittle.spec.ts":
    'import { expect, test } from "@playwright/test";\n\ntest("brittle", async ({ page }) => {\n  await page.waitForTimeout(1000);\n  await expect(page.locator("h1")).toBeVisible();\n});\n',
};

async function writePlaywrightLaneFixtures(root) {
  for (const [relativePath, source] of Object.entries(playwrightLaneSources)) {
    await writeFixture(root, relativePath, source);
  }
}

function diagnosticsForPlugin(stdout, plugin) {
  const report = JSON.parse(stdout);
  const diagnostics = report.diagnostics ?? report;
  return diagnostics.filter((diagnostic) =>
    String(diagnostic.code ?? "").startsWith(`${plugin}(`)
  );
}

test("playwrightOverride exempts the Playwright lane from the Vitest rules", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nimport { playwrightJsPlugins, playwrightOverride } from ${JSON.stringify(playwrightPresetUrl)};\n\nexport default {\n  extends: [next],\n  jsPlugins: playwrightJsPlugins,\n  overrides: [playwrightOverride(["e2e/**/*.{ts,tsx}"])],\n};\n`
    );
    await writePlaywrightLaneFixtures(root);

    const result = await runOxlint(root, ["e2e"]);

    assert.deepEqual(
      diagnosticsForPlugin(result.stdout, "vitest").map(
        (diagnostic) => diagnostic.code
      ),
      []
    );
    // A native bridge diagnostic proves the configuration loaded.
    assert.equal(
      diagnosticsForRule(result.stdout, "playwright(no-wait-for-timeout)")
        .length,
      1
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// The bites-proof for the test above. `plugins: ["vitest"]` is the whole fix:
// Oxlint discards a rule entry whose plugin is not in scope at that point and
// says nothing about it, so an override carrying only the `"off"` entries reads
// as a fix and changes nothing. This arm holds that shape and must stay red.
test("the Vitest rules survive an override that omits the vitest plugin", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nimport { playwrightJsPlugins, playwrightRules, vitestRulesOff } from ${JSON.stringify(playwrightPresetUrl)};\n\nexport default {\n  extends: [next],\n  jsPlugins: playwrightJsPlugins,\n  overrides: [\n    {\n      files: ["e2e/**/*.{ts,tsx}"],\n      rules: { ...vitestRulesOff, ...playwrightRules },\n    },\n  ],\n};\n`
    );
    await writePlaywrightLaneFixtures(root);

    const result = await runOxlint(root, ["e2e"]);

    assert.ok(
      diagnosticsForRule(result.stdout, "vitest(consistent-test-filename)")
        .length > 0
    );
    assert.ok(
      diagnosticsForRule(
        result.stdout,
        "vitest(prefer-importing-vitest-globals)"
      ).length > 0
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("the standalone Playwright preset keeps its rules outside spec files", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import playwright from ${JSON.stringify(playwrightPresetUrl)};\n\nexport default {\n  extends: [playwright],\n};\n`
    );
    await writePlaywrightLaneFixtures(root);
    // A page object is not a spec file, so it falls outside the exemption's
    // globs. The Playwright rules stay at the preset's top level and have to
    // keep covering it.
    await writeFixture(
      root,
      "e2e/helpers/nav.ts",
      'import type { Page } from "@playwright/test";\n\nexport const settle = async (page: Page) => {\n  await page.waitForTimeout(500);\n};\n'
    );

    const result = await runOxlint(root, ["e2e"]);

    assert.deepEqual(
      diagnosticsForPlugin(result.stdout, "vitest").map(
        (diagnostic) => diagnostic.code
      ),
      []
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "playwright(no-wait-for-timeout)")
        .length,
      2
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("the core lane still carries the Vitest rules", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nimport { playwrightJsPlugins, playwrightOverride } from ${JSON.stringify(playwrightPresetUrl)};\n\nexport default {\n  extends: [next],\n  jsPlugins: playwrightJsPlugins,\n  overrides: [playwrightOverride(["e2e/**/*.{ts,tsx}"])],\n};\n`
    );
    await writePlaywrightLaneFixtures(root);
    await writeFixture(
      root,
      "src/parse.test.ts",
      'describe("parse", () => {\n  it("reads an id", () => {\n    expect(1).toBe(1);\n  });\n});\n'
    );
    // A `.spec.ts` outside the Playwright globs, because the exemption is
    // scoped by path and a fix that went global would take this one too.
    await writeFixture(
      root,
      "src/render.spec.ts",
      'import { describe, expect, it } from "vitest";\n\ndescribe("render", () => {\n  it("renders", () => {\n    expect(1).toBe(1);\n  });\n});\n'
    );

    const result = await runOxlint(root, ["e2e", "src"]);

    assert.equal(
      diagnosticsForRule(
        result.stdout,
        "vitest(prefer-importing-vitest-globals)"
      ).length,
      1
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "vitest(consistent-test-filename)")
        .length,
      1
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("vitestRulesOff covers every Vitest rule Ultracite enables", async () => {
  const { vitestRulesOff } = await import(playwrightPresetUrl);
  const ultraciteVitest = await import("ultracite/oxlint/vitest");
  const enabled = (ultraciteVitest.default.overrides ?? []).flatMap(
    (override) =>
      Object.keys(override.rules ?? {}).filter((ruleName) =>
        ruleName.startsWith("vitest/")
      )
  );

  assert.ok(enabled.length > 40);
  assert.deepEqual(
    Object.keys(vitestRulesOff).sort(),
    [...new Set(enabled)].sort()
  );
  assert.ok(
    Object.values(vitestRulesOff).every((severity) => severity === "off")
  );
});

test("the shadcn plugin reaches the React lane and not the core one", () => {
  assert.ok(!resolvedJsPluginNames(core).includes("shadcn"));
  assert.ok(resolvedJsPluginNames(react).includes("shadcn"));
  assert.ok(resolvedJsPluginNames(next).includes("shadcn"));
});

test("the React lane enables only the shadcn rules that need no project policy", async () => {
  const { designSystemRuleNames } = await import(shadcnPresetUrl);
  const enabled = ruleNamesWithPrefix(react, "shadcn/");

  assert.deepEqual(enabled.sort(), [
    "shadcn/no-arbitrary-values",
    "shadcn/require-static-classes",
  ]);

  // `no-arbitrary-values` warns: what survives its allowances needs a
  // judgement call, so at error severity it gates every upgrade. A className
  // no rule can read is unambiguous, so that one errors.
  const resolved = resolvedRules(react);

  assert.equal(resolved["shadcn/no-arbitrary-values"][0], "warn");
  assert.equal(resolved["shadcn/require-static-classes"], "error");

  // The design-system rules report a project's own policy, so a preset cannot
  // choose them. Enabling one here would hand every consumer a backlog of
  // existing call sites on the next upgrade.
  for (const ruleName of designSystemRuleNames) {
    assert.ok(
      !enabled.includes(ruleName),
      `${ruleName} must stay opt-in; see oxlint/shadcn.mjs`
    );
  }
});

test("React preset reports off-scale values and unreadable component classNames", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `export { default } from "${reactPresetUrl}";\n`
    );
    await writeFixture(
      root,
      "components.json",
      `${JSON.stringify({ aliases: { ui: "@/components/ui" } })}\n`
    );
    await writeFixture(
      root,
      "tsconfig.json",
      `${JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] } },
      })}\n`
    );
    await writeFixture(
      root,
      "components/ui/button.tsx",
      "export const Button = (props: { className?: string }) => <button {...props} />;\n"
    );
    await writeFixture(
      root,
      "src/panel.tsx",
      'import { Button } from "@/components/ui/button";\n\nexport const Panel = ({ step }: { step: number }) => (\n  <div className="p-[13px]">\n    <Button className={`mt-${step}`}>Save</Button>\n  </div>\n);\n'
    );

    const result = await runOxlint(root);

    assert.equal(
      diagnosticsForRule(result.stdout, "shadcn(no-arbitrary-values)").length,
      1
    );
    assert.equal(
      diagnosticsForRule(result.stdout, "shadcn(require-static-classes)")
        .length,
      1
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("React preset reports no shadcn finding in a project without Tailwind", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `export { default } from "${reactPresetUrl}";\n`
    );
    // Hand-written class names are what `no-unknown-classes` and `no-raw-colors`
    // misread as misspelled Tailwind, which is why neither is in the lane. The
    // two rules that are must stay silent on them.
    await writeFixture(
      root,
      "src/card.tsx",
      'import styles from "./card.module.css";\n\nexport const Card = ({ tone }: { tone: string }) => (\n  <div className={styles.card}>\n    <span className="card-title is-active">Title</span>\n    <p className="prose lead">Body</p>\n    <b className={`badge badge--${tone}`}>Tag</b>\n  </div>\n);\n'
    );

    const result = await runOxlint(root);
    const report = JSON.parse(result.stdout);

    assert.deepEqual(
      (report.diagnostics ?? report).filter((diagnostic) =>
        diagnostic.code?.startsWith("shadcn(")
      ),
      []
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("componentSourceOverride stops the call-site rules at the component directory", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import { defineConfig } from "oxlint";\n\nimport react from "${reactPresetUrl}";\nimport { componentSourceOverride } from "${shadcnPresetUrl}";\n\nexport default defineConfig({\n  extends: [react],\n  overrides: [componentSourceOverride(["**/components/ui/**"])],\n});\n`
    );
    // With no components.json, the plugin finds `components/ui` relative to
    // the nearest package.json. The fixture base has none above it, so
    // without this file no import resolves to a design-system component and
    // require-static-classes has nothing to report.
    await writeFixture(root, "package.json", '{ "type": "module" }\n');
    await writeFixture(
      root,
      "components/ui/badge.tsx",
      'export const Badge = (props: { className?: string }) => <span className={props.className ?? "p-[13px]"} />;\n'
    );
    // A forwarding wrapper: `className` is destructured out, so `rest` cannot
    // carry a class, but the rule does not see that and reports the rest
    // element. This is every component in a design-system directory.
    await writeFixture(
      root,
      "components/ui/tag.tsx",
      'import { Badge } from "./badge";\nexport const Tag = (props: { className?: string; size?: string }) => {\n  const { className, ...rest } = props;\n  return <Badge {...rest} className={className} />;\n};\n'
    );
    await writeFixture(
      root,
      "src/page.tsx",
      'import { Badge } from "../components/ui/badge";\nexport const Page = ({ size }: { size: string }) => (\n  <section className="p-[13px]"><Badge className={`mt-${size}`} /></section>\n);\n'
    );

    const result = await runOxlint(root, ["components", "src"]);
    const arbitrary = diagnosticsForRule(
      result.stdout,
      "shadcn(no-arbitrary-values)"
    );
    const dynamic = diagnosticsForRule(
      result.stdout,
      "shadcn(require-static-classes)"
    );

    // The override carries no `plugins` key: an override inherits the JS
    // plugins named at the config root, unlike the Playwright overlay's Vitest
    // exemption, which needs the builtin plugin brought back into scope.
    assert.equal(arbitrary.length, 1);
    assert.match(arbitrary[0].filename, /src[/\\]page\.tsx$/);

    // The forwarding wrapper inside the component directory is exempt; the
    // template-literal className at the call site still reports.
    assert.equal(dynamic.length, 1);
    assert.match(dynamic[0].filename, /src[/\\]page\.tsx$/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// `text-[var(--token)]` reads a design token, so reporting it as an off-token
// value inverts the rule. Upstream passes Tailwind v4's `text-(--token)`
// shorthand for the same thing, which is why this is a defect rather than a
// policy. Measured at 1,890 of 2,024 findings in a repo whose design system is
// entirely CSS custom properties.
test("React preset exempts a class whose arbitrary value is one variable reference", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `export { default } from "${reactPresetUrl}";\n`
    );
    await writeFixture(
      root,
      "src/tokens.tsx",
      'export const Tokens = () => (\n  <div>\n    <p className="text-[var(--cs-text)]">token</p>\n    <p className="md:bg-[var(--cs-surface)]">token, variant</p>\n    <p className="text-(--cs-text)">token, v4 shorthand</p>\n    <p className="text-[length:var(--cs-small)]">token, type hint</p>\n    <p className="border-[color:var(--cs-border)]">token, type hint</p>\n    <p className="border-[color:color-mix(in_oklab,var(--cs-border)_60%,transparent)]">composite</p>\n    <p className="shadow-[0_0_0_1px_var(--cs-border)]">mixed</p>\n    <p className="p-[calc(var(--gap)*2)]">calc</p>\n    <p className="rounded-[3px]">hardcoded</p>\n    <p className="max-w-[68ch]">layout, no scale equivalent</p>\n    <p className="grid-cols-[minmax(0,1fr)_392px]">layout track</p>\n  </div>\n);\n'
    );

    const result = await runOxlint(root);
    const reported = diagnosticsForRule(
      result.stdout,
      "shadcn(no-arbitrary-values)"
    ).map((diagnostic) => diagnostic.message);

    // A value that merely contains a variable keeps its hardcoded parts, so it
    // stays covered.
    assert.equal(reported.length, 4);
    assert.ok(
      reported.some((message) => message.includes("shadow-[0_0_0_1px"))
    );
    assert.ok(reported.some((message) => message.includes("p-[calc(")));
    assert.ok(reported.some((message) => message.includes("rounded-[3px]")));
    assert.ok(reported.some((message) => message.includes("color-mix(")));

    // Layout values have no token to move to, so they are allowed and the
    // appearance checks above are unaffected.
    assert.ok(!reported.some((message) => message.includes("max-w-[68ch]")));
    assert.ok(!reported.some((message) => message.includes("grid-cols-[")));
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// Extending a preset has to be enough to name a `howells/*` rule. Oxlint
// resolves a rule entry against the plugin set in scope, and a config that
// extends a preset carrying no `jsPlugins` entry for the policy plugin is
// refused outright — "Plugin 'howells' not found" aborts the run, so the rule
// never gets to report and nothing else in the config is linted either. Both
// halves are asserted: the plugin rides on every preset, and a consumer that
// extends the one preset that used to lack it gets diagnostics without
// re-declaring `jsPlugins` itself.
test("every Oxlint preset puts the policy plugin in scope", () => {
  for (const [name, preset] of [
    ["boundaries", boundaries],
    ["core", core],
    ["neon", neon],
    ["next", next],
    ["playwright", playwright],
    ["react", react],
    ["shadcn", shadcn],
  ]) {
    assert.ok(
      resolvedJsPluginNames(preset).includes("howells"),
      `${name} preset does not load the howells plugin`
    );
  }
});

test("a consumer enabling a howells rule needs no jsPlugins of its own", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import shadcn from ${JSON.stringify(shadcnPresetUrl)};\n\nexport default {\n  extends: [shadcn],\n  rules: {\n    "howells/no-raw-jsx-elements": ["error", { allow: ["html"] }],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/shell.tsx",
      "export const Shell = () => (\n  <html>\n    <div>hi</div>\n  </html>\n);\n"
    );

    const result = await runOxlint(root);
    // A refused config exits 1 with no JSON at all, so parsing is the assertion
    // that the plugin resolved.
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-raw-jsx-elements)"
    );
    assert.equal(ruleDiagnostics.length, 1);
    assert.match(JSON.stringify(ruleDiagnostics), /Raw <div> is banned/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in no-raw-motion-namespace rule bans the full animation namespace", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/no-raw-motion-namespace": ["error", { allowIn: ["motion-config"] }],\n  },\n};\n`
    );
    // JSX member name.
    await writeFixture(
      root,
      "src/panel.tsx",
      [
        'import { motion } from "motion/react";',
        "",
        "export const Panel = () => <motion.div animate={{ opacity: 1 }} />;",
        "",
      ].join("\n")
    );
    // Member expression as a call callee.
    await writeFixture(
      root,
      "src/factory.tsx",
      [
        'import { motion } from "motion/react";',
        "",
        "const Trigger = () => null;",
        "",
        "export const Styled = motion.create(Trigger);",
        "",
      ].join("\n")
    );
    // `typeof` on the same member expression, which parses as a type query
    // rather than a member expression and so needs its own visitor.
    await writeFixture(
      root,
      "src/element-type.ts",
      [
        'import { motion } from "motion/react";',
        "",
        "export type El = typeof motion.button;",
        "",
      ].join("\n")
    );
    // Hooks and providers are bare identifiers, never members of the namespace.
    await writeFixture(
      root,
      "src/hooks.tsx",
      [
        'import { AnimatePresence, useScroll } from "motion/react";',
        "",
        "export const Reveal = () => {",
        "  useScroll();",
        "  return <AnimatePresence>{null}</AnimatePresence>;",
        "};",
        "",
      ].join("\n")
    );
    // The lazy primitives are the sanctioned form.
    await writeFixture(
      root,
      "src/lazy.tsx",
      [
        'import * as m from "motion/react-m";',
        "",
        "export const Fade = () => <m.div animate={{ opacity: 1 }} />;",
        "",
      ].join("\n")
    );
    // The regression fixture that proves the rule is not textual: the script it
    // replaces scanned source text and needed an explicit comment check.
    await writeFixture(
      root,
      "src/note.ts",
      [
        "// A motion.div here would defeat the code-split.",
        'export const note = "motion.div";',
        "",
      ].join("\n")
    );
    // `allowIn` exempts the module that owns the namespace.
    await writeFixture(
      root,
      "src/motion-config.tsx",
      [
        'import { motion } from "motion/react";',
        "",
        "export const Root = () => <motion.div />;",
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-raw-motion-namespace)"
    );
    const messages = ruleDiagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");
    const files = ruleDiagnostics
      .map((diagnostic) => diagnostic.filename)
      .join("\n");

    assert.equal(ruleDiagnostics.length, 3);
    assert.match(messages, /Render `m\.div` instead of `motion\.div`/);
    assert.match(messages, /Render `m\.create` instead of `motion\.create`/);
    assert.match(messages, /Render `m\.button` instead of `motion\.button`/);
    assert.match(messages, /pulls the animation engine/);
    for (const quiet of ["hooks", "lazy", "note", "motion-config"]) {
      assert.doesNotMatch(files, new RegExp(quiet, "u"));
    }
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in no-avoidable-arbitrary-spacing rule reports only clean steps", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/no-avoidable-arbitrary-spacing": "error",\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/box.tsx",
      [
        'const extra = "shrink-0";',
        "",
        "export const Box = () => (",
        '  <div className="w-[320px]">',
        '    <div className="gap-[1.5rem] px-[8px]" />',
        "    <span className={`mt-[2px] ${extra}`} />",
        '    <div className="w-[13px]" />',
        '    <div className="w-[var(--panel)] max-w-[calc(100%-2rem)] h-[50vh]" />',
        '    <div className="data-[state=open]:w-80 [&>svg]:size-4 text-[13px]" />',
        "  </div>",
        ");",
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-avoidable-arbitrary-spacing)"
    );
    const messages = ruleDiagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");

    // 320px = 80 steps, 1.5rem = 6, 8px = 2, 2px = half a step.
    assert.equal(ruleDiagnostics.length, 4);
    assert.match(messages, /`w-\[320px\]` has an exact standard equivalent/);
    assert.match(messages, /`gap-\[1\.5rem\]`/);
    assert.match(messages, /`px-\[8px\]`/);
    assert.match(messages, /`mt-\[2px\]`/);
    // 13px is not a step, so there is nothing to convert to.
    assert.doesNotMatch(messages, /13px/);
    // A variable, a calc(), a viewport unit, an arbitrary variant and a
    // non-spacing scale are all outside the rule.
    assert.doesNotMatch(messages, /var\(--panel\)|calc|50vh|state=open|text-/);
    // The span is reported at the token inside the template, not the whole node.
    const [inTemplate] = ruleDiagnostics.filter((diagnostic) =>
      diagnostic.message.includes("mt-[2px]")
    );
    assert.equal(inTemplate.labels[0].span.length, "mt-[2px]".length);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in design-token-alpha rule pins a token's alpha", async () => {
  const root = await makeFixtureRoot();

  try {
    const tokens = [{ alpha: 80, utility: "ring-gray-500" }];
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/design-token-alpha": ["error", { tokens: ${JSON.stringify(tokens)} }],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/ring.tsx",
      [
        'import { cn } from "cn";',
        "",
        'export const ring = "ring-gray-500/100";',
        "",
        "export const Field = () => (",
        '  <div className={cn("focus-visible:ring-gray-500/30")}>',
        '    <div className="data-[focused=true]:ring-gray-500/50" />',
        '    <div className={cn("focus-visible:ring-gray-500/80")} />',
        '    <div className="ring-gray-400/30 ring-offset-gray-500/30" />',
        '    <div className="ring-gray-500" />',
        "  </div>",
        ");",
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(design-token-alpha)"
    );
    const messages = ruleDiagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");

    assert.equal(ruleDiagnostics.length, 3);
    assert.match(
      messages,
      /`ring-gray-500\/30` drifts from the token alpha; use `ring-gray-500\/80`/
    );
    assert.match(messages, /`ring-gray-500\/50` drifts/);
    assert.match(messages, /`ring-gray-500\/100` drifts/);
    // The pinned alpha, a different shade, a different utility that merely
    // contains the token's text, and a bare token all stay quiet.
    assert.doesNotMatch(messages, /`ring-gray-500\/80` drifts/);
    assert.doesNotMatch(messages, /ring-gray-400/);
    assert.doesNotMatch(messages, /ring-offset/);
    assert.doesNotMatch(messages, /`ring-gray-500` carries no alpha/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("design-token-alpha reports a bare token when requireAlphaSuffix is set", async () => {
  const root = await makeFixtureRoot();

  try {
    const tokens = [{ alpha: 80, utility: "ring-gray-500" }];
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/design-token-alpha": ["error", { requireAlphaSuffix: true, tokens: ${JSON.stringify(tokens)} }],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/bare.tsx",
      [
        "export const Field = () => (",
        '  <div className="ring-gray-500">',
        '    <div className="ring-gray-500/80" />',
        "  </div>",
        ");",
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(design-token-alpha)"
    );

    assert.equal(ruleDiagnostics.length, 1);
    assert.match(
      ruleDiagnostics[0].message,
      /`ring-gray-500` carries no alpha; use `ring-gray-500\/80`/
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in transition-after-focus-helper rule reads the merge call's argument order", async () => {
  const root = await makeFixtureRoot();

  try {
    const helpers = ["focusInput", "focusRing"];
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/transition-after-focus-helper": ["error", { helpers: ${JSON.stringify(helpers)} }],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/field.ts",
      [
        'import { cn } from "cn";',
        "",
        'const focusInput = () => "transition-[color,box-shadow]";',
        'const focusRing = () => "transition-[box-shadow]";',
        'const className = "";',
        'const extra = "";',
        "",
        "// Reported: the literal transition list is deleted by the helper's.",
        'export const one = cn("transition-all", focusInput());',
        "export const two = cn(",
        '  "border transition-[color,box-shadow]",',
        "  focusRing(),",
        "  className",
        ");",
        "export const three = cn(`transition-colors ${extra}`, focusInput());",
        "",
        "// Not reported: the sanctioned order, a comment naming the helper, and",
        "// variant-prefixed tokens, which are a different merge group.",
        'export const four = cn(focusInput(), "transition-all");',
        'export const five = cn("transition-all", /* mirrors focusInput() */ "border");',
        "export const six = cn(",
        '  "motion-reduce:transition-none hover:transition-colors",',
        "  focusInput()",
        ");",
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(transition-after-focus-helper)"
    );
    const messages = ruleDiagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");

    assert.equal(ruleDiagnostics.length, 3);
    assert.match(
      messages,
      /Move `transition-all` after `focusInput\(\)`; tailwind-merge keeps the last class in the transition group/
    );
    assert.match(
      messages,
      /Move `transition-\[color,box-shadow\]` after `focusRing\(\)`/
    );
    assert.match(messages, /Move `transition-colors` after `focusInput\(\)`/);
    // A variant-prefixed token is never the same conflict group.
    assert.doesNotMatch(messages, /transition-none/);
    assert.doesNotMatch(messages, /hover:/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in no-deep-package-imports rule stops at the package's own shim", async () => {
  const root = await makeFixtureRoot();

  try {
    const prefixes = [
      { depth: 1, prefix: "@instruments/materia-ui/components" },
    ];
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\n\nexport default {\n  extends: [core],\n  rules: {\n    "howells/no-deep-package-imports": ["error", { prefixes: ${JSON.stringify(prefixes)} }],\n  },\n};\n`
    );
    // The target package's own manifest decides which deep paths are public. A
    // wildcard pattern is deliberately not a declaration: it would match every
    // depth and neuter the rule for the whole namespace.
    await writeFixture(
      root,
      "src/node_modules/@instruments/materia-ui/package.json",
      `${JSON.stringify(
        {
          name: "@instruments/materia-ui",
          version: "0.0.0",
          exports: {
            "./components/*": "./dist/components/*/index.js",
            "./components/sidebar/sidebar-constants":
              "./dist/components/sidebar/sidebar-constants.js",
            "./utils/cn": "./dist/utils/cn.js",
          },
        },
        null,
        2
      )}\n`
    );
    await writeFixture(
      root,
      "src/deep-named.ts",
      'export { ButtonRoot } from "@instruments/materia-ui/components/button/button-root";\n'
    );
    await writeFixture(
      root,
      "src/deep-import.ts",
      [
        'import { SidebarNav } from "@instruments/materia-ui/components/sidebar/sidebar-nav";',
        "",
        "export const nav = SidebarNav;",
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "src/deep-dynamic.ts",
      [
        "export const load = () =>",
        '  import("@instruments/materia-ui/components/chart/chart-root");',
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "src/deep-require.ts",
      [
        "declare const require: (id: string) => unknown;",
        "",
        "export const chart = require(",
        '  "@instruments/materia-ui/components/chart/chart-root"',
        ");",
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "src/shim.ts",
      [
        'import { Button } from "@instruments/materia-ui/components/button";',
        "",
        "export const trigger = Button;",
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "src/outside-prefix.ts",
      [
        'import { cn } from "@instruments/materia-ui/utils/cn";',
        "",
        "export const join = cn;",
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "src/declared-export.ts",
      [
        'import { sidebarConstants } from "@instruments/materia-ui/components/sidebar/sidebar-constants";',
        "",
        "export const constants = sidebarConstants;",
        "",
      ].join("\n")
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-deep-package-imports)"
    );
    const messages = ruleDiagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");
    const files = ruleDiagnostics
      .map((diagnostic) => diagnostic.filename)
      .join("\n");

    assert.equal(ruleDiagnostics.length, 4);
    assert.match(
      messages,
      /Import from `@instruments\/materia-ui\/components\/button`; `@instruments\/materia-ui\/components\/button\/button-root` reaches into the package's internals/
    );
    assert.match(
      messages,
      /Import from `@instruments\/materia-ui\/components\/sidebar`/
    );
    assert.equal(
      ruleDiagnostics.filter((diagnostic) =>
        diagnostic.message.includes("chart/chart-root")
      ).length,
      2
    );
    // The shim, a subpath outside the governed prefix, and the deep path the
    // package declares literally in its own `exports` map all stay quiet.
    assert.doesNotMatch(files, /shim|outside-prefix|declared-export/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in no-out-of-bounds-package-imports rule confines a namespace to its owner", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\n\nexport default {\n  extends: [core],\n  rules: {\n    "howells/no-out-of-bounds-package-imports": [\n      "error",\n      { packages: ["@mastra/*", "mastra"], within: ["packages/mastra"] },\n    ],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "packages/utils/index.ts",
      [
        'import { Agent } from "@mastra/core";',
        "",
        "export const agent = Agent;",
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "apps/web/page.ts",
      'export { workflow } from "mastra/workflows";\n'
    );
    await writeFixture(
      root,
      "apps/web/lib/deep/nested.ts",
      'import "@mastra/loggers";\n'
    );
    await writeFixture(
      root,
      "packages/mastra/src/agent.ts",
      [
        'import { Agent } from "@mastra/core";',
        'import { build } from "mastra";',
        "",
        "export const owned = [Agent, build];",
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "apps/admin/page.ts",
      [
        'import { helper } from "mastrado";',
        "",
        "export const aid = helper;",
        "",
      ].join("\n")
    );
    await writeFixture(
      root,
      "packages/utils/other.ts",
      ['import { z } from "zod";', "", "export const schema = z;", ""].join(
        "\n"
      )
    );

    const result = await runOxlint(root, ["apps", "packages"]);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-out-of-bounds-package-imports)"
    );
    const files = ruleDiagnostics
      .map((diagnostic) => diagnostic.filename)
      .join("\n");

    assert.equal(ruleDiagnostics.length, 3);
    assert.match(
      ruleDiagnostics[0].message,
      /may only be imported inside packages\/mastra\. Reach it through that package's own exports instead\./
    );
    assert.match(files, /packages\/utils\/index\.ts/);
    assert.match(files, /apps\/web\/page\.ts/);
    assert.match(files, /apps\/web\/lib\/deep\/nested\.ts/);
    // The owning package at any depth, a package that merely shares a prefix
    // with an exact entry, and an unrestricted specifier are all left alone.
    assert.doesNotMatch(files, /packages\/mastra/);
    assert.doesNotMatch(files, /apps\/admin/);
    assert.doesNotMatch(files, /other\.ts/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("opt-in no-raw-colour-in-class-strings rule reports a colour, not a token reference", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/no-raw-colour-in-class-strings": ["error", { allowIn: ["**/*.stories.tsx"] }],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "src/swatch.tsx",
      [
        'import { cn } from "cn";',
        "",
        "export const Swatch = () => (",
        '  <div className="bg-[#ffffff]">',
        '    <p className={cn("text-[oklch(0.7_0.1_250)]")} />',
        '    <div className="border-[rgba(0,0,0,0.5)]" />',
        '    <div className="bg-surface text-muted-foreground" />',
        '    <div className={cn("bg-[var(--surface-raised)]")} />',
        '    <div className="w-[13px]" />',
        "  </div>",
        ");",
        "",
      ].join("\n")
    );
    // `allowIn` exempts a story by path, so the same colour there is quiet.
    await writeFixture(
      root,
      "src/swatch.stories.tsx",
      'export const Story = () => <div className="bg-[#ffffff]" />;\n'
    );

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-raw-colour-in-class-strings)"
    );
    const messages = ruleDiagnostics
      .map((diagnostic) => diagnostic.message)
      .join("\n");
    const files = ruleDiagnostics
      .map((diagnostic) => diagnostic.filename)
      .join("\n");

    assert.equal(ruleDiagnostics.length, 3);
    assert.match(
      messages,
      /`bg-\[#ffffff\]`: a raw colour value in a class string is invisible to the theme/
    );
    assert.match(messages, /`text-\[oklch\(0\.7_0\.1_250\)\]`/);
    assert.match(messages, /`border-\[rgba\(0,0,0,0\.5\)\]`/);
    // A design token, a `var()` reference, and a length are all left alone.
    assert.doesNotMatch(
      messages,
      /bg-surface|muted-foreground|surface-raised|13px/
    );
    assert.doesNotMatch(files, /stories/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("path globs exempt a file by pattern as well as by stem", async () => {
  const root = await makeFixtureRoot();

  try {
    // The `allowIn` values a consumer actually passes: framework story and test
    // spellings, and the module that configures the namespace it bans elsewhere.
    const allowIn = ["**/*.stories.tsx", "**/*.test.tsx", "**/motion-config*"];
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/no-raw-motion-namespace": ["error", { allowIn: ${JSON.stringify(allowIn)} }],\n  },\n};\n`
    );
    const source = [
      'import { motion } from "motion/react";',
      "",
      "export const Panel = () => <motion.div />;",
      "",
    ].join("\n");
    await writeFixture(root, "src/ui/panel.stories.tsx", source);
    await writeFixture(root, "src/ui/panel.test.tsx", source);
    await writeFixture(root, "src/ui/motion-config.tsx", source);
    // A `**/` pattern has to match at the root as well as at depth.
    await writeFixture(root, "src/motion-config-tokens.tsx", source);
    await writeFixture(root, "src/ui/panel.tsx", source);

    const result = await runOxlint(root);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-raw-motion-namespace)"
    );
    const files = ruleDiagnostics
      .map((diagnostic) => diagnostic.filename)
      .join("\n");

    assert.equal(ruleDiagnostics.length, 1);
    assert.match(files, /src\/ui\/panel\.tsx/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("a within entry is the same directory written with a slash or a dot slash", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\n\nexport default {\n  extends: [core],\n  rules: {\n    "howells/no-out-of-bounds-package-imports": [\n      "error",\n      { packages: ["@mastra/*"], within: ["./packages/mastra/"] },\n    ],\n  },\n};\n`
    );
    await writeFixture(
      root,
      "packages/mastra/src/agent.ts",
      'import { Agent } from "@mastra/core";\n\nexport const agent = Agent;\n'
    );
    await writeFixture(
      root,
      "packages/utils/index.ts",
      'import { Agent } from "@mastra/core";\n\nexport const agent = Agent;\n'
    );

    const result = await runOxlint(root, ["packages"]);
    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-out-of-bounds-package-imports)"
    );

    assert.equal(ruleDiagnostics.length, 1);
    assert.match(ruleDiagnostics[0].filename, /packages\/utils\/index\.ts/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

// The SonarJS plugin was retired in 3.0.0. Six of its rules read a dependency
// manifest per directory through the resolver that writes a `console.debug`
// line for every `catalog:` reference it cannot resolve against the catalog
// source; in a catalogued monorepo that is one line per catalogued dependency
// per lint run. Two of the six were on at error in the 2.2.0 lane
// (`stable-tests` and `no-skipped-tests`; `no-implicit-dependencies`, the
// obvious suspect, was off), which is why repos still on that version are noisy
// and a repo on 3.3.3 is silent. Nothing in this lane reads a manifest any more;
// these assertions are what keeps it that way, because the plugin would come
// back through an Ultracite JS-plugin preset rather than through a change here.
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
