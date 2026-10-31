import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import core from "../oxlint/core.mjs";
import next from "../oxlint/next.mjs";
import playwright from "../oxlint/playwright.mjs";
import react from "../oxlint/react.mjs";

const execFileAsync = promisify(execFile);
const oxlintBin = fileURLToPath(
  new URL("../node_modules/.bin/oxlint", import.meta.url)
);
const pluginUrl = new URL(
  "../oxlint/howells-policy-plugin.mjs",
  import.meta.url
).href;
const ruleName = "howells/no-array-method-this-argument";
const nativeRuleName = "unicorn/no-array-method-this-argument";

const nodeImport = 'import { Readable } from "node:stream";';
const map = "Readable.from(indices).map(readShard, { concurrency: 4 });";
const receiverCases = [
  ["named", `${nodeImport} ${map}`, 0],
  [
    "renamed-import",
    'import { Readable as NodeReadable } from "node:stream"; NodeReadable.from(indices).map(readShard, options);',
    0,
  ],
  [
    "namespace",
    'import * as stream from "node:stream"; stream.Readable.from(indices).map(readShard, options);',
    0,
  ],
  [
    "default",
    'import stream from "node:stream"; stream.Readable.from(indices).map(readShard, options);',
    0,
  ],
  [
    "unprefixed",
    'import { Readable } from "stream"; Readable.from(indices).map(readShard, options);',
    0,
  ],
  ...["every", "filter", "find", "flatMap", "forEach", "map", "some"].map(
    (method) => [
      `operator-${method}`,
      `${nodeImport} Readable.from(indices).${method}(callback, options);`,
      0,
    ]
  ),
  [
    "computed-factory",
    `${nodeImport} Readable["from"](indices)["map"](callback, options);`,
    0,
  ],
  [
    "unrelated-shadow-mutation",
    `${nodeImport} function change(Readable) { Readable.prototype.map = replacement; } ${map}`,
    0,
  ],
  [
    "type-only-other-import",
    `${nodeImport} import type * as types from "stream"; ${map}`,
    0,
  ],
  ["unknown", "receiver.map(callback, options);", 1],
  ["array-options", "indices.map(callback, { concurrency: 4 });", 1],
  ["typed-array", "new Uint8Array(indices).map(callback, options);", 1],
  [
    "foreign",
    'import { Readable } from "another-stream"; Readable.from(indices).map(callback, options);',
    1,
  ],
  [
    "type-import",
    'import type { Readable } from "node:stream"; Readable.from(indices).map(callback, options);',
    1,
  ],
  [
    "type-specifier",
    'import { type Readable } from "node:stream"; Readable.from(indices).map(callback, options);',
    1,
  ],
  [
    "type-namespace",
    'import type * as stream from "node:stream"; stream.Readable.from(indices).map(callback, options);',
    1,
  ],
  [
    "wrong-export",
    'import { Writable as Readable } from "node:stream"; Readable.from(indices).map(callback, options);',
    1,
  ],
  [
    "local",
    "const Readable = { from: () => [] }; Readable.from(indices).map(callback, options);",
    1,
  ],
  ["parameter", `${nodeImport} function load(Readable) { return ${map} }`, 1],
  ["block", `${nodeImport} { const Readable = foreign; ${map} }`, 1],
  ["catch", `${nodeImport} try {} catch (Readable) { ${map} }`, 1],
  [
    "namespace-parameter",
    'import * as stream from "node:stream"; function load(stream) { return stream.Readable.from(indices).map(callback, options); }',
    1,
  ],
  [
    "instance-variable",
    `${nodeImport} const input = Readable.from(indices); input.map(callback, options);`,
    1,
  ],
  ["constructor", `${nodeImport} new Readable().map(callback, options);`, 1],
  [
    "subclass",
    `${nodeImport} class Input extends Readable {} Input.from(indices).map(callback, options);`,
    1,
  ],
  [
    "chain",
    `${nodeImport} Readable.from(indices).filter(callback).map(callback, options);`,
    1,
  ],
  [
    "non-stream-method",
    `${nodeImport} Readable.from(indices).findIndex(callback, options);`,
    1,
  ],
  [
    "array-from-stream",
    `${nodeImport} Array.from(Readable.from(indices), callback, options);`,
    1,
  ],
  [
    "optional-factory",
    `${nodeImport} Readable.from?.(indices).map(callback, options);`,
    1,
  ],
  ["static-mutation", `${nodeImport} Readable.from = replacement; ${map}`, 1],
  [
    "prototype-mutation",
    `${nodeImport} Readable.prototype.map = Array.prototype.map; ${map}`,
    1,
  ],
  [
    "late-mutation",
    `${nodeImport} ${map} Readable.prototype.map = replacement;`,
    1,
  ],
  ["computed-mutation", `${nodeImport} Readable[key] = replacement; ${map}`, 1],
  ["delete", `${nodeImport} delete Readable.prototype.map; ${map}`, 1],
  ["update", `${nodeImport} Readable.from++; ${map}`, 1],
  [
    "destructuring-write",
    `${nodeImport} ({ map: Readable.prototype.map } = replacement); ${map}`,
    1,
  ],
  [
    "loop-write",
    `${nodeImport} for (Readable.prototype.map of replacements) {} ${map}`,
    1,
  ],
  [
    "define-property",
    `${nodeImport} Object.defineProperty(Readable.prototype, "map", descriptor); ${map}`,
    1,
  ],
  [
    "reflect",
    `${nodeImport} Reflect.set(Readable, "from", replacement); ${map}`,
    1,
  ],
  [
    "alias",
    `${nodeImport} const Alias = Readable; Alias.prototype.map = replacement; ${map}`,
    1,
  ],
  ["factory-escape", `${nodeImport} const from = Readable.from; ${map}`, 1],
  ["prototype-escape", `${nodeImport} mutate(Readable.prototype); ${map}`, 1],
  [
    "factory-prototype",
    `${nodeImport} Object.getPrototypeOf(Readable.from(indices)).map = replacement; ${map}`,
    1,
  ],
  [
    "instance-constructor",
    `${nodeImport} Readable.from(indices).constructor.prototype.map = replacement; ${map}`,
    1,
  ],
  [
    "instance-alias-prototype",
    `${nodeImport} const input = Readable.from(indices).filter(callback); const alias = input; mutate(Object.getPrototypeOf(alias)); ${map}`,
    1,
  ],
  [
    "reflect-constructor",
    `${nodeImport} const input = Readable.from(indices); mutate(Reflect.get(input, "constructor")); ${map}`,
    1,
  ],
  ["constructor-escape", `${nodeImport} mutate(Readable); ${map}`, 1],
  ["object-escape", `${nodeImport} const escaped = { Readable }; ${map}`, 1],
  ["binding-export", `${nodeImport} export { Readable }; ${map}`, 1],
  [
    "reexport",
    `${nodeImport} export { Readable as PublicReadable } from "stream"; ${map}`,
    1,
  ],
  ["star-reexport", `${nodeImport} export * from "node:stream"; ${map}`, 1],
  [
    "namespace-mutation",
    `${nodeImport} import * as stream from "stream"; stream.Readable.prototype.map = replacement; ${map}`,
    1,
  ],
  [
    "other-constructor",
    `${nodeImport} import { Duplex } from "stream"; mutate(Duplex.prototype); ${map}`,
    1,
  ],
  [
    "commonjs-access",
    `${nodeImport} const stream = require("stream"); mutate(stream.Readable); ${map}`,
    1,
  ],
  [
    "builtin-access",
    `${nodeImport} const stream = process.getBuiltinModule("stream"); mutate(stream.Readable); ${map}`,
    1,
  ],
  [
    "dynamic-access",
    `${nodeImport} const stream = await import("node:stream"); mutate(stream.Readable); ${map}`,
    1,
  ],
];

