import * as fs from "node:fs";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import {
  MessageChannel,
  Worker,
  receiveMessageOnPort,
} from "node:worker_threads";

import { mergeConfigs } from "cn/compiler";
import { defaultConfig } from "cn/config";

import {
  A as colorDistance,
  B as realpath,
  C as projectFor,
  D as packageRoot,
  E as warnOnce,
  F as TTL,
  G as isArbitraryValue$1,
  H as lengthInPx,
  I as dirOf,
  J as normalizeClass,
  K as isMarkerClass,
  L as isFile,
  M as parseColor,
  N as withoutVariableChannelColors,
  O as resolveFile,
  P as NODE_MODULES,
  Q as withBase,
  R as memoize,
  T as uiDirectory,
  U as COLOR_PREFIX,
  V as formatPx,
  W as OPACITY_MODIFIER,
  X as splitClasses,
  Y as replaceClass,
  Z as splitVariants,
  _ as themeFileFor,
  a as declaresClass,
  b as utilityPrefixesOf,
  c as moduleThemeEntryFor,
  d as scaleFor,
  f as scopedColorTokensFor,
  g as tailwindPrefixFor,
  h as tailwindEntryFor,
  i as colorValuesFor,
  j as isNamedColor,
  k as PALETTE,
  l as parseClassSelectors,
  m as spacingBaseFor,
  n as editDistance,
  o as declaresUtility,
  p as setThemeImports,
  q as isPaletteClass,
  r as colorTokensFor,
  s as knownClassesFor,
  t as didYouMean,
  v as themeScalesFor,
  w as resolveAlias,
  x as utilityPropertiesOf,
  y as themeVocabularyFor,
  z as mtimeOf,
} from "./similar.js";

/*
 * Vendored from @shadcn/lint 0.2.5 (MIT, see LICENSE beside this file).
 * Oxlint runs it through its JS-plugin bridge. The published package depends
 * on `@typescript-eslint/parser`, which declares ESLint as a required peer,
 * so pnpm installs ESLint in every consumer; this copy parses with
 * `oxc-parser` and never reaches that fallback, so nothing installs ESLint.
 * Refresh it the way AGENTS.md describes, never by editing it here.
 */
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
  let target = {};
  for (var name in all) {
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
    });
  }
  if (!no_symbols) {
    __defProp(target, Symbol.toStringTag, { value: "Module" });
  }
  return target;
};

