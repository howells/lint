import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { resolvePackageBin } from "../bin/run-package-bin.mjs";
import core from "../oxlint/core.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const oxlintBin = path.join(repoRoot, "node_modules", ".bin", "oxlint");
const corePresetUrl = pathToFileURL(path.join(repoRoot, "oxlint", "core.mjs")).href;
const reactPresetUrl = pathToFileURL(path.join(repoRoot, "oxlint", "react.mjs")).href;
const nextPresetUrl = pathToFileURL(path.join(repoRoot, "oxlint", "next.mjs")).href;
const playwrightPresetUrl = pathToFileURL(path.join(repoRoot, "oxlint", "playwright.mjs")).href;

// Oxlint resolves bare jsPlugin specifiers (e.g. Ultracite's github/sonarjs and
// the react-doctor plugin) relative to the root config file's node_modules
// ancestry, and it requires the tsgolint executable whenever type-aware mode is
// on. Nesting fixtures under this package's node_modules gives them the same
// dependency ancestry a real consumer install has, and resolving tsgolint the
// way the binaries do proves that resolution path keeps working.
const fixtureBase = path.join(repoRoot, "node_modules", ".howells-lint-fixtures");
const tsgolintPath = resolvePackageBin("oxlint-tsgolint", "tsgolint");

