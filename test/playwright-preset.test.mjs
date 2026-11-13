import assert from "node:assert/strict";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  diagnosticsForRule,
  makeFixtureRoot,
  nextPresetUrl,
  playwrightPresetUrl,
  runOxlint,
  writeFixture,
} from "./preset-harness.mjs";

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