//#endregion
//#region src/grammar/categories.ts
const GROUP_CATEGORY = {
  aspect: null,
  container: null,
  "container-type": null,
  "container-named": null,
  contain: null,
  "contain-size": null,
  "contain-layout": null,
  "contain-paint": null,
  "contain-style": null,
  columns: null,
  "break-after": null,
  "break-before": null,
  "break-inside": null,
  "box-decoration": null,
  box: null,
  display: null,
  sr: null,
  float: null,
  clear: null,
  isolation: null,
  "object-fit": null,
  "object-position": null,
  overflow: null,
  "overflow-x": null,
  "overflow-y": null,
  overscroll: null,
  "overscroll-x": null,
  "overscroll-y": null,
  position: null,
  inset: null,
  "inset-x": null,
  "inset-y": null,
  start: null,
  end: null,
  "inset-bs": null,
  "inset-be": null,
  top: null,
  right: null,
  bottom: null,
  left: null,
  visibility: null,
  z: null,
  basis: null,
  "flex-direction": null,
  "flex-wrap": null,
  flex: null,
  grow: null,
  shrink: null,
  order: null,
  "grid-cols": null,
  "col-start-end": null,
  "col-start": null,
  "col-end": null,
  "grid-rows": null,
  "row-start-end": null,
  "row-start": null,
  "row-end": null,
  "grid-flow": null,
  "auto-cols": null,
  "auto-rows": null,
  gap: "spacing",
  "gap-x": "spacing",
  "gap-y": "spacing",
  "justify-content": null,
  "justify-items": null,
  "justify-self": null,
  "align-content": null,
  "align-items": null,
  "align-self": null,
  "place-content": null,
  "place-items": null,
  "place-self": null,
  p: "spacing",
  px: "spacing",
  py: "spacing",
  ps: "spacing",
  pe: "spacing",
  pbs: "spacing",
  pbe: "spacing",
  pt: "spacing",
  pr: "spacing",
  pb: "spacing",
  pl: "spacing",
  m: null,
  mx: null,
  my: null,
  ms: null,
  me: null,
  mbs: null,
  mbe: null,
  mt: null,
  mr: null,
  mb: null,
  ml: null,
  "space-x": "spacing",
  "space-x-reverse": "spacing",
  "space-y": "spacing",
  "space-y-reverse": "spacing",
  size: null,
  "inline-size": null,
  "min-inline-size": null,
  "max-inline-size": null,
  "block-size": null,
  "min-block-size": null,
  "max-block-size": null,
  w: null,
  "min-w": null,
  "max-w": null,
  h: null,
  "min-h": null,
  "max-h": null,
  "font-size": "typography",
  "font-smoothing": "typography",
  "font-style": "typography",
  "font-weight": "typography",
  "font-stretch": "typography",
  "font-family": "typography",
  "font-features": "typography",
  "fvn-normal": "typography",
  "fvn-ordinal": "typography",
  "fvn-slashed-zero": "typography",
  "fvn-figure": "typography",
  "fvn-spacing": "typography",
  "fvn-fraction": "typography",
  tracking: "typography",
  "line-clamp": "typography",
  leading: "typography",
  "list-image": "typography",
  "list-style-position": "typography",
  "list-style-type": "typography",
  "text-alignment": null,
  "placeholder-color": "color",
  "text-color": "color",
  "text-decoration": "typography",
  "text-decoration-style": "typography",
  "text-decoration-thickness": "typography",
  "text-decoration-color": "color",
  "underline-offset": "typography",
  "text-transform": "typography",
  "text-overflow": "typography",
  "text-wrap": "typography",
  indent: "typography",
  "tab-size": null,
  "vertical-align": null,
  whitespace: null,
  break: null,
  wrap: null,
  hyphens: "typography",
  content: null,
  "bg-attachment": "effects",
  "bg-clip": "effects",
  "bg-origin": "effects",
  "bg-position": "effects",
  "bg-repeat": "effects",
  "bg-size": "effects",
  "bg-image": "effects",
  "bg-color": "color",
  "gradient-from-pos": "effects",
  "gradient-via-pos": "effects",
  "gradient-to-pos": "effects",
  "gradient-from": "color",
  "gradient-via": "color",
  "gradient-to": "color",
  rounded: "shape",
  "rounded-s": "shape",
  "rounded-e": "shape",
  "rounded-t": "shape",
  "rounded-r": "shape",
  "rounded-b": "shape",
  "rounded-l": "shape",
  "rounded-ss": "shape",
  "rounded-se": "shape",
  "rounded-ee": "shape",
  "rounded-es": "shape",
  "rounded-tl": "shape",
  "rounded-tr": "shape",
  "rounded-br": "shape",
  "rounded-bl": "shape",
  "border-w": "shape",
  "border-w-x": "shape",
  "border-w-y": "shape",
  "border-w-s": "shape",
  "border-w-e": "shape",
  "border-w-bs": "shape",
  "border-w-be": "shape",
  "border-w-t": "shape",
  "border-w-r": "shape",
  "border-w-b": "shape",
  "border-w-l": "shape",
  "divide-x": "shape",
  "divide-x-reverse": "shape",
  "divide-y": "shape",
  "divide-y-reverse": "shape",
  "border-style": "shape",
  "divide-style": "shape",
  "border-color": "color",
  "border-color-x": "color",
  "border-color-y": "color",
  "border-color-s": "color",
  "border-color-e": "color",
  "border-color-bs": "color",
  "border-color-be": "color",
  "border-color-t": "color",
  "border-color-r": "color",
  "border-color-b": "color",
  "border-color-l": "color",
  "divide-color": "color",
  "outline-style": "shape",
  "outline-offset": "shape",
  "outline-w": "shape",
  "outline-color": "color",
  shadow: "effects",
  "shadow-color": "color",
  "inset-shadow": "effects",
  "inset-shadow-color": "color",
  "ring-w": "shape",
  "ring-w-inset": "shape",
  "ring-color": "color",
  "ring-offset-w": "shape",
  "ring-offset-color": "color",
  "inset-ring-w": "shape",
  "inset-ring-color": "color",
  "text-shadow": "effects",
  "text-shadow-color": "color",
  opacity: "effects",
  "mix-blend": "effects",
  "bg-blend": "effects",
  "mask-clip": "effects",
  "mask-composite": "effects",
  "mask-image-linear-pos": "effects",
  "mask-image-linear-from-pos": "effects",
  "mask-image-linear-to-pos": "effects",
  "mask-image-linear-from-color": "color",
  "mask-image-linear-to-color": "color",
  "mask-image-t-from-pos": "effects",
  "mask-image-t-to-pos": "effects",
  "mask-image-t-from-color": "color",
  "mask-image-t-to-color": "color",
  "mask-image-r-from-pos": "effects",
  "mask-image-r-to-pos": "effects",
  "mask-image-r-from-color": "color",
  "mask-image-r-to-color": "color",
  "mask-image-b-from-pos": "effects",
  "mask-image-b-to-pos": "effects",
  "mask-image-b-from-color": "color",
  "mask-image-b-to-color": "color",
  "mask-image-l-from-pos": "effects",
  "mask-image-l-to-pos": "effects",
  "mask-image-l-from-color": "color",
  "mask-image-l-to-color": "color",
  "mask-image-x-from-pos": "effects",
  "mask-image-x-to-pos": "effects",
  "mask-image-x-from-color": "color",
  "mask-image-x-to-color": "color",
  "mask-image-y-from-pos": "effects",
  "mask-image-y-to-pos": "effects",
  "mask-image-y-from-color": "color",
  "mask-image-y-to-color": "color",
  "mask-image-radial": "effects",
  "mask-image-radial-from-pos": "effects",
  "mask-image-radial-to-pos": "effects",
  "mask-image-radial-from-color": "color",
  "mask-image-radial-to-color": "color",
  "mask-image-radial-shape": "effects",
  "mask-image-radial-size": "effects",
  "mask-image-radial-pos": "effects",
  "mask-image-conic-pos": "effects",
  "mask-image-conic-from-pos": "effects",
  "mask-image-conic-to-pos": "effects",
  "mask-image-conic-from-color": "color",
  "mask-image-conic-to-color": "color",
  "mask-mode": "effects",
  "mask-origin": "effects",
  "mask-position": "effects",
  "mask-repeat": "effects",
  "mask-size": "effects",
  "mask-type": "effects",
  "mask-image": "effects",
  filter: "effects",
  blur: "effects",
  brightness: "effects",
  contrast: "effects",
  "drop-shadow": "effects",
  "drop-shadow-color": "color",
  grayscale: "effects",
  "hue-rotate": "effects",
  invert: "effects",
  saturate: "effects",
  sepia: "effects",
  "backdrop-filter": "effects",
  "backdrop-blur": "effects",
  "backdrop-brightness": "effects",
  "backdrop-contrast": "effects",
  "backdrop-grayscale": "effects",
  "backdrop-hue-rotate": "effects",
  "backdrop-invert": "effects",
  "backdrop-opacity": "effects",
  "backdrop-saturate": "effects",
  "backdrop-sepia": "effects",
  "border-collapse": null,
  "border-spacing": "spacing",
  "border-spacing-x": "spacing",
  "border-spacing-y": "spacing",
  "table-layout": null,
  caption: null,
  transition: "motion",
  "transition-behavior": "motion",
  duration: "motion",
  ease: "motion",
  delay: "motion",
  animate: "motion",
  backface: null,
  perspective: null,
  "perspective-origin": null,
  rotate: null,
  "rotate-x": null,
  "rotate-y": null,
  "rotate-z": null,
  scale: null,
  "scale-x": null,
  "scale-y": null,
  "scale-z": null,
  "scale-3d": null,
  skew: null,
  "skew-x": null,
  "skew-y": null,
  transform: null,
  "transform-origin": null,
  "transform-style": null,
  translate: null,
  "translate-x": null,
  "translate-y": null,
  "translate-z": null,
  "translate-none": null,
  zoom: null,
  accent: "color",
  appearance: null,
  "caret-color": "color",
  "color-scheme": null,
  cursor: null,
  "field-sizing": null,
  "pointer-events": null,
  resize: null,
  "scroll-behavior": null,
  "scrollbar-thumb-color": "color",
  "scrollbar-track-color": "color",
  "scrollbar-gutter": null,
  "scrollbar-w": null,
  "scroll-m": null,
  "scroll-mx": null,
  "scroll-my": null,
  "scroll-ms": null,
  "scroll-me": null,
  "scroll-mbs": null,
  "scroll-mbe": null,
  "scroll-mt": null,
  "scroll-mr": null,
  "scroll-mb": null,
  "scroll-ml": null,
  "scroll-p": null,
  "scroll-px": null,
  "scroll-py": null,
  "scroll-ps": null,
  "scroll-pe": null,
  "scroll-pbs": null,
  "scroll-pbe": null,
  "scroll-pt": null,
  "scroll-pr": null,
  "scroll-pb": null,
  "scroll-pl": null,
  "snap-align": null,
  "snap-stop": null,
  "snap-type": null,
  "snap-strictness": null,
  touch: null,
  "touch-x": null,
  "touch-y": null,
  "touch-pz": null,
  select: null,
  "will-change": null,
  fill: "color",
  "stroke-w": "shape",
  stroke: "color",
  "forced-color-adjust": null,
};
const ARBITRARY_PROPERTY_RULES = [
  [
    /(?:^|-)color$|^(?:background|fill|stroke|--tw-(?:gradient-(?:from|via|to)|shadow-color|ring-color|inset-ring-color|inset-shadow-color)|--tw-.*-color)$/,
    "color",
  ],
  [/^(?:padding|gap$|row-gap$|column-gap$)/, "spacing"],
  [
    /^(?:font|letter-spacing$|line-height$|text-decoration|text-transform$|text-indent$|text-underline|word-spacing$|list-style)/,
    "typography",
  ],
  [
    /^(?:border(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?(?:-(?:width|style|radius))?$|border-.*-radius$|outline|--tw-ring-width$|--tw-ring-inset$)/,
    "shape",
  ],
  [
    /^(?:box-shadow|text-shadow|opacity|filter|backdrop-filter|mix-blend-mode|background-blend-mode|--tw-(?:shadow|inset-shadow|drop-shadow|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|backdrop-.*)$)/,
    "effects",
  ],
  [
    /^(?:transition|animation|--tw-(?:duration|ease|delay)$|--tw-(?:enter|exit|animation)-)/,
    "motion",
  ],
];
const ARBITRARY_PREFIX = "arbitrary..";
function propertyGroup(property) {
  return ARBITRARY_PREFIX + property;
}
const CATEGORIES = [
  "color",
  "typography",
  "spacing",
  "shape",
  "effects",
  "motion",
];
function categoryOf(groupId) {
  if (groupId === null) return null;
  if (groupId.startsWith(ARBITRARY_PREFIX)) {
    const property = groupId.slice(11);
    for (const [pattern, category] of ARBITRARY_PROPERTY_RULES)
      if (pattern.test(property)) return category;
    return null;
  }
  return GROUP_CATEGORY[groupId] ?? null;
}

//#endregion
//#region src/grammar/validators.ts
var validators_exports = /* @__PURE__ */ __exportAll({
  isAny: () => isAny,
  isAnyNonArbitrary: () => isAnyNonArbitrary,
  isArbitraryFamilyName: () => isArbitraryFamilyName,
  isArbitraryImage: () => isArbitraryImage,
  isArbitraryLength: () => isArbitraryLength,
  isArbitraryNumber: () => isArbitraryNumber,
  isArbitraryPosition: () => isArbitraryPosition,
  isArbitraryShadow: () => isArbitraryShadow,
  isArbitrarySize: () => isArbitrarySize,
  isArbitraryValue: () => isArbitraryValue,
  isArbitraryVariable: () => isArbitraryVariable,
  isArbitraryVariableFamilyName: () => isArbitraryVariableFamilyName,
  isArbitraryVariableImage: () => isArbitraryVariableImage,
  isArbitraryVariableLength: () => isArbitraryVariableLength,
  isArbitraryVariablePosition: () => isArbitraryVariablePosition,
  isArbitraryVariableShadow: () => isArbitraryVariableShadow,
  isArbitraryVariableSize: () => isArbitraryVariableSize,
  isArbitraryVariableWeight: () => isArbitraryVariableWeight,
  isArbitraryWeight: () => isArbitraryWeight,
  isFraction: () => isFraction,
  isInteger: () => isInteger,
  isNamedContainerQuery: () => isNamedContainerQuery,
  isNumber: () => isNumber,
  isPercent: () => isPercent,
  isTshirtSize: () => isTshirtSize,
});
const arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
const arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
const fractionRegex = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/;
const tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
const lengthUnitRegex =
  /\d(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|^0$/;
const lengthFunctionRegex = /\b(calc|min|max|clamp)\(/;
const colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
const shadowRegex = /^(inset_)?-?((\d*\.)?\d+[a-z]+|0)_-?((\d*\.)?\d+[a-z]+|0)/;
const imageRegex =
  /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
const isFraction = (v) => fractionRegex.test(v);
const isNumber = (v) => !!v && !Number.isNaN(Number(v));
const isInteger = (v) => !!v && Number.isInteger(Number(v));
const isPercent = (v) => v.endsWith("%") && isNumber(v.slice(0, -1));
const isTshirtSize = (v) => tshirtUnitRegex.test(v);
const isAny = () => true;
const isLengthFunction = (v) => {
  const match = lengthFunctionRegex.exec(v);
  return !!match && v.includes(")", match.index + match[0].length + 1);
};
const isLengthOnly = (v) =>
  (lengthUnitRegex.test(v) || isLengthFunction(v)) &&
  !colorFunctionRegex.test(v);
const isNever = () => false;
const isShadow = (v) => shadowRegex.test(v);
const isImage = (v) => imageRegex.test(v);
const isAnyNonArbitrary = (v) =>
  !isArbitraryValue(v) && !isArbitraryVariable(v);
const isNamedContainerQuery = (v) =>
  v.startsWith("@container") &&
  ((v[10] === "/" && v[11] !== void 0) ||
    (v[11] === "s" && v[16] !== void 0 && v.startsWith("-size/", 10)) ||
    (v[11] === "n" && v[18] !== void 0 && v.startsWith("-normal/", 10)));
const getIsArbitraryValue = (value, testLabel, testValue) => {
  const result = arbitraryValueRegex.exec(value);
  if (result) {
    if (result[1]) return testLabel(result[1]);
    return testValue(result[2]);
  }
  return false;
};
const getIsArbitraryVariable = (
  value,
  testLabel,
  shouldMatchNoLabel = false
) => {
  const result = arbitraryVariableRegex.exec(value);
  if (result) {
    if (result[1]) return testLabel(result[1]);
    return shouldMatchNoLabel;
  }
  return false;
};
const isLabelPosition = (l) => l === "position" || l === "percentage";
const isLabelImage = (l) => l === "image" || l === "url";
const isLabelSize = (l) => l === "length" || l === "size" || l === "bg-size";
const isLabelLength = (l) => l === "length";
const isLabelNumber = (l) => l === "number";
const isLabelFamilyName = (l) => l === "family-name";
const isLabelWeight = (l) => l === "number" || l === "weight";
const isLabelShadow = (l) => l === "shadow";
const isArbitrarySize = (v) => getIsArbitraryValue(v, isLabelSize, isNever);
const isArbitraryValue = (v) => arbitraryValueRegex.test(v);
const isArbitraryLength = (v) =>
  getIsArbitraryValue(v, isLabelLength, isLengthOnly);
const isArbitraryNumber = (v) =>
  getIsArbitraryValue(v, isLabelNumber, isNumber);
const isArbitraryWeight = (v) => getIsArbitraryValue(v, isLabelWeight, isAny);
const isArbitraryFamilyName = (v) =>
  getIsArbitraryValue(v, isLabelFamilyName, isNever);
const isArbitraryPosition = (v) =>
  getIsArbitraryValue(v, isLabelPosition, isNever);
const isArbitraryImage = (v) => getIsArbitraryValue(v, isLabelImage, isImage);
const isArbitraryShadow = (v) =>
  getIsArbitraryValue(v, isLabelShadow, isShadow);
const isArbitraryVariable = (v) => arbitraryVariableRegex.test(v);
const isArbitraryVariableLength = (v) =>
  getIsArbitraryVariable(v, isLabelLength);
const isArbitraryVariableFamilyName = (v) =>
  getIsArbitraryVariable(v, isLabelFamilyName);
const isArbitraryVariablePosition = (v) =>
  getIsArbitraryVariable(v, isLabelPosition);
const isArbitraryVariableSize = (v) => getIsArbitraryVariable(v, isLabelSize);
const isArbitraryVariableImage = (v) => getIsArbitraryVariable(v, isLabelImage);
const isArbitraryVariableShadow = (v) =>
  getIsArbitraryVariable(v, isLabelShadow, true);
const isArbitraryVariableWeight = (v) =>
  getIsArbitraryVariable(v, isLabelWeight, true);

//#endregion
//#region src/grammar/classifier.ts
const BUNDLED_CN = "0.4.0";
function cnVersionAt(resolvedConfigPath) {
  let dir = path.dirname(resolvedConfigPath);
  for (let i = 0; i < 6; i++) {
    const file = path.join(dir, "package.json");
    try {
      const pkg = JSON.parse(readFileSync(file, "utf8"));
      if (pkg.name === "cn" && pkg.version) return pkg.version;
    } catch {}
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
function olderThan(version, than) {
  const parts = (v) => v.split(/[.-]/, 3).map((n) => Number(n) || 0);
  const [a, b] = [parts(version), parts(than)];
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
}
const configCache = /* @__PURE__ */ new Map();
let bundledConfig = null;
function bundled() {
  bundledConfig ??= defaultConfig();
  return bundledConfig;
}
function resolveCnConfig(fromFile) {
  if (!fromFile) return bundled();
  const dir = dirOf(fromFile);
  const cached = configCache.get(dir);
  if (cached) return cached;
  let config;
  try {
    const require = createRequire(path.join(dir, "index.js"));
    const resolvedPath = require.resolve("cn/config");
    const byPath = configCache.get(resolvedPath);
    if (byPath) config = byPath;
    else {
      const version = cnVersionAt(resolvedPath);
      if (version && olderThan(version, "0.4.0")) {
        warnOnce(
          `cn-version:${resolvedPath}`,
          `This project's cn is ${version}. The linter's grammar needs cn ${BUNDLED_CN} or later, so it used its bundled cn ${BUNDLED_CN} instead. Update cn to lint with the grammar your app merges with.`
        );
        config = bundled();
      } else config = require(resolvedPath).defaultConfig();
      configCache.set(resolvedPath, config);
    }
  } catch {
    config = bundled();
  }
  configCache.set(dir, config);
  return config;
}
const themedByConfig = /* @__PURE__ */ new WeakMap();
function themedCnConfig(fromFile) {
  const config = resolveCnConfig(fromFile);
  const scales = fromFile ? themeScalesFor(fromFile) : null;
  if (!scales?.extend && !scales?.override) return config;
  let byScales = themedByConfig.get(config);
  if (!byScales) {
    byScales = /* @__PURE__ */ new WeakMap();
    themedByConfig.set(config, byScales);
  }
  let themed = byScales.get(scales);
  if (!themed) {
    themed = mergeConfigs(config, scales);
    byScales.set(scales, themed);
  }
  return themed;
}
const validatorByName = validators_exports;
function createNode() {
  return {
    next: /* @__PURE__ */ new Map(),
    validators: null,
    group: null,
  };
}
function isMarker(def, key) {
  const keys = Object.keys(def);
  return keys.length === 1 && keys[0] === key && typeof def[key] === "string";
}
function getPart(node, path) {
  for (const part of path.split("-")) {
    let next = node.next.get(part);
    if (!next) {
      next = createNode();
      node.next.set(part, next);
    }
    node = next;
  }
  return node;
}
function buildTrie(config) {
  const root = createNode();
  const addValidator = (node, test, group) => {
    (node.validators ??= []).push({
      test,
      group,
    });
  };
  const process = (def, node, group) => {
    if (typeof def === "string") {
      const target = def === "" ? node : getPart(node, def);
      target.group = group;
      return;
    }
    if (typeof def === "function") {
      if (def.isThemeGetter === true) {
        const getTheme = def;
        for (const inner of getTheme(config.theme)) process(inner, node, group);
        return;
      }
      addValidator(node, def, group);
      return;
    }
    if (isMarker(def, "$t")) {
      for (const inner of config.theme[def.$t] ?? [])
        process(inner, node, group);
      return;
    }
    if (isMarker(def, "$v")) {
      const name = def.$v;
      const test = validatorByName[name];
      if (!test) throw new Error(`cn-classifier: unknown validator "${name}"`);
      addValidator(node, test, group);
      return;
    }
    for (const [key, value] of Object.entries(def)) {
      const child = getPart(node, key);
      for (const inner of value) process(inner, child, group);
    }
  };
  for (const [group, defs] of Object.entries(config.classGroups))
    for (const def of defs) process(def, root, group);
  return root;
}
function walk$1(parts, start, root) {
  const path = [root];
  let node = root;
  let index = start;
  while (index < parts.length) {
    const next = node.next.get(parts[index]);
    if (!next) break;
    node = next;
    path.push(node);
    index++;
  }
  let level = path.length - 1;
  if (index === parts.length) {
    if (node.group) return node.group;
    level--;
  }
  for (; level >= 0; level--) {
    const validators = path[level].validators;
    if (!validators) continue;
    const rest = parts.slice(start + level).join("-");
    for (const { test, group } of validators) if (test(rest)) return group;
  }
  return null;
}
function arbitraryPropertyGroup(base) {
  const content = base.slice(1, -1);
  const colon = content.indexOf(":");
  return colon > 0 ? propertyGroup(content.slice(0, colon)) : null;
}
function postfixIndex(base) {
  let depth = 0;
  let index = -1;
  for (let i = 0; i < base.length; i++) {
    const char = base[i];
    if (char === "[" || char === "(") depth++;
    else if (char === "]" || char === ")") depth--;
    else if (char === "/" && depth === 0) index = i;
  }
  return index;
}
const RENAMED = /* @__PURE__ */ new Map([
  ["flex-grow", "grow"],
  ["flex-shrink", "shrink"],
  ["overflow-ellipsis", "text-ellipsis"],
  ["decoration-slice", "box-decoration-slice"],
  ["decoration-clone", "box-decoration-clone"],
]);
const RENAMED_SCALE = /^flex-(grow|shrink)-(.+)$/;
function currentName(base) {
  const renamed = RENAMED.get(base);
  if (renamed) return renamed;
  const scale = RENAMED_SCALE.exec(base);
  return scale ? `${scale[1]}-${scale[2]}` : base;
}
function createClassifier(config = resolveCnConfig()) {
  const root = buildTrie(config);
  const postfixLookupGroups = new Set(config.postfixLookupClassGroups ?? []);
  const lookup = (base) => {
    if (base.startsWith("[") && base.endsWith("]"))
      return arbitraryPropertyGroup(base);
    const parts = base.split("-");
    return walk$1(parts, parts[0] === "" && parts.length > 1 ? 1 : 0, root);
  };
  const memo = /* @__PURE__ */ new Map();
  const groupOf = (token) => {
    const hit = memo.get(token);
    if (hit !== void 0) return hit;
    if (memo.size > 5e4) memo.clear();
    const group = classify(token);
    memo.set(token, group);
    return group;
  };
  const classify = (token) => {
    let base = splitVariants(token.trim()).base;
    if (base.endsWith("!")) base = base.slice(0, -1);
    else if (base.startsWith("!")) base = base.slice(1);
    if (!base) return null;
    base = currentName(base);
    const slash = postfixIndex(base);
    if (slash === -1) return lookup(base);
    const group = lookup(base.slice(0, slash));
    if (group && postfixLookupGroups.has(group)) return lookup(base) ?? group;
    return group ?? lookup(base);
  };
  return { groupOf };
}
const classifierByConfig = /* @__PURE__ */ new WeakMap();
function unknownGroups(config) {
  return Object.keys(config.classGroups).filter(
    (group) => !(group in GROUP_CATEGORY)
  );
}
function classifierFor(fromFile) {
  const config = themedCnConfig(fromFile);
  let classifier = classifierByConfig.get(config);
  if (!classifier) {
    try {
      classifier = createClassifier(config);
    } catch (error) {
      warnOnce(
        "classifier:fallback",
        `The installed cn's grammar could not be loaded (${error.message}); using the grammar bundled with @shadcn/lint. Update @shadcn/lint.`
      );
      const fallback = bundled();
      classifier =
        classifierByConfig.get(fallback) ?? createClassifier(fallback);
      classifierByConfig.set(fallback, classifier);
    }
    classifierByConfig.set(config, classifier);
    const unknown = unknownGroups(config);
    if (unknown.length)
      warnOnce(
        `groups:${unknown.join(",")}`,
        `The installed cn declares class groups this version of @shadcn/lint has no category for: ${unknown.join(", ")}. They are treated as layout. Update @shadcn/lint.`
      );
  }
  return classifier;
}

//#endregion
//#region src/tailwind/client.ts
let bridge = null;
let restarts = 0;
const FIRST_TIMEOUT = 6e4;
const TIMEOUT = 3e4;
const RETRY_AFTER = 5e3;
const REFRESH_AFTER = 1e3;
function workerFile() {
  const candidates = [new URL("./tailwind-worker.js", import.meta.url)];
  if (/\/src\/tailwind\/[^/]+$/.test(import.meta.url))
    candidates.push(new URL("../../dist/tailwind-worker.js", import.meta.url));
  for (const url of candidates)
    try {
      if (fs.existsSync(url)) return url;
    } catch {}
  return null;
}
function stop() {
  if (bridge) bridge.worker.terminate().catch(() => {});
  bridge = null;
  memos$1.clear();
}
function transportFailed(reason) {
  stop();
  if (restarts++ >= 1) {
    bridge = false;
    warnOnce(
      "tailwind:off",
      `The Tailwind worker failed twice (${reason}); the Tailwind build is unavailable, so rules use the grammar bundled with @shadcn/lint for the rest of this run.`
    );
  } else
    warnOnce(
      `tailwind:restart:${reason}`,
      `The Tailwind worker failed (${reason}) and is restarting; the Tailwind build was unavailable, so rules checked the current file with the grammar bundled with @shadcn/lint and may report project classes as unknown.`
    );
  return null;
}
function start() {
  if (bridge) return bridge;
  if (bridge === false) return null;
  const file = workerFile();
  if (!file) {
    bridge = false;
    warnOnce(
      "tailwind:off",
      "The Tailwind worker script was not found next to @shadcn/lint; no-unknown-classes is using the bundled grammar."
    );
    return null;
  }
  try {
    const channel = new MessageChannel();
    const worker = new Worker(file, {
      workerData: { port: channel.port2 },
      transferList: [channel.port2],
    });
    worker.on("error", (error) => {
      if (bridge && bridge.worker === worker) transportFailed(error.message);
    });
    worker.on("exit", () => {
      if (bridge && bridge.worker === worker) stop();
    });
    worker.unref();
    channel.port1.unref();
    bridge = {
      worker,
      port: channel.port1,
      nextId: 1,
      cold: true,
    };
    return bridge;
  } catch (error) {
    return transportFailed(error.message);
  }
}
function timeoutFor(cold) {
  const override = Number(process.env.SHADCN_LINT_TAILWIND_TIMEOUT);
  if (Number.isFinite(override) && override > 0) return override;
  return cold ? FIRST_TIMEOUT : TIMEOUT;
}
function ask(cssFile, candidates) {
  const live = start();
  if (!live) return null;
  const id = live.nextId++;
  const shared = new SharedArrayBuffer(4);
  const flag = new Int32Array(shared);
  live.port.postMessage({
    id,
    cssFile,
    candidates,
    shared,
  });
  const timeout = timeoutFor(live.cold);
  const waited = Atomics.wait(flag, 0, 0, timeout);
  live.cold = false;
  if (waited === "timed-out")
    return transportFailed(`timed out after ${timeout / 1e3} s`);
  const received = receiveMessageOnPort(live.port);
  if (!received || received.message.id !== id)
    return transportFailed("out-of-order answer");
  restarts = 0;
  return received.message.answer;
}
const memos$1 = /* @__PURE__ */ new Map();
const failed = /* @__PURE__ */ new Map();
function themeFailed(cssFile, reason) {
  failed.set(cssFile, {
    at: Date.now(),
    reason,
  });
  memos$1.delete(cssFile);
  warnOnce(
    `tailwind:${cssFile}:${reason}`,
    `The Tailwind theme at ${cssFile} could not be built (${reason}); no-unknown-classes is using the grammar bundled with @shadcn/lint there until it can.`
  );
  return null;
}
function verdictsFor(cssFile, candidates) {
  if (bridge === false) return null;
  const failure = failed.get(cssFile);
  if (failure) {
    if (Date.now() - failure.at < RETRY_AFTER) return null;
    failed.delete(cssFile);
  }
  const now = Date.now();
  let memo = memos$1.get(cssFile);
  const stale = !memo || now - memo.checkedAt >= REFRESH_AFTER;
  let unseen = candidates.filter((c) => !memo?.verdicts.has(c));
  if (unseen.length || stale) {
    let answer = ask(cssFile, [...new Set(unseen)]);
    if (!answer) return null;
    if (!answer.ok) return themeFailed(cssFile, answer.reason);
    if (!memo || memo.generation !== answer.generation) {
      const rebuild = Boolean(memo && answer.hasModules);
      if (rebuild) stop();
      unseen = [...new Set(candidates)];
      if (rebuild || unseen.length) {
        answer = ask(cssFile, unseen);
        if (!answer) return null;
        if (!answer.ok) return themeFailed(cssFile, answer.reason);
      }
      memo = {
        generation: answer.generation,
        checkedAt: now,
        hasModules: answer.hasModules,
        verdicts: /* @__PURE__ */ new Map(),
      };
      memos$1.set(cssFile, memo);
    }
    memo.checkedAt = now;
    for (const token of unseen) memo.verdicts.set(token, true);
    for (const entry of answer.unknown) memo.verdicts.set(entry.token, entry);
    for (const token of answer.fontSizes) memo.verdicts.set(token, "font-size");
  }
  return memo.verdicts;
}
function unknownClasses(cssFile, candidates) {
  const verdicts = verdictsFor(cssFile, candidates);
  if (!verdicts) return null;
  const out = [];
  for (const token of candidates) {
    const verdict = verdicts.get(token);
    if (typeof verdict === "object") out.push(verdict);
  }
  return out;
}
function setsFontSize(cssFile, token) {
  const verdicts = verdictsFor(cssFile, [token]);
  if (!verdicts) return null;
  return verdicts.get(token) === "font-size";
}

//#endregion
//#region src/project/namespaces.ts
const NAMESPACES = [
  {
    prefix: "bg-",
    namespace: "background-image-",
    group: "bg-image",
  },
];
const ANIMATE_PREFIX = "animate-";
const memos = /* @__PURE__ */ new WeakMap();
function memoFor(read) {
  let memo = memos.get(read);
  if (!memo) {
    memo = /* @__PURE__ */ new Map();
    memos.set(read, memo);
  }
  if (memo.size > 5e4) memo.clear();
  return memo;
}
function valueOf$1(base, prefix) {
  const rest = base.slice(prefix.length);
  const modifier = rest.match(OPACITY_MODIFIER)?.[0] ?? "";
  const value = rest.slice(0, rest.length - modifier.length);
  if (!value || value.startsWith("[") || value.startsWith("(")) return null;
  return value;
}
function lookup$1(vocabulary, token) {
  const base = normalizeClass(token);
  const entry = NAMESPACES.find((n) => base.startsWith(n.prefix));
  if (!entry) return null;
  const value = valueOf$1(base, entry.prefix);
  if (!value) return null;
  if (vocabulary.tokens.has(value)) return null;
  return vocabulary.names.has(`${entry.namespace}${value}`)
    ? entry.group
    : null;
}
function themeGroupFor(fromFile, token) {
  if (!fromFile) return null;
  const vocabulary = themeVocabularyFor(fromFile);
  if (!vocabulary) return null;
  const memo = memoFor(vocabulary);
  let group = memo.get(token);
  if (group === void 0) {
    group = lookup$1(vocabulary, token);
    memo.set(token, group);
  }
  return group;
}
const RANK = new Map(CATEGORIES.map((name, index) => [name, index]));
function lookupUtility(utilities, token) {
  const properties = utilityPropertiesOf(utilities, token);
  if (!properties) return null;
  let best = null;
  let rank = Infinity;
  for (const property of properties) {
    const group = propertyGroup(property);
    const category = categoryOf(group);
    const at = category === null ? CATEGORIES.length : RANK.get(category);
    if (at < rank) {
      best = group;
      rank = at;
    }
  }
  return best;
}
function utilityGroupFor(fromFile, token) {
  if (!fromFile) return null;
  const { utilities } = knownClassesFor(fromFile);
  if (!utilities.size) return null;
  const memo = memoFor(utilities);
  let group = memo.get(token);
  if (group === void 0) {
    group = lookupUtility(utilities, token);
    memo.set(token, group);
  }
  return group;
}
function animationGroupFor(fromFile, token) {
  if (!fromFile) return null;
  const base = normalizeClass(token);
  if (!base.startsWith(ANIMATE_PREFIX)) return null;
  if (!valueOf$1(base, ANIMATE_PREFIX)) return null;
  if (themeVocabularyFor(fromFile)?.names.has(base)) return "animate";
  return declaresClass(fromFile, token) ? "animate" : null;
}
function moduleGroupFor(fromFile, token) {
  if (!fromFile) return null;
  if (!normalizeClass(token).startsWith("text-")) return null;
  const entry = moduleThemeEntryFor(fromFile);
  if (!entry) return null;
  return setsFontSize(entry, token) ? "font-size" : null;
}
function projectClassifierFor(fromFile) {
  const { groupOf: grammarGroupOf } = classifierFor(fromFile);
  const groupOf = (token) => {
    const group = grammarGroupOf(token);
    if (!group)
      return (
        animationGroupFor(fromFile, token) ?? utilityGroupFor(fromFile, token)
      );
    if (categoryOf(group) !== "color") return group;
    return (
      themeGroupFor(fromFile, token) ??
      utilityGroupFor(fromFile, token) ??
      moduleGroupFor(fromFile, token) ??
      group
    );
  };
  return { groupOf };
}

//#endregion
//#region src/project/parser.ts
const require = createRequire(import.meta.url);
function langOf(file) {
  switch (path.extname(file).toLowerCase()) {
    case ".tsx":
      return "tsx";
    case ".ts":
    case ".mts":
    case ".cts":
      return "ts";
    case ".jsx":
      return "jsx";
    default:
      return "js";
  }
}
const SFC_RE = /\.(svelte|vue)$/i;
const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
function isSfc(file) {
  return SFC_RE.test(file);
}
function sfcNameOf(file) {
  return path
    .basename(file, path.extname(file))
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
const STYLE_RE = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
function styleClassesOf(source) {
  const out = /* @__PURE__ */ new Set();
  for (const match of source.matchAll(STYLE_RE))
    for (const name of parseClassSelectors(match[1])) out.add(name);
  return out;
}
function scriptOf(source) {
  let out = "";
  let last = 0;
  const blank = (text) => text.replace(/[^\n\r]/g, " ");
  for (const match of source.matchAll(SCRIPT_RE)) {
    const start = match.index + match[0].indexOf(">") + 1;
    const end = start + match[1].length;
    out += blank(source.slice(last, start)) + source.slice(start, end);
    last = end;
  }
  return out + blank(source.slice(last));
}
function loadOxc() {
  try {
    const oxc = require("oxc-parser");
    return {
      kind: "oxc",
      parse(source, file) {
        const result = oxc.parseSync(path.basename(file), source, {
          lang: langOf(file),
          sourceType: "module",
        });
        if (
          !result.program?.body?.length &&
          result.errors.some((e) => e.severity === "Error")
        )
          throw new Error("oxc-parser: unparsable");
        return result.program;
      },
    };
  } catch {
    return null;
  }
}
function loadTypeScript() {
  let ts;
  try {
    ts = require("@typescript-eslint/parser");
  } catch {
    warnOnce(
      "parser:none",
      "Neither oxc-parser nor @typescript-eslint/parser is installed, so component files cannot be read: variants and wrappers are unknown until one is."
    );
    throw new Error("no parser is installed");
  }
  return {
    kind: "typescript",
    parse: (source) =>
      ts.parse(source, {
        jsx: true,
        range: false,
        loc: false,
      }),
  };
}
function createParser(kind) {
  if (kind === "typescript") return loadTypeScript();
  const oxc = loadOxc();
  if (oxc) return oxc;
  if (kind === "oxc") throw new Error("oxc-parser is not installed");
  return loadTypeScript();
}
let active = null;
function parseSource(source, file) {
  active ??= createParser();
  return isSfc(file)
    ? active.parse(scriptOf(source), `${file}.ts`)
    : active.parse(source, file);
}

//#endregion
//#region src/project/component-imports.ts
function importNameOf(imported, root, property) {
  const joined = property === null ? "" : property.replace(/\./g, "");
  const suffix = imported.namespace ? "" : joined;
  return {
    source: imported.source,
    exportName: imported.namespace ? (property ?? "") : imported.original,
    name: imported.namespace
      ? joined
      : `${imported.original === "default" ? root : imported.original}${suffix}`,
    suffix,
    member:
      imported.namespace || property === null || imported.original === "default"
        ? null
        : `${imported.original}.${property}`,
  };
}
function componentFromImport(
  index,
  binding,
  importedName,
  patterns,
  member = null,
  ui = []
) {
  const owned = member ?? binding;
  if (owned && index.owns(owned.file)) {
    const component = `${owned.name}${member ? "" : importedName.suffix}`;
    const indexed = index.files.get(component);
    const packaged = NODE_MODULES.test(owned.file);
    if (!packaged || (indexed && realpath(indexed) === realpath(owned.file)))
      return {
        component,
        file: packaged ? null : (indexed ?? owned.file),
      };
  }
  if (
    member &&
    NODE_MODULES.test(member.file) &&
    ui.some((prefix) => isUnder(importedName.source, prefix))
  )
    return null;
  if (patterns.some((pattern) => pattern.test(importedName.source)))
    return {
      component:
        binding && isSfc(binding.file)
          ? `${binding.name}${importedName.suffix}`
          : importedName.name,
      file: binding?.file ?? null,
    };
  return null;
}
function isUnder(source, prefix) {
  return source === prefix || source.startsWith(`${prefix}/`);
}

//#endregion
//#region src/project/modules.ts
const parsed = /* @__PURE__ */ new Map();
const DECLARATION_RE =
  /export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|enum)\s+([A-Za-z_$][\w$]*)/g;
const DEFAULT_DECLARATION_RE =
  /export\s+default\s+(?:async\s+)?(?:function\*?|class)\s+([A-Za-z_$][\w$]*)/;
const DEFAULT_IDENTIFIER_RE =
  /export\s+default\s+([A-Za-z_$][\w$]*)\s*(?:;\s*)?$/m;
const DEFAULT_WRAPPED_RE =
  /export\s+default\s+(?:React\.)?(?:memo|forwardRef)\(\s*(?:function\s+)?([A-Za-z_$][\w$]*)/;
const NAMED_RE =
  /export\s*(type\s+)?\{([^{}]*)\}\s*(?:from\s*["']([^"']+)["'])?/g;
const STAR_RE = /export\s*\*\s*(?:as\s+([\w$]+)\s+)?from\s*["']([^"']+)["']/g;
const IMPORT_RE =
  /import\s+(?!type\s)(?:([\w$]+)\s*(?:,\s*)?)?(?:(?:\*\s*as\s+([\w$]+)|\{([^{}]*)\})\s*)?from\s*["']([^"']+)["']/g;
const COMMENT_RE = /\/\*[\s\S]*?\*\/|\/\/[^\n\r]*/g;
function parseNamed(list) {
  const out = [];
  for (const raw of list.replace(COMMENT_RE, "").split(",")) {
    const item = raw.trim();
    if (!item || item.startsWith("type ")) continue;
    const [local, exported] = item
      .split(/(?<!\s)\s+as\s+/)
      .map((s) => s.trim());
    if (!local) continue;
    out.push({
      exported: exported ?? local,
      local,
    });
  }
  return out;
}
const BLOCK_END_RE = /\*\//g;
const LINE_END_RE = /[\n\r]/g;
const FROM_RE = /\s*(?:from\s*["']([^"']+)["'])?/y;
function listCloser(source) {
  const offsets = /* @__PURE__ */ new Map();
  const next = (re, from) => {
    let found = offsets.get(re);
    if (!found) {
      found = Array.from(source.matchAll(re), (match) => match.index);
      offsets.set(re, found);
    }
    let low = 0;
    let high = found.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (found[mid] < from) low = mid + 1;
      else high = mid;
    }
    return found[low] ?? -1;
  };
  const resumed = /* @__PURE__ */ new Map();
  return (open) => {
    const pending = [];
    let close = -1;
    for (let i = open + 1; i < source.length; i++) {
      const char = source[i];
      if (char === "}") {
        close = i;
        break;
      }
      if (char === "{") break;
      const after = source[i + 1];
      if (char !== "/" || (after !== "*" && after !== "/")) continue;
      const block = after === "*";
      const at = next(block ? BLOCK_END_RE : LINE_END_RE, i + 2);
      if (at < 0) break;
      const end = at + (block ? 2 : 1);
      const known = resumed.get(end);
      if (known !== void 0) {
        close = known;
        break;
      }
      pending.push(end);
      i = end - 1;
    }
    for (const end of pending) resumed.set(end, close);
    return close;
  };
}
function parseModule(file) {
  const module = {
    local: /* @__PURE__ */ new Set(),
    imports: /* @__PURE__ */ new Map(),
    defaultName: null,
    sfc: isSfc(file),
    named: [],
    namedIndices: /* @__PURE__ */ new Map(),
    stars: [],
    namespaces: /* @__PURE__ */ new Map(),
  };
  let source;
  try {
    source = fs.readFileSync(file, "utf-8");
  } catch {
    return module;
  }
  if (module.sfc) source = scriptOf(source);
  for (const match of source.matchAll(IMPORT_RE)) {
    const [, defaultLocal, namespaceLocal, list, spec] = match;
    if (defaultLocal)
      module.imports.set(defaultLocal, {
        spec,
        name: "default",
      });
    if (namespaceLocal)
      module.imports.set(namespaceLocal, {
        spec,
        name: "*",
      });
    for (const { exported, local } of list ? parseNamed(list) : [])
      module.imports.set(exported, {
        spec,
        name: local,
      });
  }
  for (const match of source.matchAll(DECLARATION_RE))
    module.local.add(match[1]);
  const defaultDeclaration = source.match(DEFAULT_DECLARATION_RE);
  const defaultIdentifier =
    source.match(DEFAULT_IDENTIFIER_RE) ?? source.match(DEFAULT_WRAPPED_RE);
  if (defaultDeclaration) module.defaultName = defaultDeclaration[1];
  else if (defaultIdentifier) {
    module.defaultName = defaultIdentifier[1];
    module.local.add(defaultIdentifier[1]);
  }
  if (module.sfc) module.defaultName = sfcNameOf(file);
  const closeOf = listCloser(source);
  let consumed = 0;
  for (const match of source.matchAll(NAMED_RE)) {
    if (match.index < consumed) continue;
    let list = match[2];
    let spec = match[3] ?? "";
    if (list.includes("/")) {
      const open = source.indexOf("{", match.index);
      const close = closeOf(open);
      if (close > open + 1 + list.length) {
        list = source.slice(open + 1, close);
        FROM_RE.lastIndex = close + 1;
        spec = FROM_RE.exec(source)?.[1] ?? "";
        consumed = FROM_RE.lastIndex;
      }
    }
    if (match[1]) continue;
    for (const { exported, local } of parseNamed(list))
      module.named.push({
        exported,
        local,
        spec,
      });
  }
  for (const match of source.matchAll(STAR_RE)) {
    if (match[1]) {
      module.namespaces.set(match[1], match[2]);
      continue;
    }
    module.stars.push(match[2]);
  }
  for (let index = 0; index < module.named.length; index++) {
    const name = module.named[index].exported;
    const indices = module.namedIndices.get(name);
    if (indices) indices.push(index);
    else module.namedIndices.set(name, [index]);
  }
  return module;
}
function moduleOf(file) {
  const mtimeMs = mtimeOf(file);
  if (mtimeMs === null) return null;
  const cached = parsed.get(file);
  if (cached && cached.mtimeMs === mtimeMs) return cached.module;
  const module = parseModule(file);
  parsed.set(file, {
    mtimeMs,
    module,
  });
  return module;
}
function resolveFrom(file, spec) {
  const dir = path.dirname(file);
  return resolveFile(spec, dir, packageRoot(file) ?? dir);
}
function signatureOf$2(dependencies) {
  let signature = "";
  for (const dependency of dependencies)
    signature += `${dependency}:${mtimeOf(dependency) ?? "missing"}|`;
  return signature;
}
function derive(key, compute) {
  return memoize(
    key,
    () => {
      const dependencies = /* @__PURE__ */ new Set();
      return {
        value: compute(dependencies),
        dependencies,
        signature: signatureOf$2(dependencies),
      };
    },
    (hit) => hit.signature !== signatureOf$2(hit.dependencies)
  );
}
function exportsOf(file, visiting = /* @__PURE__ */ new Set(), deps) {
  if (visiting.size) return collectExports(file, visiting, deps);
  const cached = derive(`exports:${file}`, (dependencies) =>
    collectExports(file, /* @__PURE__ */ new Set(), dependencies)
  );
  if (deps) for (const dependency of cached.dependencies) deps.add(dependency);
  return cached.value;
}
function collectExports(file, visiting, deps) {
  const walks = [walkExports(file, visiting, deps)];
  let inner = /* @__PURE__ */ new Map();
  for (;;) {
    const step = walks[walks.length - 1].next(inner);
    if (!step.done) {
      walks.push(walkExports(step.value, visiting, deps));
      continue;
    }
    walks.pop();
    inner = step.value;
    if (!walks.length) return inner;
  }
}
function* walkExports(file, visiting, deps) {
  const exports = /* @__PURE__ */ new Map();
  if (visiting.has(file)) return exports;
  deps?.add(file);
  const module = moduleOf(file);
  if (!module) return exports;
  visiting.add(file);
  for (const name of module.local)
    exports.set(name, {
      file,
      name,
    });
  if (module.sfc && module.defaultName)
    exports.set("default", {
      file,
      name: module.defaultName,
    });
  else if (module.defaultName) {
    const imported = module.imports.get(module.defaultName);
    const target =
      imported && imported.name !== "*"
        ? resolveFrom(file, imported.spec)
        : null;
    const inner = target ? yield target : null;
    exports.set(
      "default",
      inner?.get(imported.name) ??
        (target
          ? {
              file: target,
              name: imported.name,
            }
          : {
              file,
              name: module.defaultName,
            })
    );
  }
  for (const { exported, local, spec } of module.named) {
    if (!spec) {
      const imported = module.imports.get(local);
      if (imported && imported.name !== "*") {
        const target = resolveFrom(file, imported.spec);
        const inner = target ? yield target : null;
        exports.set(
          exported,
          inner?.get(imported.name) ??
            (target
              ? {
                  file: target,
                  name: imported.name,
                }
              : {
                  file,
                  name: local,
                })
        );
        continue;
      }
      if (imported) {
        const target = resolveFrom(file, imported.spec);
        exports.set(
          exported,
          target
            ? {
                file: target,
                name: "*",
              }
            : {
                file,
                name: local,
              }
        );
        continue;
      }
      exports.set(
        exported,
        exports.get(local) ?? {
          file,
          name: local,
        }
      );
      continue;
    }
    const target = resolveFrom(file, spec);
    if (!target) continue;
    const inner = yield target;
    exports.set(
      exported,
      inner.get(local) ?? {
        file: target,
        name: local,
      }
    );
  }
  for (const [exported, spec] of module.namespaces) {
    const target = resolveFrom(file, spec);
    if (target)
      exports.set(exported, {
        file: target,
        name: "*",
      });
  }
  for (const spec of module.stars) {
    const target = resolveFrom(file, spec);
    if (!target) continue;
    for (const [name, binding] of yield target)
      if (name !== "default" && !exports.has(name)) exports.set(name, binding);
  }
  visiting.delete(file);
  return exports;
}
function exportRoute(module, file, name) {
  const importedRoute = (local) => {
    const imported = module.imports.get(local);
    const target =
      imported && imported.name !== "*"
        ? resolveFrom(file, imported.spec)
        : null;
    return target
      ? {
          binding: {
            file: target,
            name: imported.name,
          },
          follow: true,
        }
      : {
          binding: {
            file,
            name: local,
          },
          follow: false,
        };
  };
  let before = module.named.length;
  let fallback = null;
  for (;;) {
    const indices = module.namedIndices.get(name) ?? [];
    let aliased = false;
    for (let i = indices.length - 1; i >= 0; i--) {
      const index = indices[i];
      if (index >= before) continue;
      const { local, spec } = module.named[index];
      if (!spec) {
        const imported = module.imports.get(local);
        if (imported && imported.name !== "*") return importedRoute(local);
        const target = imported ? resolveFrom(file, imported.spec) : null;
        if (target)
          return {
            binding: {
              file: target,
              name: "*",
            },
            follow: false,
          };
        name = local;
        before = index;
        fallback = {
          file,
          name,
        };
        aliased = true;
        break;
      }
      const target = resolveFrom(file, spec);
      if (target)
        return {
          binding: {
            file: target,
            name: local,
          },
          follow: true,
        };
    }
    if (aliased) continue;
    if (name === "default" && module.defaultName)
      return module.sfc
        ? {
            binding: {
              file,
              name: module.defaultName,
            },
            follow: false,
          }
        : importedRoute(module.defaultName);
    const namespace = module.namespaces.get(name);
    const target = namespace ? resolveFrom(file, namespace) : null;
    if (target)
      return {
        binding: {
          file: target,
          name: "*",
        },
        follow: false,
      };
    const binding = module.local.has(name)
      ? {
          file,
          name,
        }
      : fallback;
    return binding
      ? {
          binding,
          follow: false,
        }
      : null;
  }
}
function resolveBinding(file, name, deps) {
  const visiting = /* @__PURE__ */ new Set();
  let fallback = null;
  while (!visiting.has(file)) {
    deps.add(file);
    const module = moduleOf(file);
    if (!module) return fallback;
    if (module.stars.length)
      return exportsOf(file, visiting, deps).get(name) ?? fallback;
    visiting.add(file);
    const route = exportRoute(module, file, name);
    if (!route) return fallback;
    if (!route.follow) return route.binding;
    fallback = route.binding;
    file = route.binding.file;
    name = route.binding.name;
  }
  return fallback;
}
function resolvePath(file, name, deps) {
  const [head, ...rest] = name.split(".");
  let binding = resolveBinding(file, head, deps);
  for (const segment of rest) {
    if (binding?.name !== "*") return null;
    binding = resolveBinding(binding.file, segment, deps);
  }
  return binding;
}
function definingExportOf(spec, name, fromFile, deps) {
  const target = resolveFrom(fromFile, spec);
  if (!target) return null;
  const cached = derive(`binding:${target}\u0000${name}`, (dependencies) =>
    resolvePath(target, name, dependencies)
  );
  if (deps) for (const dependency of cached.dependencies) deps.add(dependency);
  const binding = cached.value?.name === "*" ? null : cached.value;
  if (name.includes(".")) return binding;
  return (
    binding ?? {
      file: target,
      name,
    }
  );
}
function importOf(file, local) {
  return moduleOf(file)?.imports.get(local) ?? null;
}

//#endregion
//#region src/project/components.ts
const EMPTY = {
  dir: null,
  files: /* @__PURE__ */ new Map(),
  has: () => false,
  owns: () => false,
};
const cache$2 = /* @__PURE__ */ new Map();
const BARRELS = ["index.tsx", "index.ts", "index.jsx"];
const SOURCE_RE = /\.(tsx|jsx|ts|js|svelte|vue)$/;
function barrelOf(dir) {
  for (const index of BARRELS) {
    const candidate = path.join(dir, index);
    if (isFile(candidate)) return candidate;
  }
  const candidate = path.join(dir, "index.js");
  if (!isFile(candidate)) return null;
  try {
    return fs.readdirSync(dir).some(isSfc) ? candidate : null;
  } catch {
    return null;
  }
}
function componentFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && SOURCE_RE.test(entry.name)) files.push(full);
    else if (entry.isDirectory()) {
      const barrel = barrelOf(full);
      if (barrel) files.push(barrel);
    }
  }
  return files.sort();
}
function signatureOf$1(files) {
  return files.map((file) => `${file}:${mtimeOf(file) ?? "missing"}`).join("|");
}
function buildIndex(dir) {
  const cached = cache$2.get(dir);
  const now = Date.now();
  if (cached && now - cached.checkedAt < 1e3) return cached.index;
  const entries = componentFiles(dir);
  if (cached && signatureFor(entries, cached.deps) === cached.signature) {
    cached.checkedAt = now;
    return cached.index;
  }
  const files = /* @__PURE__ */ new Map();
  const deps = new Set(entries);
  for (const file of entries)
    for (const [name, binding] of exportsOf(
      file,
      /* @__PURE__ */ new Set(),
      deps
    )) {
      const component = name === "default" ? binding.name : name;
      if (
        binding.name !== "*" &&
        /^[A-Z]/.test(component) &&
        !files.has(component)
      )
        files.set(component, binding.file);
    }
  const owned = new Set([...deps].map(realpath));
  const root = realpath(dir) + path.sep;
  const index = {
    dir,
    files,
    has: (name) => files.has(name),
    owns: (file) => {
      const real = realpath(file);
      return real.startsWith(root) || owned.has(real);
    },
  };
  const depList = [...deps];
  cache$2.set(dir, {
    signature: signatureFor(entries, depList),
    deps: depList,
    checkedAt: now,
    index,
  });
  return index;
}
function signatureFor(entries, deps) {
  return `${entries.join(",")}||${signatureOf$1(deps)}`;
}
const merged = /* @__PURE__ */ new Map();
function mergeIndexes(parts) {
  const key = parts.map((part) => part.dir).join("\0");
  const cached = merged.get(key);
  if (cached && cached.parts.every((part, i) => part === parts[i]))
    return cached.index;
  const files = /* @__PURE__ */ new Map();
  for (const part of parts)
    for (const [name, file] of part.files)
      if (!files.has(name)) files.set(name, file);
  const index = {
    dir: parts[0].dir,
    files,
    has: (name) => files.has(name),
    owns: (file) => parts.some((part) => part.owns(file)),
  };
  merged.set(key, {
    parts,
    index,
  });
  return index;
}
function componentsFor(fromFile, ui = []) {
  const project = projectFor(fromFile);
  if (!project) return EMPTY;
  const dirs = /* @__PURE__ */ new Set();
  const own = uiDirectory(project);
  if (own) dirs.add(own);
  for (const prefix of ui) {
    const dir = resolveAlias(project, prefix);
    if (dir) dirs.add(dir);
  }
  const parts = [];
  for (const dir of dirs)
    try {
      parts.push(buildIndex(dir));
    } catch {}
  if (!parts.length) return EMPTY;
  return parts.length === 1 ? parts[0] : mergeIndexes(parts);
}

//#endregion
//#region src/sites/readers/jsx.ts
function attributeNameOf(attribute) {
  const name = attribute?.name;
  if (name?.type === "JSXNamespacedName")
    return `${name.namespace?.name}:${name.name?.name}`;
  return typeof name?.name === "string" ? name.name : "";
}
function jsxNameText(jsxName) {
  if (jsxName?.type === "JSXMemberExpression")
    return `${jsxNameText(jsxName.object)}.${jsxName.property?.name ?? ""}`;
  return jsxName?.name ?? "";
}
function jsxRootOf(jsxName) {
  let node = jsxName;
  while (node?.type === "JSXMemberExpression") node = node.object;
  return node?.name;
}
function jsxPropertyOf(jsxName) {
  const parts = [];
  for (
    let node = jsxName;
    node?.type === "JSXMemberExpression";
    node = node.object
  )
    parts.unshift(node.property?.name ?? "");
  return parts.join(".");
}
function jsxElementNameOf(name) {
  if (!name) return null;
  const root = jsxRootOf(name);
  const member = name.type === "JSXMemberExpression";
  return {
    root: typeof root === "string" ? root : "",
    property: member ? jsxPropertyOf(name) : null,
    text: jsxNameText(name),
    component:
      member || (name.type === "JSXIdentifier" && /^[A-Z]/.test(name.name)),
  };
}
function propsSpreadNameOf(fn) {
  const param = fn.params?.[0];
  if (param?.type === "Identifier") return param.name;
  if (param?.type === "ObjectPattern") {
    const rest = param.properties.find((p) => p.type === "RestElement");
    if (rest?.argument?.type === "Identifier") return rest.argument.name;
  }
  return null;
}
function renderedElementOf(element) {
  const expression = (element.openingElement?.attributes ?? []).find(
    (candidate) =>
      candidate.type === "JSXAttribute" && candidate.name?.name === "render"
  )?.value?.expression;
  if (expression?.type === "JSXElement") return expression;
  if (expression?.type !== "ArrowFunctionExpression") return void 0;
  const body = expression.body;
  const spread = propsSpreadNameOf(expression);
  if (body?.type !== "JSXElement" || !spread) return void 0;
  return (body.openingElement.attributes ?? []).some(
    (candidate) =>
      candidate.type === "JSXSpreadAttribute" &&
      candidate.argument?.type === "Identifier" &&
      candidate.argument.name === spread
  )
    ? body
    : void 0;
}
const jsxReader = {
  attributes: ["JSXAttribute"],
  spreads: ["JSXSpreadAttribute"],
  attributeName: attributeNameOf,
  attributeValue: (node) => node.value,
  spreadArgument: (node) => node.argument,
  elementOf(node) {
    const opening = node?.parent;
    return opening?.type === "JSXOpeningElement" ? opening.parent : null;
  },
  nameOf: (element) => jsxElementNameOf(element?.openingElement?.name),
  parentElementOf(element) {
    for (let node = element?.parent; node; node = node.parent)
      if (node.type === "JSXElement") return node;
    return null;
  },
  renderedElementOf,
};

//#endregion
//#region src/project/ast.ts
function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== "string") return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value))
      for (const child of value) walk(child, visit, node);
    else if (value && typeof value.type === "string") walk(value, visit, node);
  }
}