async function fixture(t, cases) {
  const root = await mkdtemp(
    path.join(realpathSync(tmpdir()), "howells array receivers ")
  );
  t.after(() => rm(root, { force: true, recursive: true }));
  for (const [name, source] of cases)
    await writeFile(path.join(root, `${name}.ts`), source);
  return root;
}

async function writeConfig(root, rule = ruleName) {
  await writeFile(
    path.join(root, "oxlint.config.mjs"),
    `export default {
  categories: { correctness: "off" },
  plugins: ["unicorn"],
  jsPlugins: [{ name: "howells", specifier: ${JSON.stringify(pluginUrl)} }],
  rules: { ${JSON.stringify(rule)}: "error" },
};\n`
  );
}

async function lint(root, flag) {
  let result;
  try {
    result = await execFileAsync(
      oxlintBin,
      [
        "--config",
        path.join(root, "oxlint.config.mjs"),
        "--format",
        "json",
        ...(flag ? [flag] : []),
        root,
      ],
      { cwd: root, maxBuffer: 5_000_000 }
    );
  } catch (error) {
    assert.equal(error.code, 1, error.stderr);
    result = error;
  }
  const diagnostics = JSON.parse(result.stdout).diagnostics;
  assert.ok(
    diagnostics.every((item) =>
      [
        "howells(no-array-method-this-argument)",
        "unicorn(no-array-method-this-argument)",
      ].includes(item.code)
    ),
    result.stdout
  );
  return diagnostics;
}

