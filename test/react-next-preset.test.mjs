import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import core from "../oxlint/core.mjs";
import next from "../oxlint/next.mjs";
import react from "../oxlint/react.mjs";
import {
  corePresetUrl,
  diagnosticsForRule,
  makeFixtureRoot,
  nextPresetUrl,
  playwrightPresetUrl,
  reactPresetUrl,
  resolvedRules,
  ruleNamesWithPrefix,
  runOxlint,
  writeFixture,
  writeTypedFixtureConfig,
} from "./preset-harness.mjs";

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

for (const [name, presetUrl] of [
  ["Core", corePresetUrl],
  ["React", reactPresetUrl],
  ["Next", nextPresetUrl],
  ["Playwright", playwrightPresetUrl],
]) {
  test(`${name} permits canonical shape vocabulary and retains other anti-slop checks`, async () => {
    const root = await makeFixtureRoot();

    try {
      await writeFixture(
        root,
        "oxlint.config.mjs",
        `import preset from "${presetUrl}";\nexport default { extends: [preset] };\n`
      );
      await writeFixture(
        root,
        "src/reference.ts",
        "export const geometryShape = { radius: 1 } as const;\n"
      );
      await writeFixture(
        root,
        "src/vocabulary.ts",
        [
          'import { geometryShape } from "./reference";',
          "export interface AttributeDefinition { readonly shapeId: string; }",
          'export const valueShapes = ["text", "number"] as const;',
          "export const radius = geometryShape.radius;",
          "export const read = (value: unknown) => typeof value;",
          "",
        ].join("\n")
      );

      const result = await runOxlint(root);
      assert.equal(result.status, 1);
      assert.equal(
        diagnosticsForRule(result.stdout, "anti-slop(no-shape-in-symbol-names)")
          .length,
        0
      );
      assert.ok(
        diagnosticsForRule(result.stdout, "anti-slop(no-runtime-typeof)")
          .length > 0
      );
      assert.ok(
        diagnosticsForRule(result.stdout, "anti-slop(no-unknown-parameters)")
          .length > 0
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
}

for (const [name, presetUrl, overlay] of [
  ["React", reactPresetUrl, false],
  ["Next", nextPresetUrl, false],
  ["Next with Playwright overlay", nextPresetUrl, true],
]) {
  test(`${name} makes the layout-animation audit opt-in and retains other performance checks`, async () => {
    const root = await makeFixtureRoot();
    const config = [
      `import preset from "${presetUrl}";`,
      ...(overlay
        ? [
            `import { playwrightJsPlugins, playwrightOverride } from "${playwrightPresetUrl}";`,
          ]
        : []),
      "export default {",
      "  extends: [preset],",
      ...(overlay
        ? [
            "  jsPlugins: playwrightJsPlugins,",
            '  overrides: [playwrightOverride(["e2e/**/*.{ts,tsx}"])],',
          ]
        : []),
    ];
    const code = "react-doctor(no-layout-property-animation)";
    const blurCode = "react-doctor(no-large-animated-blur)";

    try {
      await writeTypedFixtureConfig(root, [...config, "};"].join("\n"));
      const sources = {
        "accordion.tsx":
          'export const Accordion = () => <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { duration: 0.55 } }} />;',
        "measured.tsx":
          'export const Measured = ({ height }: { height: number | null }) => <m.div animate={{ height: height ?? "auto" }} initial={false} transition={{ duration: 0.36 }} />;',
        "numeric.tsx":
          "export const Numeric = () => <m.div initial={{ width: 20 }} animate={{ width: 100, left: 20 }} />;",
        "blur.tsx":
          'export const Blurred = () => <m.div animate={{ filter: "blur(20px)" }} />;',
      };
      for (const [file, source] of Object.entries(sources)) {
        await writeFixture(root, `src/${file}`, source);
      }

      const defaultResult = await runOxlint(root);
      assert.equal(
        diagnosticsForRule(defaultResult.stdout, code).length,
        0,
        defaultResult.stdout
      );
      assert.equal(
        diagnosticsForRule(defaultResult.stdout, blurCode).length,
        1,
        defaultResult.stdout
      );

      await writeFixture(
        root,
        "oxlint.config.mjs",
        [
          ...config,
          '  rules: { "react-doctor/no-layout-property-animation": "error" },',
          "};",
        ].join("\n")
      );
      const optedIn = await runOxlint(root);
      const findings = diagnosticsForRule(optedIn.stdout, code);
      assert.equal(findings.length, 7, optedIn.stdout);
      for (const [file, count] of [
        ["accordion.tsx", 3],
        ["measured.tsx", 1],
        ["numeric.tsx", 3],
      ]) {
        assert.equal(
          findings.filter((finding) => finding.filename.endsWith(file)).length,
          count,
          optedIn.stdout
        );
      }
      assert.equal(
        diagnosticsForRule(optedIn.stdout, blurCode).length,
        1,
        optedIn.stdout
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
}

// Anti-slop and the Vitest preset are part of the standard core lane, not an
// opt-in overlay. Both come from Ultracite, and both are easy to lose silently
// if the extends list is reordered or a rule moves upstream.