//#endregion
//#region src/project/sfc-template.ts
const VOID = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);
const blank = (text) => text.replace(/[^\n\r]/g, " ");
function markupOf(source, file) {
  if (/\.vue$/i.test(file)) {
    const open = source.match(/<template\b[^>]*>/);
    const close = source.lastIndexOf("</template");
    if (!open || open.index === void 0 || close < open.index) return "";
    const start = open.index + open[0].length;
    return blank(source.slice(0, start)) + source.slice(start, close);
  }
  return source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, (block) =>
    blank(block)
  );
}
function skipValue(text, i) {
  const quote = text[i];
  if (quote === '"' || quote === "'" || quote === "`") {
    const end = text.indexOf(quote, i + 1);
    return end === -1 ? text.length : end + 1;
  }
  if (quote !== "{") {
    while (i < text.length && !/[\s>]/.test(text[i])) i++;
    return i;
  }
  let depth = 0;
  for (; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'" || char === "`")
      i = skipValue(text, i) - 1;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return i + 1;
  }
  return i;
}
function templateTags(source, file) {
  const text = markupOf(source, file);
  const tags = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "<") continue;
    if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i);
      i = end === -1 ? text.length : end + 2;
      continue;
    }
    if (text[i + 1] === "/") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    const name = text.slice(i + 1).match(/^[A-Za-z][\w:.-]*/)?.[0];
    if (!name) continue;
    const tag = {
      name,
      attributes: [],
      depth,
    };
    let selfClosing = false;
    i += 1 + name.length;
    while (i < text.length) {
      while (i < text.length && /\s/.test(text[i])) i++;
      if (text[i] === ">") break;
      if (text[i] === "/") {
        selfClosing = true;
        i++;
        continue;
      }
      if (text[i] === "{") {
        const end = skipValue(text, i);
        tag.attributes.push({
          name: "",
          value: text.slice(i, end),
        });
        i = end;
        continue;
      }
      const start = i;
      while (i < text.length && !/[\s=>/]/.test(text[i])) i++;
      const attribute = {
        name: text.slice(start, i),
        value: "",
      };
      if (text[i] === "=") {
        const end = skipValue(text, i + 1);
        attribute.value = text.slice(i + 1, end);
        i = end;
      }
      if (i === start) i++;
      else tag.attributes.push(attribute);
    }
    tags.push(tag);
    if (!selfClosing && !VOID.has(name)) depth++;
  }
  return tags;
}

//#endregion
//#region src/project/wrappers.ts
const NO_FORWARDS = {
  props: /* @__PURE__ */ new Map(),
  spread: null,
};
const CLASS_PROP = /^(?!data-|aria-)[^:]*class(name)?s?$/i;
const MAIN_CLASS_PROP = /^(class|className|class:list)$/;
function wrapperPropOf(attribute) {
  if (MAIN_CLASS_PROP.test(attribute)) return "className";
  return attribute.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}
