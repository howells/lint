import * as fs from "node:fs";
import * as path from "node:path";

/*
 * Vendored from @shadcn/lint 0.2.5 (MIT, see LICENSE beside this file).
 * Loaded by index.js. Refresh it the way AGENTS.md describes, never by
 * editing it here.
 */
//#region src/grammar/classes.ts
function splitVariants(token) {
  if (!token.includes(":"))
    return {
      variants: [],
      base: token,
    };
  const segments = [];
  let bracketDepth = 0;
  let parenDepth = 0;
  let current = "";
  for (const char of token) {
    if (char === "[") bracketDepth++;
    else if (char === "]") bracketDepth--;
    else if (bracketDepth === 0) {
      if (char === "(") parenDepth++;
      else if (char === ")") parenDepth--;
    }
    if (char === ":" && bracketDepth === 0 && parenDepth === 0) {
      segments.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  segments.push(current);
  return {
    variants: segments.slice(0, -1),
    base: segments[segments.length - 1],
  };
}
function splitClasses(value) {
  return value.split(/\s+/).filter(Boolean);
}
const MARKERS = /* @__PURE__ */ new Set(["group", "peer", "dark", "light"]);
function isMarkerClass(token) {
  return MARKERS.has(normalizeClass(token).split("/")[0]);
}
function normalizeClass(token) {
  const { base } = splitVariants(token);
  return base.replace(/^!/, "").replace(/!$/, "").replace(/^-/, "");
}
function isArbitraryValue(token) {
  if (!token.includes("[")) return false;
  const { base } = splitVariants(token);
  const open = base.indexOf("-[");
  if (open !== -1 && base.includes("]", open + 2)) return true;
  return /^\[[^\]]+\]$/.test(base) && base.slice(2, -2).includes(":");
}
const COLOR_PREFIX =
  /^(?:text-shadow|inset-shadow|inset-ring|drop-shadow|scrollbar-(?:thumb|track)|ring-offset|border(?:-[trblxyse]|-[bi][se])?|divide(?:-[xy])?|mask-(?:linear|radial|conic|[trblxy])-(?:from|to)|bg|text|ring|outline|fill|stroke|from|via|to|accent|caret|decoration|placeholder|shadow)-/;
const PALETTE$1 = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "mauve",
  "olive",
  "mist",
  "taupe",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];
const OPACITY_MODIFIER = /\/(?:[\w.%]+|\[[^[\]]*\]|\([^()]*\))$/;
const PALETTE_RE = new RegExp(
  `${COLOR_PREFIX.source}(?:${PALETTE$1.join("|")})-\\d{2,3}(?:${OPACITY_MODIFIER.source})?$`
);
function isPaletteClass(token) {
  return PALETTE_RE.test(normalizeClass(token));
}
function withBase(token, base) {
  const { variants, base: original } = splitVariants(token);
  const leadingBang = original.startsWith("!") ? "!" : "";
  const trailingBang = !leadingBang && original.endsWith("!") ? "!" : "";
  const negative = original.replace(/^!/, "").replace(/!$/, "").startsWith("-")
    ? "-"
    : "";
  return `${variants.length ? `${variants.join(":")}:` : ""}${leadingBang}${negative}${base}${trailingBang}`;
}
function replaceClass(value, token, replacement) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value.replace(
    new RegExp(`(^|\\s)${escaped}(?=\\s|$)`),
    (_, lead) => `${lead}${replacement}`
  );
}