function assertCounts(cases, diagnostics) {
  const counts = new Map();
  for (const item of diagnostics) {
    const name = path.basename(item.filename, ".ts");
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const [name, source, expected] of cases)
    assert.equal(counts.get(name) ?? 0, expected, `${name}: ${source}`);
}

function resolvedRules(preset, rules = {}) {
  for (const extended of preset.extends ?? []) resolvedRules(extended, rules);
  Object.assign(rules, preset.rules ?? {});
  return rules;
}

test("all inherited presets replace only the native array thisArg rule", () => {
  for (const preset of [core, react, next, playwright]) {
    const rules = resolvedRules(preset);
    assert.equal(rules[ruleName], "error");
    assert.equal(rules[nativeRuleName], "off");
    assert.equal(rules["typescript/strict-void-return"], "error");
    assert.equal(rules["typescript/no-floating-promises"], "error");
  }
});

test("native matcher parity covers upstream fixtures and callback, spread, computed and optional forms", async (t) => {
  const cases = [...upstreamCases, ...edgeCases, ...syntaxCases].map(
    ([source, count], index) => [`parity-${index}`, source, count]
  );
  const root = await fixture(t, cases);
  await writeConfig(root, nativeRuleName);
  const native = await lint(root);
  assertCounts(cases, native);
  await writeConfig(root);
  const shared = await lint(root);
  assertCounts(cases, shared);
  for (const item of shared) {
    const counterpart = native.find(
      (diagnostic) => diagnostic.filename === item.filename
    );
    const source = cases.find(([name]) => `${name}.ts` === item.filename)[1];
    const sharedSpan = item.labels[0].span;
    const nativeSpan = counterpart.labels[0].span;
    // ESTree omits wrapping parentheses from expression ranges; Oxc includes
    // them in native labels. Both must identify the same argument expression.
    const content = (span) =>
      source
        .slice(span.offset, span.offset + span.length)
        .replace(/[()\s]/gu, "");
    assert.equal(content(sharedSpan), content(nativeSpan), source);
  }
  for (const flag of ["--fix", "--fix-dangerously"]) {
    assertCounts(cases, await lint(root, flag));
    for (const [name, source] of cases)
      assert.equal(
        await readFile(path.join(root, `${name}.ts`), "utf8"),
        source,
        `${flag}: ${name}`
      );
  }
});