const cache$1 = /* @__PURE__ */ new Map();
function signatureOf(files) {
  return files.map((file) => `${file}:${mtimeOf(file) ?? "missing"}`).join("|");
}
function indexLocalBindings(ast) {
  const bindings = /* @__PURE__ */ new Map();
  const candidates = /* @__PURE__ */ new Set();
  const aliases = [];
  for (const statement of ast.body) {
    const decl =
      statement.type === "ExportNamedDeclaration" ||
      statement.type === "ExportDefaultDeclaration"
        ? statement.declaration
        : statement;
    if (decl?.type === "FunctionDeclaration" && decl.id?.name) {
      candidates.add(decl.id.name);
      bindings.set(decl.id.name, decl);
      if (statement.type === "ExportDefaultDeclaration")
        bindings.set("default", decl);
    } else if (decl?.type === "VariableDeclaration")
      for (const d of decl.declarations) {
        if (d.id?.type !== "Identifier") continue;
        candidates.add(d.id.name);
        if (d.init) bindings.set(d.id.name, d.init);
      }
    else if (decl && statement.type === "ExportDefaultDeclaration")
      bindings.set("default", decl);
    if (statement.type === "ExportDefaultDeclaration")
      candidates.add("default");
    if (statement.type === "ExportNamedDeclaration" && !statement.source)
      for (const spec of statement.specifiers ?? []) {
        const exported = spec.exported?.name ?? spec.exported?.value;
        if (exported) candidates.add(exported);
        aliases.push(spec);
      }
  }
  for (const spec of aliases) {
    const exported = spec.exported?.name ?? spec.exported?.value;
    const local = spec.local?.name;
    if (exported && local && exported !== local && bindings.has(local))
      bindings.set(exported, bindings.get(local));
  }
  return {
    bindings,
    candidates,
  };
}
function componentFunction(bindings, name) {
  let fn = bindings.get(name);
  for (let hop = 0; hop < 6 && fn; hop++)
    if (fn.type === "CallExpression" && fn.arguments?.[0]) fn = fn.arguments[0];
    else if (fn.type === "Identifier" && bindings.has(fn.name))
      fn = bindings.get(fn.name);
    else break;
  return fn?.type === "FunctionDeclaration" ||
    fn?.type === "FunctionExpression" ||
    fn?.type === "ArrowFunctionExpression"
    ? fn
    : null;
}
function propBindings(fn) {
  const named = /* @__PURE__ */ new Map();
  const carriers = /* @__PURE__ */ new Set();
  const param = fn.params?.[0];
  if (!param)
    return {
      named,
      carriers,
    };
  const pattern = param.type === "AssignmentPattern" ? param.left : param;
  if (pattern.type === "ObjectPattern")
    for (const prop of pattern.properties) {
      if (prop.type === "RestElement") {
        if (prop.argument?.type === "Identifier")
          carriers.add(prop.argument.name);
        continue;
      }
      if (prop.type !== "Property") continue;
      const key = prop.key?.name ?? prop.key?.value;
      if (typeof key !== "string" || !CLASS_PROP.test(key)) continue;
      const value =
        prop.value?.type === "AssignmentPattern" ? prop.value.left : prop.value;
      if (value?.type === "Identifier") named.set(key, value.name);
    }
  else if (pattern.type === "Identifier") carriers.add(pattern.name);
  return {
    named,
    carriers,
  };
}
function bindingsFor(prop, named, carriers) {
  const local = named.get(prop);
  return {
    names: new Set(local ? [local] : []),
    propsNames: local ? /* @__PURE__ */ new Set() : carriers,
  };
}
function memberClassProps(body, carriers) {
  const out = /* @__PURE__ */ new Set();
  if (!carriers.size) return out;
  walk(body, (node) => {
    if (
      node.type === "MemberExpression" &&
      !node.computed &&
      node.object?.type === "Identifier" &&
      carriers.has(node.object.name) &&
      typeof node.property?.name === "string" &&
      CLASS_PROP.test(node.property.name)
    )
      out.add(node.property.name);
  });
  return out;
}
function forwardsProp(expr, prop, names, propsNames) {
  let found = false;
  walk(expr, (node) => {
    if (found) return;
    if (node.type === "Identifier" && names.has(node.name)) found = true;
    if (
      node.type === "MemberExpression" &&
      node.object?.type === "Identifier" &&
      propsNames.has(node.object.name) &&
      node.property?.name === prop
    )
      found = true;
    if (
      node.type === "JSXSpreadAttribute" &&
      node.argument?.type === "Identifier" &&
      propsNames.has(node.argument.name)
    )
      found = true;
  });
  return found;
}
function sfcClassBindings(ast, vue) {
  const names = /* @__PURE__ */ new Set();
  const propsNames = new Set(vue ? ["$props", "$attrs"] : []);
  let declaresClass = false;
  const isPropsCall = (node) => {
    while (node?.type?.startsWith("TS") && node.expression)
      node = node.expression;
    if (node?.type !== "CallExpression" || node.callee?.type !== "Identifier")
      return false;
    if (node.callee.name === "withDefaults")
      return isPropsCall(node.arguments[0]);
    return node.callee.name === "$props" || node.callee.name === "defineProps";
  };
  walk(ast, (node) => {
    if (node.type === "CallExpression" && isPropsCall(node))
      walk(node, (inner) => {
        const key = inner.key?.name ?? inner.key?.value;
        if (
          (inner.type === "TSPropertySignature" || inner.type === "Property") &&
          key === "class"
        )
          declaresClass = true;
      });
    if (node.type !== "VariableDeclarator" || !isPropsCall(node.init)) return;
    if (node.id.type === "Identifier") {
      propsNames.add(node.id.name);
      return;
    }
    if (node.id.type !== "ObjectPattern") return;
    const rests = [];
    for (const prop of node.id.properties) {
      if (prop.type === "RestElement" && prop.argument?.type === "Identifier")
        rests.push(prop.argument.name);
      if (prop.type !== "Property") continue;
      if ((prop.key?.name ?? prop.key?.value) !== "class") continue;
      const value =
        prop.value?.type === "AssignmentPattern" ? prop.value.left : prop.value;
      if (value?.type === "Identifier") names.add(value.name);
    }
    if (!names.size) for (const rest of rests) propsNames.add(rest);
  });
  return {
    names,
    propsNames,
    declaresClass,
  };
}
const escapeName = (name) => name.replace(/[$]/g, "\\$&");
function tagForwardsClass(tag, names, propsNames) {
  const mentions = (value) =>
    [...names].some((name) =>
      new RegExp(`(?<![\\w$.])${escapeName(name)}(?![\\w$])`).test(value)
    ) ||
    [...propsNames].some((name) =>
      new RegExp(`(?<![\\w$.])${escapeName(name)}\\.class(?![\\w$])`).test(
        value
      )
    );
  return tag.attributes.some(({ name, value }) => {
    if (name === "class" || name === ":class" || name === "v-bind:class")
      return mentions(value);
    const spread =
      name === ""
        ? value.match(/^\{\s*\.\.\.\s*([\w$]+)\s*\}$/)?.[1]
        : name === "v-bind"
          ? value.replace(/^["']|["']$/g, "").trim()
          : void 0;
    return spread !== void 0 && propsNames.has(spread);
  });
}
function sfcForwardingTags(source, file, ast) {
  const vue = /\.vue$/i.test(file);
  const { names, propsNames, declaresClass } = sfcClassBindings(ast, vue);
  const tags = templateTags(source, file);
  const forwarding = tags.filter((tag) =>
    tagForwardsClass(tag, names, propsNames)
  );
  const roots = tags.filter((tag) => tag.depth === 0);
  if (
    vue &&
    !declaresClass &&
    roots.length === 1 &&
    !/inheritAttrs\s*:\s*false/.test(source) &&
    !forwarding.includes(roots[0])
  )
    forwarding.unshift(roots[0]);
  return forwarding;
}
function jsxElementName(node) {
  const name = jsxElementNameOf(node.name);
  return name
    ? {
        root: name.root || void 0,
        property: name.property,
      }
    : null;
}
function build(file, patterns, ui, visiting, deps, parsedAst) {
  const wrappers = /* @__PURE__ */ new Map();
  let complete = true;
  deps.add(file);
  const sfc = isSfc(file);
  let ast = sfc ? void 0 : parsedAst;
  let source = "";
  if (!ast) {
    try {
      source = fs.readFileSync(file, "utf-8");
    } catch {
      return {
        wrappers,
        complete,
      };
    }
    if (!sfc && !source.includes("className") && !source.includes("..."))
      return {
        wrappers,
        complete,
      };
    try {
      ast = parseSource(source, file);
    } catch {
      return {
        wrappers,
        complete,
      };
    }
  }
  const imports = /* @__PURE__ */ new Map();
  for (const statement of ast.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const source = statement.source?.value;
    if (typeof source !== "string") continue;
    for (const spec of statement.specifiers ?? []) {
      const local = spec.local?.name;
      if (!local) continue;
      const original =
        spec.type === "ImportSpecifier"
          ? (spec.imported?.name ?? spec.imported?.value ?? local)
          : spec.type === "ImportDefaultSpecifier"
            ? "default"
            : local;
      imports.set(local, {
        source,
        original,
        namespace: spec.type === "ImportNamespaceSpecifier",
      });
    }
  }
  const index = componentsFor(file, ui);
  const unresolvedIndex = ui.length ? componentsFor(file) : index;
  const { bindings, candidates } = indexLocalBindings(ast);
  const declaring = /* @__PURE__ */ new Set();
  const asking = /* @__PURE__ */ new Set();
  const hops = /* @__PURE__ */ new Map();
  const hopOf = (element) => {
    let hop = hops.get(element);
    if (hop === void 0) {
      hop = hopOfName(jsxElementName(element));
      hops.set(element, hop);
    }
    return hop;
  };
  const hopOfName = (name) => {
    if (!name?.root) return null;
    const imported = imports.get(name.root);
    if (!imported) {
      if (name.property !== null) return null;
      if (index.has(name.root))
        return {
          target: {
            component: name.root,
            file: index.files.get(name.root) ?? null,
          },
        };
      return candidates.has(name.root)
        ? {
            file,
            name: name.root,
          }
        : null;
    }
    const importedName = importNameOf(imported, name.root, name.property);
    const binding = importedName.exportName
      ? definingExportOf(
          importedName.source,
          importedName.exportName,
          file,
          deps
        )
      : null;
    const member = importedName.member
      ? definingExportOf(importedName.source, importedName.member, file, deps)
      : null;
    const component = componentFromImport(
      index,
      binding,
      importedName,
      patterns,
      member,
      ui
    );
    if (component) return { target: component };
    if (!binding) {
      complete = false;
      return unresolvedIndex.has(importedName.name)
        ? {
            target: {
              component: importedName.name,
              file: unresolvedIndex.files.get(importedName.name) ?? null,
            },
          }
        : null;
    }
    if (binding.file === file || NODE_MODULES.test(binding.file)) return null;
    if (importedName.suffix) return null;
    return {
      file: binding.file,
      name: binding.name,
    };
  };
  const targetVia = (hop, prop) => {
    if (!hop) return null;
    if ("target" in hop) return hop.target;
    if (hop.file === file) return localTarget(hop.name, prop);
    if (visiting.has(hop.file)) {
      complete = false;
      return null;
    }
    const result = lookup(
      hop.file,
      hop.name,
      prop,
      patterns,
      ui,
      visiting,
      deps
    );
    if (!result.complete) complete = false;
    return result.target;
  };
  const localTarget = (name, prop) => {
    const key = `${name}|${prop}`;
    if (asking.has(key)) {
      complete = false;
      return null;
    }
    asking.add(key);
    const own = resolveDeclared(name);
    const target = own.props.has(prop)
      ? (own.props.get(prop) ?? null)
      : targetVia(own.spread, prop);
    asking.delete(key);
    return target;
  };
  const forwardedTarget = (fn, prop, named, carriers) => {
    const { names, propsNames } = bindingsFor(prop, named, carriers);
    if (!names.size && !propsNames.size) return null;
    let target = null;
    walk(fn.body, (node) => {
      if (target || node.type !== "JSXOpeningElement") return;
      for (const attr of node.attributes ?? []) {
        let lands = null;
        if (attr.type === "JSXAttribute") {
          const attribute =
            attr.name?.type === "JSXIdentifier" ? attr.name.name : "";
          if (
            CLASS_PROP.test(attribute) &&
            forwardsProp(attr.value, prop, names, propsNames)
          )
            lands = wrapperPropOf(attribute);
        } else if (
          attr.type === "JSXSpreadAttribute" &&
          forwardsProp(attr, prop, names, propsNames)
        )
          lands = prop;
        if (lands === null) continue;
        target = targetVia(hopOf(node), lands);
        if (target) return;
      }
    });
    return target;
  };
  const resolveDeclared = (name) => {
    const cached = wrappers.get(name);
    if (cached) return cached;
    if (declaring.has(name)) {
      complete = false;
      return NO_FORWARDS;
    }
    declaring.add(name);
    const own = {
      props: /* @__PURE__ */ new Map(),
      spread: null,
    };
    const fn = componentFunction(bindings, name);
    if (fn) {
      const { named, carriers } = propBindings(fn);
      const props = /* @__PURE__ */ new Set([
        "className",
        ...named.keys(),
        ...memberClassProps(fn.body, carriers),
      ]);
      for (const prop of props)
        own.props.set(prop, forwardedTarget(fn, prop, named, carriers));
      if (carriers.size)
        walk(fn.body, (node) => {
          if (own.spread || node.type !== "JSXOpeningElement") return;
          if (
            node.attributes?.some(
              (attr) =>
                attr.type === "JSXSpreadAttribute" &&
                attr.argument?.type === "Identifier" &&
                carriers.has(attr.argument.name)
            )
          )
            own.spread = hopOf(node);
        });
    }
    declaring.delete(name);
    wrappers.set(name, own);
    return own;
  };
  for (const name of candidates)
    if (name === "default" || /^[A-Z]/.test(name)) resolveDeclared(name);
  if (sfc) {
    let target = null;
    for (const tag of sfcForwardingTags(source, file, ast)) {
      const [root, ...rest] = tag.name.split(".");
      const pascal = root.includes("-") ? sfcNameOf(root) : root;
      target = targetVia(
        hopOfName({
          root: imports.has(root) ? root : pascal,
          property: rest.length ? rest.join(".") : null,
        }),
        "className"
      );
      if (target) break;
    }
    wrappers.set(sfcNameOf(file), {
      props: /* @__PURE__ */ new Map([["className", target]]),
      spread: null,
    });
  }
  return {
    wrappers,
    complete,
  };
}
function targetIn(
  file,
  wrappers,
  exportName,
  prop,
  patterns,
  ui,
  visiting,
  deps
) {
  const seen = /* @__PURE__ */ new Set();
  for (let name = exportName; !seen.has(name);) {
    seen.add(name);
    const own = wrappers.get(name);
    if (!own) break;
    if (own.props.has(prop))
      return {
        target: own.props.get(prop) ?? null,
        complete: true,
      };
    const hop = own.spread;
    if (!hop) break;
    if ("target" in hop)
      return {
        target: hop.target,
        complete: true,
      };
    if (hop.file === file) {
      name = hop.name;
      continue;
    }
    if (visiting.has(hop.file))
      return {
        target: null,
        complete: false,
      };
    return lookup(hop.file, hop.name, prop, patterns, ui, visiting, deps);
  }
  return {
    target: null,
    complete: true,
  };
}
function lookup(
  file,
  exportName,
  prop,
  patterns,
  ui,
  visiting,
  deps,
  parsedAst
) {
  deps?.add(file);
  if (mtimeOf(file) === null)
    return {
      target: null,
      complete: false,
    };
  const key = `${file}|${patterns.map((p) => p.source).join(",")}|${ui.join(",")}`;
  const cached = cache$1.get(key);
  const now = Date.now();
  let wrappers;
  let complete = true;
  if (
    cached &&
    (now - cached.checkedAt < 1e3 ||
      signatureOf(cached.deps) === cached.signature)
  ) {
    if (now - cached.checkedAt >= 1e3) cached.checkedAt = now;
    if (deps) for (const dep of cached.deps) deps.add(dep);
    wrappers = cached.wrappers;
  } else {
    visiting.add(file);
    const own = /* @__PURE__ */ new Set();
    const built = build(file, patterns, ui, visiting, own, parsedAst);
    visiting.delete(file);
    if (deps) for (const dep of own) deps.add(dep);
    const depList = [...own];
    wrappers = built.wrappers;
    complete = built.complete;
    if (complete)
      cache$1.set(key, {
        deps: depList,
        signature: signatureOf(depList),
        checkedAt: now,
        wrappers,
      });
  }
  visiting.add(file);
  const result = targetIn(
    file,
    wrappers,
    exportName,
    prop,
    patterns,
    ui,
    visiting,
    deps
  );
  visiting.delete(file);
  return {
    target: result.target,
    complete: complete && result.complete,
  };
}
function wrapperTargetOf(
  file,
  exportName,
  patterns = [],
  parsedAst,
  ui = [],
  prop = "className"
) {
  return lookup(
    file,
    exportName,
    prop,
    patterns,
    ui,
    /* @__PURE__ */ new Set(),
    void 0,
    parsedAst
  ).target;
}
function addsNoClasses(file, component) {
  if (NODE_MODULES.test(file) || isSfc(file)) return false;
  const mtime = mtimeOf(file);
  if (mtime === null) return false;
  let entry = classless.get(file);
  if (!entry || entry.mtime !== mtime) {
    entry = {
      mtime,
      components: classlessComponentsOf(file),
    };
    classless.set(file, entry);
  }
  return entry.components.has(component);
}
const classless = /* @__PURE__ */ new Map();
function classlessComponentsOf(file) {
  const out = /* @__PURE__ */ new Set();
  let ast;
  try {
    ast = parseSource(fs.readFileSync(file, "utf-8"), file);
  } catch {
    return out;
  }
  const { bindings, candidates } = indexLocalBindings(ast);
  for (const name of candidates)
    if (provesClassless(ast, bindings, name)) out.add(name);
  return out;
}
const BASE_UI = /^@base-ui\/react(\/[^/]+)?$/;
const STATIC_DATA_ATTRIBUTE = /^data-[\w-]+$/;
function provesClassless(ast, bindings, component) {
  const fn = componentFunction(bindings, component);
  if (!fn || bindings.get(component) !== fn || fn.async || fn.generator)
    return false;
  const param = fn.params?.[0];
  if (fn.params.length !== 1) return false;
  const { named, carriers } = propBindings(fn);
  if (named.size || carriers.size !== 1) return false;
  if (
    param.type === "ObjectPattern" &&
    param.properties.some((prop) => prop.type !== "RestElement")
  )
    return false;
  if (param.type !== "ObjectPattern" && param.type !== "Identifier")
    return false;
  const [props] = carriers;
  let body = fn.body;
  if (body?.type === "BlockStatement") {
    if (body.body.length !== 1 || body.body[0].type !== "ReturnStatement")
      return false;
    body = body.body[0].argument;
  }
  while (body?.type === "ParenthesizedExpression") body = body.expression;
  if (
    body?.type !== "JSXElement" ||
    !body.openingElement?.selfClosing ||
    body.children?.length
  )
    return false;
  const name = jsxElementNameOf(body.openingElement.name);
  if (!name?.root || (name.property ?? "").includes(".")) return false;
  if (name.root === props || name.root === fn.id?.name) return false;
  if (!importsFromBaseUi(ast, name.root)) return false;
  let spreads = 0;
  for (const attr of body.openingElement.attributes ?? []) {
    if (attr.type === "JSXSpreadAttribute") {
      if (attr.argument?.type !== "Identifier" || attr.argument.name !== props)
        return false;
      spreads++;
      continue;
    }
    if (
      attr.type !== "JSXAttribute" ||
      attr.name?.type !== "JSXIdentifier" ||
      !STATIC_DATA_ATTRIBUTE.test(attr.name.name) ||
      attr.value?.type !== "Literal" ||
      typeof attr.value.value !== "string"
    )
      return false;
  }
  return spreads === 1;
}
function importsFromBaseUi(ast, local) {
  for (const statement of ast.body) {
    if (statement.type !== "ImportDeclaration") continue;
    if (statement.importKind === "type") continue;
    for (const spec of statement.specifiers ?? []) {
      if (spec.local?.name !== local) continue;
      return (
        spec.importKind !== "type" &&
        typeof statement.source?.value === "string" &&
        BASE_UI.test(statement.source.value)
      );
    }
  }
  return false;
}

//#endregion
//#region src/rules/messages.ts
const LISTED = 12;
const listed = /* @__PURE__ */ new WeakMap();
const PLACEHOLDER = /\{\{\s*([^{}|]+?)\s*(?:\|([^{}]*))?\}\}/g;
const MESSAGE_KEYS = /* @__PURE__ */ new Set([
  ...["className", "property", "component", "suggestions", "file"],
  "category",
  "variants",
  "wrapper",
  "sizes",
  "entries",
  "tokens",
  "suggestion",
  "replacement",
  "attribute",
  "value",
  "around",
  "where",
  "variantsSuffix",
]);
function fileOf(context) {
  return context.physicalFilename ?? context.getFilename?.() ?? "";
}
function displayPath(file, context) {
  const cwd = context.cwd ?? process.cwd();
  return memoize(`display-path:${cwd}\u0000${file}`, () => {
    const relative = path.relative(cwd, file);
    return (relative.startsWith("..") ? file : relative).replace(/\\/g, "/");
  });
}
function listTokens(declared) {
  const cached = listed.get(declared);
  if (cached !== void 0) return cached;
  const text = formatTokens(declared);
  listed.set(declared, text);
  return text;
}
function formatTokens(declared) {
  const sorted = [...declared].sort((a, b) => {
    return (
      (a.endsWith("-foreground") ? 1 : 0) -
        (b.endsWith("-foreground") ? 1 : 0) || a.localeCompare(b)
    );
  });
  const shown = sorted.slice(0, LISTED);
  const rest = sorted.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} (+${rest} more)` : shown.join(", ");
}
function noteFor(context) {
  const note = context.settings?.shadcn?.note;
  if (note == null) return "";
  if (typeof note !== "string") {
    warnOnce(
      "settings:note",
      "settings.shadcn.note must be a string; it is ignored."
    );
    return "";
  }
  return note.trim();
}
function checkMessage(message, label) {
  for (const [, key] of message.matchAll(PLACEHOLDER)) {
    if (MESSAGE_KEYS.has(key) || !/^[A-Za-z_$][\w$]*$/.test(key)) continue;
    let nearest = null;
    let closest = 3;
    for (const candidate of MESSAGE_KEYS) {
      const d = editDistance(key.toLowerCase(), candidate.toLowerCase());
      if (d < closest) {
        nearest = candidate;
        closest = d;
      } else if (d === closest) nearest = null;
    }
    if (nearest)
      warnOnce(
        `placeholder:${JSON.stringify([label, key])}`,
        `Unknown message placeholder "{{${key}}}" in ${label.startsWith("shadcn/") ? label : `contract "${label}"`}. Did you mean "{{${nearest}}}"? It will remain literal.`
      );
  }
}
function interpolate(text, data) {
  return text.replace(PLACEHOLDER, (match, key, fallback) => {
    if (!Object.hasOwn(data, key)) return match;
    const value = data[key] == null ? "" : String(data[key]);
    return value !== "" ? value : (fallback?.trim() ?? "");
  });
}
function ruleMessageFor(rule, option) {
  if (option == null) return "";
  if (typeof option !== "string") {
    warnOnce(
      `${rule}:message`,
      `${rule}: the message option must be a string; it is ignored.`
    );
    return "";
  }
  checkMessage(option, rule);
  return option.trim();
}
function withUniversalSlots(data) {
  const first = (...keys) => {
    for (const key of keys) {
      const value = data[key];
      if (value != null && String(value) !== "") return String(value);
    }
    return "";
  };
  return {
    ...data,
    className:
      first("className") ||
      (data.attribute ? `${data.attribute}="${data.value ?? ""}"` : ""),
    property: first("property"),
    component: first("component"),
    suggestions: first("suggestions", "replacement", "suggestion"),
    file: first("file"),
  };
}
function reporter(context, messages, options = {}) {
  const note = noteFor(context);
  const ruleMessage = ruleMessageFor(options.rule ?? "shadcn", options.message);
  return (descriptor, override) => {
    const text =
      typeof override === "string" && override.trim() !== ""
        ? override.trim()
        : ruleMessage;
    if (!text && !note) {
      context.report(descriptor);
      return;
    }
    const data = withUniversalSlots(descriptor.data ?? {});
    const { messageId, ...rest } = descriptor;
    const parts = [
      interpolate(text || (messages[messageId] ?? ""), data),
      note,
    ].filter((p) => p !== "");
    context.report({
      ...rest,
      message: parts.join(" "),
    });
  };
}

//#endregion
//#region src/rules/settings.ts
const SHARED = [
  "componentImports",
  "ignoreImports",
  "mergeFunctions",
  "variantFunctions",
];
function strings(value, key) {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  if (!list.every((v) => typeof v === "string")) {
    warnOnce(
      `settings:${key}`,
      `settings.shadcn.${key} must be a string or an array of strings; it is ignored.`
    );
    return null;
  }
  return list;
}
function escapeRegExp$1(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const themePatterns = /* @__PURE__ */ new Map();
function themePatternOf(pattern) {
  let re = themePatterns.get(pattern);
  if (re === void 0) {
    try {
      re = new RegExp(pattern);
    } catch {
      re = null;
      warnOnce(
        `settings:themeImports:${pattern}`,
        `settings.shadcn.themeImports has an invalid pattern, ${pattern}; it is ignored.`
      );
    }
    themePatterns.set(pattern, re);
  }
  return re;
}
function recordThemeImports(context, settings) {
  const value =
    settings && typeof settings === "object" ? settings.themeImports : null;
  const list = value == null ? [] : (strings(value, "themeImports") ?? []);
  setThemeImports(
    fileOf(context),
    list.map(themePatternOf).filter((re) => re !== null)
  );
}
function withSettings(context, options) {
  const settings = context.settings?.shadcn;
  recordThemeImports(context, settings);
  if (!settings || typeof settings !== "object") return options;
  const merged = { ...options };
  for (const key of SHARED) {
    if (merged[key] !== void 0 || settings[key] === void 0) continue;
    const list = strings(settings[key], key);
    if (list) merged[key] = list;
  }
  if (settings.ui !== void 0) {
    const prefixes = strings(settings.ui, "ui") ?? [];
    if (prefixes.length) {
      merged.ui = prefixes;
      merged.componentImports = [
        ...(merged.componentImports ?? []),
        ...prefixes.map((prefix) => `^${escapeRegExp$1(prefix)}(/|$)`),
      ];
    }
  }
  return merged;
}

//#endregion
//#region src/sites/readers/svelte.ts
const templates = /* @__PURE__ */ new WeakMap();
function templateOf(attribute) {
  let template = templates.get(attribute);
  if (template) return template;
  const parts = attribute.value;
  template = {
    type: "TemplateLiteral",
    quasis: [],
    expressions: [],
    range: [parts[0].range[0], parts[parts.length - 1].range[1]],
    loc: {
      start: parts[0].loc.start,
      end: parts[parts.length - 1].loc.end,
    },
    parent: attribute,
  };
  let text = "";
  let first = null;
  let last = null;
  const flush = (at) => {
    const from = first ?? at;
    const to = last ?? at;
    template.quasis.push({
      type: "TemplateElement",
      value: {
        cooked: text,
        raw: text,
      },
      tail: false,
      range: first ? [from.range[0], to.range[1]] : [at.range[0], at.range[0]],
      loc: first
        ? {
            start: from.loc.start,
            end: to.loc.end,
          }
        : {
            start: at.loc.start,
            end: at.loc.start,
          },
      parent: template,
    });
    text = "";
    first = last = null;
  };
  for (const part of parts)
    if (part.type === "SvelteLiteral") {
      text += part.value;
      first ??= part;
      last = part;
    } else {
      flush(part);
      template.expressions.push(part.expression);
    }
  flush(parts[parts.length - 1]);
  template.quasis[template.quasis.length - 1].tail = true;
  templates.set(attribute, template);
  return template;
}
function valueOf(attribute) {
  if (attribute?.type === "SvelteShorthandAttribute") return attribute.value;
  const parts = attribute?.value ?? [];
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return templateOf(attribute);
}
function nameText(name) {
  if (name?.type === "SvelteMemberExpressionName")
    return `${nameText(name.object)}.${name.property?.name ?? ""}`;
  return name?.name ?? "";
}
const svelteReader = {
  attributes: ["SvelteAttribute", "SvelteShorthandAttribute"],
  spreads: ["SvelteSpreadAttribute"],
  classObjects: true,
  staticStyles: true,
  attributeName: (node) =>
    typeof node?.key?.name === "string" ? node.key.name : "",
  attributeValue: valueOf,
  spreadArgument: (node) => node.argument,
  elementOf(node) {
    const element = node?.parent?.parent;
    return element?.type === "SvelteElement" ? element : null;
  },
  nameOf(element) {
    const name = element?.name;
    if (!name) return null;
    const member = name.type === "SvelteMemberExpressionName";
    const parts = [];
    let object = name;
    while (object?.type === "SvelteMemberExpressionName") {
      parts.unshift(object.property?.name ?? "");
      object = object.object;
    }
    const root = object?.name;
    return {
      root: typeof root === "string" ? root : "",
      property: member ? parts.join(".") : null,
      text: nameText(name),
      component: element.kind === "component",
    };
  },
  parentElementOf(element) {
    for (let node = element?.parent; node; node = node.parent)
      if (node.type === "SvelteElement") return node;
    return null;
  },
  extraSites: {
    SvelteDirective(node) {
      if (node.kind !== "Class") return null;
      const name = node.key?.name;
      return typeof name?.name === "string"
        ? {
            names: [
              {
                value: name.name,
                node: name,
              },
            ],
            anchor: node,
          }
        : null;
    },
  },
  styleProperties: {
    SvelteAttribute(node) {
      const name = node.key?.name;
      return typeof name === "string" && name.startsWith("--")
        ? {
            property: name,
            value: valueOf(node) ?? node.key,
          }
        : null;
    },
    SvelteStyleDirective(node) {
      const property = node.key?.name?.name;
      return typeof property === "string"
        ? {
            property,
            value: valueOf(node) ?? node.key.name,
          }
        : null;
    },
  },
};

//#endregion
//#region src/sites/readers/vue.ts
function bindingOf(node) {
  const key = node?.key;
  return node?.directive && key?.name?.name === "bind" ? key : null;
}
function pascalCase(name) {
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
const vueReader = {
  attributes: ["VAttribute"],
  spreads: ["VAttribute"],
  classObjects: true,
  staticStyles: true,
  attributeName(node) {
    if (!node?.directive)
      return typeof node?.key?.name === "string" ? node.key.name : "";
    const argument = bindingOf(node)?.argument;
    return argument?.type === "VIdentifier" ? argument.name : "";
  },
  attributeValue: (node) => node?.value ?? null,
  spreadArgument(node) {
    const binding = bindingOf(node);
    return binding && !binding.argument
      ? (node.value?.expression ?? null)
      : null;
  },
  elementOf(node) {
    const element = node?.parent?.parent;
    return element?.type === "VElement" ? element : null;
  },
  nameOf(element) {
    const text = element?.rawName ?? "";
    if (!text) return null;
    const [root, ...rest] = text.split(".");
    const kebab = root.includes("-");
    return {
      root,
      property: rest.length ? rest.join(".") : null,
      text,
      component: rest.length > 0 || kebab || /^[A-Z]/.test(root),
      ...(kebab ? { alias: pascalCase(root) } : {}),
    };
  },
  parentElementOf(element) {
    for (let node = element?.parent; node; node = node.parent)
      if (node.type === "VElement" && node.rawName !== "template") return node;
    return null;
  },
  variableOf(node, context) {
    let container = node;
    while (container && container.type !== "VExpressionContainer")
      container = container.parent;
    if (container?.references?.find((r) => r.id === node)?.variable)
      return null;
    const scopes = context.sourceCode?.scopeManager?.scopes ?? [];
    return (
      (scopes.find((s) => s.type === "module") ?? scopes[0])?.set?.get(
        node.name
      ) ?? null
    );
  },
};

//#endregion
//#region src/sites/readers/index.ts
const readers = [jsxReader, svelteReader, vueReader];
function readerFor(context) {
  const services = context?.sourceCode?.parserServices;
  if (services?.isSvelte) return svelteReader;
  if (typeof services?.defineTemplateBodyVisitor === "function")
    return vueReader;
  return jsxReader;
}
const CONTAINERS = {
  JSXExpressionContainer: "JSXAttribute",
  SvelteMustacheTag: "SvelteAttribute",
  VExpressionContainer: "VAttribute",
};
const LITERALS = /* @__PURE__ */ new Set([
  "Literal",
  "SvelteLiteral",
  "VLiteral",
]);
function addVisitor(visitors, type, visit) {
  const existing = visitors[type];
  visitors[type] = existing
    ? (node) => {
        existing(node);
        visit(node);
      }
    : visit;
}
function isContainer(node) {
  return typeof node?.type === "string" && node.type in CONTAINERS;
}
function attributeOfContainer(container) {
  if (container?.type === "SvelteShorthandAttribute") return container;
  const attribute = container?.parent;
  return attribute && CONTAINERS[container.type] === attribute.type
    ? attribute
    : null;
}
function attributeNameIn(attribute) {
  const reader = readers.find((r) => r.attributes.includes(attribute?.type));
  return reader ? reader.attributeName(attribute) : "";
}
function isMarkupLiteral(node) {
  return node?.type !== "Literal" && LITERALS.has(node?.type);
}
function staticStringOf(value) {
  const node = isContainer(value) ? value.expression : value;
  return LITERALS.has(node?.type) && typeof node.value === "string"
    ? node.value
    : null;
}
function withTemplates(rule) {
  return {
    ...rule,
    create(context) {
      const visitors = rule.create(context);
      const services = context.sourceCode?.parserServices;
      const define = services?.defineTemplateBodyVisitor;
      if (typeof define === "function")
        return define({ ...visitors }, { ...visitors });
      if (!services?.isSvelte && isSfc(fileOf(context) ?? ""))
        warnOnce(
          "templates:unread",
          "Templates in .svelte and .vue files are read under ESLint with svelte-eslint-parser or vue-eslint-parser. This run has no template parser, so only their script blocks are linted. See https://github.com/shadcn-ui/lint/blob/main/docs/vue.md and https://github.com/shadcn-ui/lint/blob/main/docs/svelte.md."
        );
      return visitors;
    },
  };
}

//#endregion
//#region src/sites/collect.ts
const DEFAULT_MERGE_FUNCTIONS = [
  "cn",
  "cx",
  "clsx",
  "cva",
  "tv",
  "twMerge",
  "twJoin",
  "classNames",
];
const DEFAULT_VARIANT_FUNCTIONS = ["cva", "tv"];
const CLASS_ATTRIBUTE = /^(class:list|(?!data-|aria-)[^:]*class(name)?s?)$/i;
function isClassAttribute(name) {
  return CLASS_ATTRIBUTE.test(name);
}
const regexps = /* @__PURE__ */ new Map();
function regexpOf(pattern) {
  let re = regexps.get(pattern);
  if (!re) {
    re = new RegExp(pattern);
    regexps.set(pattern, re);
  }
  return re;
}
function createComponentTracker(context, options = {}) {
  const filename = fileOf(context);
  const ui = options.ui ?? [];
  const index = componentsFor(filename, ui);
  const unresolvedIndex = ui.length ? componentsFor(filename) : index;
  const patterns = (options.componentImports ?? []).map(regexpOf);
  const ignored = (options.ignoreImports ?? []).map(regexpOf);
  const imports = /* @__PURE__ */ new Map();
  const skipped = /* @__PURE__ */ new Set();
  const bindings = /* @__PURE__ */ new Map();
  const wrappers = /* @__PURE__ */ new Map();
  const bindingOf = (root, name) => {
    const key = `${root}:${name}`;
    const cached = bindings.get(key);
    if (cached !== void 0) return cached;
    const source = imports.get(root)?.source;
    const binding =
      source && filename ? definingExportOf(source, name, filename) : null;
    bindings.set(key, binding);
    return binding;
  };
  const wrapperOf = (key, binding, local, prop) => {
    key = `${key}|${prop}`;
    const cached = wrappers.get(key);
    if (cached !== void 0) return cached;
    let target = null;
    if (binding) {
      if (binding.file !== filename && !NODE_MODULES.test(binding.file))
        target = wrapperTargetOf(
          binding.file,
          binding.name,
          patterns,
          void 0,
          ui,
          prop
        );
    } else if (local && filename && /^[A-Z]/.test(local))
      target = wrapperTargetOf(
        filename,
        local,
        patterns,
        context.sourceCode?.ast,
        ui,
        prop
      );
    wrappers.set(key, target);
    return target;
  };
  const resolveName = (element, attribute = "className") => {
    if (!element) return null;
    const root =
      element.alias && !imports.has(element.root) && imports.has(element.alias)
        ? element.alias
        : element.root;
    if (!root || skipped.has(root)) return null;
    const property = element.property;
    const imported = imports.get(root);
    if (imported) {
      const importedName = importNameOf(imported, root, property);
      if (imported.namespace && property === null) importedName.name = root;
      const { exportName, name } = importedName;
      const binding = exportName ? bindingOf(root, exportName) : null;
      const member = importedName.member
        ? bindingOf(root, importedName.member)
        : null;
      const component = componentFromImport(
        index,
        binding,
        importedName,
        patterns,
        member,
        ui
      );
      if (component)
        return {
          ...component,
          wrapper: null,
        };
      if (binding) {
        if (NODE_MODULES.test(binding.file)) return null;
        if (property !== null && !imported.namespace) return null;
        const target = wrapperOf(
          `${root}.${exportName}`,
          binding,
          null,
          wrapperPropOf(attribute)
        );
        if (!target) return null;
        const wrapper = property === null ? name : `${root}.${property}`;
        return {
          component: target.component,
          file: target.file,
          wrapper,
        };
      }
      if (unresolvedIndex.has(name) || unresolvedIndex.has(imported.original))
        return {
          component: name,
          file:
            unresolvedIndex.files.get(name) ??
            unresolvedIndex.files.get(imported.original) ??
            null,
          wrapper: null,
        };
      return null;
    }
    const name =
      property === null
        ? !index.has(root) && element.alias && index.has(element.alias)
          ? element.alias
          : root
        : `${root}${property.replace(/\./g, "")}`;
    if (index.has(name))
      return {
        component: name,
        file: index.files.get(name) ?? null,
        wrapper: null,
      };
    if (property !== null) return null;
    const target = wrapperOf(root, null, root, wrapperPropOf(attribute));
    return target
      ? {
          component: target.component,
          file: target.file,
          wrapper: name,
        }
      : null;
  };
  return {
    collectImport(node) {
      const source = node.source?.value;
      if (typeof source !== "string") return;
      const matchesIgnore = ignored.some((p) => p.test(source));
      for (const spec of node.specifiers ?? []) {
        const local = spec.local?.name;
        if (!local) continue;
        const original =
          spec.type === "ImportSpecifier"
            ? (spec.imported?.name ?? spec.imported?.value ?? local)
            : spec.type === "ImportDefaultSpecifier"
              ? "default"
              : local;
        imports.set(local, {
          source,
          original,
          namespace: spec.type === "ImportNamespaceSpecifier",
        });
        if (matchesIgnore) skipped.add(local);
      }
    },
    resolve: (jsxName) => resolveName(jsxElementNameOf(jsxName)),
    resolveName,
  };
}
function findVariable(scope, name) {
  for (let s = scope; s; s = s.upper) {
    const variable = s.set?.get(name);
    if (variable) return variable;
  }
  return null;
}
function variableOf(node, context) {
  const scope = context.sourceCode?.getScope?.(node);
  return (
    (scope ? findVariable(scope, node.name) : null) ??
    readerFor(context).variableOf?.(node, context) ??
    null
  );
}
function referenceExpression(node) {
  while (
    node.parent?.expression === node &&
    ["TSAsExpression", "TSNonNullExpression", "TSSatisfiesExpression"].includes(
      node.parent.type
    )
  )
    node = node.parent;
  return node;
}
function isMutated(variable) {
  return (variable.references ?? []).some((ref) => {
    const id = referenceExpression(ref.identifier);
    const parent = id?.parent;
    if (parent?.type === "MemberExpression" && parent.object === id) {
      let member = referenceExpression(parent);
      while (
        member.parent?.type === "MemberExpression" &&
        member.parent.object === member
      )
        member = referenceExpression(member.parent);
      while (
        (member.parent?.type === "Property" &&
          member.parent.value === member &&
          member.parent.parent?.type === "ObjectPattern") ||
        member.parent?.type === "ArrayPattern" ||
        (member.parent?.type === "RestElement" &&
          member.parent.argument === member) ||
        (member.parent?.type === "AssignmentPattern" &&
          member.parent.left === member)
      )
        member =
          member.parent.type === "Property"
            ? member.parent.parent
            : member.parent;
      const outer = member.parent;
      return (
        (outer?.type === "AssignmentExpression" && outer.left === member) ||
        outer?.type === "UpdateExpression" ||
        (outer?.type === "UnaryExpression" && outer.operator === "delete")
      );
    }
    return (
      parent?.type === "CallExpression" &&
      parent.callee?.type === "MemberExpression" &&
      parent.callee.object?.name === "Object" &&
      parent.callee.property?.name === "assign" &&
      parent.arguments?.[0] === id
    );
  });
}
function dottedName(callee) {
  if (callee?.type === "Identifier") return callee.name;
  if (callee?.type !== "MemberExpression" || callee.computed) return null;
  if (callee.property?.type !== "Identifier") return null;
  const object = dottedName(callee.object);
  return object ? `${object}.${callee.property.name}` : null;
}
const helperNames = /* @__PURE__ */ new WeakMap();
function helperNamesOf(context) {
  let names = helperNames.get(context);
  if (!names) {
    const options = withSettings(context, context.options?.[0] ?? {});
    names = [
      ...DEFAULT_MERGE_FUNCTIONS,
      ...(options.mergeFunctions ?? []),
      ...(options.variantFunctions ?? []),
    ];
    helperNames.set(context, names);
  }
  return names;
}
function isEscaped(variable, context) {
  return (variable.references ?? []).some((ref) => {
    if (!ref.isRead?.()) return false;
    let value = referenceExpression(ref.identifier);
    let parent = value.parent;
    while (
      (parent?.type === "ConditionalExpression" && parent.test !== value) ||
      parent?.type === "LogicalExpression" ||
      (parent?.type === "SequenceExpression" &&
        parent.expressions.at(-1) === value)
    ) {
      value = referenceExpression(parent);
      parent = value.parent;
    }
    if (context) {
      const attribute = attributeOfContainer(parent);
      if (
        attribute &&
        (attributeNameIn(attribute) === "style" ||
          isClassAttribute(attributeNameIn(attribute)))
      )
        return false;
      let container = value;
      let outer = parent;
      while (
        outer?.type === "Property" &&
        outer.value === container &&
        outer.parent?.type === "ObjectExpression"
      ) {
        container = outer.parent;
        outer = container.parent;
      }
      if (
        outer?.type === "CallExpression" &&
        outer.arguments.includes(container) &&
        helperNamesOf(context).includes(dottedName(outer.callee) ?? "")
      )
        return false;
    }
    return (
      (parent?.type === "VariableDeclarator" &&
        parent.id.type === "Identifier" &&
        parent.init === value) ||
      (parent?.type === "AssignmentExpression" &&
        ["Identifier", "MemberExpression"].includes(parent.left.type) &&
        parent.right === value) ||
      ((parent?.type === "CallExpression" ||
        parent?.type === "NewExpression") &&
        parent.arguments.includes(value)) ||
      (parent?.type === "ReturnStatement" && parent.argument === value) ||
      (parent?.type === "ArrowFunctionExpression" && parent.body === value) ||
      (parent?.type === "Property" &&
        parent.value === value &&
        parent.parent?.type === "ObjectExpression") ||
      parent?.type === "ArrayExpression" ||
      attributeOfContainer(parent) !== null
    );
  });
}
function isWritten(variable) {
  return (
    variable.references?.some((ref) => ref.isWrite?.() && !ref.init) ||
    isMutated(variable)
  );
}
function patternStepsOf(binding, pattern) {
  const steps = [];
  let node = binding;
  while (node !== pattern) {
    const parent = node?.parent;
    if (parent?.type === "ArrayPattern") {
      steps.unshift({ index: parent.elements.indexOf(node) });
      node = parent;
    } else if (
      parent?.type === "Property" &&
      parent.value === node &&
      parent.parent?.type === "ObjectPattern"
    ) {
      const key = keyName$1(parent);
      if (key === null) return null;
      steps.unshift({ key });
      node = parent.parent;
    } else return null;
  }
  return steps;
}
function projectStatic(init, steps) {
  let node = init;
  let i = 0;
  for (; i < steps.length; i++) {
    const value = unwrapTs(node);
    const step = steps[i];
    if ("index" in step && value?.type === "ArrayExpression") {
      if (
        value.elements
          .slice(0, step.index + 1)
          .some((el) => el?.type === "SpreadElement")
      )
        break;
      const element = value.elements[step.index];
      if (!element) break;
      node = element;
    } else if ("key" in step && value?.type === "ObjectExpression") {
      if (value.properties.some((p) => p.type !== "Property")) break;
      const found = value.properties.filter((p) => keyName$1(p) === step.key);
      if (!found.length) break;
      node = found[found.length - 1].value;
    } else break;
  }
  return {
    init: node,
    steps: steps.slice(i),
  };
}
function derivedValueOf(init) {
  const call = unwrapTs(init);
  if (
    call?.type !== "CallExpression" ||
    call.callee?.type !== "Identifier" ||
    call.callee.name !== "$derived" ||
    call.arguments?.length !== 1 ||
    call.arguments[0].type === "SpreadElement"
  )
    return init;
  return call.arguments[0];
}
const MAX_ROUTE = 64;
var Route = class extends Set {
  stops = 0;
  has(value) {
    const found = super.has(value);
    if (found) this.stops++;
    return found;
  }
};
function resolveIdentifier(node, context, path) {
  if (path.size >= MAX_ROUTE) {
    if (path instanceof Route) path.stops++;
    return null;
  }
  const variable = variableOf(node, context);
  if (!variable || path.has(variable)) return null;
  const def = variable.defs?.[0];
  if (!def || def.type !== "Variable" || !def.node?.init) return null;
  if (isWritten(variable)) return null;
  let init = derivedValueOf(def.node.init);
  let steps = [];
  if (def.name !== def.node.id) {
    const route = patternStepsOf(def.name, def.node.id);
    if (!route) return null;
    ({ init, steps } = projectStatic(init, route));
  }
  if (
    unwrapTs(init)?.type === "ObjectExpression" &&
    isEscaped(variable, context)
  )
    return null;
  return {
    init,
    variable,
    steps,
  };
}
function isPropsCall(node) {
  const call = unwrapTs(node);
  if (call?.type !== "CallExpression" || call.callee?.type !== "Identifier")
    return false;
  if (call.callee.name === "withDefaults")
    return isPropsCall(call.arguments[0]);
  return call.callee.name === "$props" || call.callee.name === "defineProps";
}
function parameterOf(node, context) {
  const variable = variableOf(node, context);
  const def = variable?.defs?.[0];
  if (!def) return null;
  const received = def.type === "Variable" && isPropsCall(def.node?.init);
  if (def.type !== "Parameter" && !received) return null;
  let binding = def.name;
  let fallback = null;
  if (binding.parent?.type === "AssignmentPattern") {
    binding = binding.parent;
    fallback = binding.right;
  }
  let key = "*";
  let pattern = binding;
  if (binding.parent?.type === "Property") {
    key = keyName$1(binding.parent) ?? "";
    pattern = binding.parent.parent;
  } else if (binding.parent?.type === "RestElement")
    pattern = binding.parent.parent;
  const parameter =
    pattern.parent?.type === "AssignmentPattern" ? pattern.parent : pattern;
  if (
    received ? parameter !== def.node.id : !def.node.params?.includes(parameter)
  )
    return null;
  const objectDefault =
    parameter.type === "AssignmentPattern" ? parameter : null;
  return {
    variable,
    key,
    fallback: key === "*" ? null : fallback,
    objectDefault,
    received,
  };
}
function namesProp(parameter, key, name) {
  if (key === name) return true;
  if (name !== "className" || !key) return false;
  if (key === "class") return parameter.received;
  return isClassAttribute(key);
}
function forwardedPropOf(node, context, name) {
  if (node?.type === "Identifier") {
    const parameter = parameterOf(node, context);
    return parameter &&
      namesProp(parameter, parameter.key, name) &&
      !isWritten(parameter.variable)
      ? parameter
      : null;
  }
  if (node?.type !== "MemberExpression") return null;
  const key = node.computed ? staticKey(node.property) : node.property?.name;
  const object = unwrapTs(node.object);
  if (object?.type !== "Identifier") return null;
  if (!key) return null;
  const parameter = parameterOf(object, context);
  return parameter?.key === "*" &&
    namesProp(parameter, key, name) &&
    !isWritten(parameter.variable) &&
    (parameter.received || !isEscaped(parameter.variable))
    ? parameter
    : null;
}
function isForwardedProp(node, context, name) {
  return forwardedPropOf(node, context, name) !== null;
}
function forwardedValuesOf(node, context, name, path) {
  const parameter = forwardedPropOf(node, context, name);
  if (!parameter) return null;
  const alternatives = [];
  if (!path.has(parameter.variable)) {
    if (parameter.fallback) alternatives.push({ value: parameter.fallback });
    if (parameter.objectDefault) {
      const defaultsPath = new Set(path).add(parameter.variable);
      const object = resolveObject(
        parameter.objectDefault.right,
        context,
        defaultsPath
      );
      const found = object
        ? resolveProperty(object, name, context, defaultsPath)
        : {
            value: void 0,
            uncertain: true,
          };
      if (found.uncertain)
        alternatives.push({ unresolved: parameter.objectDefault });
      else if (found.value) alternatives.push({ value: found.value });
    }
  }
  return {
    variable: parameter.variable,
    alternatives,
  };
}
function keyName$1(prop) {
  if (prop.computed) return staticKey(prop.key);
  if (prop.key?.type === "Identifier") return prop.key.name;
  if (prop.key?.type === "Literal") return String(prop.key.value);
  return null;
}
function staticKey(key) {
  if (key?.type === "Literal") return String(key.value);
  if (key?.type === "TemplateLiteral" && key.expressions.length === 0)
    return key.quasis[0]?.value?.cooked ?? null;
  return null;
}
function unwrapTs(node) {
  while (
    node &&
    (node.type === "TSAsExpression" ||
      node.type === "TSNonNullExpression" ||
      node.type === "TSSatisfiesExpression" ||
      isContainer(node))
  )
    node = node.expression;
  return node;
}
function resolveObject(node, context, path) {
  node = unwrapTs(node);
  if (node?.type === "ObjectExpression") return node;
  if (node?.type !== "Identifier") return null;
  const resolved = resolveIdentifier(node, context, path);
  const init = resolved && unwrapTs(resolved.init);
  return init?.type === "ObjectExpression" ? init : null;
}
function resolveMemberObject(node, context, path) {
  node = unwrapTs(node);
  if (node?.type === "Identifier") {
    const variable = variableOf(node, context);
    if (variable && isEscaped(variable)) return null;
  }
  return resolveObject(node, context, path);
}
function objectEntries(object, context, path, depth = 0) {
  const entries = [];
  for (const prop of object.properties) {
    if (prop.type === "SpreadElement") {
      const arg = unwrapTs(prop.argument);
      const inner = depth < 4 ? resolveObject(arg, context, path) : null;
      if (!inner) {
        entries.push({ unknown: prop });
        continue;
      }
      const variable =
        arg?.type === "Identifier"
          ? resolveIdentifier(arg, context, path)?.variable
          : null;
      if (variable) path.add(variable);
      entries.push(...objectEntries(inner, context, path, depth + 1));
      if (variable) path.delete(variable);
      continue;
    }
    if (prop.type !== "Property") {
      entries.push({ unknown: prop });
      continue;
    }
    const key = keyName$1(prop);
    if (key === null) entries.push({ unknown: prop });
    else
      entries.push({
        key,
        value: prop.value,
      });
  }
  return entries;
}
function resolveProperty(object, key, context, path) {
  let value = void 0;
  let uncertain = false;
  for (const entry of objectEntries(object, context, path))
    if ("unknown" in entry) uncertain = true;
    else if (entry.key === key) {
      value = entry.value;
      uncertain = false;
    }
  return {
    value,
    uncertain,
  };
}
function resolveMemberValue(node, context, path) {
  const key = keyName$1({
    key: node.property,
    computed: node.computed,
  });
  const object =
    key === null ? null : resolveMemberObject(node.object, context, path);
  const found = object
    ? resolveProperty(object, key, context, path)
    : {
        value: void 0,
        uncertain: true,
      };
  if (found.value === void 0 || found.uncertain)
    return {
      key,
      unresolved: node,
    };
  const variable =
    node.object?.type === "Identifier"
      ? resolveIdentifier(node.object, context, path)?.variable
      : null;
  return {
    key,
    value: found.value,
    variable,
  };
}
function collectClassStrings(expression, context, options = {}) {
  const helpers = options.mergeFunctions ?? new Set(DEFAULT_MERGE_FUNCTIONS);
  const valueHelpers =
    options.variantFunctions ?? new Set(DEFAULT_VARIANT_FUNCTIONS);
  const resolve = options.resolve ?? true;
  const contextualStrings = [];
  const vocabularyStrings = [];
  const unresolved = [];
  const path = new Route();
  let resolvedCalls = 0;
  const contextualNodes = /* @__PURE__ */ new Set();
  const vocabularyNodes = /* @__PURE__ */ new Set();
  const unresolvedNodes = /* @__PURE__ */ new Set();
  const readBindings = /* @__PURE__ */ new Map();
  const push = (value, node) => {
    const string = {
      value,
      node,
    };
    if (!contextualNodes.has(node)) {
      contextualNodes.add(node);
      contextualStrings.push(string);
    }
    if (resolvedCalls === 0 && !vocabularyNodes.has(node)) {
      vocabularyNodes.add(node);
      vocabularyStrings.push(string);
    }
  };
  const unread = (node) => {
    if (unresolvedNodes.has(node)) return;
    unresolvedNodes.add(node);
    unresolved.push(node);
  };
  const readBinding = (variable, steps, valuesMode, read) => {
    const key = `${valuesMode}:${resolvedCalls > 0}:${JSON.stringify(steps)}`;
    let keys = readBindings.get(variable);
    if (keys?.has(key)) return;
    const stops = path.stops;
    path.add(variable);
    read();
    path.delete(variable);
    if (path.stops !== stops) return;
    if (!keys) readBindings.set(variable, (keys = /* @__PURE__ */ new Set()));
    keys.add(key);
  };
  const visitThrough = (node, steps, valuesMode) => {
    if (!steps.length) {
      visit(node, valuesMode);
      return;
    }
    const value = unwrapTs(node);
    switch (value?.type) {
      case "ConditionalExpression":
        visitThrough(value.consequent, steps, valuesMode);
        visitThrough(value.alternate, steps, valuesMode);
        return;
      case "LogicalExpression":
        if (value.operator !== "&&")
          visitThrough(value.left, steps, valuesMode);
        visitThrough(value.right, steps, valuesMode);
        return;
      case "Identifier": {
        const resolved = resolve
          ? resolveIdentifier(value, context, path)
          : null;
        if (!resolved) {
          unread(value);
          return;
        }
        const route = [...resolved.steps, ...steps];
        readBinding(resolved.variable, route, valuesMode, () =>
          visitThrough(resolved.init, route, valuesMode)
        );
        return;
      }
      case "ArrayExpression":
      case "ObjectExpression": {
        const projected = projectStatic(value, steps);
        if (projected.steps.length === steps.length) {
          unread(value);
          return;
        }
        visitThrough(projected.init, projected.steps, valuesMode);
        return;
      }
      default:
        unread(node);
    }
  };
  const visit = (node, valuesMode) => {
    if (!node) return;
    const forwarded = resolve
      ? forwardedValuesOf(node, context, "className", path)
      : null;
    if (forwarded) {
      if (path.has(forwarded.variable)) return;
      path.add(forwarded.variable);
      for (const alternative of forwarded.alternatives)
        if ("unresolved" in alternative) unread(alternative.unresolved);
        else visit(alternative.value, valuesMode);
      path.delete(forwarded.variable);
      return;
    }
    switch (node.type) {
      case "Literal":
      case "SvelteLiteral":
      case "VLiteral":
        if (typeof node.value === "string") push(node.value, node);
        return;
      case "TemplateLiteral":
        node.quasis.forEach((quasi, i) => {
          let text = quasi.value?.cooked ?? "";
          if (i > 0 && !/^\s/.test(text)) text = text.replace(/^\S+/, "");
          if (i < node.expressions.length && !/\s$/.test(text))
            text = text.replace(/(?<!\S)\S+$/, "");
          if (text.trim()) push(text, quasi);
        });
        node.expressions.forEach((expr, i) => {
          const before = node.quasis[i]?.value?.cooked ?? "";
          const after = node.quasis[i + 1]?.value?.cooked ?? "";
          if (
            (before !== "" && !/\s$/.test(before)) ||
            (after !== "" && !/^\s/.test(after))
          )
            unread(node);
          else visit(expr, valuesMode);
        });
        return;
      case "ConditionalExpression":
        visit(node.consequent, valuesMode);
        visit(node.alternate, valuesMode);
        return;
      case "LogicalExpression":
        if (node.operator !== "&&") visit(node.left, valuesMode);
        visit(node.right, valuesMode);
        return;
      case "ArrayExpression":
        for (const el of node.elements) visit(el, valuesMode);
        return;
      case "NewExpression":
        if (node.callee?.type === "Identifier" && node.callee.name === "Set") {
          for (const arg of node.arguments) visit(arg, valuesMode);
          return;
        }
        unread(node);
        return;
      case "ObjectExpression":
        for (const entry of objectEntries(node, context, path))
          if ("unknown" in entry) {
            if (valuesMode && entry.unknown.type === "Property")
              visit(entry.unknown.value, valuesMode);
            else unread(entry.unknown);
          } else if (valuesMode) visit(entry.value, valuesMode);
          else push(entry.key, keyNodeOf(node, entry));
        return;
      case "CallExpression": {
        const callee = dottedName(node.callee);
        if (callee && helpers.has(callee)) {
          const hopped = path.size > 0;
          if (!hopped && node !== expression) options.onHelperCall?.(node);
          if (hopped) resolvedCalls++;
          if (valueHelpers.has(callee))
            for (const arg of node.arguments) visitVariantConfig(arg);
          else for (const arg of node.arguments) visit(arg, false);
          if (hopped) resolvedCalls--;
          return;
        }
        if (resolve && visitVariantCall(node, valuesMode)) return;
        unread(node);
        return;
      }
      case "Identifier": {
        if (node.name === "undefined") return;
        const resolved = resolve
          ? resolveIdentifier(node, context, path)
          : null;
        if (!resolved) {
          unread(node);
          return;
        }
        readBinding(resolved.variable, resolved.steps, valuesMode, () =>
          visitThrough(resolved.init, resolved.steps, valuesMode)
        );
        return;
      }
      case "MemberExpression": {
        const found = resolveMemberValue(node, context, path);
        if (!found.key || "unresolved" in found) {
          unread(node);
          return;
        }
        if (found.variable) path.add(found.variable);
        visit(found.value, valuesMode);
        if (found.variable) path.delete(found.variable);
        return;
      }
      case "JSXExpressionContainer":
      case "SvelteMustacheTag":
      case "VExpressionContainer":
        visit(node.expression, valuesMode);
        return;
      case "TSAsExpression":
      case "TSNonNullExpression":
      case "TSSatisfiesExpression":
        visit(node.expression, valuesMode);
        return;
      default:
        unread(node);
    }
  };
  const visitVariantCall = (node, valuesMode) => {
    if (node.callee?.type !== "Identifier") return false;
    const resolved = resolveIdentifier(node.callee, context, path);
    if (!resolved || resolved.steps.length) return false;
    const init = unwrapTs(resolved.init);
    if (init?.type !== "CallExpression") return false;
    const callee = dottedName(init.callee);
    if (!callee || !valueHelpers.has(callee)) return false;
    if (
      init.arguments.some((arg) => {
        const config = resolveObject(arg, context, path);
        if (!config) return false;
        const slots = resolveProperty(config, "slots", context, path);
        return slots.value !== void 0 || slots.uncertain;
      })
    )
      return false;
    readBinding(resolved.variable, [], valuesMode, () =>
      visit(init, valuesMode)
    );
    for (const arg of node.arguments) {
      const props = unwrapTs(arg);
      if (props?.type !== "ObjectExpression") {
        unread(arg);
        continue;
      }
      for (const prop of props.properties) {
        if (prop.type !== "Property") {
          unread(prop);
          continue;
        }
        const key = keyName$1(prop);
        if (key === null) unread(prop);
        else if (key === "class" || key === "className")
          visit(prop.value, false);
      }
    }
    return true;
  };
  const visitVariantConfig = (node) => {
    if (!node) return;
    if (node.type !== "ObjectExpression") {
      visit(node, true);
      return;
    }
    for (const prop of node.properties) {
      if (prop.type !== "Property") {
        unread(prop);
        continue;
      }
      switch (keyName$1(prop)) {
        case "base":
        case "slots":
        case "class":
        case "className":
        case "variants":
          visit(prop.value, true);
          break;
        case "compoundVariants":
        case "compoundSlots":
          if (prop.value?.type === "ArrayExpression")
            for (const entry of prop.value.elements) {
              if (entry?.type !== "ObjectExpression") continue;
              for (const inner of entry.properties) {
                if (inner.type !== "Property") continue;
                const innerKey = keyName$1(inner);
                if (innerKey === "class" || innerKey === "className")
                  visit(inner.value, true);
              }
            }
      }
    }
  };
  visit(expression, options.valuesMode ?? false);
  return {
    contextualStrings,
    vocabularyStrings,
    unresolved,
  };
}
function keyNodeOf(object, entry) {
  for (const prop of object.properties)
    if (prop.type === "Property" && prop.value === entry.value) return prop.key;
  return object;
}
function collectFromValue(value, context, options = {}) {
  if (!value)
    return {
      contextualStrings: [],
      vocabularyStrings: [],
      unresolved: [],
    };
  const object = resolveObject(value, context, /* @__PURE__ */ new Set());
  if (object)
    return collectClassStrings(object, context, {
      ...options,
      valuesMode: true,
    });
  return collectClassStrings(value, context, options);
}
const sharedByProgram = /* @__PURE__ */ new WeakMap();
const NO_VISITORS = {};
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const helperSets = /* @__PURE__ */ new Map();
function helpersFor(key, options) {
  let sets = helperSets.get(key);
  if (sets) return sets;
  const helpers = /* @__PURE__ */ new Set([
    ...DEFAULT_MERGE_FUNCTIONS,
    ...(options.mergeFunctions ?? []),
    ...(options.variantFunctions ?? []),
  ]);
  sets = {
    helpers,
    variantFunctions: /* @__PURE__ */ new Set([
      ...DEFAULT_VARIANT_FUNCTIONS,
      ...(options.variantFunctions ?? []),
    ]),
    helperCall: new RegExp(
      `\\b(?:${[...helpers].map(escapeRegExp).join("|")})\\s*\\(`
    ),
  };
  helperSets.set(key, sets);
  return sets;
}
const optionKeys = /* @__PURE__ */ new WeakMap();
function keyOf(options) {
  let key = optionKeys.get(options);
  if (key === void 0) {
    key = JSON.stringify([
      options.componentImports ?? [],
      options.ignoreImports ?? [],
      options.mergeFunctions ?? [],
      options.variantFunctions ?? [],
    ]);
    optionKeys.set(options, key);
  }
  return key;
}
function sharedFor(context, options) {
  const program = context.sourceCode?.ast ?? context.sourceCode ?? context;
  let byKey = sharedByProgram.get(program);
  if (!byKey) {
    byKey = /* @__PURE__ */ new Map();
    sharedByProgram.set(program, byKey);
  }
  const key = keyOf(options);
  let shared = byKey.get(key);
  if (shared) return shared;
  const { helpers, variantFunctions, helperCall } = helpersFor(key, options);
  const text = context.sourceCode?.text;
  const consumedCalls = /* @__PURE__ */ new WeakSet();
  shared = {
    helpers,
    collectOptions: {
      mergeFunctions: helpers,
      variantFunctions,
      onHelperCall: (node) => consumedCalls.add(node),
    },
    imports: /* @__PURE__ */ new WeakSet(),
    consumedCalls,
    sites: /* @__PURE__ */ new WeakMap(),
    hasSites:
      typeof text !== "string" || /class/i.test(text) || helperCall.test(text),
  };
  byKey.set(key, shared);
  return shared;
}
const PROPERTY_KEY_PARENTS = /* @__PURE__ */ new Set([
  "Property",
  "PropertyDefinition",
  "MethodDefinition",
  "AccessorProperty",
  "TSPropertySignature",
  "TSAbstractPropertyDefinition",
  "TSAbstractMethodDefinition",
]);
function classSiteVisitors(context, options, onSite) {
  const shared = sharedFor(context, options);
  if (!shared.hasSites && !options.scanAllStrings) return NO_VISITORS;
  const tracker = (shared.tracker ??= createComponentTracker(context, options));
  const reader = readerFor(context);
  const { helpers, collectOptions, consumedCalls, sites } = shared;
  const reportedStrings = /* @__PURE__ */ new WeakSet();
  const claimedVocabulary = /* @__PURE__ */ new WeakSet();
  const emit = (site) => {
    for (const string of site.contextualStrings)
      reportedStrings.add(string.node);
    const vocabularyStrings = site.vocabularyStrings.filter((string) => {
      if (claimedVocabulary.has(string.node)) return false;
      claimedVocabulary.add(string.node);
      return true;
    });
    onSite(
      vocabularyStrings.length === site.vocabularyStrings.length
        ? site
        : {
            ...site,
            vocabularyStrings,
          }
    );
  };
  const resolvedOf = (element, attribute = "className") => {
    if (!element) return null;
    const rendered = reader.renderedElementOf?.(element);
    const resolved =
      rendered && tracker.resolveName(reader.nameOf(rendered), attribute);
    if (resolved)
      return {
        ...resolved,
        wrapper: resolved.wrapper ?? reader.nameOf(element)?.text ?? "",
      };
    const own = tracker.resolveName(reader.nameOf(element), attribute);
    if (own) return own;
    const owner = reader.parentElementOf(element);
    if (!owner || reader.renderedElementOf?.(owner) !== element) return null;
    const judge = tracker.resolveName(reader.nameOf(owner), attribute);
    if (
      judge?.file &&
      !judge.wrapper &&
      reader.nameOf(element)?.component === false &&
      addsNoClasses(judge.file, judge.component)
    )
      return null;
    return judge;
  };
  const enclosingOf = (element, accepts) => {
    let direct = true;
    for (
      let node = reader.parentElementOf(element);
      node;
      node = reader.parentElementOf(node)
    ) {
      const name = reader.nameOf(node);
      const resolved = tracker.resolveName(name);
      if (resolved && accepts(resolved.component))
        return {
          name: name?.text ?? "",
          direct,
        };
      direct = false;
    }
    return null;
  };
  const closedParentOf = (element, accepts) => {
    const parent = reader.parentElementOf(element);
    if (!parent) return null;
    const name = reader.nameOf(parent);
    const resolved = tracker.resolveName(name);
    return resolved && !accepts(resolved.component) ? (name?.text ?? "") : null;
  };
  const siteFor = (node, value, attribute, resolved, element = null) => {
    const keyed = reader.classObjects === true && attribute === "class";
    return {
      ...(value && !keyed
        ? collectFromValue(value, context, collectOptions)
        : collectClassStrings(value ?? node, context, collectOptions)),
      component: resolved?.component ?? null,
      componentFile: resolved?.file ?? null,
      wrapper: resolved?.wrapper ?? null,
      attribute,
      node,
      enclosingContainer: (accepts) =>
        element ? enclosingOf(element, accepts) : null,
      closedParent: (accepts) =>
        element ? closedParentOf(element, accepts) : null,
    };
  };
  const attributeSites = (node) => {
    let list = sites.get(node);
    if (list) return list;
    const element = reader.elementOf(node);
    const attribute = reader.attributeName(node);
    list = [
      siteFor(
        node,
        reader.attributeValue(node),
        attribute,
        resolvedOf(element, attribute),
        element
      ),
    ];
    sites.set(node, list);
    return list;
  };
  const spreadSites = (node) => {
    let list = sites.get(node);
    if (list) return list;
    list = [];
    const object = resolveObject(
      reader.spreadArgument(node),
      context,
      /* @__PURE__ */ new Set()
    );
    if (object) {
      const element = reader.elementOf(node);
      const finals = /* @__PURE__ */ new Map();
      for (const entry of objectEntries(
        object,
        context,
        /* @__PURE__ */ new Set()
      ))
        if ("key" in entry && isClassAttribute(entry.key))
          finals.set(entry.key, entry.value);
      for (const [key, value] of finals)
        list.push(
          siteFor(value, value, key, resolvedOf(element, key), element)
        );
    }
    sites.set(node, list);
    return list;
  };
  const callSites = (node) => {
    let list = sites.get(node);
    if (list) return list;
    list = [siteFor(node, null, null, null)];
    sites.set(node, list);
    return list;
  };
  const visitors = {};
  for (const type of reader.attributes)
    addVisitor(visitors, type, (node) => {
      if (!isClassAttribute(reader.attributeName(node))) return;
      for (const site of attributeSites(node)) emit(site);
    });
  for (const type of reader.spreads)
    addVisitor(visitors, type, (node) => {
      if (!reader.spreadArgument(node)) return;
      for (const site of spreadSites(node)) emit(site);
    });
  for (const [type, read] of Object.entries(reader.extraSites ?? {}))
    addVisitor(visitors, type, (node) => {
      let list = sites.get(node);
      if (!list) {
        const extra = read(node);
        list = [];
        if (extra) {
          const element = reader.elementOf(extra.anchor);
          list.push({
            ...siteFor(node, null, "class", resolvedOf(element), element),
            contextualStrings: extra.names,
            vocabularyStrings: extra.names,
            unresolved: [],
          });
        }
        sites.set(node, list);
      }
      for (const site of list) emit(site);
    });
  return {
    ImportDeclaration(node) {
      if (shared.imports.has(node)) return;
      shared.imports.add(node);
      tracker.collectImport(node);
    },
    ...visitors,
    CallExpression(node) {
      if (consumedCalls.has(node)) return;
      const callee = dottedName(node.callee);
      if (!callee || !helpers.has(callee)) return;
      for (const site of callSites(node)) emit(site);
    },
    ...(options.scanAllStrings
      ? {
          Literal(node) {
            if (typeof node.value !== "string" || !node.value.includes("-"))
              return;
            if (reportedStrings.has(node) || claimedVocabulary.has(node))
              return;
            if (node.parent?.type === "ImportDeclaration") return;
            if (
              PROPERTY_KEY_PARENTS.has(node.parent?.type) &&
              node.parent.key === node &&
              !node.parent.computed
            )
              return;
            const strings = [
              {
                value: node.value,
                node,
              },
            ];
            emit({
              contextualStrings: strings,
              vocabularyStrings: strings,
              unresolved: [],
              component: null,
              componentFile: null,
              wrapper: null,
              attribute: null,
              node,
              enclosingContainer: () => null,
              closedParent: () => null,
            });
          },
        }
      : {}),
  };
}

//#endregion
//#region src/rules/contracts.ts
function globToRegExp(glob) {
  const escaped = glob
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^\\s]+");
  return new RegExp(`^${escaped}$`);
}
function compileEntries(entries, groupIds, classifier) {
  const set = {
    source: entries ?? [],
    categories: /* @__PURE__ */ new Set(),
    layout: false,
    groups: /* @__PURE__ */ new Set(),
    basePatterns: [],
    fullPatterns: [],
  };
  for (const raw of entries ?? [])
    if (raw === "layout") set.layout = true;
    else if (CATEGORIES.includes(raw)) set.categories.add(raw);
    else if (raw.includes(":")) set.fullPatterns.push(globToRegExp(raw));
    else {
      const entry = stripModifier(normalizeClass(raw), classifier);
      if (groupIds.has(entry)) set.groups.add(entry);
      if (!groupIds.has(entry) || classifier.groupOf(entry))
        set.basePatterns.push(globToRegExp(entry));
    }
  return set;
}
function stripModifier(base, classifier) {
  if (
    /-\d+\/\d+$/.test(base) &&
    categoryOf(classifier.groupOf(base)) !== "color"
  )
    return base;
  return base.replace(/\/[\w.%]+$/, "");
}
function matches(set, token, classifier) {
  if (!set.source.length) return false;
  const group = classifier.groupOf(token);
  if (group && set.groups.has(group)) return true;
  const category = categoryOf(group);
  if (category && set.categories.has(category)) return true;
  if (!category && set.layout && (group || isMarkerClass(token))) return true;
  const base = stripModifier(normalizeClass(token), classifier);
  if (set.basePatterns.some((re) => re.test(base))) return true;
  if (set.fullPatterns.some((re) => re.test(token))) return true;
  return false;
}
const groupIdsByConfig = /* @__PURE__ */ new WeakMap();
function groupIdsFor(config) {
  let ids = groupIdsByConfig.get(config);
  if (!ids) {
    ids = new Set(Object.keys(config.classGroups));
    groupIdsByConfig.set(config, ids);
  }
  return ids;
}
const compiledByConfig = /* @__PURE__ */ new WeakMap();
function compiledOnce(fromFile, key, build) {
  const config = themedCnConfig(fromFile);
  let byKey = compiledByConfig.get(config);
  if (!byKey) {
    byKey = /* @__PURE__ */ new Map();
    compiledByConfig.set(config, byKey);
  }
  let value = byKey.get(key);
  if (value === void 0) {
    value = build();
    byKey.set(key, value);
  }
  return value;
}
function messageTable(message) {
  if (typeof message === "string") return { default: message };
  if (!message || typeof message !== "object") return null;
  const table = {};
  for (const [key, value] of Object.entries(message))
    if (typeof value === "string") table[key] = value;
  return Object.keys(table).length ? table : null;
}
function compileContracts(inputs, options = {}) {
  const key = `contracts:${JSON.stringify([
    options.allow ?? null,
    options.deny ?? null,
    options.message ?? null,
    options.uncheckedEntries ?? false,
    inputs ?? [],
  ])}`;
  return compiledOnce(options.fromFile, key, () =>
    buildContracts(inputs, options)
  );
}
var ContractConfigError = class extends Error {};
function configErrorVisitors(context, error) {
  if (!(error instanceof ContractConfigError)) throw error;
  const message = error.message;
  return {
    Program(node) {
      context.report({
        node,
        loc: {
          line: 1,
          column: 0,
        },
        message,
      });
    },
  };
}
function compilePattern(pattern) {
  try {
    return new RegExp(pattern);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new ContractConfigError(
      `Contract pattern "${pattern}" is not a valid regular expression.`
    );
  }
}
function checkEntries(entries, groupIds, classifier, fromFile) {
  for (const entry of entries ?? []) {
    if (entry === "layout" || entry.includes("*") || entry.includes(":"))
      continue;
    if (CATEGORIES.includes(entry)) continue;
    if (groupIds.has(entry)) continue;
    if (classifier.groupOf(entry)) continue;
    const known = fromFile ? knownClassesFor(fromFile) : null;
    if (known?.utilities.has(entry) || known?.classes.has(entry)) continue;
    const entryFile = fromFile ? tailwindEntryFor(fromFile) : null;
    if (entryFile && unknownClasses(entryFile, [entry])?.length === 0) continue;
    const hint = /^[A-Za-z][A-Za-z0-9]*$/.test(entry)
      ? didYouMean(entry, [...CATEGORIES, "layout", ...groupIds])
      : null;
    if (hint)
      throw new ContractConfigError(
        `Contract entry "${entry}" is not a category (${[...CATEGORIES, "layout"].join(", ")}), a class group, or a class, so it would match nothing. Did you mean "${hint}"?`
      );
    warnOnce(
      `contract-entry:${entry}`,
      `Contract entry "${entry}" is not a category (${[...CATEGORIES, "layout"].join(", ")}), a class group, or a class cn or your theme knows; it matches only a class named exactly that.`
    );
  }
}
function checkAllowEntries(entries, fromFile, rule) {
  if (!entries?.length) return;
  const classifier = projectClassifierFor(fromFile);
  const groupIds = groupIdsFor(resolveCnConfig(fromFile));
  for (const entry of entries)
    if (
      /^[a-z]+-\d{2,3}$/.test(entry) &&
      !groupIds.has(entry) &&
      !classifier.groupOf(entry)
    )
      throw new ContractConfigError(
        `${rule}: allow entry "${entry}" names a color, not a class, so it would match nothing. Did you mean "*-${entry}" (the color on any utility), or "bg-${entry}"?`
      );
  checkEntries(entries, groupIds, classifier, fromFile);
}
function compileVocabularyPolicy(options, rule) {
  if (!options.uncheckedEntries) {
    checkAllowEntries(options.allow, options.fromFile, rule);
    checkAllowEntries(options.deny, options.fromFile, rule);
    for (const c of options.contracts ?? []) {
      checkAllowEntries(c.allow, options.fromFile, rule);
      checkAllowEntries(c.deny, options.fromFile, rule);
    }
  }
  return compileContracts(options.contracts, {
    allow: options.allow,
    deny: options.deny,
    message: options.message,
    uncheckedEntries: options.uncheckedEntries,
    fromFile: options.fromFile,
  });
}
function allowListOf(policy, inherited) {
  if (policy.allow !== void 0) return policy.allow;
  if (inherited !== void 0) return inherited;
  return policy.deny !== void 0 ? ["*"] : [];
}
function buildContracts(inputs, options) {
  const classifier = projectClassifierFor(options.fromFile);
  const groupIds = groupIdsFor(resolveCnConfig(options.fromFile));
  if (!options.uncheckedEntries) {
    checkEntries(options.allow, groupIds, classifier, options.fromFile);
    checkEntries(options.deny, groupIds, classifier, options.fromFile);
    for (const c of inputs ?? []) {
      checkEntries(c.allow, groupIds, classifier, options.fromFile);
      checkEntries(c.deny, groupIds, classifier, options.fromFile);
    }
  }
  const topAllow = allowListOf(options);
  const topDeny = options.deny ?? [];
  const compiled = (inputs ?? []).map((c) => {
    const pattern = compilePattern(c.pattern);
    const message = messageTable(c.message);
    for (const text of Object.values(message ?? {}))
      checkMessage(text, c.pattern);
    return {
      pattern,
      allow: compileEntries(allowListOf(c, topAllow), groupIds, classifier),
      deny: compileEntries(c.deny ?? topDeny, groupIds, classifier),
      message,
    };
  });
  const baselineMessage = messageTable(options.message);
  for (const text of Object.values(baselineMessage ?? {}))
    checkMessage(text, "no-restyle");
  const baseline = {
    allow: compileEntries(topAllow, groupIds, classifier),
    deny: compileEntries(topDeny, groupIds, classifier),
    message: baselineMessage,
  };
  const cache = /* @__PURE__ */ new Map();
  const verdicts = /* @__PURE__ */ new Map();
  const policyFor = (name) => {
    const cached = cache.get(name);
    if (cached) return cached;
    let policy = baseline;
    for (let i = compiled.length - 1; i >= 0; i--)
      if (compiled[i].pattern.test(name)) {
        policy = compiled[i];
        break;
      }
    cache.set(name, policy);
    return policy;
  };
  const decide = (component, token) => {
    const key = `${component ?? ""}\u0000${token}`;
    const known = verdicts.get(key);
    if (known) return known;
    if (verdicts.size > 5e4) verdicts.clear();
    const verdict = decideUncached(component, token);
    verdicts.set(key, verdict);
    return verdict;
  };
  const decideUncached = (component, token) => {
    const policy = component === null ? baseline : policyFor(component);
    const group = classifier.groupOf(token);
    const category =
      group || isMarkerClass(token)
        ? (categoryOf(group) ?? "layout")
        : "unclassified";
    const words = (table) =>
      table ? (table[category] ?? table.default ?? null) : null;
    const message = words(policy.message) ?? words(baseline.message);
    if (matches(policy.deny, token, classifier))
      return {
        kind: "denied",
        entries: policy.deny.source,
        category,
        message,
      };
    if (matches(policy.allow, token, classifier)) return { kind: "ok" };
    return {
      kind: "not-allowed",
      entries: policy.allow.source,
      category,
      message,
    };
  };
  const primitivesFor = (token, except, indexed) => {
    const granting = compiled.filter((c) =>
      matches(c.allow, token, classifier)
    );
    if (!granting.length) return [];
    const names = /* @__PURE__ */ new Set();
    for (const c of granting)
      for (const n of literalNames(c.pattern)) names.add(n);
    for (const n of indexed()) names.add(n);
    const covered = new Set(except);
    const out = [];
    for (const name of names) {
      if (covered.has(name)) continue;
      if (!granting.some((c) => c.pattern.test(name))) continue;
      if (decide(name, token).kind !== "ok") continue;
      out.push(name);
      if (out.length > 4) return [];
    }
    return out;
  };
  return {
    decide,
    primitivesFor,
  };
}
function literalNames(pattern) {
  const parts = pattern.source
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .replace(/^\((?:\?:)?/, "")
    .replace(/\)$/, "")
    .split("|");
  return parts.every((part) => /^[A-Za-z_$][\w$]*$/.test(part)) ? parts : [];
}

//#endregion
//#region src/rules/fixes.ts
function replaceInMarkup(node, context, token, replacement) {
  const raw = context.sourceCode?.getText?.(node) ?? "";
  const quote = raw[0] === '"' || raw[0] === "'" ? raw[0] : "";
  const inner = quote ? raw.slice(1, -1) : raw;
  if (quote && raw[raw.length - 1] !== quote) return null;
  const replaced = replaceClass(inner, token, replacement);
  return replaced === inner ? null : `${quote}${replaced}${quote}`;
}
function replaceInLiteral(node, context, token, replacement) {
  if (isMarkupLiteral(node) && typeof node.value === "string")
    return replaceInMarkup(node, context, token, replacement);
  if (node?.type !== "Literal" || typeof node.value !== "string") return null;
  const raw = node.raw ?? context.sourceCode?.getText?.(node) ?? "";
  const quote = raw[0];
  if ((quote !== '"' && quote !== "'") || raw[raw.length - 1] !== quote)
    return null;
  const inner = raw.slice(1, -1);
  if (!(node.parent?.type === "JSXAttribute") && inner !== node.value)
    return null;
  const replaced = replaceClass(inner, token, replacement);
  return replaced === inner ? null : `${quote}${replaced}${quote}`;
}
function classSuggestion(node, context, token, replacement, messageId, data) {
  const text = replaceInLiteral(node, context, token, replacement);
  if (text === null) return null;
  return {
    messageId,
    data,
    fix: (fixer) => fixer.replaceText(node, text),
  };
}
function classSuggestions(node, context, token, replacements, messageId, key) {
  const list = replacements
    .map((replacement) =>
      classSuggestion(node, context, token, replacement, messageId, {
        [key]: replacement,
      })
    )
    .filter((s) => s !== null);
  return list.length ? list : void 0;
}

//#endregion
//#region src/rules/policy-schema.ts
const entriesSchema = {
  type: "array",
  items: { type: "string" },
};
const message = {
  type: "string",
  maxLength: 500,
};
const recognitionSchema = {
  componentImports: entriesSchema,
  ignoreImports: entriesSchema,
  mergeFunctions: entriesSchema,
  variantFunctions: entriesSchema,
};
const contractsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      pattern: { type: "string" },
      allow: entriesSchema,
      deny: entriesSchema,
      message,
    },
    required: ["pattern"],
    additionalProperties: false,
  },
};
const policySchema = {
  allow: entriesSchema,
  deny: entriesSchema,
  contracts: contractsSchema,
  message,
};

//#endregion
//#region src/rules/suggest.ts
const COLOR_THRESHOLD = 0.12;
const PRIORITY = [
  "background",
  "foreground",
  "muted",
  "muted-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
];
const priorityOf = (name) => {
  const index = PRIORITY.indexOf(name);
  return index === -1 ? PRIORITY.length : index;
};
function roleOf(prefix) {
  return /^(?:text|placeholder|caret|decoration|fill|stroke)-$/.test(prefix)
    ? "text"
    : "surface";
}
const isForeground = (name) =>
  name === "foreground" || name.endsWith("-foreground");
function nearestColorTokens(lab, tokens, role, limit = 2) {
  const groups = /* @__PURE__ */ new Map();
  for (const [name, value] of tokens) {
    const distance = colorDistance(lab, value);
    if (distance > 0.12) continue;
    const key = distance.toFixed(3);
    const group = groups.get(key);
    if (group) group.names.push(name);
    else
      groups.set(key, {
        distance,
        names: [name],
      });
  }
  const prefer = role === "text" ? isForeground : (n) => !isForeground(n);
  let candidates = [...groups.values()]
    .sort((a, b) => a.distance - b.distance)
    .map(
      ({ names }) =>
        names.sort(
          (a, b) =>
            Number(prefer(b)) - Number(prefer(a)) ||
            priorityOf(a) - priorityOf(b) ||
            a.localeCompare(b)
        )[0]
    );
  if (role === "surface" && candidates.some((n) => !isForeground(n)))
    candidates = candidates.filter((n) => !isForeground(n));
  return candidates.slice(0, limit);
}
function paletteColor(value) {
  const raw = PALETTE[value];
  return raw ? parseColor(raw) : null;
}
function arbitraryColor(inner) {
  const text = inner.replace(/^color:/, "").replace(/_/g, " ");
  return parseColor(text);
}
function nearestSteps(px, scale, limit = 2) {
  return [...scale]
    .map(([name, value]) => ({
      name,
      px: value,
      exact: Math.abs(value - px) < 0.01,
    }))
    .sort((a, b) => Math.abs(a.px - px) - Math.abs(b.px - px) || a.px - b.px)
    .slice(0, limit);
}
function formatSteps(steps, toClass) {
  return steps.map((s) => `${toClass(s.name)} (${formatPx(s.px)})`).join(", ");
}

//#endregion
//#region src/rules/no-arbitrary-values.ts
const PX_SPACING = /^(-?)([a-z]+(?:-[a-z]+)*)-\[(\d+(?:\.\d+)?)px\]$/;
const SPACING_GROUPS = /* @__PURE__ */ new Set([
  "m",
  "mx",
  "my",
  "ms",
  "me",
  "mt",
  "mr",
  "mb",
  "ml",
  "w",
  "min-w",
  "max-w",
  "h",
  "min-h",
  "max-h",
  "size",
  "inset",
  "inset-x",
  "inset-y",
  "start",
  "end",
  "top",
  "right",
  "bottom",
  "left",
  "translate",
  "translate-x",
  "translate-y",
  "basis",
  "indent",
  "leading",
  "scroll-m",
  "scroll-mx",
  "scroll-my",
  "scroll-mt",
  "scroll-mr",
  "scroll-mb",
  "scroll-ml",
  "scroll-p",
  "scroll-px",
  "scroll-py",
  "scroll-pt",
  "scroll-pr",
  "scroll-pb",
  "scroll-pl",
]);
function splitArbitrary(token) {
  const base = normalizeClass(token);
  const open = base.indexOf("-[", 1);
  const close = open === -1 ? -1 : base.indexOf("]", open + 2);
  if (close === -1) return null;
  return {
    utility: base.slice(0, open),
    inner: base.slice(open + 2, close),
    suffix: base.slice(close + 1),
  };
}
function scaleEquivalent(token, unitPx = 4) {
  if (unitPx === null) return null;
  const { variants, base } = splitVariants(token);
  const leading = base.startsWith("!") ? "!" : "";
  const trailing = !leading && base.endsWith("!") ? "!" : "";
  const match = base
    .slice(leading.length, base.length - trailing.length)
    .match(PX_SPACING);
  if (!match) return null;
  const [, negative, utility, px] = match;
  const steps = Number(px) / unitPx;
  if (!Number.isInteger(steps * 4)) return null;
  return `${variants.length ? `${variants.join(":")}:` : ""}${leading}${negative}${utility}-${steps}${trailing}`;
}
const MESSAGES$5 = {
  arbitraryValue:
    '"{{className}}" hardcodes an off-token value. Use a theme token or scale value instead.',
  arbitraryValueWithScale:
    '"{{className}}" hardcodes an off-token value. Use "{{replacement}}" instead (same value, on the scale).',
  arbitraryValueNearScale:
    '"{{className}}" hardcodes an off-token value. Nearest on the scale: {{suggestions}}.',
  arbitraryColorNear:
    '"{{className}}" hardcodes a color. Nearest theme tokens: {{suggestions}}. Use one of those, or declare --color-<name> in {{file}}.',
  arbitraryColorFar:
    '"{{className}}" hardcodes a color and no declared theme color is close to it. Use one of: {{tokens}}, or declare --color-<name> in {{file}}.',
  useScale: 'Replace with "{{replacement}}" (same value, on the scale).',
  useToken: 'Replace with "{{replacement}}".',
};
const noArbitraryValues = {
  meta: {
    type: "problem",
    hasSuggestions: true,
    docs: {
      description:
        "Disallow arbitrary values on appearance utilities; use theme tokens and scale values.",
      url: "https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-arbitrary-values.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          ...policySchema,
          scanAllStrings: { type: "boolean" },
          ...recognitionSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: MESSAGES$5,
  },
  create(context) {
    const options = withSettings(context, context.options?.[0] ?? {});
    const emit = reporter(context, MESSAGES$5, {
      rule: "shadcn/no-arbitrary-values",
      message: options.message,
    });
    const filename = fileOf(context);
    let policy;
    try {
      policy = compileVocabularyPolicy(
        {
          ...options,
          fromFile: filename,
        },
        "shadcn/no-arbitrary-values"
      );
    } catch (error) {
      return configErrorVisitors(context, error);
    }
    const { groupOf } = projectClassifierFor(filename);
    let file;
    let unitPx;
    const colorSuggestions = (token, parts) => {
      const lab = arbitraryColor(parts.inner);
      const colors = lab ? colorValuesFor(filename) : null;
      if (!lab || !colors?.size) return null;
      return nearestColorTokens(lab, colors, roleOf(`${parts.utility}-`)).map(
        (name) => withBase(token, `${parts.utility}-${name}${parts.suffix}`)
      );
    };
    return classSiteVisitors(context, options, (site) => {
      for (const { value, node } of site.vocabularyStrings)
        for (const token of splitClasses(value)) {
          if (!isArbitraryValue$1(token)) continue;
          const exemption = policy.decide(site.component, token);
          if (exemption.kind === "ok") continue;
          if (file === void 0) {
            const themeFile = themeFileFor(filename);
            file = themeFile
              ? displayPath(themeFile, context)
              : "your theme CSS";
          }
          const group = groupOf(token);
          const category = categoryOf(group);
          const parts = splitArbitrary(token);
          if (category === "color" && parts) {
            const suggestions = colorSuggestions(token, parts);
            if (suggestions) {
              emit(
                {
                  node,
                  messageId: suggestions.length
                    ? "arbitraryColorNear"
                    : "arbitraryColorFar",
                  data: {
                    className: token,
                    component: site.component ?? "",
                    suggestions: suggestions.join(", "),
                    tokens: listTokens(
                      colorTokensFor(filename) ?? /* @__PURE__ */ new Set()
                    ),
                    file,
                  },
                  suggest: classSuggestions(
                    node,
                    context,
                    token,
                    suggestions,
                    "useToken",
                    "replacement"
                  ),
                },
                exemption.message
              );
              continue;
            }
          }
          let replacement = null;
          let near = null;
          const scaleKind =
            group === "font-size"
              ? "text"
              : group && /^rounded(-|$)/.test(group)
                ? "radius"
                : null;
          if (category === "spacing" || (group && SPACING_GROUPS.has(group))) {
            if (unitPx === void 0) unitPx = spacingBaseFor(filename);
            replacement = scaleEquivalent(token, unitPx);
          } else if (scaleKind && parts) {
            const px = lengthInPx(parts.inner.replace(/_/g, " "));
            const steps =
              px === null
                ? []
                : nearestSteps(px, scaleFor(filename, scaleKind));
            const toClass = (name) =>
              withBase(token, `${parts.utility}-${name}${parts.suffix}`);
            if (steps[0]?.exact) replacement = toClass(steps[0].name);
            else if (steps.length) near = formatSteps(steps, toClass);
          }
          emit(
            {
              node,
              messageId: replacement
                ? "arbitraryValueWithScale"
                : near
                  ? "arbitraryValueNearScale"
                  : "arbitraryValue",
              data: {
                className: token,
                component: site.component ?? "",
                replacement: replacement ?? "",
                suggestions: near ?? "",
                file,
              },
              suggest: replacement
                ? classSuggestions(
                    node,
                    context,
                    token,
                    [replacement],
                    "useScale",
                    "replacement"
                  )
                : void 0,
            },
            exemption.message
          );
        }
    });
  },
};

//#endregion
//#region src/rules/no-inline-styles.ts
const COLOR_FUNCTION$1 =
  /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|oklch|oklab|lab|lch|color|color-mix|light-dark)\(/i;
function colorValueText(value) {
  let text = "";
  let quote = "";
  let urlDepth = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && value[i + 1] === "*") {
      const end = value.indexOf("*/", i + 2);
      i = end === -1 ? value.length : end + 1;
      text += " ";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      text += " ";
      continue;
    }
    if (char === "\\") {
      if (!urlDepth) text += value.slice(i, i + 2);
      i++;
      continue;
    }
    if (urlDepth) {
      if (char === "(") urlDepth++;
      else if (char === ")") urlDepth--;
      continue;
    }
    if (
      value.slice(i, i + 4).toLowerCase() === "url(" &&
      (i === 0 || !/[\w-]/.test(value[i - 1]))
    ) {
      urlDepth = 1;
      i += 3;
      text += " ";
      continue;
    }
    text += char;
  }
  return text;
}
function hasRawColor(value) {
  const text = withoutVariableChannelColors(colorValueText(value));
  if (COLOR_FUNCTION$1.test(text) || parseColor(text) !== null) return true;
  return text
    .replace(/var\([^)]*\)/gi, " ")
    .split(/[\s,()/]+/)
    .some((leaf) => leaf && parseColor(leaf) !== null);
}
function unwrap(node) {
  while (
    node &&
    (node.type === "TSAsExpression" ||
      node.type === "TSSatisfiesExpression" ||
      node.type === "TSNonNullExpression")
  )
    node = node.expression;
  return node;
}
function cssPropertyName(name) {
  if (name.startsWith("--")) return name;
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).toLowerCase();
}
function propertyMatcher(entries) {
  const patterns = (entries ?? []).map((entry) => {
    if (!/^--[\w*-]+$/.test(entry) && !/^[a-zA-Z*][a-zA-Z*-]*$/.test(entry))
      throw new ContractConfigError(
        `shadcn/no-inline-styles: entry "${entry}" is not a CSS property name (backgroundColor, background-color, border-*, --chart-1), so it would match nothing.`
      );
    return new RegExp(`^${cssPropertyName(entry).replace(/\*/g, ".*")}$`);
  });
  return (property) => {
    const name = cssPropertyName(property);
    return patterns.some((pattern) => pattern.test(name));
  };
}
function compilePropertyPolicy(options) {
  const topAllow = allowListOf(options);
  const topDeny = options.deny ?? [];
  const compile = (policy, inherited) => ({
    allow: propertyMatcher(allowListOf(policy, inherited?.allow)),
    deny: propertyMatcher(policy.deny ?? inherited?.deny),
    message: (inherited ? policy.message : void 0) ?? null,
  });
  const baseline = compile(options);
  const contracts = (options.contracts ?? []).map((c) => {
    let pattern;
    try {
      pattern = new RegExp(c.pattern);
    } catch {
      throw new ContractConfigError(
        `Contract pattern "${c.pattern}" is not a valid regular expression.`
      );
    }
    return {
      pattern,
      ...compile(c, {
        allow: topAllow,
        deny: topDeny,
      }),
    };
  });
  const policyFor = (component) => {
    for (let i = contracts.length - 1; i >= 0; i--)
      if (contracts[i].pattern.test(component)) return contracts[i];
    return baseline;
  };
  const decide = (component, property) => {
    const policy = component ? policyFor(component) : baseline;
    if (policy.deny(property))
      return {
        exempt: false,
        message: policy.message,
      };
    if (policy.allow(property))
      return {
        exempt: true,
        message: null,
      };
    return {
      exempt: false,
      message: policy.message,
    };
  };
  const wordsFor = (component) =>
    component ? policyFor(component).message : null;
  return {
    decide,
    wordsFor,
  };
}
function carriesRawColor(node, context, seen = /* @__PURE__ */ new Set()) {
  node = unwrap(node);
  if (!node) return false;
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" && hasRawColor(node.value);
    case "TemplateLiteral":
      return hasRawColor(
        node.quasis.map((q) => q.value?.cooked ?? "").join("￼")
      );
    case "ConditionalExpression":
      return (
        carriesRawColor(node.consequent, context, seen) ||
        carriesRawColor(node.alternate, context, seen)
      );
    case "LogicalExpression":
      return (
        carriesRawColor(node.left, context, seen) ||
        carriesRawColor(node.right, context, seen)
      );
    case "ObjectExpression":
      return node.properties.some(
        (p) => p.type === "Property" && carriesRawColor(p.value, context, seen)
      );
    case "ArrayExpression":
      return node.elements.some((el) => carriesRawColor(el, context, seen));
    case "Identifier": {
      const init = resolveIdentifier(node, context, seen)?.init;
      return init ? carriesRawColor(init, context, seen) : false;
    }
    case "MemberExpression":
      if (node.object?.type === "Identifier") {
        const init = resolveIdentifier(node.object, context, seen)?.init;
        return init ? carriesRawColor(init, context, seen) : false;
      }
      return carriesRawColor(node.object, context, seen);
    default:
      return false;
  }
}
function splitDeclarations(css) {
  const out = [];
  let start = 0;
  let depth = 0;
  let quote = "";
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = "";
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (char === ";" && depth === 0) {
      out.push(css.slice(start, i));
      start = i + 1;
    }
  }
  out.push(css.slice(start));
  return out;
}
function cssTextOf(node) {
  if (
    (node?.type === "Literal" || isMarkupLiteral(node)) &&
    typeof node.value === "string"
  )
    return node.value;
  if (node?.type === "TemplateLiteral")
    return node.quasis.map((q) => q.value?.cooked ?? "").join("￼");
  return null;
}
const MESSAGES$4 = {
  inlineStyle:
    "Inline style sets {{property}}. Style through classes; use CSS custom properties for dynamic values.",
  dynamicStyle:
    "Dynamic style object cannot be checked. Build it from CSS custom properties only.",
  customPropColor:
    "Custom property {{property}} hardcodes a color. Define it as a theme token instead of injecting a raw value.",
  styleElement:
    "A <style> element injects CSS outside the design system. Use classes, or declare the rule in your theme CSS.",
};
const noInlineStyles = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow inline style attributes, except CSS custom properties.",
      url: "https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-inline-styles.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          ...policySchema,
          allowDynamicIdentifiers: entriesSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: MESSAGES$4,
  },
  create(context) {
    const options = context.options?.[0] ?? {};
    const allowedDynamic = new Set(options.allowDynamicIdentifiers ?? []);
    const isAllowedDynamic = (expr) =>
      allowedDynamic.has(dottedName(expr) ?? "");
    const emit = reporter(context, MESSAGES$4, {
      rule: "shadcn/no-inline-styles",
      message: options.message,
    });
    let policy;
    try {
      policy = compilePropertyPolicy(options);
    } catch (error) {
      return configErrorVisitors(context, error);
    }
    const reader = readerFor(context);
    const elementName = (attribute) => {
      const name = reader.nameOf(reader.elementOf(attribute));
      return name?.component ? name.text : "";
    };
    const judge = (key, value, component, text) => {
      const verdict = policy.decide(component, key);
      if (verdict.exempt) return;
      const messageId = !key.startsWith("--")
        ? "inlineStyle"
        : (
              text === void 0
                ? carriesRawColor(value, context)
                : hasRawColor(text)
            )
          ? "customPropColor"
          : null;
      if (!messageId) return;
      emit(
        {
          node: value,
          messageId,
          data: {
            property: key,
            component,
          },
        },
        verdict.message
      );
    };
    const judgeDeclarations = (css, reportAt, component) => {
      for (const declaration of splitDeclarations(css)) {
        const colon = declaration.indexOf(":");
        if (colon === -1) continue;
        const property = declaration.slice(0, colon).trim();
        if (!property) continue;
        judge(property, reportAt, component, declaration.slice(colon + 1));
      }
    };
    const check = (
      expr,
      reportAt,
      seen = /* @__PURE__ */ new Set(),
      component = ""
    ) => {
      expr = unwrap(expr);
      if (!expr) return;
      const forwarded = forwardedValuesOf(expr, context, "style", seen);
      if (forwarded && !seen.has(forwarded.variable)) {
        seen.add(forwarded.variable);
        for (const alternative of forwarded.alternatives)
          if ("unresolved" in alternative)
            emit(
              {
                node: reportAt,
                messageId: "dynamicStyle",
                data: { component },
              },
              policy.wordsFor(component)
            );
          else check(alternative.value, reportAt, seen, component);
        seen.delete(forwarded.variable);
        return;
      }
      if (
        (expr.type === "Identifier" && expr.name === "undefined") ||
        (expr.type === "Literal" && expr.value === null)
      )
        return;
      if (reader.staticStyles) {
        const css = cssTextOf(expr);
        if (css !== null) return judgeDeclarations(css, reportAt, component);
      }
      if (expr.type === "ConditionalExpression") {
        check(expr.consequent, expr.consequent, seen, component);
        check(expr.alternate, expr.alternate, seen, component);
        return;
      }
      if (expr.type === "LogicalExpression") {
        if (expr.operator !== "&&")
          check(expr.left, expr.left, seen, component);
        check(expr.right, expr.right, seen, component);
        return;
      }
      if (expr.type === "Identifier") {
        const init = resolveIdentifier(expr, context, seen)?.init;
        if (isAllowedDynamic(expr) && init?.type !== "ObjectExpression") return;
        if (init) return check(init, reportAt, seen, component);
        emit(
          {
            node: reportAt,
            messageId: "dynamicStyle",
            data: { component },
          },
          policy.wordsFor(component)
        );
        return;
      }
      if (expr.type === "MemberExpression") {
        const found = resolveMemberValue(expr, context, seen);
        const value = "unresolved" in found ? null : found.value;
        if (isAllowedDynamic(expr) && value?.type !== "ObjectExpression")
          return;
        if (value) return check(value, reportAt, seen, component);
      }
      if (expr.type !== "ObjectExpression") {
        emit(
          {
            node: reportAt,
            messageId: "dynamicStyle",
            data: { component },
          },
          policy.wordsFor(component)
        );
        return;
      }
      const properties = /* @__PURE__ */ new Map();
      for (const entry of objectEntries(expr, context, seen)) {
        if ("unknown" in entry) {
          const prop = entry.unknown;
          if (
            prop.type === "SpreadElement" &&
            isForwardedProp(unwrap(prop.argument), context, "style")
          ) {
            check(prop.argument, prop, seen, component);
            continue;
          }
          if (
            prop.type === "SpreadElement" &&
            isAllowedDynamic(unwrap(prop.argument))
          )
            continue;
          emit(
            {
              node: prop,
              messageId: "dynamicStyle",
              data: { component },
            },
            policy.wordsFor(component)
          );
          continue;
        }
        properties.set(entry.key, entry.value);
      }
      for (const [key, value] of properties) judge(key, value, component);
    };
    const visitors = {
      JSXOpeningElement(node) {
        if (node.name?.type === "JSXIdentifier" && node.name.name === "style")
          emit({
            node,
            messageId: "styleElement",
          });
      },
    };
    for (const type of reader.attributes)
      addVisitor(visitors, type, (node) => {
        if (reader.attributeName(node) !== "style") return;
        const value = reader.attributeValue(node);
        if (isContainer(value))
          check(
            value.expression,
            value.expression,
            /* @__PURE__ */ new Set(),
            elementName(node)
          );
        else if (reader.staticStyles && value)
          check(value, value, /* @__PURE__ */ new Set(), elementName(node));
      });
    for (const [type, read] of Object.entries(reader.styleProperties ?? {}))
      addVisitor(visitors, type, (node) => {
        const style = read(node);
        if (!style) return;
        const value = isContainer(style.value)
          ? style.value.expression
          : style.value;
        const text = cssTextOf(value);
        judge(
          style.property,
          text === null ? value : node,
          elementName(node),
          text ?? void 0
        );
      });
    for (const type of reader.spreads)
      addVisitor(visitors, type, (node) => {
        const object = resolveObject(
          reader.spreadArgument(node),
          context,
          /* @__PURE__ */ new Set()
        );
        if (!object) return;
        const { value, uncertain } = resolveProperty(
          object,
          "style",
          context,
          /* @__PURE__ */ new Set()
        );
        if (!value) return;
        const component = elementName(node);
        if (uncertain)
          emit(
            {
              node,
              messageId: "dynamicStyle",
              data: { component },
            },
            policy.wordsFor(component)
          );
        else check(value, value, /* @__PURE__ */ new Set(), component);
      });
    return visitors;
  },
};

//#endregion
//#region src/rules/no-raw-colors.ts
const NAMED = /* @__PURE__ */ new Set(["transparent", "current", "inherit"]);
const FIXED = /* @__PURE__ */ new Set(["white", "black"]);
const PAINT_PREFIXES = /* @__PURE__ */ new Set(["fill-", "stroke-"]);
const COLOR_ATTRIBUTES = /* @__PURE__ */ new Set([
  "fill",
  "stroke",
  "color",
  "stopColor",
  "stop-color",
  "floodColor",
  "flood-color",
  "lightingColor",
  "lighting-color",
]);
const ATTRIBUTE_ALLOWED = /* @__PURE__ */ new Set([
  "currentColor",
  "currentcolor",
  "none",
  "inherit",
  "transparent",
  "initial",
  "unset",
]);
const COLOR_FUNCTION =
  /^(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|oklch|oklab|lab|lch|color|color-mix)\(.*\))$/;
function isRawColorValue(value) {
  const trimmed = value.trim();
  if (ATTRIBUTE_ALLOWED.has(trimmed)) return false;
  if (!withoutVariableChannelColors(trimmed).trim()) return false;
  if (COLOR_FUNCTION.test(trimmed)) return true;
  return isNamedColor(trimmed);
}
function splitColorClass(token) {
  const base = normalizeClass(token);
  const match = base.match(COLOR_PREFIX);
  if (!match) return null;
  const rest = base.slice(match[0].length);
  const opacity = rest.match(OPACITY_MODIFIER)?.[0] ?? "";
  const value = rest.slice(0, rest.length - opacity.length);
  if (!value || value.startsWith("[") || value.startsWith("(")) return null;
  return {
    prefix: match[0],
    value,
    opacity,
  };
}
function colorValueOf(token) {
  return splitColorClass(token)?.value ?? null;
}
const PREFIX_NAMESPACES = {
  bg: "background-color",
  text: "text-color",
  border: "border-color",
  divide: "divide-color",
  ring: "ring-color",
  outline: "outline-color",
  accent: "accent-color",
  caret: "caret-color",
  placeholder: "placeholder-color",
  decoration: "text-decoration-color",
  "text-shadow": "text-shadow-color",
  "drop-shadow": "drop-shadow-color",
  fill: "fill",
  stroke: "stroke",
};
const FALLBACK_NAMESPACES = { "divide-color": ["border-color"] };
function colorNamespaceOf(prefix) {
  const base = prefix.replace(/-$/, "");
  return (
    PREFIX_NAMESPACES[base] ??
    PREFIX_NAMESPACES[base.replace(/-(?:[trblxyse]|[bi][se])$/, "")] ??
    null
  );
}
const NO_THEME = {};
const verdicts = /* @__PURE__ */ new WeakMap();
function verdictMemo(theme, key) {
  let byKey = verdicts.get(theme);
  if (!byKey) {
    byKey = /* @__PURE__ */ new Map();
    verdicts.set(theme, byKey);
  }
  let memo = byKey.get(key);
  if (!memo) {
    memo = /* @__PURE__ */ new Map();
    byKey.set(key, memo);
  }
  return memo;
}
const MESSAGES$3 = {
  paletteClass:
    '"{{className}}" uses the raw Tailwind palette. Use a theme token, or define one for this color.',
  paletteClassNear:
    '"{{className}}" uses the raw Tailwind palette. Nearest theme tokens: {{suggestions}}. Use one of those, or declare --color-<name> in {{file}} for a new color.',
  paletteClassFar:
    '"{{className}}" uses the raw Tailwind palette and no declared theme color is close to it. Use one of: {{tokens}}, or declare --color-<name> in {{file}} for a new color.',
  paletteClassListed:
    '"{{className}}" uses the raw Tailwind palette. Use one of the theme colors: {{tokens}}, or declare --color-<name> in {{file}} for a new color.',
  undeclaredToken:
    '"{{className}}" is not a declared theme color. Use one of: {{tokens}}. To add a color, declare --color-<name> in {{file}} first.',
  undeclaredTokenTypo:
    '"{{className}}" is not a declared theme color. Did you mean "{{suggestion}}"? Declared colors: {{tokens}}.',
  rawColorAttribute:
    '{{attribute}}="{{value}}" hardcodes a color. Use currentColor with a text color class, or var(--color-<token>).',
  rawColorAttributeNear:
    '{{attribute}}="{{value}}" hardcodes a color. Use currentColor with a text color class, or the nearest theme token: var(--color-{{suggestion}}).',
  useToken: 'Replace with "{{replacement}}".',
};
const noRawColors = {
  meta: {
    type: "problem",
    hasSuggestions: true,
    docs: {
      description:
        "Require theme tokens for color utilities instead of the raw Tailwind palette.",
      url: "https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-raw-colors.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          ...policySchema,
          ...recognitionSchema,
          scanAllStrings: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: MESSAGES$3,
  },
  create(context) {
    const options = withSettings(context, context.options?.[0] ?? {});
    const emit = reporter(context, MESSAGES$3, {
      rule: "shadcn/no-raw-colors",
      message: options.message,
    });
    const filename = fileOf(context);
    let policy;
    try {
      policy = compileVocabularyPolicy(
        {
          ...options,
          fromFile: filename,
        },
        "shadcn/no-raw-colors"
      );
    } catch (error) {
      return configErrorVisitors(context, error);
    }
    const { groupOf } = projectClassifierFor(filename);
    let theme;
    function readTheme() {
      const declared = colorTokensFor(filename);
      const themeFile = themeFileFor(filename);
      const file = themeFile
        ? displayPath(themeFile, context)
        : "your theme CSS";
      return {
        declared,
        scoped: scopedColorTokensFor(filename),
        entry: tailwindEntryFor(filename),
        prefix: tailwindPrefixFor(filename),
        file,
        memo: verdictMemo(declared ?? NO_THEME, file),
      };
    }
    const themeFor = () => (theme ??= readTheme());
    let listed;
    const tokenList = () =>
      (listed ??= themeFor().declared ? listTokens(themeFor().declared) : "");
    let colors;
    const suggestionColors = () => {
      if (colors === void 0)
        colors = themeFor().declared ? colorValuesFor(filename) : null;
      return colors;
    };
    const nearest = (token) => {
      const parts = splitColorClass(token);
      const lab = parts && paletteColor(parts.value);
      const values = suggestionColors();
      if (!parts || !lab || !values) return [];
      return nearestColorTokens(lab, values, roleOf(parts.prefix)).map((name) =>
        withBase(token, `${parts.prefix}${name}${parts.opacity}`)
      );
    };
    const paletteVerdict = (token) => {
      const { declared, file } = themeFor();
      if (!declared)
        return {
          messageId: "paletteClass",
          data: { className: token },
        };
      if (!suggestionColors()?.size)
        return {
          messageId: "paletteClassListed",
          data: {
            className: token,
            tokens: tokenList(),
            file,
          },
        };
      const suggestions = nearest(token);
      return {
        messageId: suggestions.length ? "paletteClassNear" : "paletteClassFar",
        data: {
          className: token,
          suggestions: suggestions.join(", "),
          tokens: tokenList(),
          file,
        },
        replacements: suggestions,
      };
    };
    const isTypoOfAnotherUtility = (token) => {
      const { entry } = themeFor();
      const suggestion = (entry ? unknownClasses(entry, [token]) : null)?.[0]
        ?.suggestion;
      return !!suggestion && categoryOf(groupOf(suggestion)) !== "color";
    };
    const tokensFor = (prefix) => {
      const { declared, scoped } = themeFor();
      const namespace = colorNamespaceOf(prefix);
      const own = namespace
        ? [namespace, ...(FALLBACK_NAMESPACES[namespace] ?? [])].flatMap(
            (name) => [...(scoped?.get(name) ?? [])]
          )
        : [];
      if (!own.length) return declared;
      return /* @__PURE__ */ new Set([...(declared ?? []), ...own]);
    };
    const undeclaredVerdict = (token) => {
      const { file } = themeFor();
      const parts = splitColorClass(token);
      const declared = parts ? tokensFor(parts.prefix) : null;
      const meant =
        parts && declared ? didYouMean(parts.value, declared) : null;
      if (!meant && isTypoOfAnotherUtility(token)) return null;
      if (parts && meant) {
        const suggestion = withBase(
          token,
          `${parts.prefix}${meant}${parts.opacity}`
        );
        return {
          messageId: "undeclaredTokenTypo",
          data: {
            className: token,
            suggestion,
            tokens: tokenList(),
            file,
          },
          replacements: [suggestion],
        };
      }
      return {
        messageId: "undeclaredToken",
        data: {
          className: token,
          tokens: tokenList(),
          file,
        },
      };
    };
    const judge = (token) => {
      if (isArbitraryValue$1(token)) return null;
      const { declared, prefix } = themeFor();
      if (prefix && !token.startsWith(`${prefix}:`)) return null;
      const parts = splitColorClass(token);
      const colorValue = parts?.value ?? null;
      if (colorValue && declared?.has(colorValue)) return null;
      if (parts && tokensFor(parts.prefix)?.has(parts.value)) return null;
      if (isPaletteClass(token)) return paletteVerdict(token);
      if (colorValue && FIXED.has(colorValue)) {
        const verdict = paletteVerdict(token);
        return (
          verdict && {
            ...verdict,
            optIn: true,
          }
        );
      }
      if (!declared) return null;
      if (categoryOf(groupOf(token)) !== "color") return null;
      if (!colorValue || NAMED.has(colorValue)) return null;
      if (parts?.value === "none" && PAINT_PREFIXES.has(parts.prefix))
        return null;
      if (declaresUtility(filename, token)) return null;
      return undeclaredVerdict(token);
    };
    const verdictOf = (token) => {
      const { memo } = themeFor();
      let verdict = memo.get(token);
      if (verdict === void 0) {
        if (memo.size > 5e4) memo.clear();
        verdict = judge(token);
        memo.set(token, verdict);
      }
      return verdict;
    };
    const visitors = classSiteVisitors(context, options, (site) => {
      for (const { value, node } of site.vocabularyStrings)
        for (const token of splitClasses(value)) {
          const verdict = verdictOf(token);
          if (!verdict) continue;
          const exemption = policy.decide(site.component, token);
          if (exemption.kind === "ok") continue;
          if (verdict.optIn && exemption.kind !== "denied") continue;
          const { replacements, optIn: _optIn, ...report } = verdict;
          emit(
            {
              node,
              ...report,
              data: {
                ...report.data,
                component: site.component ?? "",
              },
              suggest: classSuggestions(
                node,
                context,
                token,
                replacements ?? [],
                "useToken",
                "replacement"
              ),
            },
            exemption.message
          );
        }
    });
    const reader = readerFor(context);
    const colorAttribute = (node) => {
      const name = reader.attributeName(node);
      if (!COLOR_ATTRIBUTES.has(name)) return;
      const tag = reader.nameOf(reader.elementOf(node));
      if (!tag || tag.component || !/^[a-z]/.test(tag.root)) return;
      const value = staticStringOf(reader.attributeValue(node));
      if (value === null || !isRawColorValue(value)) return;
      const values = suggestionColors();
      const lab = values?.size ? parseColor(value) : null;
      const [suggestion] = lab
        ? nearestColorTokens(lab, values, "text", 1)
        : [];
      emit({
        node,
        messageId: suggestion ? "rawColorAttributeNear" : "rawColorAttribute",
        data: {
          attribute: name,
          value,
          suggestion: suggestion ?? "",
        },
      });
    };
    const merged = { ...visitors };
    for (const type of reader.attributes) {
      const classAttribute = visitors[type];
      merged[type] = (node) => {
        classAttribute?.(node);
        colorAttribute(node);
      };
    }
    return merged;
  },
};

//#endregion
//#region src/project/variants.ts
const cache = /* @__PURE__ */ new Map();
const VARIANT_FACTORIES = /* @__PURE__ */ new Set(["cva", "tv"]);
function keyName(node) {
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string")
    return node.value;
  return null;
}
function axesOf(config) {
  const axes = {};
  if (config?.type !== "ObjectExpression") return axes;
  const variants = config.properties.find(
    (p) => p.type === "Property" && keyName(p.key) === "variants"
  );
  if (variants?.value?.type !== "ObjectExpression") return axes;
  for (const axis of variants.value.properties) {
    if (axis.type !== "Property") continue;
    const axisName = keyName(axis.key);
    if (!axisName || axis.value?.type !== "ObjectExpression") continue;
    axes[axisName] = axis.value.properties
      .filter((p) => p.type === "Property")
      .map((p) => keyName(p.key))
      .filter((k) => typeof k === "string");
  }
  return axes;
}
const MAY_DEFINE_VARIANTS = /\b(?:cva|tv)\s*\(|\|\s*["']|\bkeyof\s+typeof\b/;
const MAX_TYPE_DEPTH = 8;
function unwrapType(type) {
  let out = type;
  for (
    let depth = 0;
    out?.type === "TSParenthesizedType" && depth < MAX_TYPE_DEPTH;
    depth++
  )
    out = out.typeAnnotation;
  return out;
}
function objectKeys(object) {
  if (object?.type !== "ObjectExpression") return null;
  const keys = [];
  for (const property of object.properties) {
    if (property.type !== "Property" || property.computed) return null;
    const key = keyName(property.key);
    if (!key) return null;
    keys.push(key);
  }
  return keys.length ? keys : null;
}
function literalValues(input, declared, depth = 0) {
  const type = unwrapType(input);
  if (!type || depth > MAX_TYPE_DEPTH) return null;
  if (type.type === "TSTypeReference" && type.typeName?.type === "Identifier")
    return literalValues(
      declared.types.get(type.typeName.name),
      declared,
      depth + 1
    );
  if (
    type.type === "TSTypeOperator" &&
    type.operator === "keyof" &&
    type.typeAnnotation?.type === "TSTypeQuery" &&
    type.typeAnnotation.exprName?.type === "Identifier"
  )
    return objectKeys(declared.objects.get(type.typeAnnotation.exprName.name));
  if (type.type === "TSUnionType") {
    const values = [];
    for (const member of type.types) {
      if (member.type === "TSUndefinedKeyword") continue;
      const nested = literalValues(member, declared, depth + 1);
      if (!nested) return null;
      values.push(...nested);
    }
    return values.length ? values : null;
  }
  if (
    type.type === "TSLiteralType" &&
    type.literal?.type === "Literal" &&
    typeof type.literal.value === "string"
  )
    return [type.literal.value];
  return null;
}
function axesOfPropsType(input, declared, depth = 0) {
  const axes = {};
  const type = unwrapType(input);
  if (!type || depth > MAX_TYPE_DEPTH) return axes;
  if (type.type === "TSIntersectionType") {
    for (const member of type.types)
      Object.assign(axes, axesOfPropsType(member, declared, depth + 1));
    return axes;
  }
  if (type.type === "TSUnionType") {
    const [first, ...rest] = type.types.map((member) =>
      axesOfPropsType(member, declared, depth + 1)
    );
    for (const [name, values] of Object.entries(first ?? {})) {
      const shared = values.filter((value) =>
        rest.every((other) => other[name]?.includes(value))
      );
      if (shared.length) axes[name] = shared;
    }
    return axes;
  }
  if (type.type === "TSTypeReference" && type.typeName?.type === "Identifier")
    return axesOfPropsType(
      declared.types.get(type.typeName.name),
      declared,
      depth + 1
    );
  const members =
    type.type === "TSTypeLiteral"
      ? type.members
      : type.type === "TSInterfaceBody"
        ? type.body
        : null;
  if (!members) return axes;
  for (const member of members) {
    if (member.type !== "TSPropertySignature") continue;
    const key = keyName(member.key);
    const values = literalValues(
      member.typeAnnotation?.typeAnnotation,
      declared
    );
    if (key && values) axes[key] = values;
  }
  return axes;
}
function declarationsIn(ast) {
  const types = /* @__PURE__ */ new Map();
  const objects = /* @__PURE__ */ new Map();
  walk(ast, (node) => {
    if (
      node.type === "TSTypeAliasDeclaration" &&
      node.id?.type === "Identifier"
    )
      types.set(node.id.name, node.typeAnnotation);
    else if (
      node.type === "TSInterfaceDeclaration" &&
      node.id?.type === "Identifier"
    )
      types.set(node.id.name, node.body);
    else if (
      node.type === "VariableDeclarator" &&
      node.id?.type === "Identifier"
    ) {
      const init =
        node.init?.type === "TSAsExpression" ||
        node.init?.type === "TSSatisfiesExpression"
          ? node.init.expression
          : node.init;
      if (init?.type === "ObjectExpression") objects.set(node.id.name, init);
    }
  });
  return {
    types,
    objects,
  };
}
function componentSignature(node) {
  if (node.type === "FunctionDeclaration" && node.id?.type === "Identifier")
    return {
      name: node.id.name,
      param: node.params?.[0],
    };
  if (
    node.type === "VariableDeclarator" &&
    node.id?.type === "Identifier" &&
    (node.init?.type === "ArrowFunctionExpression" ||
      node.init?.type === "FunctionExpression")
  )
    return {
      name: node.id.name,
      param: node.init.params?.[0],
    };
  return null;
}
function namesIn(node, types) {
  const names = /* @__PURE__ */ new Set();
  const pending = [node];
  while (pending.length)
    walk(pending.pop(), (child) => {
      if (child.type !== "Identifier" || names.has(child.name)) return;
      names.add(child.name);
      const type = types.get(child.name);
      if (type) pending.push(type);
    });
  return names;
}
function readVariants(source, file) {
  const definitions = [];
  const uses = /* @__PURE__ */ new Map();
  if (!MAY_DEFINE_VARIANTS.test(source))
    return {
      definitions,
      uses,
    };
  let ast;
  try {
    ast = parseSource(source, file);
  } catch {
    return {
      definitions,
      uses,
    };
  }
  const declared = declarationsIn(ast);
  const scopes = /* @__PURE__ */ new Map();
  const types = /* @__PURE__ */ new Map();
  walk(ast, (node, parent) => {
    if (
      (node.type === "FunctionDeclaration" ||
        node.type === "VariableDeclarator" ||
        node.type === "TSTypeAliasDeclaration" ||
        node.type === "TSInterfaceDeclaration") &&
      node.id?.type === "Identifier"
    ) {
      const into = node.type.startsWith("TS") ? types : scopes;
      if (!into.has(node.id.name)) into.set(node.id.name, node);
    }
    if (node.type === "CallExpression") {
      if (node.callee?.type !== "Identifier") return;
      if (!VARIANT_FACTORIES.has(node.callee.name)) return;
      const [first, second] = node.arguments;
      const axes = axesOf(
        node.callee.name === "tv" && first?.type === "ObjectExpression"
          ? first
          : second
      );
      if (!Object.keys(axes).length) return;
      const name =
        parent?.type === "VariableDeclarator" &&
        parent.id?.type === "Identifier"
          ? parent.id.name
          : null;
      definitions.push({
        name,
        axes,
        source: "factory",
      });
      return;
    }
    const signature = componentSignature(node);
    if (!signature) return;
    const type = signature.param?.typeAnnotation?.typeAnnotation;
    const axes = axesOfPropsType(type, declared);
    if (!Object.keys(axes).length) return;
    definitions.push({
      name: signature.name,
      axes,
      source: "props",
    });
  });
  const factories = new Set(
    definitions.flatMap((d) => (d.source === "factory" && d.name ? d.name : []))
  );
  if (!factories.size)
    return {
      definitions,
      uses,
    };
  for (const [name, node] of scopes) {
    const used = [...namesIn(node, types)].filter(
      (n) => n !== name && factories.has(n)
    );
    if (used.length) uses.set(name, new Set(used));
  }
  return {
    definitions,
    uses,
  };
}
function fileVariantsOf(file) {
  const mtimeMs = mtimeOf(file);
  if (mtimeMs === null) return null;
  const cached = cache.get(file);
  if (cached && cached.mtimeMs === mtimeMs) return cached;
  let read;
  try {
    read = readVariants(fs.readFileSync(file, "utf-8"), file);
  } catch {
    read = {
      definitions: [],
      uses: /* @__PURE__ */ new Map(),
    };
  }
  const entry = {
    mtimeMs,
    ...read,
  };
  cache.set(file, entry);
  return entry;
}
function variantDefinitionsOf(file) {
  return fileVariantsOf(file)?.definitions ?? [];
}
function barrelDefinitionFor(file, expected) {
  const barrel = isSfc(file) ? barrelOf(path.dirname(file)) : null;
  if (!barrel) return null;
  if (![...exportsOf(barrel).values()].some((binding) => binding.file === file))
    return null;
  return variantDefinitionsOf(barrel).find((d) => d.name === expected) ?? null;
}
function importedDefinitionFor(file, expected) {
  const imported = importOf(file, expected);
  if (!imported) return null;
  const binding = definingExportOf(imported.spec, imported.name, file);
  if (!binding || NODE_MODULES.test(binding.file)) return null;
  return (
    variantDefinitionsOf(binding.file).find(
      (d) => d.name === binding.name && d.source === "factory"
    ) ?? null
  );
}
function definitionFor(file, component) {
  const expected =
    component.charAt(0).toLowerCase() + component.slice(1) + "Variants";
  const read = fileVariantsOf(file);
  const definitions = read?.definitions ?? [];
  if (!definitions.length)
    return (
      barrelDefinitionFor(file, expected) ??
      importedDefinitionFor(file, expected)
    );
  return (
    definitions.find((d) => d.name === expected) ??
    definitions.find((d) => d.name === component && d.source === "props") ??
    importedDefinitionFor(file, expected) ??
    definitions.find(
      (d) =>
        d.source === "factory" &&
        (isSfc(file) || (!!d.name && !!read?.uses.get(component)?.has(d.name)))
    ) ??
    null
  );
}
function variantNamesFor(file, component) {
  const values = definitionFor(file, component)?.axes.variant;
  return values?.length ? values : null;
}
function sizeNamesFor(file, component) {
  const values = definitionFor(file, component)?.axes.size;
  return values?.length ? values : null;
}

//#endregion
//#region src/rules/no-restyle.ts
const messageSchema = {
  anyOf: [
    {
      type: "string",
      maxLength: 500,
    },
    {
      type: "object",
      properties: Object.fromEntries(
        ["default", "layout", ...CATEGORIES].map((key) => [
          key,
          {
            type: "string",
            maxLength: 500,
          },
        ])
      ),
      additionalProperties: false,
    },
  ],
};
const NOT_ALLOWED = '"{{className}}" is not allowed on <{{component}}>:';
const OWNS = "<{{component}}> owns its {{category}}.";
const OWNS_VIA_WRAPPER =
  "<{{wrapper}}> forwards {{prop}} to <{{component}}>, which owns its {{category}}.";
const NEW_VARIANT_GUARD =
  "only if the design explicitly calls for a treatment none of these provides.";
const SPACING_SIZES =
  "Use a size ({{sizes}}), or {{around}} for space around it.";
const SPACING_AROUND = "For space around it, use {{around}}.";
const SPACING_NEW_SIZE =
  "Add a size {{where}} only if the design explicitly calls for one.";
const MESSAGES$2 = {
  appearanceClass: `${NOT_ALLOWED} ${OWNS} Use one of its variants. Add a new variant only if the design explicitly calls for a treatment none of them provides.`,
  appearanceClassWithVariants: `${NOT_ALLOWED} ${OWNS} Use a variant: {{variants}}. Add a new variant {{where}} ${NEW_VARIANT_GUARD}`,
  appearanceClassNoVariants: `${NOT_ALLOWED} ${OWNS} Add a variant {{where}} only if the design explicitly calls for this treatment.`,
  appearanceClassViaWrapper: `"{{className}}" is not allowed on <{{wrapper}}>: ${OWNS_VIA_WRAPPER} Use a variant{{variantsSuffix}}. Add a new variant {{where}} ${NEW_VARIANT_GUARD}`,
  deniedClass: `${NOT_ALLOWED} its contract denies {{entries}}.`,
  layoutClass: `${NOT_ALLOWED} its contract allows {{entries}}. Use one of those, or put layout classes on a parent element.`,
  layoutClassClosed: `${NOT_ALLOWED} its contract allows no classes. Put layout classes on a parent element instead.`,
  unclassifiedClass: `${NOT_ALLOWED} the grammar does not recognize it. Fix the spelling, or use a class Tailwind generates.`,
  declaredClass: `${NOT_ALLOWED} your CSS declares it, and the grammar cannot tell what it changes. Use a variant, or put it on a parent element.`,
  spacingClassWithSizes: `${NOT_ALLOWED} ${OWNS} ${SPACING_SIZES} ${SPACING_NEW_SIZE}`,
  spacingClassNoSizes: `${NOT_ALLOWED} ${OWNS} ${SPACING_AROUND}`,
  spacingClassViaWrapperWithSizes: `"{{className}}" is not allowed on <{{wrapper}}>: ${OWNS_VIA_WRAPPER} ${SPACING_SIZES} ${SPACING_NEW_SIZE}`,
  spacingClassViaWrapperNoSizes: `"{{className}}" is not allowed on <{{wrapper}}>: ${OWNS_VIA_WRAPPER} ${SPACING_AROUND}`,
};
const noRestyle = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow classes on design-system components except what the rule's allow list and the component's contract permit.",
      url: "https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-restyle.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: entriesSchema,
          deny: entriesSchema,
          message: messageSchema,
          ...recognitionSchema,
          contracts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                allow: entriesSchema,
                deny: entriesSchema,
                message: messageSchema,
              },
              required: ["pattern"],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: MESSAGES$2,
  },
  create(context) {
    const emit = reporter(context, MESSAGES$2);
    const options = withSettings(context, context.options?.[0] ?? {});
    const filename = fileOf(context);
    let contracts;
    try {
      contracts = compileContracts(options.contracts, {
        allow: options.allow,
        deny: options.deny,
        message: options.message,
        fromFile: filename,
      });
    } catch (error) {
      return configErrorVisitors(context, error);
    }
    return classSiteVisitors(context, options, (site) => {
      if (!site.component) return;
      const component = site.component;
      const file = site.componentFile;
      const shown = file && !NODE_MODULES.test(file) ? file : null;
      const shownPath = shown ? displayPath(shown, context) : "";
      const where = shownPath ? `in ${shownPath}` : `to <${component}>`;
      let details;
      let sizes;
      for (const { value, node } of site.contextualStrings)
        for (const token of splitClasses(value)) {
          const verdict = contracts.decide(component, token);
          if (verdict.kind === "ok") continue;
          details ??= appearanceDetails(site);
          if (sizes === void 0)
            sizes = file ? sizeNamesFor(file, component) : null;
          const { messageId, variantNames, variantsSuffix } = details;
          const data = {
            className: token,
            component,
            entries: verdict.entries.join(" "),
            category: verdict.category,
            variants: variantNames,
            sizes: sizes?.join(", ") ?? "",
            wrapper: site.wrapper ?? "",
            prop:
              site.attribute && wrapperPropOf(site.attribute) !== "className"
                ? site.attribute
                : "className",
            file: shownPath,
            where,
          };
          if (
            verdict.kind === "denied" ||
            verdict.category === "layout" ||
            verdict.category === "unclassified"
          )
            emit(
              {
                node,
                messageId:
                  verdict.kind === "denied"
                    ? "deniedClass"
                    : verdict.category === "unclassified"
                      ? declaresClass(filename, token)
                        ? "declaredClass"
                        : "unclassifiedClass"
                      : verdict.entries.length
                        ? "layoutClass"
                        : "layoutClassClosed",
                data,
              },
              verdict.message
            );
          else if (verdict.category === "spacing")
            emit(
              {
                node,
                messageId: site.wrapper
                  ? sizes
                    ? "spacingClassViaWrapperWithSizes"
                    : "spacingClassViaWrapperNoSizes"
                  : sizes
                    ? "spacingClassWithSizes"
                    : "spacingClassNoSizes",
                data: {
                  ...data,
                  around: aroundFor(
                    site,
                    contracts,
                    component,
                    token,
                    filename,
                    options.ui
                  ),
                },
              },
              verdict.message
            );
          else
            emit(
              {
                node,
                messageId,
                data: {
                  ...data,
                  variantsSuffix,
                },
              },
              verdict.message
            );
        }
    });
  },
};
function aroundFor(site, contracts, component, token, filename, ui) {
  const accepts = (name) => contracts.decide(name, token).kind === "ok";
  const places = [];
  if (contracts.decide(component, "m-4").kind === "ok")
    places.push("margin here");
  const container = site.enclosingContainer(accepts);
  if (!container?.direct)
    places.push(
      site.closedParent(accepts)
        ? "gap on a plain wrapper around it"
        : "gap on the parent"
    );
  if (container) places.push(`spacing on <${container.name}>`);
  const primitives = contracts.primitivesFor(
    token,
    container ? [component, container.name] : [component],
    () => (filename ? componentsFor(filename, ui).files.keys() : [])
  );
  if (primitives.length) places.push(listOf(primitives));
  const last = places.pop();
  if (!places.length) return last;
  if (places.length === 1) return `${places[0]} or ${last}`;
  return `${places.join(", ")}, or ${last}`;
}
function listOf(names) {
  if (names.length < 3) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
function appearanceDetails(site) {
  const variants = site.componentFile
    ? variantNamesFor(site.componentFile, site.component)
    : null;
  const messageId = site.wrapper
    ? "appearanceClassViaWrapper"
    : !site.componentFile
      ? "appearanceClass"
      : variants
        ? "appearanceClassWithVariants"
        : "appearanceClassNoVariants";
  const variantNames = variants?.join(", ") ?? "";
  return {
    messageId,
    variantNames,
    variantsSuffix: variantNames ? `: ${variantNames}` : "",
  };
}

//#endregion
//#region src/rules/no-unknown-classes.ts
const MESSAGES$1 = {
  unknownClass:
    '"{{className}}" is not a class this project\'s Tailwind knows, so no CSS is generated for it. Fix the spelling, or declare it with @utility in {{file}}.',
  unknownClassSuggest:
    '"{{className}}" is not a class this project\'s Tailwind knows, so no CSS is generated for it. Did you mean "{{suggestion}}"?',
  unknownVariant:
    '"{{className}}" uses a variant this project\'s Tailwind does not know, so no CSS is generated for it. Use an existing variant, or declare it with @custom-variant in {{file}}.',
  useSuggestion: 'Replace with "{{suggestion}}".',
};
const noUnknownClasses = {
  meta: {
    type: "problem",
    hasSuggestions: true,
    docs: {
      description:
        "Disallow classes Tailwind does not know; no CSS is generated for them.",
      url: "https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-unknown-classes.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          ...policySchema,
          ...recognitionSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: MESSAGES$1,
  },
  create(context) {
    const options = withSettings(context, context.options?.[0] ?? {});
    const emit = reporter(context, MESSAGES$1, {
      rule: "shadcn/no-unknown-classes",
      message: options.message,
    });
    const filename = fileOf(context);
    let policy;
    try {
      policy = compileVocabularyPolicy(
        {
          ...options,
          uncheckedEntries: true,
          fromFile: filename,
        },
        "shadcn/no-unknown-classes"
      );
    } catch (error) {
      return configErrorVisitors(context, error);
    }
    const { groupOf } = projectClassifierFor(filename);
    const known = knownClassesFor(filename);
    const ownClasses = isSfc(filename)
      ? styleClassesOf(context.sourceCode?.text ?? "")
      : /* @__PURE__ */ new Set();
    const themeFile = themeFileFor(filename);
    const file = themeFile ? displayPath(themeFile, context) : "your theme CSS";
    const entry = tailwindEntryFor(filename);
    const utilityPrefixes = utilityPrefixesOf(known.utilities);
    const prefix = tailwindPrefixFor(filename);
    const isTailwindColor = (token) =>
      (!prefix || token.startsWith(`${prefix}:`)) && isColor(token);
    const settled = (token) => {
      const base = normalizeClass(token);
      if (!base) return true;
      if (base.startsWith("[")) return true;
      if (isMarkerClass(token)) return true;
      const bare = base.replace(/\/[\w.%]+$/, "");
      return known.classes.has(bare) || ownClasses.has(bare);
    };
    const knownByGrammar = (token) => {
      if (groupOf(token)) return true;
      const bare = normalizeClass(token).replace(/\/[\w.%]+$/, "");
      if (known.utilities.has(bare)) return true;
      return utilityPrefixes.some((prefix) => bare.startsWith(prefix));
    };
    const report = (
      node,
      token,
      suggestion,
      words,
      component,
      variantOnly = false
    ) => {
      emit(
        {
          node,
          messageId: suggestion
            ? "unknownClassSuggest"
            : variantOnly
              ? "unknownVariant"
              : "unknownClass",
          data: {
            className: token,
            component,
            file,
            suggestion: suggestion ?? "",
          },
          suggest: suggestion
            ? classSuggestions(
                node,
                context,
                token,
                [suggestion],
                "useSuggestion",
                "suggestion"
              )
            : void 0,
        },
        words
      );
    };
    const isColor = (token) => categoryOf(groupOf(token)) === "color";
    let declared;
    const ownsColorTypo = (token, suggestion) => {
      if (!suggestion || isColor(suggestion)) return false;
      const value = colorValueOf(token);
      if (!value) return true;
      declared ??= colorTokensFor(filename);
      return !declared || !didYouMean(value, declared);
    };
    return classSiteVisitors(context, options, (site) => {
      for (const { value, node } of site.vocabularyStrings) {
        const wordsFor = /* @__PURE__ */ new Map();
        const tokens = splitClasses(value).filter((token) => {
          if (settled(token)) return false;
          const exemption = policy.decide(site.component, token);
          if (exemption.kind === "ok") return false;
          wordsFor.set(token, exemption.message);
          return true;
        });
        if (!tokens.length) continue;
        const asked = entry ? unknownClasses(entry, tokens) : null;
        if (asked) {
          for (const { token, suggestion, baseKnown } of asked) {
            if (
              isTailwindColor(token) &&
              !baseKnown &&
              !ownsColorTypo(token, suggestion)
            )
              continue;
            report(
              node,
              token,
              suggestion,
              wordsFor.get(token) ?? null,
              site.component ?? "",
              baseKnown && token.includes(":")
            );
          }
          continue;
        }
        for (const token of tokens)
          if (!knownByGrammar(token))
            report(
              node,
              token,
              null,
              wordsFor.get(token) ?? null,
              site.component ?? ""
            );
      }
    });
  },
};

//#endregion
//#region src/rules/require-static-classes.ts
const MESSAGES = {
  dynamicClasses:
    "Dynamically built className on <{{component}}> cannot be checked. Use static class strings.",
};
const requireStaticClasses = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require statically analyzable className values on design-system components.",
      url: "https://github.com/shadcn-ui/lint/blob/main/docs/rules/require-static-classes.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          message: {
            type: "string",
            maxLength: 500,
          },
          ...recognitionSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: MESSAGES,
  },
  create(context) {
    const options = withSettings(context, context.options?.[0] ?? {});
    const emit = reporter(context, MESSAGES, {
      rule: "shadcn/require-static-classes",
      message: options.message,
    });
    return classSiteVisitors(context, options, (site) => {
      if (!site.component) return;
      for (const node of site.unresolved)
        emit({
          node,
          messageId: "dynamicClasses",
          data: { component: site.component },
        });
    });
  },
};

//#endregion
//#region src/plugin.ts
const rules = {
  "no-restyle": withTemplates(noRestyle),
  "no-raw-colors": withTemplates(noRawColors),
  "no-arbitrary-values": withTemplates(noArbitraryValues),
  "no-inline-styles": withTemplates(noInlineStyles),
  "require-static-classes": withTemplates(requireStaticClasses),
  "no-unknown-classes": withTemplates(noUnknownClasses),
};
const plugin = {
  meta: { name: "shadcn" },
  rules,
};

//#endregion
//#region src/index.ts
const project = {
  projectFor,
  themeFileFor,
  colorTokensFor,
  componentsFor,
  variantDefinitionsOf,
  variantNamesFor,
};
var src_default = plugin;

//#endregion
export { src_default as default, plugin, project };
