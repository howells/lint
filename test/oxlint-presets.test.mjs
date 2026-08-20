import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { resolvePackageBin } from "../bin/run-package-bin.mjs";
import core from "../oxlint/core.mjs";
import next from "../oxlint/next.mjs";
import { disabledReactDoctorRules } from "../oxlint/react-doctor-rules.mjs";
import react from "../oxlint/react.mjs";

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
    await execFileAsync(
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
    return { status: 0, stdout: "[]" };
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

  assert.ok(coreJsPluginNames.includes("github"));
  assert.ok(coreJsPluginNames.includes("sonarjs"));
  assert.ok(!coreJsPluginNames.includes("react-doctor"));
  assert.equal(coreRules["github/no-inner-html"], "error");
  assert.equal(coreRules["sonarjs/no-duplicate-string"], "error");

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

    // Sanctioned via `allow`, colour arbitrary (never governed), and — crucially —
    // a same-spelled word in a JSDoc @example or a non-className string prop
    // (Radix `value="italic"`) are all left alone.
    assert.doesNotMatch(messages, /"text-caption"/);
    assert.doesNotMatch(messages, /"text-\[#fff\]"/);
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
    // And the rule must still be ON: a genuinely badly-cased helper still fails.
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
    assert.match(flagged, /_Mixed_Up/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("core lane keeps the strict camelCase function name", async () => {
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

    assert.match(
      JSON.stringify(
        diagnosticsForRule(result.stdout, "sonarjs(function-name)")
      ),
      /Widget/
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
      'export const dynamic = "force-dynamic";\n\nexport const metadata = { title: "Blog" };\n\nexport default function Page() {\n  return <main />;\n}\n'
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
    // Both controls run against the same output, so a config that never loaded
    // cannot pass this test by reporting nothing. The empty spec is named
    // rather than counted: `sonarjs/no-empty-test-file` does not recognise an
    // aliased `test` either, so the aliased fixtures draw it too, and a bare
    // total would move whenever those change.
    assert.equal(
      diagnosticsForRule(result.stdout, "sonarjs(no-empty-test-file)").filter(
        (diagnostic) => diagnostic.filename.endsWith("e2e/empty.spec.ts")
      ).length,
      1
    );
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