async function makeFixtureRoot() {
  await mkdir(fixtureBase, { recursive: true });
  return mkdtemp(path.join(fixtureBase, "case-"));
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
      { cwd: root, env: { ...process.env, OXLINT_TSGOLINT_PATH: tsgolintPath } },
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

function diagnosticsForRule(stdout, code) {
  const report = JSON.parse(stdout);
  const diagnostics = report.diagnostics ?? report;
  return diagnostics.filter((diagnostic) => diagnostic.code === code);
}

test("core preset enables type-aware linting", async () => {
  assert.equal(core.options?.typeAware, true);
});

test("tsgolint executable resolves from this package's dependency tree", () => {
  // The binaries pass this path to Oxlint via OXLINT_TSGOLINT_PATH so type-aware
  // mode works even when a consumer runs from a directory where tsgolint is not
  // on the cwd-relative `node_modules/.bin` search path.
  assert.ok(existsSync(tsgolintPath), `expected tsgolint to exist at ${tsgolintPath}`);
});

test("core preset rejects app imports across workspace boundaries", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`,
    );
    await writeFixture(root, "apps/web/nav.ts", "export const nav = 1;\n");
    await writeFixture(
      root,
      "apps/web/local.ts",
      'import { nav } from "./nav";\nexport const local = nav;\n',
    );
    await writeFixture(
      root,
      "apps/admin/page.ts",
      'import { nav } from "../web/nav";\nexport const page = nav;\n',
    );
    await writeFixture(
      root,
      "packages/ui/index.ts",
      'import { nav } from "../../apps/web/nav";\nexport const ui = nav;\n',
    );
    await writeFixture(
      root,
      "packages/design/index.ts",
      'import { ui } from "../ui";\nexport const design = ui;\n',
    );

    const result = await runOxlint(root, ["apps", "packages"]);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-cross-workspace-app-imports)",
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
      `import core from ${JSON.stringify(corePresetUrl)};\nexport default core;\n`,
    );
    await writeFixture(
      root,
      "src/loader.ts",
      'import { staticValue } from "./static-value";\n\nexport async function loadKnownPackage() {\n  return import("heavy-package");\n}\n\nexport async function loadNamedPackage(packageName: string) {\n  return import(packageName);\n}\n\nexport const value = staticValue;\n',
    );
    await writeFixture(root, "src/static-value.ts", "export const staticValue = 1;\n");

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-runtime-dynamic-imports)",
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

test("Playwright preset rejects brittle E2E test patterns", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nimport { playwrightJsPlugins, playwrightRules } from ${JSON.stringify(playwrightPresetUrl)};\n\nexport default {\n  extends: [next],\n  jsPlugins: playwrightJsPlugins,\n  overrides: [\n    {\n      files: ["tests/**/*.{ts,tsx}"],\n      rules: playwrightRules,\n    },\n  ],\n};\n`,
    );
    await writeFixture(
      root,
      "tests/checkout.spec.ts",
      'import { expect, test } from "@playwright/test";\n\ntest("checkout", async ({ page }) => {\n  await page.waitForTimeout(1000);\n  await page.locator("text=Buy").click({ force: true });\n  const button = await page.$("button");\n  expect(button).toBeTruthy();\n  expect(await page.locator("button").isVisible()).toBe(true);\n});\n',
    );

    const result = await runOxlint(root, ["tests"]);
    assert.notEqual(result.status, 0);

    assert.equal(diagnosticsForRule(result.stdout, "playwright(no-wait-for-timeout)").length, 1);
    assert.equal(diagnosticsForRule(result.stdout, "playwright(no-force-option)").length, 1);
    assert.equal(diagnosticsForRule(result.stdout, "playwright(no-element-handle)").length, 1);
    assert.equal(
      diagnosticsForRule(result.stdout, "playwright(prefer-web-first-assertions)").length,
      1,
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
      `import react from ${JSON.stringify(reactPresetUrl)};\nexport default react;\n`,
    );
    await mkdir(path.join(root, "src", "app", "orders"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "home"), { recursive: true });
    await writeFixture(
      root,
      "src/user-wrapper.tsx",
      "export function UserWrapper() { return <div />; }\n",
    );
    await writeFixture(
      root,
      "src/checkout-client.tsx",
      "export const CheckoutClient = () => <button />;\n",
    );
    await writeFixture(
      root,
      "src/dashboard-page.tsx",
      "export default function DashboardPage() { return <main />; }\n",
    );
    await writeFixture(
      root,
      "src/account-content.tsx",
      "export function AccountContent() { return <section />; }\n",
    );
    await writeFixture(
      root,
      "src/app/orders/page.tsx",
      "export default function Page() { return <main />; }\n",
    );
    await writeFixture(
      root,
      "src/app/page.tsx",
      "export default function Page() { return <main />; }\n",
    );
    // Component named "HomePage" in a page.tsx should be allowed —
    // the "Page" suffix is natural inside an actual page file.
    await writeFixture(
      root,
      "src/app/home/page.tsx",
      "export default function HomePage() { return <main />; }\n",
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-generic-component-suffix)",
    );
    const messages = ruleDiagnostics.map((diagnostic) => diagnostic.message);
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    assert.equal(
      messages.filter((message) => message.includes("Avoid generic component suffix")).length,
      6,
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
      `import react from ${JSON.stringify(reactPresetUrl)};\n\nexport default {\n  extends: [react],\n  rules: {\n    "howells/no-raw-jsx-elements": ["error", { allow: ["html", "body"] }],\n  },\n};\n`,
    );
    await writeFixture(
      root,
      "src/shell.tsx",
      "export function Shell() {\n  return (\n    <html>\n      <body>\n        <div>\n          <Frame>\n            <span>hi</span>\n          </Frame>\n        </div>\n      </body>\n    </html>\n  );\n}\n",
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(result.stdout, "howells(no-raw-jsx-elements)");
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
      messages.filter((message) => message.includes("design-system component instead")).length,
      2,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("Next preset rejects pages that only pass through to one client component", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nexport default next;\n`,
    );
    await mkdir(path.join(root, "src", "app", "account"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "checkout"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "marketing"), { recursive: true });

    await writeFixture(
      root,
      "src/app/checkout/page.tsx",
      'import { CheckoutExperience } from "./checkout-experience";\n\nexport default function Page() {\n  return <CheckoutExperience />;\n}\n',
    );
    await writeFixture(
      root,
      "src/app/checkout/checkout-experience.tsx",
      '"use client";\n\nexport function CheckoutExperience() {\n  return <button type="button" />;\n}\n',
    );
    await writeFixture(
      root,
      "src/app/account/page.tsx",
      'import { AccountOverview } from "./account-overview";\n\nexport default async function Page() {\n  const account = await getAccount();\n  return <AccountOverview account={account} />;\n}\n\nasync function getAccount() {\n  return { id: "account_1" };\n}\n',
    );
    await writeFixture(
      root,
      "src/app/account/account-overview.tsx",
      "export function AccountOverview() {\n  return <section />;\n}\n",
    );
    await writeFixture(
      root,
      "src/app/marketing/page.tsx",
      "export default function Page() {\n  return <main />;\n}\n",
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-single-client-component-page)",
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