test("stream exemptions require lexical builtin identity and reject mutation or escape", async (t) => {
  const root = await fixture(t, receiverCases);
  await writeConfig(root);
  assertCounts(receiverCases, await lint(root));
  for (const flag of ["--fix", "--fix-dangerously"]) {
    assertCounts(receiverCases, await lint(root, flag));
    for (const [name, source] of receiverCases)
      assert.equal(
        await readFile(path.join(root, `${name}.ts`), "utf8"),
        source,
        `${flag}: ${name}`
      );
  }
  // The native opt-in stays available with its original receiver behavior.
  await writeConfig(root, nativeRuleName);
  const native = await lint(root);
  assert.equal(
    native.filter((item) => path.basename(item.filename) === "named.ts").length,
    1
  );
});

test("Node's unchanged map API preserves concurrency, yield order and mapper errors", async () => {
  let active = 0;
  let maximum = 0;
  const completed = [];
  const indices = [0, 1, 2, 3, 4, 5, 6, 7];
  const readShard = async (index) => {
    active += 1;
    maximum = Math.max(maximum, active);
    await setTimeout(index === 0 ? 40 : 1);
    completed.push(index);
    active -= 1;
    return index;
  };
  const stream = Readable.from(indices).map(readShard, { concurrency: 4 });
  assert.deepEqual(await stream.toArray(), indices);
  assert.equal(maximum, 4);
  assert.notDeepEqual(completed, indices);
  const failure = new Error("shard failed");
  const failed = Readable.from(indices).map(
    async () => {
      throw failure;
    },
    { concurrency: 4 }
  );
  await assert.rejects(failed.toArray(), (error) => error === failure);
  assert.equal(failed.destroyed, true);
});