//#endregion
//#region src/grammar/lengths.ts
const REM = 16;
function tokenize(input) {
  const tokens = [];
  const re =
    /\s*(?:(calc\(|\()|(\))|([+\-*/])|(\d*\.?\d+(?:e[+-]?\d+)?)(px|rem|em|%)?)/giy;
  let last = 0;
  let match;
  while (last < input.length) {
    re.lastIndex = last;
    match = re.exec(input);
    if (!match || match[0].length === 0)
      return /^\s*$/.test(input.slice(last)) ? tokens : null;
    last = re.lastIndex;
    if (match[1]) tokens.push({ kind: "(" });
    else if (match[2]) tokens.push({ kind: ")" });
    else if (match[3])
      tokens.push({
        kind: "op",
        op: match[3],
      });
    else {
      const number = Number(match[4]);
      const unit = (match[5] ?? "").toLowerCase();
      if (unit === "%") return null;
      const value =
        unit === "px"
          ? { px: number }
          : unit === "rem" || unit === "em"
            ? { px: number * REM }
            : { n: number };
      tokens.push({
        kind: "num",
        value,
      });
    }
  }
  return tokens;
}
function add(a, b, sign) {
  if ("px" in a && "px" in b) return { px: a.px + sign * b.px };
  if ("n" in a && "n" in b) return { n: a.n + sign * b.n };
  if ("n" in a && a.n === 0 && "px" in b) return { px: sign * b.px };
  if ("px" in a && "n" in b && b.n === 0) return a;
  return null;
}
function multiply(a, b) {
  if ("n" in a && "n" in b) return { n: a.n * b.n };
  if ("px" in a && "n" in b) return { px: a.px * b.n };
  if ("n" in a && "px" in b) return { px: a.n * b.px };
  return null;
}
function divide(a, b) {
  if (!("n" in b) || b.n === 0) return null;
  return "px" in a ? { px: a.px / b.n } : { n: a.n / b.n };
}
function evaluate(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const factor = () => {
    const token = next();
    if (!token) return null;
    if (token.kind === "num") return token.value;
    if (token.kind === "op" && token.op === "-") {
      const inner = factor();
      return inner && ("px" in inner ? { px: -inner.px } : { n: -inner.n });
    }
    if (token.kind === "op" && token.op === "+") return factor();
    if (token.kind === "(") {
      const inner = sum();
      return next()?.kind === ")" ? inner : null;
    }
    return null;
  };
  const product = () => {
    let left = factor();
    while (left) {
      const token = peek();
      if (token?.kind !== "op" || (token.op !== "*" && token.op !== "/")) break;
      next();
      const right = factor();
      if (!right) return null;
      left = token.op === "*" ? multiply(left, right) : divide(left, right);
    }
    return left;
  };
  const sum = () => {
    let left = product();
    while (left) {
      const token = peek();
      if (token?.kind !== "op" || (token.op !== "+" && token.op !== "-")) break;
      next();
      const right = product();
      if (!right) return null;
      left = add(left, right, token.op === "+" ? 1 : -1);
    }
    return left;
  };
  const result = sum();
  return i === tokens.length ? result : null;
}
function lengthInPx(value) {
  const tokens = tokenize(value.trim());
  if (!tokens || !tokens.length) return null;
  const result = evaluate(tokens);
  if (!result) return null;
  if ("px" in result) return result.px;
  return result.n === 0 ? 0 : null;
}
function formatPx(px) {
  return `${Number(px.toFixed(2))}px`;
}

//#endregion
//#region src/project/fs.ts
const TTL = 1e3;
const NODE_MODULES = /[\\/]node_modules[\\/]/;
const MAX_MEMO_ENTRIES = 5e4;
const memo = /* @__PURE__ */ new Map();
function memoize(key, compute, stale) {
  const hit = memo.get(key);
  const now = Date.now();
  if (hit && now - hit.at < 1e3 && !stale?.(hit.value)) return hit.value;
  const value = compute();
  if (memo.size >= MAX_MEMO_ENTRIES && !memo.has(key))
    for (const oldest of memo.keys()) {
      memo.delete(oldest);
      if (memo.size <= MAX_MEMO_ENTRIES * 0.75) break;
    }
  memo.set(key, {
    at: now,
    value,
  });
  return value;
}
const dirs = /* @__PURE__ */ new Map();
function dirOf(file) {
  let dir = dirs.get(file);
  if (dir === void 0) {
    if (dirs.size > 2e4) dirs.clear();
    dir = path.dirname(path.resolve(file));
    dirs.set(file, dir);
  }
  return dir;
}
function isDirectory(p) {
  return memoize(`dir:${p}`, () => {
    try {
      return fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
}
function isFile(p) {
  return memoize(`file:${p}`, () => {
    try {
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });
}
function mtimeOf(p) {
  return memoize(`mtime:${p}`, () => {
    try {
      return fs.statSync(p).mtimeMs;
    } catch {
      return null;
    }
  });
}
function realpath(p) {
  return memoize(`real:${p}`, () => {
    try {
      return fs.realpathSync.native(p);
    } catch {
      return p;
    }
  });
}
function findUp(fromDir, name) {
  const start = path.resolve(fromDir);
  return memoize(`up:${start}|${name}`, () => {
    let dir = start;
    for (let depth = 0; depth < 32; depth++) {
      const candidate = path.join(dir, name);
      if (memoize(`exists:${candidate}`, () => fs.existsSync(candidate)))
        return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  });
}

//#endregion
//#region src/grammar/colors.ts
const NAMED = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};
function linear(channel) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}
function fromRgb(r, g, b) {
  const lr = linear(r);
  const lg = linear(g);
  const lb = linear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function fromHwb(h, w, b) {
  if (w + b >= 1) {
    const gray = w / (w + b);
    return fromRgb(gray, gray, gray);
  }
  const [r, g, bl] = hslToRgb(h, 1, 0.5);
  const scale = (c) => c * (1 - w - b) + w;
  return fromRgb(scale(r), scale(g), scale(bl));
}
function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}
function fromHsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return fromRgb(f(0), f(8), f(4));
}
function fromHex(hex) {
  let digits = hex.slice(1);
  if (digits.length === 3 || digits.length === 4)
    digits = [...digits].map((d) => d + d).join("");
  if (digits.length !== 6 && digits.length !== 8) return null;
  if (!/^[0-9a-f]+$/i.test(digits)) return null;
  const n = parseInt(digits.slice(0, 6), 16);
  return fromRgb(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255
  );
}
function args(inner) {
  const [channels] = inner.split("/");
  return channels
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 3);
}
function channel(raw, scale, percentScale = 1) {
  if (raw === "none") return 0;
  if (raw.endsWith("%")) {
    const value = Number(raw.slice(0, -1));
    return Number.isFinite(value) ? (value / 100) * percentScale : null;
  }
  const value = Number(raw.replace(/deg$/, ""));
  return Number.isFinite(value) ? value / scale : null;
}
function isNamedColor(value) {
  return Object.hasOwn(NAMED, value.trim().toLowerCase());
}
const VARIABLE = String.raw`var\(\s*--[\w-]+\s*\)`;
const ALPHA = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?%?`;
const VARIABLE_CHANNELS = new RegExp(
  String.raw`(?<![\w-])(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(\s*${VARIABLE}\s*(?:\/\s*(?:${ALPHA}|${VARIABLE})\s*)?\)`,
  "gi"
);
function withoutVariableChannelColors(value) {
  return value.replace(VARIABLE_CHANNELS, " ");
}
function parseColor(value) {
  const text = value.trim().toLowerCase();
  if (!text) return null;
  if (text.startsWith("#")) return fromHex(text);
  const named = NAMED[text];
  if (named) return fromHex(named);
  const match = text.match(/^([a-z]+)\((.*)\)$/s);
  if (!match) return null;
  const [, fn, inner] = match;
  const parts = args(inner);
  if (parts.length < 3) return null;
  switch (fn) {
    case "rgb":
    case "rgba": {
      const [r, g, b] = parts.map((p) => channel(p, 255));
      if (r === null || g === null || b === null) return null;
      return fromRgb(r, g, b);
    }
    case "hsl":
    case "hsla": {
      const h = channel(parts[0], 1);
      const s = channel(parts[1], 100);
      const l = channel(parts[2], 100);
      if (h === null || s === null || l === null) return null;
      return fromHsl(h, s, l);
    }
    case "hwb": {
      const h = channel(parts[0], 1);
      const w = channel(parts[1], 100);
      const b = channel(parts[2], 100);
      if (h === null || w === null || b === null) return null;
      return fromHwb(h, w, b);
    }
    case "oklch": {
      const l = channel(parts[0], 1);
      const c = channel(parts[1], 1, 0.4);
      const h = channel(parts[2], 1);
      if (l === null || c === null || h === null) return null;
      const rad = (h * Math.PI) / 180;
      return [l, c * Math.cos(rad), c * Math.sin(rad)];
    }
    case "oklab": {
      const l = channel(parts[0], 1);
      const a = channel(parts[1], 1, 0.4);
      const b = channel(parts[2], 1, 0.4);
      if (l === null || a === null || b === null) return null;
      return [l, a, b];
    }
    case "color": {
      if (parts[0] !== "srgb") return null;
      const [r, g, b] = args(inner.replace(/^\s*srgb\s+/, "")).map((p) =>
        channel(p, 1)
      );
      if (r == null || g == null || b == null) return null;
      return fromRgb(r, g, b);
    }
    default:
      return null;
  }
}
function colorDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

//#endregion
//#region src/grammar/tailwind-theme.ts
const PALETTE = {
  "red-50": "oklch(97.1% 0.013 17.38)",
  "red-100": "oklch(93.6% 0.032 17.717)",
  "red-200": "oklch(88.5% 0.062 18.334)",
  "red-300": "oklch(80.8% 0.114 19.571)",
  "red-400": "oklch(70.4% 0.191 22.216)",
  "red-500": "oklch(63.7% 0.237 25.331)",
  "red-600": "oklch(57.7% 0.245 27.325)",
  "red-700": "oklch(50.5% 0.213 27.518)",
  "red-800": "oklch(44.4% 0.177 26.899)",
  "red-900": "oklch(39.6% 0.141 25.723)",
  "red-950": "oklch(25.8% 0.092 26.042)",
  "orange-50": "oklch(98% 0.016 73.684)",
  "orange-100": "oklch(95.4% 0.038 75.164)",
  "orange-200": "oklch(90.1% 0.076 70.697)",
  "orange-300": "oklch(83.7% 0.128 66.29)",
  "orange-400": "oklch(75% 0.183 55.934)",
  "orange-500": "oklch(70.5% 0.213 47.604)",
  "orange-600": "oklch(64.6% 0.222 41.116)",
  "orange-700": "oklch(55.3% 0.195 38.402)",
  "orange-800": "oklch(47% 0.157 37.304)",
  "orange-900": "oklch(40.8% 0.123 38.172)",
  "orange-950": "oklch(26.6% 0.079 36.259)",
  "amber-50": "oklch(98.7% 0.022 95.277)",
  "amber-100": "oklch(96.2% 0.059 95.617)",
  "amber-200": "oklch(92.4% 0.12 95.746)",
  "amber-300": "oklch(87.9% 0.169 91.605)",
  "amber-400": "oklch(82.8% 0.189 84.429)",
  "amber-500": "oklch(76.9% 0.188 70.08)",
  "amber-600": "oklch(66.6% 0.179 58.318)",
  "amber-700": "oklch(55.5% 0.163 48.998)",
  "amber-800": "oklch(47.3% 0.137 46.201)",
  "amber-900": "oklch(41.4% 0.112 45.904)",
  "amber-950": "oklch(27.9% 0.077 45.635)",
  "yellow-50": "oklch(98.7% 0.026 102.212)",
  "yellow-100": "oklch(97.3% 0.071 103.193)",
  "yellow-200": "oklch(94.5% 0.129 101.54)",
  "yellow-300": "oklch(90.5% 0.182 98.111)",
  "yellow-400": "oklch(85.2% 0.199 91.936)",
  "yellow-500": "oklch(79.5% 0.184 86.047)",
  "yellow-600": "oklch(68.1% 0.162 75.834)",
  "yellow-700": "oklch(55.4% 0.135 66.442)",
  "yellow-800": "oklch(47.6% 0.114 61.907)",
  "yellow-900": "oklch(42.1% 0.095 57.708)",
  "yellow-950": "oklch(28.6% 0.066 53.813)",
  "lime-50": "oklch(98.6% 0.031 120.757)",
  "lime-100": "oklch(96.7% 0.067 122.328)",
  "lime-200": "oklch(93.8% 0.127 124.321)",
  "lime-300": "oklch(89.7% 0.196 126.665)",
  "lime-400": "oklch(84.1% 0.238 128.85)",
  "lime-500": "oklch(76.8% 0.233 130.85)",
  "lime-600": "oklch(64.8% 0.2 131.684)",
  "lime-700": "oklch(53.2% 0.157 131.589)",
  "lime-800": "oklch(45.3% 0.124 130.933)",
  "lime-900": "oklch(40.5% 0.101 131.063)",
  "lime-950": "oklch(27.4% 0.072 132.109)",
  "green-50": "oklch(98.2% 0.018 155.826)",
  "green-100": "oklch(96.2% 0.044 156.743)",
  "green-200": "oklch(92.5% 0.084 155.995)",
  "green-300": "oklch(87.1% 0.15 154.449)",
  "green-400": "oklch(79.2% 0.209 151.711)",
  "green-500": "oklch(72.3% 0.219 149.579)",
  "green-600": "oklch(62.7% 0.194 149.214)",
  "green-700": "oklch(52.7% 0.154 150.069)",
  "green-800": "oklch(44.8% 0.119 151.328)",
  "green-900": "oklch(39.3% 0.095 152.535)",
  "green-950": "oklch(26.6% 0.065 152.934)",
  "emerald-50": "oklch(97.9% 0.021 166.113)",
  "emerald-100": "oklch(95% 0.052 163.051)",
  "emerald-200": "oklch(90.5% 0.093 164.15)",
  "emerald-300": "oklch(84.5% 0.143 164.978)",
  "emerald-400": "oklch(76.5% 0.177 163.223)",
  "emerald-500": "oklch(69.6% 0.17 162.48)",
  "emerald-600": "oklch(59.6% 0.145 163.225)",
  "emerald-700": "oklch(50.8% 0.118 165.612)",
  "emerald-800": "oklch(43.2% 0.095 166.913)",
  "emerald-900": "oklch(37.8% 0.077 168.94)",
  "emerald-950": "oklch(26.2% 0.051 172.552)",
  "teal-50": "oklch(98.4% 0.014 180.72)",
  "teal-100": "oklch(95.3% 0.051 180.801)",
  "teal-200": "oklch(91% 0.096 180.426)",
  "teal-300": "oklch(85.5% 0.138 181.071)",
  "teal-400": "oklch(77.7% 0.152 181.912)",
  "teal-500": "oklch(70.4% 0.14 182.503)",
  "teal-600": "oklch(60% 0.118 184.704)",
  "teal-700": "oklch(51.1% 0.096 186.391)",
  "teal-800": "oklch(43.7% 0.078 188.216)",
  "teal-900": "oklch(38.6% 0.063 188.416)",
  "teal-950": "oklch(27.7% 0.046 192.524)",
  "cyan-50": "oklch(98.4% 0.019 200.873)",
  "cyan-100": "oklch(95.6% 0.045 203.388)",
  "cyan-200": "oklch(91.7% 0.08 205.041)",
  "cyan-300": "oklch(86.5% 0.127 207.078)",
  "cyan-400": "oklch(78.9% 0.154 211.53)",
  "cyan-500": "oklch(71.5% 0.143 215.221)",
  "cyan-600": "oklch(60.9% 0.126 221.723)",
  "cyan-700": "oklch(52% 0.105 223.128)",
  "cyan-800": "oklch(45% 0.085 224.283)",
  "cyan-900": "oklch(39.8% 0.07 227.392)",
  "cyan-950": "oklch(30.2% 0.056 229.695)",
  "sky-50": "oklch(97.7% 0.013 236.62)",
  "sky-100": "oklch(95.1% 0.026 236.824)",
  "sky-200": "oklch(90.1% 0.058 230.902)",
  "sky-300": "oklch(82.8% 0.111 230.318)",
  "sky-400": "oklch(74.6% 0.16 232.661)",
  "sky-500": "oklch(68.5% 0.169 237.323)",
  "sky-600": "oklch(58.8% 0.158 241.966)",
  "sky-700": "oklch(50% 0.134 242.749)",
  "sky-800": "oklch(44.3% 0.11 240.79)",
  "sky-900": "oklch(39.1% 0.09 240.876)",
  "sky-950": "oklch(29.3% 0.066 243.157)",
  "blue-50": "oklch(97% 0.014 254.604)",
  "blue-100": "oklch(93.2% 0.032 255.585)",
  "blue-200": "oklch(88.2% 0.059 254.128)",
  "blue-300": "oklch(80.9% 0.105 251.813)",
  "blue-400": "oklch(70.7% 0.165 254.624)",
  "blue-500": "oklch(62.3% 0.214 259.815)",
  "blue-600": "oklch(54.6% 0.245 262.881)",
  "blue-700": "oklch(48.8% 0.243 264.376)",
  "blue-800": "oklch(42.4% 0.199 265.638)",
  "blue-900": "oklch(37.9% 0.146 265.522)",
  "blue-950": "oklch(28.2% 0.091 267.935)",
  "indigo-50": "oklch(96.2% 0.018 272.314)",
  "indigo-100": "oklch(93% 0.034 272.788)",
  "indigo-200": "oklch(87% 0.065 274.039)",
  "indigo-300": "oklch(78.5% 0.115 274.713)",
  "indigo-400": "oklch(67.3% 0.182 276.935)",
  "indigo-500": "oklch(58.5% 0.233 277.117)",
  "indigo-600": "oklch(51.1% 0.262 276.966)",
  "indigo-700": "oklch(45.7% 0.24 277.023)",
  "indigo-800": "oklch(39.8% 0.195 277.366)",
  "indigo-900": "oklch(35.9% 0.144 278.697)",
  "indigo-950": "oklch(25.7% 0.09 281.288)",
  "violet-50": "oklch(96.9% 0.016 293.756)",
  "violet-100": "oklch(94.3% 0.029 294.588)",
  "violet-200": "oklch(89.4% 0.057 293.283)",
  "violet-300": "oklch(81.1% 0.111 293.571)",
  "violet-400": "oklch(70.2% 0.183 293.541)",
  "violet-500": "oklch(60.6% 0.25 292.717)",
  "violet-600": "oklch(54.1% 0.281 293.009)",
  "violet-700": "oklch(49.1% 0.27 292.581)",
  "violet-800": "oklch(43.2% 0.232 292.759)",
  "violet-900": "oklch(38% 0.189 293.745)",
  "violet-950": "oklch(28.3% 0.141 291.089)",
  "purple-50": "oklch(97.7% 0.014 308.299)",
  "purple-100": "oklch(94.6% 0.033 307.174)",
  "purple-200": "oklch(90.2% 0.063 306.703)",
  "purple-300": "oklch(82.7% 0.119 306.383)",
  "purple-400": "oklch(71.4% 0.203 305.504)",
  "purple-500": "oklch(62.7% 0.265 303.9)",
  "purple-600": "oklch(55.8% 0.288 302.321)",
  "purple-700": "oklch(49.6% 0.265 301.924)",
  "purple-800": "oklch(43.8% 0.218 303.724)",
  "purple-900": "oklch(38.1% 0.176 304.987)",
  "purple-950": "oklch(29.1% 0.149 302.717)",
  "fuchsia-50": "oklch(97.7% 0.017 320.058)",
  "fuchsia-100": "oklch(95.2% 0.037 318.852)",
  "fuchsia-200": "oklch(90.3% 0.076 319.62)",
  "fuchsia-300": "oklch(83.3% 0.145 321.434)",
  "fuchsia-400": "oklch(74% 0.238 322.16)",
  "fuchsia-500": "oklch(66.7% 0.295 322.15)",
  "fuchsia-600": "oklch(59.1% 0.293 322.896)",
  "fuchsia-700": "oklch(51.8% 0.253 323.949)",
  "fuchsia-800": "oklch(45.2% 0.211 324.591)",
  "fuchsia-900": "oklch(40.1% 0.17 325.612)",
  "fuchsia-950": "oklch(29.3% 0.136 325.661)",
  "pink-50": "oklch(97.1% 0.014 343.198)",
  "pink-100": "oklch(94.8% 0.028 342.258)",
  "pink-200": "oklch(89.9% 0.061 343.231)",
  "pink-300": "oklch(82.3% 0.12 346.018)",
  "pink-400": "oklch(71.8% 0.202 349.761)",
  "pink-500": "oklch(65.6% 0.241 354.308)",
  "pink-600": "oklch(59.2% 0.249 0.584)",
  "pink-700": "oklch(52.5% 0.223 3.958)",
  "pink-800": "oklch(45.9% 0.187 3.815)",
  "pink-900": "oklch(40.8% 0.153 2.432)",
  "pink-950": "oklch(28.4% 0.109 3.907)",
  "rose-50": "oklch(96.9% 0.015 12.422)",
  "rose-100": "oklch(94.1% 0.03 12.58)",
  "rose-200": "oklch(89.2% 0.058 10.001)",
  "rose-300": "oklch(81% 0.117 11.638)",
  "rose-400": "oklch(71.2% 0.194 13.428)",
  "rose-500": "oklch(64.5% 0.246 16.439)",
  "rose-600": "oklch(58.6% 0.253 17.585)",
  "rose-700": "oklch(51.4% 0.222 16.935)",
  "rose-800": "oklch(45.5% 0.188 13.697)",
  "rose-900": "oklch(41% 0.159 10.272)",
  "rose-950": "oklch(27.1% 0.105 12.094)",
  "slate-50": "oklch(98.4% 0.003 247.858)",
  "slate-100": "oklch(96.8% 0.007 247.896)",
  "slate-200": "oklch(92.9% 0.013 255.508)",
  "slate-300": "oklch(86.9% 0.022 252.894)",
  "slate-400": "oklch(70.4% 0.04 256.788)",
  "slate-500": "oklch(55.4% 0.046 257.417)",
  "slate-600": "oklch(44.6% 0.043 257.281)",
  "slate-700": "oklch(37.2% 0.044 257.287)",
  "slate-800": "oklch(27.9% 0.041 260.031)",
  "slate-900": "oklch(20.8% 0.042 265.755)",
  "slate-950": "oklch(12.9% 0.042 264.695)",
  "gray-50": "oklch(98.5% 0.002 247.839)",
  "gray-100": "oklch(96.7% 0.003 264.542)",
  "gray-200": "oklch(92.8% 0.006 264.531)",
  "gray-300": "oklch(87.2% 0.01 258.338)",
  "gray-400": "oklch(70.7% 0.022 261.325)",
  "gray-500": "oklch(55.1% 0.027 264.364)",
  "gray-600": "oklch(44.6% 0.03 256.802)",
  "gray-700": "oklch(37.3% 0.034 259.733)",
  "gray-800": "oklch(27.8% 0.033 256.848)",
  "gray-900": "oklch(21% 0.034 264.665)",
  "gray-950": "oklch(13% 0.028 261.692)",
  "zinc-50": "oklch(98.5% 0 none)",
  "zinc-100": "oklch(96.7% 0.001 286.375)",
  "zinc-200": "oklch(92% 0.004 286.32)",
  "zinc-300": "oklch(87.1% 0.006 286.286)",
  "zinc-400": "oklch(70.5% 0.015 286.067)",
  "zinc-500": "oklch(55.2% 0.016 285.938)",
  "zinc-600": "oklch(44.2% 0.017 285.786)",
  "zinc-700": "oklch(37% 0.013 285.805)",
  "zinc-800": "oklch(27.4% 0.006 286.033)",
  "zinc-900": "oklch(21% 0.006 285.885)",
  "zinc-950": "oklch(14.1% 0.005 285.823)",
  "neutral-50": "oklch(98.5% 0 none)",
  "neutral-100": "oklch(97% 0 none)",
  "neutral-200": "oklch(92.2% 0 none)",
  "neutral-300": "oklch(87% 0 none)",
  "neutral-400": "oklch(70.8% 0 none)",
  "neutral-500": "oklch(55.6% 0 none)",
  "neutral-600": "oklch(43.9% 0 none)",
  "neutral-700": "oklch(37.1% 0 none)",
  "neutral-800": "oklch(26.9% 0 none)",
  "neutral-900": "oklch(20.5% 0 none)",
  "neutral-950": "oklch(14.5% 0 none)",
  "stone-50": "oklch(98.5% 0.001 106.423)",
  "stone-100": "oklch(97% 0.001 106.424)",
  "stone-200": "oklch(92.3% 0.003 48.717)",
  "stone-300": "oklch(86.9% 0.005 56.366)",
  "stone-400": "oklch(70.9% 0.01 56.259)",
  "stone-500": "oklch(55.3% 0.013 58.071)",
  "stone-600": "oklch(44.4% 0.011 73.639)",
  "stone-700": "oklch(37.4% 0.01 67.558)",
  "stone-800": "oklch(26.8% 0.007 34.298)",
  "stone-900": "oklch(21.6% 0.006 56.043)",
  "stone-950": "oklch(14.7% 0.004 49.25)",
  "mauve-50": "oklch(98.5% 0 none)",
  "mauve-100": "oklch(96% 0.003 325.6)",
  "mauve-200": "oklch(92.2% 0.005 325.62)",
  "mauve-300": "oklch(86.5% 0.012 325.68)",
  "mauve-400": "oklch(71.1% 0.019 323.02)",
  "mauve-500": "oklch(54.2% 0.034 322.5)",
  "mauve-600": "oklch(43.5% 0.029 321.78)",
  "mauve-700": "oklch(36.4% 0.029 323.89)",
  "mauve-800": "oklch(26.3% 0.024 320.12)",
  "mauve-900": "oklch(21.2% 0.019 322.12)",
  "mauve-950": "oklch(14.5% 0.008 326)",
  "olive-50": "oklch(98.8% 0.003 106.5)",
  "olive-100": "oklch(96.6% 0.005 106.5)",
  "olive-200": "oklch(93% 0.007 106.5)",
  "olive-300": "oklch(88% 0.011 106.6)",
  "olive-400": "oklch(73.7% 0.021 106.9)",
  "olive-500": "oklch(58% 0.031 107.3)",
  "olive-600": "oklch(46.6% 0.025 107.3)",
  "olive-700": "oklch(39.4% 0.023 107.4)",
  "olive-800": "oklch(28.6% 0.016 107.4)",
  "olive-900": "oklch(22.8% 0.013 107.4)",
  "olive-950": "oklch(15.3% 0.006 107.1)",
  "mist-50": "oklch(98.7% 0.002 197.1)",
  "mist-100": "oklch(96.3% 0.002 197.1)",
  "mist-200": "oklch(92.5% 0.005 214.3)",
  "mist-300": "oklch(87.2% 0.007 219.6)",
  "mist-400": "oklch(72.3% 0.014 214.4)",
  "mist-500": "oklch(56% 0.021 213.5)",
  "mist-600": "oklch(45% 0.017 213.2)",
  "mist-700": "oklch(37.8% 0.015 216)",
  "mist-800": "oklch(27.5% 0.011 216.9)",
  "mist-900": "oklch(21.8% 0.008 223.9)",
  "mist-950": "oklch(14.8% 0.004 228.8)",
  "taupe-50": "oklch(98.6% 0.002 67.8)",
  "taupe-100": "oklch(96% 0.002 17.2)",
  "taupe-200": "oklch(92.2% 0.005 34.3)",
  "taupe-300": "oklch(86.8% 0.007 39.5)",
  "taupe-400": "oklch(71.4% 0.014 41.2)",
  "taupe-500": "oklch(54.7% 0.021 43.1)",
  "taupe-600": "oklch(43.8% 0.017 39.3)",
  "taupe-700": "oklch(36.7% 0.016 35.7)",
  "taupe-800": "oklch(26.8% 0.011 36.5)",
  "taupe-900": "oklch(21.4% 0.009 43.1)",
  "taupe-950": "oklch(14.7% 0.004 49.3)",
  black: "#000",
  white: "#fff",
};
const FONT_SIZES = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
  "7xl": "4.5rem",
  "8xl": "6rem",
  "9xl": "8rem",
  "shadow-2xs": "0px 1px 0px rgb(0 0 0 / 0.15)",
  "shadow-xs": "0px 1px 1px rgb(0 0 0 / 0.2)",
  "shadow-sm":
    "0px 1px 0px rgb(0 0 0 / 0.075), 0px 1px 1px rgb(0 0 0 / 0.075), 0px 2px 2px rgb(0 0 0 / 0.075)",
  "shadow-md":
    "0px 1px 1px rgb(0 0 0 / 0.1), 0px 1px 2px rgb(0 0 0 / 0.1), 0px 2px 4px rgb(0 0 0 / 0.1)",
  "shadow-lg":
    "0px 1px 2px rgb(0 0 0 / 0.1), 0px 3px 2px rgb(0 0 0 / 0.1), 0px 4px 8px rgb(0 0 0 / 0.1)",
};
const RADII = {
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  "4xl": "2rem",
};

//#endregion
//#region src/project/resolve.ts
const EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".svelte",
  ".vue",
];
const SOURCE_FOR_JS = {
  ".js": [".ts", ".tsx"],
  ".jsx": [".tsx"],
  ".mjs": [".mts", ".ts"],
  ".cjs": [".cts", ".ts"],
};
function readJsonc(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  let out = "";
  let i = 0;
  let quote = null;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  out = out.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}
function packageRoot(fromFile) {
  const file = findUp(dirOf(fromFile), "package.json");
  return file ? path.dirname(file) : null;
}
function matchPattern(pattern, value) {
  const star = pattern.indexOf("*");
  if (star === -1) return pattern === value ? "" : null;
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  if (
    value.length < prefix.length + suffix.length ||
    !value.startsWith(prefix) ||
    !value.endsWith(suffix)
  )
    return null;
  return value.slice(prefix.length, value.length - suffix.length);
}
function expand(target, captured) {
  return target.replace("*", captured);
}
function isUncPath(file) {
  return /^[\\/]{2}/.test(file);
}
function isInside(dir, file) {
  const relative = path.relative(dir, file);
  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
function isStrayUncPath(file, ...within) {
  return isUncPath(file) && !within.some((dir) => isInside(dir, file));
}
const BAD_SEGMENT = /^(?:\.|%2e){1,2}$|^node_modules$/i;
function safeSegments(text) {
  return (
    !/%2f|%5c/i.test(text) &&
    !text.split(/[\\/]/).some((segment) => BAD_SEGMENT.test(segment))
  );
}
function isPackageTarget(target) {
  return target.startsWith("./") && safeSegments(target.slice(2));
}
function packageTarget(dir, target, captured = "") {
  if (!isPackageTarget(target) || !safeSegments(captured)) return null;
  const file = path.resolve(dir, expand(target, captured));
  return isInside(dir, file) ? file : null;
}
function isBareTarget(target) {
  return /^[^./\\#][^:\\]*$/.test(target);
}
const tsconfigCache = /* @__PURE__ */ new Map();
function signatureOf$1(files) {
  return files.map((file) => `${file}:${mtimeOf(file) ?? "missing"}`).join("|");
}
function readTsconfigChain(file, visiting, files) {
  if (visiting.has(file) || visiting.size > 8) return [];
  visiting.add(file);
  files.push(file);
  const json = readJsonc(file);
  if (!json || typeof json !== "object") return [];
  const dir = path.dirname(file);
  const options = json.compilerOptions ?? {};
  const base =
    typeof options.baseUrl === "string" && options.baseUrl
      ? path.resolve(dir, options.baseUrl)
      : dir;
  const paths =
    options.paths &&
    typeof options.paths === "object" &&
    !Array.isArray(options.paths)
      ? options.paths
      : {};
  const own = Object.entries(paths).map(([pattern, targets]) => ({
    pattern,
    targets: Array.isArray(targets)
      ? targets.filter((target) => typeof target === "string")
      : [],
    base,
  }));
  const inherited = [].concat(json.extends ?? []).flatMap((parent) => {
    const resolved = resolveFile(String(parent), dir, dir, [".json"], {
      skipPaths: true,
    });
    return resolved ? readTsconfigChain(resolved, visiting, files) : [];
  });
  return [...own, ...inherited];
}
function tsconfigPaths(rootDir) {
  for (const name of ["tsconfig.json", "jsconfig.json", "tsconfig.base.json"]) {
    const file = path.join(rootDir, name);
    if (!isFile(file)) continue;
    const entries = readTsconfig(file);
    if (entries.length) return entries;
  }
  return [];
}
function readTsconfig(file) {
  const cached = tsconfigCache.get(file);
  if (cached?.files.length && signatureOf$1(cached.files) === cached.signature)
    return cached.entries;
  tsconfigCache.set(file, {
    signature: "",
    files: [],
    entries: [],
  });
  const files = [];
  const entries = readTsconfigChain(file, /* @__PURE__ */ new Set(), files);
  tsconfigCache.set(file, {
    signature: signatureOf$1(files),
    files,
    entries,
  });
  return entries;
}
const packageJsonCache = /* @__PURE__ */ new Map();
function readPackageJson(dir) {
  const file = path.join(dir, "package.json");
  const mtimeMs = mtimeOf(file);
  if (mtimeMs === null) return null;
  const cached = packageJsonCache.get(file);
  if (cached && cached.mtimeMs === mtimeMs) return cached.json;
  const json = readJsonc(file);
  packageJsonCache.set(file, {
    mtimeMs,
    json,
  });
  return json;
}
const MAX_CONDITION_DEPTH = 32;
const PREFERRED_CONDITIONS = ["import", "default", "require", "node", "types"];
function pickTarget(value, valid, depth = 0) {
  if (typeof value === "string") return valid(value) ? value : null;
  if (depth >= 32) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickTarget(item, valid, depth + 1);
      if (picked) return picked;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const key of PREFERRED_CONDITIONS)
      if (key in value) {
        const picked = pickTarget(value[key], valid, depth + 1);
        if (picked) return picked;
      }
    for (const key of Object.keys(value)) {
      if (key.startsWith(".") || PREFERRED_CONDITIONS.includes(key)) continue;
      const picked = pickTarget(value[key], valid, depth + 1);
      if (picked) return picked;
    }
  }
  return null;
}
function mapSubpath(map, subpath, dir, bare = false) {
  const keys = Object.keys(map)
    .filter((key) => key.startsWith(".") || key.startsWith("#"))
    .sort((a, b) => b.length - a.length);
  const out = [];
  for (const key of keys) {
    const captured = matchPattern(key, subpath);
    if (captured === null || !safeSegments(captured)) continue;
    const target = pickTarget(
      map[key],
      (t) => isPackageTarget(t) || (bare && isBareTarget(t))
    );
    if (!target) continue;
    if (!target.startsWith("./")) {
      out.push({ spec: expand(target, captured) });
      continue;
    }
    const file = packageTarget(dir, target, captured);
    if (file) out.push({ file });
  }
  return out;
}
function packageDirectory$1(name, fromDir) {
  const found = findUp(fromDir, path.join("node_modules", name));
  return found ? realpath(found) : null;
}
function selfPackageDirectory(name, fromDir) {
  const manifest = findUp(fromDir, "package.json");
  if (!manifest) return null;
  const dir = path.dirname(manifest);
  return readPackageJson(dir)?.name === name ? realpath(dir) : null;
}
function splitPackageSpecifier(spec) {
  const parts = spec.split("/");
  const nameLength = spec.startsWith("@") ? 2 : 1;
  if (parts.length < nameLength) return null;
  return {
    name: parts.slice(0, nameLength).join("/"),
    subpath: parts.slice(nameLength).join("/"),
  };
}
function candidatesFor(spec, fromDir, rootDir, options = {}) {
  return collectCandidates(spec, fromDir, rootDir, options).filter(
    (candidate) => !isStrayUncPath(candidate, rootDir, fromDir)
  );
}
function collectCandidates(spec, fromDir, rootDir, options) {
  const out = [];
  if (
    spec.startsWith("./") ||
    spec.startsWith("../") ||
    spec === "." ||
    spec === ".."
  ) {
    out.push(path.resolve(fromDir, spec));
    return out;
  }
  if (path.isAbsolute(spec)) {
    out.push(spec);
    return out;
  }
  if (!options.skipPaths)
    for (const entry of tsconfigPaths(rootDir)) {
      const captured = matchPattern(entry.pattern, spec);
      if (captured === null) continue;
      for (const target of entry.targets)
        out.push(path.resolve(entry.base, expand(target, captured)));
    }
  if (spec.startsWith("#")) {
    const imports = readPackageJson(rootDir)?.imports;
    if (imports && typeof imports === "object") {
      for (const target of mapSubpath(imports, spec, rootDir, true))
        if (target.file) out.push(target.file);
        else if (target.spec) packageCandidates(target.spec, rootDir, out);
      for (const target of mapSubpath(imports, `${spec}/*`, rootDir))
        if (target.file) out.push(path.dirname(target.file));
    }
    return out;
  }
  const convention = spec.match(/^[@~]\/(.*)$/);
  if (convention) {
    out.push(path.join(rootDir, convention[1]));
    out.push(path.join(rootDir, "src", convention[1]));
    return out;
  }
  const kit = spec.match(/^\$lib(?:\/(.*))?$/);
  if (kit) {
    out.push(path.join(rootDir, "src/lib", kit[1] ?? ""));
    return out;
  }
  packageCandidates(spec, rootDir, out, fromDir);
  return out;
}
function packageCandidates(spec, rootDir, out, fromDir = rootDir) {
  const pkg = splitPackageSpecifier(spec);
  if (!pkg) return;
  const dir =
    selfPackageDirectory(pkg.name, rootDir) ??
    selfPackageDirectory(pkg.name, fromDir) ??
    packageDirectory$1(pkg.name, rootDir) ??
    packageDirectory$1(pkg.name, fromDir);
  if (!dir) return;
  const subpath = pkg.subpath ? `./${pkg.subpath}` : ".";
  const exportsMap = readPackageJson(dir)?.exports;
  if (exportsMap && typeof exportsMap === "object") {
    for (const target of mapSubpath(exportsMap, subpath, dir))
      if (target.file) out.push(target.file);
    for (const target of mapSubpath(exportsMap, `${subpath}/*`, dir))
      if (target.file) out.push(path.dirname(target.file));
  }
  const own = pkg.subpath
    ? [path.join(dir, pkg.subpath), path.join(dir, "src", pkg.subpath)]
    : [dir, path.join(dir, "src")];
  for (const file of own) if (isInside(dir, file)) out.push(file);
}
function resolveDirectory(spec, fromDir, rootDir) {
  return memoize(`resolve-dir:${fromDir}\u0000${rootDir}\u0000${spec}`, () => {
    for (const candidate of candidatesFor(spec, fromDir, rootDir))
      if (isDirectory(candidate)) return realpath(candidate);
    return null;
  });
}
function resolveFileUncached(
  spec,
  fromDir,
  rootDir,
  extensions = EXTENSIONS,
  options = {}
) {
  for (const candidate of candidatesFor(spec, fromDir, rootDir, options)) {
    if (isFile(candidate)) return realpath(candidate);
    const ext = path.extname(candidate);
    for (const source of SOURCE_FOR_JS[ext] ?? []) {
      const swapped = candidate.slice(0, -ext.length) + source;
      if (isFile(swapped)) return realpath(swapped);
    }
    for (const suffix of extensions)
      if (isFile(candidate + suffix)) return realpath(candidate + suffix);
    for (const suffix of extensions) {
      const index = path.join(candidate, `index${suffix}`);
      if (isFile(index)) return realpath(index);
    }
  }
  return null;
}
function resolveFile(
  spec,
  fromDir,
  rootDir,
  extensions = EXTENSIONS,
  options = {}
) {
  const key = `resolve:${fromDir}|${rootDir}|${spec}|${extensions.join(",")}|${options.skipPaths ? 1 : 0}`;
  return memoize(key, () =>
    resolveFileUncached(spec, fromDir, rootDir, extensions, options)
  );
}

//#endregion
//#region src/project/warn.ts
const seen = /* @__PURE__ */ new Set();
let sink = (message) => console.warn(message);
function warnOnce(key, message) {
  if (seen.has(key)) return;
  seen.add(key);
  sink(`[@shadcn/lint] ${message}`);
}

//#endregion
//#region src/project/components-json.ts
const cache$1 = /* @__PURE__ */ new Map();
function readProject(file) {
  const dir = path.dirname(file);
  const json = readJsonc(file);
  if (!json || typeof json !== "object") {
    warnOnce(
      `parse:${file}`,
      `${file} could not be parsed, so its aliases and theme are ignored and the project is read from package.json instead. Fix the JSON.`
    );
    return null;
  }
  const css = json.tailwind?.css;
  return {
    dir,
    file,
    root: packageRoot(file) ?? dir,
    aliases: readAliases(file, json.aliases),
    cssFile: typeof css === "string" && css ? path.resolve(dir, css) : null,
  };
}
function readAliases(file, aliases) {
  if (
    aliases === void 0 ||
    aliases === null ||
    typeof aliases !== "object" ||
    Array.isArray(aliases)
  ) {
    if (aliases !== void 0 && aliases !== null)
      warnOnce(
        `aliases:${file}`,
        `The aliases in ${file} are not an object, so they are ignored and design-system components are looked for at the default alias. Make aliases an object like { "ui": "@/components/ui" }.`
      );
    return {};
  }
  const out = {};
  for (const [key, value] of Object.entries(aliases)) {
    if (typeof value === "string") {
      out[key] = value;
      continue;
    }
    if (key !== "ui" && key !== "components") continue;
    warnOnce(
      `aliases.${key}:${file}`,
      `aliases.${key} in ${file} is not a string, so it is ignored. Set it to an import path like "@/components${key === "ui" ? "/ui" : ""}".`
    );
  }
  return out;
}
function findProject(fromFile) {
  const dir = dirOf(fromFile);
  return memoize(`project:${dir}`, () => {
    const file = findUp(dir, "components.json");
    if (!file) return null;
    const mtimeMs = mtimeOf(file) ?? 0;
    const cached = cache$1.get(file);
    if (cached && cached.mtimeMs === mtimeMs) return cached.project;
    const project = readProject(file);
    cache$1.set(file, {
      mtimeMs,
      project,
    });
    return project;
  });
}
function projectFor(fromFile) {
  const project = findProject(fromFile);
  if (project) return project;
  const root = packageRoot(fromFile);
  if (!root) return null;
  return {
    dir: root,
    file: null,
    root,
    aliases: {},
    cssFile: null,
  };
}
function resolveAlias(project, alias) {
  const resolved =
    resolveDirectory(alias, project.dir, project.root) ??
    (project.dir === project.root
      ? null
      : resolveDirectory(alias, project.dir, project.dir));
  if (resolved || path.isAbsolute(alias)) return resolved;
  return resolveDirectory(`./${alias}`, project.dir, project.dir);
}
function uiDirectory(project) {
  if (project.file) {
    const alias =
      project.aliases.ui ??
      `${project.aliases.components ?? "@/components"}/ui`;
    const dir = resolveAlias(project, alias);
    if (dir) return dir;
    warnOnce(
      `ui:${project.file}`,
      `The ui alias "${alias}" in ${project.file} does not resolve to a directory, so design-system components are not recognized in this project. Fix aliases.ui, add the alias to tsconfig paths or package exports, or set componentImports.`
    );
    return null;
  }
  for (const candidate of ["components/ui", "src/components/ui"]) {
    const dir = path.join(project.dir, candidate);
    if (isDirectory(dir)) return dir;
  }
  return null;
}

//#endregion
//#region src/project/stylesheets.ts
function resolveStylesheetImport(base, id) {
  const resolved = resolveStylesheet(base, id);
  if (resolved) return realpath(resolved);
  const file = resolveFile(
    id,
    base,
    packageRoot(path.join(base, "index.css")) ?? base,
    [".css"]
  );
  return file && isStylesheet(file) ? file : null;
}
function resolveStylesheet(base, id) {
  if (id === "tailwindcss")
    return resolveStylesheet(base, "tailwindcss/index.css");
  if (id.startsWith(".") || path.isAbsolute(id)) {
    const file = path.resolve(base, id);
    if (isStrayUncPath(id, base) || isStrayUncPath(file, base)) return null;
    return stylesheetAt(path.dirname(file), path.basename(id));
  }
  const match = id.match(/^(@[^/]+\/[^/]+|[^/]+)(?:\/(.*))?$/);
  if (!match) return null;
  const [, name, subpath] = match;
  const pkgDir = packageDirectory(base, name);
  if (!pkgDir) return null;
  let pkg = {};
  try {
    pkg = JSON.parse(
      fs.readFileSync(path.join(pkgDir, "package.json"), "utf-8")
    );
  } catch {}
  const exports = pkg.exports;
  if (subpath) {
    const target =
      exports && typeof exports === "object"
        ? exportedStyle(pkgDir, exports, subpath)
        : null;
    if (target) return existingFile(target);
    const file = path.join(pkgDir, subpath);
    if (!isInside(pkgDir, file)) return null;
    return stylesheetAt(path.dirname(file), path.basename(subpath));
  }
  const root =
    typeof exports === "string"
      ? exports
      : exports && typeof exports === "object"
        ? styleTarget(exports["."] ?? exports)
        : null;
  const rootFile = root ? packageTarget(pkgDir, root) : null;
  if (rootFile && existingFile(rootFile)) return rootFile;
  const main =
    typeof pkg.main === "string" && isStylesheet(pkg.main) ? pkg.main : null;
  for (const target of [pkg.style, main]) {
    if (typeof target !== "string") continue;
    const joined = path.join(pkgDir, target);
    if (!isInside(pkgDir, joined)) continue;
    const file = existingFile(joined);
    if (file) return file;
  }
  return stylesheetAt(pkgDir, "index");
}
function isStylesheet(file) {
  return path.extname(file).toLowerCase() === ".css";
}
function existingFile(candidate) {
  try {
    return fs.statSync(candidate).isFile() ? candidate : null;
  } catch {
    return null;
  }
}
function stylesheetAt(dir, name) {
  const base = path.join(dir, name);
  return (
    existingFile(base) ??
    existingFile(`${base}.css`) ??
    existingFile(path.join(base, "index.css"))
  );
}
function styleTarget(entry, depth = 0) {
  if (typeof entry === "string") return isPackageTarget(entry) ? entry : null;
  if (!entry || typeof entry !== "object") return null;
  if (depth >= 32) return null;
  const record = entry;
  for (const key of ["style", "default"]) {
    const target = styleTarget(record[key], depth + 1);
    if (target) return target;
  }
  return null;
}
function exportedStyle(pkgDir, exports, subpath) {
  const exact = styleTarget(exports[`./${subpath}`]);
  if (exact) return packageTarget(pkgDir, exact);
  const patterns = Object.keys(exports)
    .filter((key) => key.startsWith("./") && key.includes("*"))
    .sort((a, b) => b.length - a.length);
  for (const key of patterns) {
    const star = key.indexOf("*");
    const prefix = key.slice(2, star);
    const suffix = key.slice(star + 1);
    if (
      subpath.length < prefix.length + suffix.length ||
      !subpath.startsWith(prefix) ||
      !subpath.endsWith(suffix)
    )
      continue;
    const target = styleTarget(exports[key]);
    if (!target) continue;
    const file = packageTarget(
      pkgDir,
      target,
      subpath.slice(prefix.length, subpath.length - suffix.length)
    );
    if (file) return file;
  }
  return null;
}
function packageDirectory(base, name) {
  let dir = base;
  for (let depth = 0; depth < 32; depth++) {
    const candidate = path.join(dir, "node_modules", name);
    if (existingFile(path.join(candidate, "package.json"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

//#endregion
//#region src/project/theme-scales.ts
const NAMESPACES = [
  ["inset-shadow", "inset-shadow"],
  ["drop-shadow", "drop-shadow"],
  ["text-shadow", "text-shadow"],
  ["font-weight", "font-weight"],
  ["perspective", "perspective"],
  ["breakpoint", "breakpoint"],
  ["container", "container"],
  ["tracking", "tracking"],
  ["spacing", "spacing"],
  ["leading", "leading"],
  ["animate", "animate"],
  ["radius", "radius"],
  ["shadow", "shadow"],
  ["aspect", "aspect"],
  ["blur", "blur"],
  ["ease", "ease"],
  ["text", "text"],
];
function themeScalesOf(declarations) {
  const names = /* @__PURE__ */ new Map();
  const reset = /* @__PURE__ */ new Set();
  const resetScale = (scale) => {
    reset.add(scale);
    names.delete(scale);
  };
  for (const { name: property, value, theme } of declarations) {
    if (!theme) continue;
    const initial = value.trim() === "initial";
    if (property === "*") {
      if (initial) for (const [, scale] of NAMESPACES) resetScale(scale);
      continue;
    }
    if (property === "spacing") {
      if (!initial) reset.delete("spacing");
      continue;
    }
    const namespace = NAMESPACES.find(([ns]) => property.startsWith(`${ns}-`));
    if (!namespace) continue;
    const [ns, scale] = namespace;
    const name = property.slice(ns.length + 1);
    if (name === "*") {
      if (initial) resetScale(scale);
      continue;
    }
    if (!name || name.includes("--")) continue;
    if (initial) {
      names.get(scale)?.delete(name);
      continue;
    }
    let set = names.get(scale);
    if (!set) names.set(scale, (set = /* @__PURE__ */ new Set()));
    set.add(name);
  }
  const extend = {};
  const override = {};
  for (const [scale, set] of names)
    if (!reset.has(scale)) extend[scale] = [...set];
  for (const scale of reset) override[scale] = [...(names.get(scale) ?? [])];
  const extension = {};
  if (Object.keys(extend).length) extension.extend = { theme: extend };
  if (Object.keys(override).length) extension.override = { theme: override };
  return extension;
}

//#endregion
//#region src/project/theme.ts
const cache = /* @__PURE__ */ new Map();
function stripComments(css) {
  const parts = [];
  let start = 0;
  let i = 0;
  while (i < css.length) {
    const char = css[i];
    if (char === "/" && css[i + 1] === "*") {
      parts.push(css.slice(start, i));
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      start = i;
    } else if (char === '"' || char === "'") {
      i++;
      while (i < css.length && css[i] !== char) i += css[i] === "\\" ? 2 : 1;
      i++;
    } else if (css.startsWith("url(", i)) {
      const end = css.indexOf(")", i + 4);
      i = end === -1 ? css.length : end + 1;
    } else i++;
  }
  parts.push(css.slice(start));
  return parts.join("");
}
const COLOR_NAMESPACES = [
  "background-color",
  "text-color",
  "border-color",
  "divide-color",
  "ring-color",
  "outline-color",
  "accent-color",
  "caret-color",
  "placeholder-color",
  "text-decoration-color",
  "text-shadow-color",
  "drop-shadow-color",
  "fill",
  "stroke",
];
function applyTokenDeclarations(declarations, tokens, scoped) {
  for (const { name, value, theme } of declarations) {
    if (!theme) continue;
    const reset = value.trim() === "initial";
    if (name === "*") {
      if (reset) {
        tokens.clear();
        scoped?.clear();
      }
      continue;
    }
    const namespace = name.startsWith("color-")
      ? "color"
      : COLOR_NAMESPACES.find((candidate) => name.startsWith(`${candidate}-`));
    if (!namespace) continue;
    const token = name.slice(namespace.length + 1);
    let set = tokens;
    if (namespace !== "color") {
      if (!scoped) continue;
      set = scoped.get(namespace) ?? /* @__PURE__ */ new Set();
      scoped.set(namespace, set);
    }
    if (token === "*") {
      if (reset) set.clear();
    } else if (reset) set.delete(token);
    else set.add(token);
  }
}
const DARK_PRELUDE =
  /\.dark(?![\w-])|prefers-color-scheme\s*:\s*dark|data-(?:theme|mode)=["']?dark|@variant\s+dark\b/;
const ROOT_SELECTOR = /^(?::root|html|:host)$/;
function parseDeclarations(css) {
  const values = /* @__PURE__ */ new Map();
  const scopedNames = /* @__PURE__ */ new Set();
  const themeNames = /* @__PURE__ */ new Set();
  const declarations = [];
  const stripped = stripComments(css);
  const stack = [];
  let start = 0;
  for (let i = 0; i < stripped.length; i++) {
    const char = stripped[i];
    if (char === "{") {
      const prelude = stripped.slice(start, i).trim();
      const outer = stack[stack.length - 1];
      stack.push({
        theme: (outer?.theme ?? false) || /^@theme\b/.test(prelude),
        dark: (outer?.dark ?? false) || DARK_PRELUDE.test(prelude),
        scoped:
          (outer?.scoped ?? false) ||
          (!prelude.startsWith("@") &&
            !prelude.split(",").every((s) => ROOT_SELECTOR.test(s.trim()))),
      });
      start = i + 1;
    } else if (char === "}" || char === ";") {
      const match = stripped
        .slice(start, i)
        .match(/^\s*--((?:[\w-]+\*?)|\*)\s*:\s*([\s\S]+)$/);
      const scope = stack[stack.length - 1];
      if (match && !scope?.dark) {
        const value = match[2].trimEnd() || match[2];
        const scoped = scope?.scoped ?? false;
        if (!scoped || !values.has(match[1]) || scopedNames.has(match[1])) {
          values.set(match[1], value);
          if (scoped) scopedNames.add(match[1]);
          else scopedNames.delete(match[1]);
        }
        if (scope?.theme) themeNames.add(match[1]);
        declarations.push({
          name: match[1],
          value,
          theme: scope?.theme ?? false,
        });
      }
      if (char === "}") stack.pop();
      start = i + 1;
    }
  }
  return {
    values,
    scopedNames,
    themeNames,
    declarations,
  };
}
const RESOLVE_BUDGET = 1e5;
function resolveVariables(
  value,
  values,
  depth = 0,
  budget = { left: RESOLVE_BUDGET }
) {
  if (!value.includes("var(")) return value;
  if (depth > 6) return null;
  let failed = false;
  const out = value.replace(
    /var\(\s*--([\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g,
    (_, name, fallback) => {
      if (failed) return "";
      const inner = values.get(name) ?? fallback;
      if (inner === void 0) {
        failed = true;
        return "";
      }
      const resolved = resolveVariables(
        inner.trim(),
        values,
        depth + 1,
        budget
      );
      budget.left -= 1 + (resolved?.length ?? 0);
      if (resolved === null || budget.left < 0) failed = true;
      return resolved ?? "";
    }
  );
  return failed ? null : out;
}
const IMPORT_HEAD = /@import\s+(?:url\(\s*)?["']([^"']+)["']/g;
function parseImports(css) {
  const out = [];
  const text = stripComments(css);
  const re = new RegExp(IMPORT_HEAD);
  for (let match = re.exec(text); match; match = re.exec(text)) {
    const end = text.indexOf(";", re.lastIndex);
    if (end === -1) break;
    out.push(match[1]);
    re.lastIndex = end + 1;
  }
  return out;
}
function parseTailwindPrefix(css) {
  const text = stripComments(css);
  const re = new RegExp(IMPORT_HEAD);
  for (let match = re.exec(text); match; match = re.exec(text)) {
    if (!/^tailwindcss(?:\/|$)/.test(match[1])) continue;
    const end = text.indexOf(";", re.lastIndex);
    const rest = text.slice(re.lastIndex, end === -1 ? text.length : end);
    const prefix = /\bprefix\(\s*([\w-]+)\s*\)/.exec(rest);
    if (prefix) return prefix[1];
    if (end === -1) break;
    re.lastIndex = end;
  }
  return null;
}
function parseUtilities(css) {
  const out = /* @__PURE__ */ new Map();
  const stripped = stripComments(css);
  for (const match of stripped.matchAll(/@utility\s+([\w-]+\*?)\s*\{/g))
    out.set(
      match[1],
      declaredProperties(stripped, match.index + match[0].length)
    );
  return out;
}
function declaredProperties(css, start) {
  let depth = 1;
  let i = start;
  while (i < css.length && depth > 0) {
    const char = css[i];
    if (char === "{") depth++;
    else if (char === "}") depth--;
    i++;
  }
  const body = css.slice(start, depth === 0 ? i - 1 : css.length);
  const names = /* @__PURE__ */ new Set();
  for (const [, name] of body.matchAll(
    /(?:^|[;{}])\s*(-{0,2}[a-zA-Z][\w-]*)\s*:/g
  ))
    names.add(name.toLowerCase());
  return [...names];
}
function parseClassSelectors(css) {
  const out = /* @__PURE__ */ new Set();
  const stripped = stripComments(css).replace(
    /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    '""'
  );
  for (const match of stripped.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g))
    out.add(match[1]);
  return out;
}
function isPackageFile(file) {
  return file.includes(`${path.sep}node_modules${path.sep}`);
}
function packageDirOf(file) {
  const marker = `${path.sep}node_modules${path.sep}`;
  const at = file.lastIndexOf(marker);
  if (at === -1) return null;
  const start = at + marker.length;
  const segments = file.slice(start).split(path.sep);
  const depth = segments[0].startsWith("@") ? 2 : 1;
  return file.slice(0, start) + segments.slice(0, depth).join(path.sep);
}
function ownPackageOf(spec, target, imports, current) {
  const dir = packageDirOf(target);
  if (!dir) return null;
  if (imports.some((pattern) => pattern.test(spec))) return dir;
  return dir === current ? dir : null;
}
function readTheme(
  cssFile,
  seen,
  read,
  imports,
  fromPackage = false,
  ownPackage = null
) {
  if (seen.has(cssFile) || seen.size > 64) return;
  seen.add(cssFile);
  read.files.push(cssFile);
  let css;
  try {
    css = fs.readFileSync(cssFile, "utf-8");
  } catch {
    return;
  }
  for (const [name, properties] of parseUtilities(css))
    read.utilities.set(name, properties);
  for (const name of parseClassSelectors(css)) read.classes.add(name);
  if (!fromPackage) read.prefix ??= parseTailwindPrefix(css);
  if (/@(?:config|plugin)\s/.test(stripComments(css))) read.modules = true;
  const dir = path.dirname(cssFile);
  for (const spec of parseImports(css)) {
    if (spec === "tailwindcss" || spec.startsWith("tailwindcss/"))
      read.tailwind = true;
    const target = resolveStylesheetImport(dir, spec);
    if (!target) {
      read.missingImports.push({
        spec,
        fromDir: dir,
      });
      continue;
    }
    const own = ownPackageOf(spec, target, imports, ownPackage);
    readTheme(
      target,
      seen,
      read,
      imports,
      own ? false : fromPackage || isPackageFile(target),
      own
    );
  }
  if (!fromPackage) {
    const { values, scopedNames, themeNames, declarations } =
      parseDeclarations(css);
    applyTokenDeclarations(declarations, read.tokens, read.scoped);
    for (const [name, value] of values) {
      const scoped = scopedNames.has(name);
      if (scoped && read.values.has(name) && !read.scopedNames.has(name))
        continue;
      read.values.set(name, value);
      if (scoped) read.scopedNames.add(name);
      else read.scopedNames.delete(name);
    }
    for (const name of themeNames) read.themeNames.add(name);
    read.declarations.push(...declarations);
  } else if (css.includes("--animate-")) {
    for (const name of parseDeclarations(css).themeNames)
      if (name.startsWith("animate-")) read.themeNames.add(name);
  }
}
function signatureOf(read) {
  return [
    ...read.files.map((file) => `${file}:${mtimeOf(file) ?? "missing"}`),
    ...read.missingImports.map(
      ({ spec, fromDir }) =>
        `${fromDir}:${spec}:${resolveStylesheetImport(fromDir, spec) ?? "missing"}`
    ),
  ].join("|");
}
const NO_IMPORTS = [];
const themeImports = /* @__PURE__ */ new Map();
function setThemeImports(fromFile, patterns) {
  if (!patterns.length && !themeImports.size) return;
  const root = fromFile ? projectFor(fromFile)?.root : null;
  if (!root) return;
  if (patterns.length) themeImports.set(root, patterns);
  else themeImports.delete(root);
}
function themeImportsOf(root) {
  return (root && themeImports.get(root)) || NO_IMPORTS;
}
function themeOf(fromFile, cssFile) {
  if (!themeImports.size) return themeAt(cssFile);
  return themeAt(cssFile, themeImportsOf(projectFor(fromFile)?.root));
}
function themeAt(cssFile, imports = NO_IMPORTS) {
  const key = imports.length
    ? [cssFile, ...imports.map((pattern) => pattern.source)].join("\0")
    : cssFile;
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && now - cached.checkedAt < 1e3) return cached.read;
  if (cached && signatureOf(cached.read) === cached.signature) {
    cached.checkedAt = now;
    return cached.read;
  }
  const read = {
    tokens: /* @__PURE__ */ new Set(),
    scoped: /* @__PURE__ */ new Map(),
    utilities: /* @__PURE__ */ new Map(),
    classes: /* @__PURE__ */ new Set(),
    values: /* @__PURE__ */ new Map(),
    scopedNames: /* @__PURE__ */ new Set(),
    themeNames: /* @__PURE__ */ new Set(),
    declarations: [],
    tailwind: false,
    prefix: null,
    modules: false,
    files: [],
    missingImports: [],
  };
  readTheme(cssFile, /* @__PURE__ */ new Set(), read, imports);
  cache.set(key, {
    signature: signatureOf(read),
    checkedAt: now,
    read,
  });
  return read;
}
const SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "public",
  ".next",
  ".git",
  ".turbo",
  ".registry",
]);
function cssFilesUnder(dir, depth, out) {
  if (depth > 5 || out.length > 200) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) cssFilesUnder(full, depth + 1, out);
    } else if (entry.name.endsWith(".css")) out.push(full);
  }
}
const discovered = /* @__PURE__ */ new Map();
const DISCOVERY_TTL = 5e3;
function discoverThemeFile(root) {
  const cached = discovered.get(root);
  if (
    cached &&
    Date.now() - cached.at < DISCOVERY_TTL &&
    (cached.file === null || isFile(cached.file))
  )
    return cached.file;
  const files = [];
  cssFilesUnder(root, 0, files);
  let best = null;
  for (const file of files.sort()) {
    const read = themeAt(file, themeImportsOf(root));
    if (!read.tailwind) continue;
    const tokens = read.tokens.size;
    const depth = path.relative(root, file).split(path.sep).length;
    if (
      !best ||
      tokens > best.tokens ||
      (tokens === best.tokens && depth < best.depth)
    )
      best = {
        file,
        tokens,
        depth,
      };
  }
  const file = best?.file ?? null;
  discovered.set(root, {
    at: Date.now(),
    file,
  });
  return file;
}
function relativeTo(root, file) {
  return path.relative(root, file).replace(/\\/g, "/");
}
function themeFileFor(fromFile) {
  const project = projectFor(fromFile);
  if (!project) return null;
  if (project.cssFile) {
    if (isFile(project.cssFile)) return project.cssFile;
    const discovered = discoverThemeFile(project.root);
    warnOnce(
      `theme:missing:${project.cssFile}`,
      `components.json sets tailwind.css to ${relativeTo(project.root, project.cssFile)}, which does not exist. ${discovered ? `Using ${relativeTo(project.root, discovered)} until the path is fixed.` : "No stylesheet importing Tailwind was found under the project, so no-raw-colors cannot check declared tokens until the path is fixed."}`
    );
    return discovered;
  }
  return discoverThemeFile(project.root);
}
function tailwindEntryFor(fromFile) {
  const file = themeFileFor(fromFile);
  if (!file || themeOf(fromFile, file).tailwind) return file;
  const project = projectFor(fromFile);
  if (!project) return file;
  const discovered = discoverThemeFile(project.root);
  warnOnce(
    `theme:no-tailwind:${file}`,
    `components.json sets tailwind.css to ${relativeTo(project.root, file)}, which does not import Tailwind. ${discovered ? `Using ${relativeTo(project.root, discovered)} to read the classes Tailwind knows until the path is fixed.` : "No stylesheet importing Tailwind was found under the project, so no-unknown-classes is using the grammar bundled with @shadcn/lint until the path is fixed."}`
  );
  return discovered;
}
function tailwindPrefixFor(fromFile) {
  const entry = tailwindEntryFor(fromFile);
  return entry ? themeAt(entry).prefix : null;
}
function moduleThemeEntryFor(fromFile) {
  const file = tailwindEntryFor(fromFile);
  return file && themeAt(file).modules ? file : null;
}
function colorTokensFor(fromFile) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return null;
  const { tokens } = themeOf(fromFile, cssFile);
  return tokens.size ? tokens : null;
}
function scopedColorTokensFor(fromFile) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return null;
  return themeOf(fromFile, cssFile).scoped;
}
function colorsOf(read) {
  if (read.colors) return read.colors;
  const colors = /* @__PURE__ */ new Map();
  for (const token of read.tokens) {
    const raw = read.values.get(`color-${token}`);
    if (!raw) continue;
    const resolved = resolveVariables(raw, read.values);
    const lab = resolved ? parseColor(resolved) : null;
    if (lab) colors.set(token, lab);
  }
  read.colors = colors;
  return colors;
}
const SCALE_DEFAULTS = {
  radius: RADII,
  text: FONT_SIZES,
};
function scaleOf(read, kind) {
  read.scales ??= {
    radius: buildScale(read, "radius"),
    text: buildScale(read, "text"),
  };
  return read.scales[kind];
}
function defaultScale(kind) {
  const scale = /* @__PURE__ */ new Map();
  for (const [name, value] of Object.entries(SCALE_DEFAULTS[kind])) {
    const px = lengthInPx(value);
    if (px !== null) scale.set(name, px);
  }
  return scale;
}
function buildScale(read, kind) {
  const scale = defaultScale(kind);
  const prefix = `${kind}-`;
  for (const { name, value, theme } of read.declarations) {
    if (!theme) continue;
    const reset = value.trim() === "initial";
    if (name === "*") {
      if (reset) scale.clear();
      continue;
    }
    if (!name.startsWith(prefix) || name.includes("--")) continue;
    const step = name.slice(prefix.length);
    if (step === "*") {
      if (reset) scale.clear();
      continue;
    }
    if (reset) {
      scale.delete(step);
      continue;
    }
    const resolved = resolveVariables(value, read.values);
    const px = resolved ? lengthInPx(resolved) : null;
    if (px !== null) scale.set(step, px);
    else scale.delete(step);
  }
  return scale;
}
const DEFAULT_SCALES = {
  radius: defaultScale("radius"),
  text: defaultScale("text"),
};
function colorValuesFor(fromFile) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return null;
  const read = themeOf(fromFile, cssFile);
  return read.tokens.size ? colorsOf(read) : null;
}
function spacingBaseFor(fromFile) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return 4;
  const read = themeOf(fromFile, cssFile);
  if (read.spacing !== void 0) return read.spacing;
  let raw = "0.25rem";
  for (const { name, value, theme } of read.declarations) {
    if (!theme) continue;
    if (name === "*" && value.trim() === "initial") raw = null;
    else if (name === "spacing")
      raw = value.trim() === "initial" ? null : value;
  }
  const resolved = raw === null ? null : resolveVariables(raw, read.values);
  const px = resolved ? lengthInPx(resolved) : null;
  return (read.spacing = px && px > 0 ? px : null);
}
function scaleFor(fromFile, kind) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return DEFAULT_SCALES[kind];
  return scaleOf(themeOf(fromFile, cssFile), kind);
}
function themeScalesFor(fromFile) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return null;
  const read = themeOf(fromFile, cssFile);
  return (read.themeScales ??= themeScalesOf(read.declarations));
}
function themeVocabularyFor(fromFile) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return null;
  const read = themeOf(fromFile, cssFile);
  return (read.vocabulary ??= {
    names: read.themeNames,
    tokens: read.tokens,
    utilities: read.utilities,
  });
}
const utilityPrefixes = /* @__PURE__ */ new WeakMap();
function utilityPrefixesOf(utilities) {
  let list = utilityPrefixes.get(utilities);
  if (!list) {
    list = [...utilities.keys()]
      .filter((name) => name.endsWith("*"))
      .map((name) => name.slice(0, -1));
    utilityPrefixes.set(utilities, list);
  }
  return list;
}
function utilityPropertiesOf(utilities, token) {
  const base = normalizeClass(token).replace(OPACITY_MODIFIER, "");
  if (!base) return null;
  const exact = utilities.get(base);
  if (exact) return exact;
  const prefix = utilityPrefixesOf(utilities).find((p) => base.startsWith(p));
  return prefix ? (utilities.get(`${prefix}*`) ?? []) : null;
}
function declaresUtility(fromFile, token) {
  const { utilities } = knownClassesFor(fromFile);
  return utilityPropertiesOf(utilities, token) !== null;
}
function declaresClass(fromFile, token) {
  if (declaresUtility(fromFile, token)) return true;
  const base = normalizeClass(token).replace(OPACITY_MODIFIER, "");
  return !!base && knownClassesFor(fromFile).classes.has(base);
}
const NO_CLASSES = {
  utilities: /* @__PURE__ */ new Map(),
  classes: /* @__PURE__ */ new Set(),
};
function knownClassesFor(fromFile) {
  const cssFile = themeFileFor(fromFile);
  if (!cssFile) return NO_CLASSES;
  const { utilities, classes } = themeOf(fromFile, cssFile);
  return {
    utilities,
    classes,
  };
}

