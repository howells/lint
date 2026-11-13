import assert from "node:assert/strict";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import boundaries from "../oxlint/boundaries.mjs";
import core from "../oxlint/core.mjs";
import gdp from "../oxlint/gdp.mjs";
import neon from "../oxlint/neon.mjs";
import next from "../oxlint/next.mjs";
import playwright from "../oxlint/playwright.mjs";
import react from "../oxlint/react.mjs";
import shadcn from "../oxlint/shadcn.mjs";
import {
  corePresetUrl,
  diagnosticsForRule,
  makeFixtureRoot,
  reactPresetUrl,
  resolvedJsPluginNames,
  runOxlint,
  shadcnPresetUrl,
  writeFixture,
} from "./preset-harness.mjs";

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

test("every Oxlint preset puts the policy plugin in scope", () => {
  for (const [name, preset] of [
    ["boundaries", boundaries],
    ["core", core],
    ["gdp", gdp],
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