// Upstream fixtures from Oxc oxlint_v1.86.0, no_array_method_this_argument.rs.
// https://github.com/oxc-project/oxc/blob/oxlint_v1.86.0/crates/oxc_linter/src/rules/unicorn/no_array_method_this_argument.rs
/*
MIT License

Copyright (c) 2024-present VoidZero Inc. & Contributors
Copyright (c) 2023 Boshen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
const upstreamCases = [
  ["array.unknownMethod(() => {}, thisArgument)", 0],
  ["new array.map(() => {}, thisArgument)", 0],
  ["array.map?.(() => {}, thisArgument)", 0],
  ["Array.unknownMethod(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["new Array.from(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["Array.from?.(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["Array?.from(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["NotArray.from(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["new Array.fromAsync(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["Array.fromAsync?.(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["Array?.fromAsync(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["NotArray.fromAsync(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["array.map()", 0],
  ["array.map(() => {},)", 0],
  ["array.map(() => {}, ...thisArgument)", 0],
  ["array.map(...() => {}, thisArgument)", 0],
  ["array.map(() => {}, thisArgument, extraArgument)", 0],
  ["Array?.from(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["Array.from()", 0],
  ["Array.from(iterableOrArrayLike)", 0],
  ["Array.from(iterableOrArrayLike, () => {},)", 0],
  ["Array.from(iterableOrArrayLike, () => {}, ...thisArgument)", 0],
  ["Array.from(iterableOrArrayLike, ...() => {}, thisArgument)", 0],
  ["Array.from(...iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["Array.from(iterableOrArrayLike, () => {}, thisArgument, extraArgument)", 0],
  ["Array.fromAsync()", 0],
  ["Array.fromAsync(iterableOrArrayLike)", 0],
  ["Array.fromAsync(iterableOrArrayLike, () => {},)", 0],
  ["Array.fromAsync(iterableOrArrayLike, () => {}, ...thisArgument)", 0],
  ["Array.fromAsync(iterableOrArrayLike, ...() => {}, thisArgument)", 0],
  ["Array.fromAsync(...iterableOrArrayLike, () => {}, thisArgument)", 0],
  [
    "Array.fromAsync(iterableOrArrayLike, () => {}, thisArgument, extraArgument)",
    0,
  ],
  ["Array?.fromAsync(iterableOrArrayLike, () => {}, thisArgument)", 0],
  ["lodash.every(array, () => {})", 0],
  ["lodash.find(array, () => {})", 0],
  ["jQuery.map(array, () => {})", 0],
  ["$.map(array, () => {})", 0],
  ["React.Children.map(children, () => {})", 0],
  ["Children.map(children, () => {})", 0],
  ["React.Children.forEach(children, () => {})", 0],
  ["Children.forEach(children, () => {})", 0],
  ['Vue.filter("capitalize", () => {})', 0],
  ["R.filter(() => {}, [])", 0],
  ["R.find(() => {}, [])", 0],
  ["R.findIndex(() => {}, [])", 0],
  ["R.forEach(() => {}, [])", 0],
  ["R.map(() => {}, [])", 0],
  ['$( "li" ).filter( ":nth-child(2n)" ).css( "background-color", "red" );', 0],
  ['$( "li.item-ii" ).find( "li" ).css( "background-color", "red" );', 0],
  ["array.map(new Callback, thisArgument)", 0],
  ["array.map(1, thisArgument)", 0],
  ["async () => array.map(await callback, thisArgument)", 0],
  ["Array.from(iterableOrArrayLike, new Callback, thisArgument)", 0],
  ["Array.fromAsync(iterableOrArrayLike, new Callback, thisArgument)", 0],
  ["Array.from(iterableOrArrayLike, 1, thisArgument)", 0],
  ["Array.fromAsync(iterableOrArrayLike, 1, thisArgument)", 0],
  [
    "async () => Array.from(iterableOrArrayLike, await callback, thisArgument)",
    0,
  ],
  [
    "async () => Array.fromAsync(iterableOrArrayLike, await callback, thisArgument)",
    0,
  ],
  ["array.every(() => {}, thisArgument)", 1],
  ["array.filter(() => {}, thisArgument)", 1],
  ["array.find(() => {}, thisArgument)", 1],
  ["array.findIndex(() => {}, thisArgument)", 1],
  ["array.findLast(() => {}, thisArgument)", 1],
  ["array.findLastIndex(() => {}, thisArgument)", 1],
  ["array.flatMap(() => {}, thisArgument)", 1],
  ["array.forEach(() => {}, thisArgument)", 1],
  ["array.map(() => {}, thisArgument)", 1],
  ["array?.map(() => {}, thisArgument)", 1],
  ["Array.from(iterableOrArrayLike, () => {}, thisArgument)", 1],
  ["Array.fromAsync(iterableOrArrayLike, () => {}, thisArgument)", 1],
  ["array.map(() => {}, thisArgument,)", 1],
  ["array.map(() => {}, (0, thisArgument),)", 1],
  ["Array.from(iterableOrArrayLike, () => {}, thisArgument,)", 1],
  ["Array.fromAsync(iterableOrArrayLike, () => {}, thisArgument,)", 1],
  ["array.map(() => {}, thisArgumentHasSideEffect())", 1],
  ["array?.map(() => {}, thisArgumentHasSideEffect())", 1],
  ["Array.from(iterableOrArrayLike, () => {}, thisArgumentHasSideEffect())", 1],
  [
    "Array.fromAsync(iterableOrArrayLike, () => {}, thisArgumentHasSideEffect())",
    1,
  ],
  ["array.map(callback, thisArgument)", 1],
  ["Array.from(iterableOrArrayLike, callback, thisArgument)", 1],
  ["Array.fromAsync(iterableOrArrayLike, callback, thisArgument)", 1],
  ["array.map(callback, (0, thisArgument))", 1],
  ["Array.from(iterableOrArrayLike, callback, (0, thisArgument))", 1],
  ["Array.fromAsync(iterableOrArrayLike, callback, (0, thisArgument))", 1],
  ["array.map(function () {}, thisArgument)", 1],
  ["Array.from(iterableOrArrayLike, function () {}, thisArgument)", 1],
  ["array.map(function callback () {}, thisArgument)", 1],
  ["Array.from(iterableOrArrayLike, function callback () {}, thisArgument)", 1],
  [
    "Array.fromAsync(iterableOrArrayLike, function callback () {}, thisArgument)",
    1,
  ],
  ["array.map( foo as bar, (( thisArgument )),)", 1],
  ["Array.from(iterableOrArrayLike, foo as bar, (( thisArgument )),)", 1],
  ["Array.fromAsync(iterableOrArrayLike, foo as bar, (( thisArgument )),)", 1],
  ["array.map( (( foo as bar )), (( thisArgument )),)", 1],
  ["Array.from(iterableOrArrayLike, (( foo as bar )), (( thisArgument )),)", 1],
  [
    "Array.fromAsync(iterableOrArrayLike, (( foo as bar )), (( thisArgument )),)",
    1,
  ],
  ["array.map( (( 0, callback )), (( thisArgument )),)", 1],
  [
    "Array.from(iterableOrArrayLike, (( 0, callback )), (( thisArgument )),)",
    1,
  ],
  [
    "Array.fromAsync(iterableOrArrayLike, (( 0, callback )), (( thisArgument )),)",
    1,
  ],
  ["array.map((0, () => {}), thisArgument)", 1],
  ["Array.from(iterableOrArrayLike, (0, () => {}), thisArgument)", 1],
  ["Array.fromAsync(iterableOrArrayLike, (0, () => {}), thisArgument)", 1],
  ["array.map(callback.bind(foo), thisArgument)", 1],
  ["Array.from(iterableOrArrayLike, callback.bind(foo), thisArgument)", 1],
  ["Array.fromAsync(iterableOrArrayLike, callback.bind(foo), thisArgument)", 1],
];

const edgeCases = [
  ['array["map"](callback, context)', 1],
  ["array[`map`](callback, context)", 1],
  ["array[method](callback, context)", 0],
  ['array?.["map"](callback, context)', 1],
  ['Array["from"](input, callback, context)', 1],
  ["Array[`fromAsync`](input, callback, context)", 1],
  ["array.map(true, context)", 1],
  ["array.map(false, context)", 1],
  ["array.map(null, context)", 0],
  ["array.map(/x/, context)", 0],
  ["array.map(1n, context)", 0],
  ['array.map("x", context)', 0],
  ["array.map(`x`, context)", 0],
  ["array.map(a + b, context)", 0],
  ["array.map(a && b, context)", 1],
  ["array.map(a || b, context)", 1],
  ["array.map(a ?? b, context)", 1],
  ["array.map(a ? b : c, context)", 1],
  ["array.map(undefined, context)", 0],
  ["array.map(callback(), context)", 0],
  ['array.map(callback["bind"](x), context)', 1],
  ["array.map(callback.bind(x), context)", 1],
  ["array.map(...callbacks, context)", 0],
  ["array.map(callback, ...contexts)", 0],
  ["array.map(callback, undefined)", 1],
  ["Array.from(input, undefined, context)", 0],
  ["Array.from(input, true, context)", 1],
  ["array?.map(callback, context)", 1],
  ["array.map?.(callback, context)", 0],
  ['array["map"]?.(callback, context)', 0],
];

// Additional native parity: ESTree parentheses, TS wrappers and library paths.
const syntaxCases = [
  ['array[("map")](callback, context)', 0],
  ['array[("map")](1, context)', 0],
  ['array[("map")]((1), context)', 0],
  ['array[("map")](callback.bind(context), context)', 0],
  ['array[("map")]((callback.bind as Fn)(context), context)', 0],
  ["array[(`map`)](callback, context)", 0],
  ["array[(`map`)](1, context)", 0],
  ["array[(`map`)]((1), context)", 0],
  ["array[(`map`)](callback.bind(context), context)", 0],
  ["array[(`map`)]((callback.bind as Fn)(context), context)", 0],
  ['array[(("map"))](callback, context)', 0],
  ['array[(("map"))](1, context)', 0],
  ['array[(("map"))]((1), context)', 0],
  ['array[(("map"))](callback.bind(context), context)', 0],
  ['array[(("map"))]((callback.bind as Fn)(context), context)', 0],
  ['array["m"+"ap"](callback, context)', 0],
  ['array["m"+"ap"](1, context)', 0],
  ['array["m"+"ap"]((1), context)', 0],
  ['array["m"+"ap"](callback.bind(context), context)', 0],
  ['array["m"+"ap"]((callback.bind as Fn)(context), context)', 0],
  ['array[("m"+"ap")](callback, context)', 0],
  ['array[("m"+"ap")](1, context)', 0],
  ['array[("m"+"ap")]((1), context)', 0],
  ['array[("m"+"ap")](callback.bind(context), context)', 0],
  ['array[("m"+"ap")]((callback.bind as Fn)(context), context)', 0],
  ["(array.map as Callback)(callback, context)", 1],
  ["(array.map as Callback)(1, context)", 0],
  ["(array.map as Callback)((1), context)", 1],
  ["(array.map as Callback)(callback.bind(context), context)", 1],
  ["(array.map as Callback)((callback.bind as Fn)(context), context)", 1],
  ["(array.map satisfies Callback)(callback, context)", 1],
  ["(array.map satisfies Callback)(1, context)", 0],
  ["(array.map satisfies Callback)((1), context)", 1],
  ["(array.map satisfies Callback)(callback.bind(context), context)", 1],
  [
    "(array.map satisfies Callback)((callback.bind as Fn)(context), context)",
    1,
  ],
  ["array.map!(callback, context)", 1],
  ["array.map!(1, context)", 0],
  ["array.map!((1), context)", 1],
  ["array.map!(callback.bind(context), context)", 1],
  ["array.map!((callback.bind as Fn)(context), context)", 1],
  ["(array.map<Callback>)(callback, context)", 1],
  ["(array.map<Callback>)(1, context)", 0],
  ["(array.map<Callback>)((1), context)", 1],
  ["(array.map<Callback>)(callback.bind(context), context)", 1],
  ["(array.map<Callback>)((callback.bind as Fn)(context), context)", 1],
  ["Array!.from(input, callback, context)", 1],
  ["Array!.from(input, 1, context)", 0],
  ["Array!.from(input, (1), context)", 1],
  ["Array!.from(input, callback.bind(context), context)", 1],
  ["Array!.from(input, (callback.bind as Fn)(context), context)", 1],
  ["(Array as Constructor).from(input, callback, context)", 1],
  ["(Array as Constructor).from(input, 1, context)", 0],
  ["(Array as Constructor).from(input, (1), context)", 1],
  ["(Array as Constructor).from(input, callback.bind(context), context)", 1],
  [
    "(Array as Constructor).from(input, (callback.bind as Fn)(context), context)",
    1,
  ],
  ["(Array satisfies Constructor).from(input, callback, context)", 1],
  ["(Array satisfies Constructor).from(input, 1, context)", 0],
  ["(Array satisfies Constructor).from(input, (1), context)", 1],
  [
    "(Array satisfies Constructor).from(input, callback.bind(context), context)",
    1,
  ],
  [
    "(Array satisfies Constructor).from(input, (callback.bind as Fn)(context), context)",
    1,
  ],
  ["(Array.from as Fn)(input, callback, context)", 1],
  ["(Array.from as Fn)(input, 1, context)", 0],
  ["(Array.from as Fn)(input, (1), context)", 1],
  ["(Array.from as Fn)(input, callback.bind(context), context)", 1],
  ["(Array.from as Fn)(input, (callback.bind as Fn)(context), context)", 1],
  ["(Array?.from as Fn)(input, callback, context)", 1],
  ["(Array?.from as Fn)(input, 1, context)", 0],
  ["(Array?.from as Fn)(input, (1), context)", 1],
  ["(Array?.from as Fn)(input, callback.bind(context), context)", 1],
  ["(Array?.from as Fn)(input, (callback.bind as Fn)(context), context)", 1],
  ['Array["from"](input, callback, context)', 1],
  ['Array["from"](input, 1, context)', 0],
  ['Array["from"](input, (1), context)', 1],
  ['Array["from"](input, callback.bind(context), context)', 1],
  ['Array["from"](input, (callback.bind as Fn)(context), context)', 1],
  ['Array[("from")](input, callback, context)', 0],
  ['Array[("from")](input, 1, context)', 0],
  ['Array[("from")](input, (1), context)', 0],
  ['Array[("from")](input, callback.bind(context), context)', 0],
  ['Array[("from")](input, (callback.bind as Fn)(context), context)', 0],
  ["globalThis.Array.from(input, callback, context)", 0],
  ["globalThis.Array.from(input, 1, context)", 0],
  ["globalThis.Array.from(input, (1), context)", 0],
  ["globalThis.Array.from(input, callback.bind(context), context)", 0],
  ["globalThis.Array.from(input, (callback.bind as Fn)(context), context)", 0],
  ["(globalThis.Array as T).from(input, callback, context)", 0],
  ["(globalThis.Array as T).from(input, 1, context)", 0],
  ["(globalThis.Array as T).from(input, (1), context)", 0],
  ["(globalThis.Array as T).from(input, callback.bind(context), context)", 0],
  [
    "(globalThis.Array as T).from(input, (callback.bind as Fn)(context), context)",
    0,
  ],
  ['_["map"](callback, context)', 1],
  ['_["map"](1, context)', 0],
  ['_["map"]((1), context)', 1],
  ['_["map"](callback.bind(context), context)', 1],
  ['_["map"]((callback.bind as Fn)(context), context)', 1],
  ["(_ as X).map(callback, context)", 0],
  ["(_ as X).map(1, context)", 0],
  ["(_ as X).map((1), context)", 0],
  ["(_ as X).map(callback.bind(context), context)", 0],
  ["(_ as X).map((callback.bind as Fn)(context), context)", 0],
  ["(React.Children as Any).map(callback, context)", 0],
  ["(React.Children as Any).map(1, context)", 0],
  ["(React.Children as Any).map((1), context)", 0],
  ["(React.Children as Any).map(callback.bind(context), context)", 0],
  ["(React.Children as Any).map((callback.bind as Fn)(context), context)", 0],
  ['React["Children"][("map")](callback, context)', 0],
  ['React["Children"][("map")](1, context)', 0],
  ['React["Children"][("map")]((1), context)', 0],
  ['React["Children"][("map")](callback.bind(context), context)', 0],
  ['React["Children"][("map")]((callback.bind as Fn)(context), context)', 0],
  ["(React.Children.map as Callback)(callback, context)", 1],
  ["(React.Children.map as Callback)(1, context)", 0],
  ["(React.Children.map as Callback)((1), context)", 1],
  ["(React.Children.map as Callback)(callback.bind(context), context)", 1],
  [
    "(React.Children.map as Callback)((callback.bind as Fn)(context), context)",
    1,
  ],
  ["array.map((1), context)", 1],
  ["array.map(((1)), context)", 1],
  ["array.map((null), context)", 1],
  ["array.map(((null)), context)", 1],
  ["array.map((undefined), context)", 1],
  ["array.map(((undefined)), context)", 1],
  ['array.map(("text"), context)', 1],
  ['array.map((("text")), context)', 1],
  ["array.map((`text`), context)", 1],
  ["array.map(((`text`)), context)", 1],
  ["array.map(([]), context)", 1],
  ["array.map((([])), context)", 1],
  ["array.map((class {}), context)", 1],
  ["array.map(((class {})), context)", 1],
  ["array.map((callback()), context)", 1],
  ["array.map(((callback())), context)", 1],
  ["array.map((callback[key](value)), context)", 1],
  ["array.map(((callback[key](value))), context)", 1],
  ["async () => (array.map((await callback), context))", 1],
  ["async () => (array.map(((await callback)), context))", 1],
  ["array.map((new Callback), context)", 1],
  ["array.map(((new Callback)), context)", 1],
  ["array.map((this), context)", 1],
  ["array.map(((this)), context)", 1],
  ["array.map((!value), context)", 1],
  ["array.map(((!value)), context)", 1],
  ["array.map((a+b), context)", 1],
  ["array.map(((a+b)), context)", 1],
];