//#endregion
//#region src/grammar/similar.ts
function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) => {
    const row = new Array(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++)
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[rows - 1][cols - 1];
}
function didYouMean(value, candidates, budget = value.length < 6 ? 1 : 2) {
  if (value.length < 3) return null;
  let best = null;
  for (const name of candidates) {
    if (name === value) return null;
    if (Math.abs(name.length - value.length) > budget) continue;
    const distance = editDistance(value, name);
    if (distance > budget) continue;
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && name.localeCompare(best.name) < 0)
    )
      best = {
        name,
        distance,
      };
  }
  return best?.name ?? null;
}

//#endregion
export {
  colorDistance as A,
  realpath as B,
  projectFor as C,
  packageRoot as D,
  warnOnce as E,
  TTL as F,
  isArbitraryValue as G,
  lengthInPx as H,
  dirOf as I,
  normalizeClass as J,
  isMarkerClass as K,
  isFile as L,
  parseColor as M,
  withoutVariableChannelColors as N,
  resolveFile as O,
  NODE_MODULES as P,
  withBase as Q,
  memoize as R,
  resolveStylesheetImport as S,
  uiDirectory as T,
  COLOR_PREFIX as U,
  formatPx as V,
  OPACITY_MODIFIER as W,
  splitClasses as X,
  replaceClass as Y,
  splitVariants as Z,
  themeFileFor as _,
  declaresClass as a,
  utilityPrefixesOf as b,
  moduleThemeEntryFor as c,
  scaleFor as d,
  scopedColorTokensFor as f,
  tailwindPrefixFor as g,
  tailwindEntryFor as h,
  colorValuesFor as i,
  isNamedColor as j,
  PALETTE as k,
  parseClassSelectors as l,
  spacingBaseFor as m,
  editDistance as n,
  declaresUtility as o,
  setThemeImports as p,
  isPaletteClass as q,
  colorTokensFor as r,
  knownClassesFor as s,
  didYouMean as t,
  parseImports as u,
  themeScalesFor as v,
  resolveAlias as w,
  utilityPropertiesOf as x,
  themeVocabularyFor as y,
  mtimeOf as z,
};
