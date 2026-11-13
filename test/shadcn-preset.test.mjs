import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { test } from "node:test";

import core from "../oxlint/core.mjs";
import next from "../oxlint/next.mjs";
import react from "../oxlint/react.mjs";
import {
  diagnosticsForRule,
  makeFixtureRoot,
  reactPresetUrl,
  resolvedJsPluginNames,
  resolvedRules,
  ruleNamesWithPrefix,
  runOxlint,
  shadcnPresetUrl,
  writeFixture,
} from "./preset-harness.mjs";

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

test("no-raw-colors reads a declared type role as a font size, not a colour", async () => {
  const root = await makeFixtureRoot();

  try {
    await writeFixture(
      root,
      "oxlint.config.mjs",
      `import react from "${reactPresetUrl}";\n\nexport default {\n  extends: [react],\n  rules: { "shadcn/no-raw-colors": "error" },\n};\n`
    );
    await writeFixture(root, "package.json", '{ "type": "module" }\n');
    await writeFixture(
      root,
      "components.json",
      `${JSON.stringify({ tailwind: { css: "app/globals.css" } })}\n`
    );
    await writeFixture(
      root,
      "app/globals.css",
      '@import "tailwindcss";\n\n@theme {\n  --color-ink: #111;\n  --color-muted: #666;\n  --text-caption: 0.75rem;\n  --text-caption--line-height: 1rem;\n}\n'
    );
    // `text-caption` is declared as a size, so it is a size. `text-heading` is
    // declared nowhere, and `text-pink-500` is palette: both stay reports.
    await writeFixture(
      root,
      "src/type.tsx",
      'export const Type = () => (\n  <p className="text-caption text-muted">\n    <b className="text-heading">a</b>\n    <i className="text-pink-500">b</i>\n    <u className="bg-caption">c</u>\n  </p>\n);\n'
    );

    const result = await runOxlint(root);
    const messages = diagnosticsForRule(
      result.stdout,
      "shadcn(no-raw-colors)"
    ).map((diagnostic) => diagnostic.message);
    const reported = (className) =>
      messages.some((message) => message.startsWith(`"${className}"`));

    assert.ok(!reported("text-caption"), messages.join("\n"));
    assert.ok(!reported("text-muted"), messages.join("\n"));
    assert.ok(reported("text-heading"), messages.join("\n"));
    assert.ok(reported("text-pink-500"), messages.join("\n"));
    assert.ok(reported("bg-caption"), messages.join("\n"));
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
