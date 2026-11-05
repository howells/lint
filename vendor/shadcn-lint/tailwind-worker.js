import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { workerData } from "node:worker_threads";

import {
  S as resolveStylesheetImport,
  Z as splitVariants,
  t as didYouMean,
  u as parseImports,
} from "./similar.js";

/*
 * Vendored from @shadcn/lint 0.2.5 (MIT, see LICENSE beside this file).
 * Loaded by index.js. Refresh it the way AGENTS.md describes, never by
 * editing it here.
 */
//#region src/tailwind/oracle.ts
const SIGNATURE_TTL = 1e3;
const FONT_SIZE = /(?:^|[;{\s])font-size\s*:/;
const MAX_CANDIDATE_LENGTH = 1e4;
const MAX_VARIANTS = 64;
const loaded = /* @__PURE__ */ new Map();
let generations = 0;
function resolveFrom(base, id) {
  return createRequire(path.join(base, "noop.js")).resolve(id);
}
function* tailwindImporters(cssFile) {
  const seen = /* @__PURE__ */ new Set();
  const queue = [cssFile];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    let css;
    try {
      css = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    for (const id of parseImports(css)) {
      if (id === "tailwindcss" || id.startsWith("tailwindcss/")) {
        yield path.dirname(file);
        continue;
      }
      const resolved = resolveStylesheetImport(path.dirname(file), id);
      if (resolved) queue.push(realpathOf(resolved));
    }
  }
}
function* tailwindBases(cssFile) {
  yield path.dirname(cssFile);
  yield* tailwindImporters(cssFile);
  yield process.cwd();
}
async function loadTailwind(cssFile) {
  for (const from of tailwindBases(cssFile)) {
    let resolved;
    try {
      resolved = resolveFrom(from, "tailwindcss");
    } catch {
      continue;
    }
    const mod = await import(pathToFileURL(resolved).href);
    const api =
      typeof mod.__unstable__loadDesignSystem === "function"
        ? mod
        : typeof mod.default?.__unstable__loadDesignSystem === "function"
          ? mod.default
          : null;
    if (api)
      return {
        api,
        resolved,
      };
    throw new Error(
      `${resolved} is not Tailwind v4 (no __unstable__loadDesignSystem)`
    );
  }
  return null;
}
async function loadNodeLoader(cssFile, tailwind) {
  const bases = [...tailwindBases(cssFile), path.dirname(realpathOf(tailwind))];
  for (const from of bases) {
    let resolved;
    try {
      resolved = resolveFrom(from, "@tailwindcss/node");
    } catch {
      continue;
    }
    try {
      const mod = await import(pathToFileURL(resolved).href);
      const loader = mod.loadModule ?? mod.default?.loadModule;
      if (typeof loader === "function") return loader;
    } catch {}
  }
  return null;
}
async function importModule(id, base) {
  const resolved = resolveFrom(base, id);
  const url = pathToFileURL(resolved);
  url.searchParams.set("mtime", String(mtimeOf(resolved)));
  const mod = await import(url.href);
  return {
    path: resolved,
    base: path.dirname(resolved),
    module: mod.default ?? mod,
  };
}
function realpathOf(file) {
  try {
    return fs.realpathSync.native(file);
  } catch {
    return file;
  }
}
function mtimeOf(file) {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return null;
  }
}
function signatureOf(files) {
  return files.map((file) => `${file}:${mtimeOf(file) ?? "missing"}`).join("|");
}
async function build(cssFile) {
  const dir = path.dirname(cssFile);
  const tailwind = await loadTailwind(cssFile);
  if (!tailwind)
    throw new Error(`tailwindcss v4 could not be resolved from ${dir}`);
  let loader;
  const files = [cssFile];
  let modules = 0;
  const css = fs.readFileSync(cssFile, "utf-8");
  const ds = await tailwind.api.__unstable__loadDesignSystem(css, {
    base: dir,
    async loadStylesheet(id, base) {
      if (/^(?:https?:|data:)/.test(id))
        return {
          base,
          content: "",
        };
      const resolved = resolveStylesheetImport(base, id);
      if (!resolved)
        throw new Error(`@import "${id}" could not be resolved from ${base}`);
      const file = realpathOf(resolved);
      files.push(file);
      return {
        base: path.dirname(file),
        content: fs.readFileSync(file, "utf-8"),
      };
    },
    async loadModule(id, base) {
      modules++;
      if (loader === void 0)
        loader = await loadNodeLoader(cssFile, tailwind.resolved);
      const result = loader
        ? await loader(id, base, (file) => files.push(file))
        : await importModule(id, base);
      files.push(result.path);
      return {
        base: result.base,
        module: result.module,
      };
    },
  });
  const variants = ds.getVariants();
  return {
    ds,
    files,
    modules,
    prefix: ds.theme?.prefix ?? null,
    signature: signatureOf(files),
    checkedAt: Date.now(),
    generation: ++generations,
    classNames: null,
    staticVariants: variants
      .filter((v) => !v.isArbitrary && !v.values.length)
      .map((v) => v.name),
    functionalVariants: variants
      .filter((v) => v.isArbitrary || v.values.length)
      .map((v) => v.name),
  };
}
async function designSystemFor(cssFile) {
  const cached = loaded.get(cssFile);
  const now = Date.now();
  if (cached) {
    if (now - cached.checkedAt < SIGNATURE_TTL) return cached;
    if (signatureOf(cached.files) === cached.signature) {
      cached.checkedAt = now;
      return cached;
    }
  }
  const fresh = await build(cssFile);
  loaded.set(cssFile, fresh);
  return fresh;
}
function classNamesOf(system) {
  if (!system.classNames)
    system.classNames = system.ds
      .getClassList()
      .map((entry) => (Array.isArray(entry) ? entry[0] : entry));
  return system.classNames;
}
function variantKnown(system, variant) {
  const name = variant.replace(/\/.*$/, "");
  if (name.startsWith("[") || name.startsWith("@")) return true;
  if (system.staticVariants.includes(name)) return true;
  return system.functionalVariants.some(
    (prefix) => name === prefix || name.startsWith(`${prefix}-`)
  );
}
function checkable(candidate) {
  return (
    candidate.length <= MAX_CANDIDATE_LENGTH &&
    splitVariants(candidate).variants.length <= MAX_VARIANTS
  );
}
function cssOf(system, candidate) {
  try {
    return system.ds.candidatesToCss([candidate])[0];
  } catch {
    return;
  }
}
function cssOfAll(system, candidates) {
  try {
    return system.ds.candidatesToCss(candidates);
  } catch {
    return candidates.map((candidate) => cssOf(system, candidate));
  }
}
function suggestionFor(system, candidate) {
  const { variants, base } = splitVariants(candidate);
  const prefixed = system.prefix !== null && variants[0] === system.prefix;
  const probe = prefixed ? `${system.prefix}:${base}` : base;
  if (variants.length && typeof cssOf(system, probe) === "string") {
    let changed = false;
    const fixed = variants.map((variant, i) => {
      if (prefixed && i === 0) return variant;
      if (variantKnown(system, variant)) return variant;
      const meant = didYouMean(variant, system.staticVariants, 1);
      if (!meant) return variant;
      changed = true;
      return meant;
    });
    return changed ? [...fixed, base].join(":") : null;
  }
  const bare = base.replace(/^!/, "").replace(/!$/, "").replace(/^-/, "");
  const meant = didYouMean(bare, classNamesOf(system));
  if (!meant) return null;
  const rebuilt = base.replace(bare, meant);
  return [...variants, rebuilt].join(":");
}
function baseKnownOf(system, candidate) {
  const { variants, base } = splitVariants(candidate);
  if (!variants.length) return false;
  const bare =
    system.prefix && variants[0] === system.prefix
      ? `${system.prefix}:${base}`
      : base;
  if (variants.length === (bare === base ? 0 : 1)) return false;
  return typeof cssOf(system, bare) === "string";
}
async function query(cssFile, candidates) {
  let system;
  try {
    system = await designSystemFor(cssFile);
  } catch (error) {
    return {
      ok: false,
      reason: error.message,
    };
  }
  const checked = candidates.filter(checkable);
  const css = cssOfAll(system, checked);
  const unknown = [];
  const fontSizes = [];
  for (let i = 0; i < checked.length; i++) {
    if (css[i] === void 0) continue;
    if (css[i] !== null) {
      if (FONT_SIZE.test(css[i])) fontSizes.push(checked[i]);
      continue;
    }
    unknown.push({
      token: checked[i],
      suggestion: suggestionFor(system, checked[i]),
      baseKnown: baseKnownOf(system, checked[i]),
    });
  }
  return {
    ok: true,
    generation: system.generation,
    hasModules: system.modules > 0,
    unknown,
    fontSizes,
  };
}

//#endregion
//#region src/tailwind/worker.ts
const port = workerData.port;
port.on("message", async ({ id, cssFile, candidates, shared }) => {
  let answer;
  try {
    answer = await query(cssFile, candidates);
  } catch (error) {
    answer = {
      ok: false,
      reason: error.message,
    };
  }
  port.postMessage({
    id,
    answer,
  });
  const flag = new Int32Array(shared);
  Atomics.store(flag, 0, 1);
  Atomics.notify(flag, 0);
});

//#endregion
export {};
