//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
const node_module = __toESM(require("node:module"));
const node_path = __toESM(require("node:path"));
const oxc_resolver = __toESM(require("oxc-resolver"));
const stable_hash_x = __toESM(require("stable-hash-x"));
const node_fs = __toESM(require("node:fs"));
const node_process = __toESM(require("node:process"));
const node_url = __toESM(require("node:url"));

//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/predicate/isPrimitive.mjs
function isPrimitive(value) {
	return value == null || typeof value !== "object" && typeof value !== "function";
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/predicate/isTypedArray.mjs
function isTypedArray(x) {
	return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/compat/_internal/getSymbols.mjs
function getSymbols(object) {
	return Object.getOwnPropertySymbols(object).filter((symbol) => Object.prototype.propertyIsEnumerable.call(object, symbol));
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/compat/_internal/getTag.mjs
function getTag(value) {
	if (value == null) return value === void 0 ? "[object Undefined]" : "[object Null]";
	return Object.prototype.toString.call(value);
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/compat/_internal/tags.mjs
const regexpTag = "[object RegExp]";
const stringTag = "[object String]";
const numberTag = "[object Number]";
const booleanTag = "[object Boolean]";
const argumentsTag = "[object Arguments]";
const symbolTag = "[object Symbol]";
const dateTag = "[object Date]";
const mapTag = "[object Map]";
const setTag = "[object Set]";
const arrayTag = "[object Array]";
const arrayBufferTag = "[object ArrayBuffer]";
const objectTag = "[object Object]";
const dataViewTag = "[object DataView]";
const uint8ArrayTag = "[object Uint8Array]";
const uint8ClampedArrayTag = "[object Uint8ClampedArray]";
const uint16ArrayTag = "[object Uint16Array]";
const uint32ArrayTag = "[object Uint32Array]";
const int8ArrayTag = "[object Int8Array]";
const int16ArrayTag = "[object Int16Array]";
const int32ArrayTag = "[object Int32Array]";
const float32ArrayTag = "[object Float32Array]";
const float64ArrayTag = "[object Float64Array]";

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/object/cloneDeepWith.mjs
function cloneDeepWithImpl(valueToClone, keyToClone, objectToClone, stack = /* @__PURE__ */ new Map(), cloneValue = void 0) {
	const cloned = cloneValue?.(valueToClone, keyToClone, objectToClone, stack);
	if (cloned != null) return cloned;
	if (isPrimitive(valueToClone)) return valueToClone;
	if (stack.has(valueToClone)) return stack.get(valueToClone);
	if (Array.isArray(valueToClone)) {
		const result = new Array(valueToClone.length);
		stack.set(valueToClone, result);
		for (let i = 0; i < valueToClone.length; i++) result[i] = cloneDeepWithImpl(valueToClone[i], i, objectToClone, stack, cloneValue);
		if (Object.hasOwn(valueToClone, "index")) result.index = valueToClone.index;
		if (Object.hasOwn(valueToClone, "input")) result.input = valueToClone.input;
		return result;
	}
	if (valueToClone instanceof Date) return new Date(valueToClone.getTime());
	if (valueToClone instanceof RegExp) {
		const result = new RegExp(valueToClone.source, valueToClone.flags);
		result.lastIndex = valueToClone.lastIndex;
		return result;
	}
	if (valueToClone instanceof Map) {
		const result = /* @__PURE__ */ new Map();
		stack.set(valueToClone, result);
		for (const [key, value] of valueToClone) result.set(key, cloneDeepWithImpl(value, key, objectToClone, stack, cloneValue));
		return result;
	}
	if (valueToClone instanceof Set) {
		const result = /* @__PURE__ */ new Set();
		stack.set(valueToClone, result);
		for (const value of valueToClone) result.add(cloneDeepWithImpl(value, void 0, objectToClone, stack, cloneValue));
		return result;
	}
	if (typeof Buffer !== "undefined" && Buffer.isBuffer(valueToClone)) return valueToClone.subarray();
	if (isTypedArray(valueToClone)) {
		const result = new (Object.getPrototypeOf(valueToClone)).constructor(valueToClone.length);
		stack.set(valueToClone, result);
		for (let i = 0; i < valueToClone.length; i++) result[i] = cloneDeepWithImpl(valueToClone[i], i, objectToClone, stack, cloneValue);
		return result;
	}
	if (valueToClone instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && valueToClone instanceof SharedArrayBuffer) return valueToClone.slice(0);
	if (valueToClone instanceof DataView) {
		const result = new DataView(valueToClone.buffer.slice(0), valueToClone.byteOffset, valueToClone.byteLength);
		stack.set(valueToClone, result);
		copyProperties(result, valueToClone, objectToClone, stack, cloneValue);
		return result;
	}
	if (typeof File !== "undefined" && valueToClone instanceof File) {
		const result = new File([valueToClone], valueToClone.name, { type: valueToClone.type });
		stack.set(valueToClone, result);
		copyProperties(result, valueToClone, objectToClone, stack, cloneValue);
		return result;
	}
	if (valueToClone instanceof Blob) {
		const result = new Blob([valueToClone], { type: valueToClone.type });
		stack.set(valueToClone, result);
		copyProperties(result, valueToClone, objectToClone, stack, cloneValue);
		return result;
	}
	if (valueToClone instanceof Error) {
		const result = new valueToClone.constructor();
		stack.set(valueToClone, result);
		result.message = valueToClone.message;
		result.name = valueToClone.name;
		result.stack = valueToClone.stack;
		result.cause = valueToClone.cause;
		copyProperties(result, valueToClone, objectToClone, stack, cloneValue);
		return result;
	}
	if (typeof valueToClone === "object" && isCloneableObject(valueToClone)) {
		const result = Object.create(Object.getPrototypeOf(valueToClone));
		stack.set(valueToClone, result);
		copyProperties(result, valueToClone, objectToClone, stack, cloneValue);
		return result;
	}
	return valueToClone;
}
function copyProperties(target, source, objectToClone = target, stack, cloneValue) {
	const keys = [...Object.keys(source), ...getSymbols(source)];
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const descriptor = Object.getOwnPropertyDescriptor(target, key);
		if (descriptor == null || descriptor.writable) target[key] = cloneDeepWithImpl(source[key], key, objectToClone, stack, cloneValue);
	}
}
function isCloneableObject(object) {
	switch (getTag(object)) {
		case argumentsTag:
		case arrayTag:
		case arrayBufferTag:
		case dataViewTag:
		case booleanTag:
		case dateTag:
		case float32ArrayTag:
		case float64ArrayTag:
		case int8ArrayTag:
		case int16ArrayTag:
		case int32ArrayTag:
		case mapTag:
		case numberTag:
		case objectTag:
		case regexpTag:
		case setTag:
		case stringTag:
		case symbolTag:
		case uint8ArrayTag:
		case uint8ClampedArrayTag:
		case uint16ArrayTag:
		case uint32ArrayTag: return true;
		default: return false;
	}
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/object/cloneDeep.mjs
function cloneDeep(obj) {
	return cloneDeepWithImpl(obj, void 0, obj, /* @__PURE__ */ new Map(), void 0);
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/predicate/isPlainObject.mjs
function isPlainObject(value) {
	if (!value || typeof value !== "object") return false;
	const proto = Object.getPrototypeOf(value);
	const hasObjectPrototype = proto === null || proto === Object.prototype || Object.getPrototypeOf(proto) === null;
	if (!hasObjectPrototype) return false;
	return Object.prototype.toString.call(value) === "[object Object]";
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/compat/predicate/isObjectLike.mjs
function isObjectLike(value) {
	return typeof value === "object" && value !== null;
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/object/mergeWith.mjs
function mergeWith(target, source, merge) {
	const sourceKeys = Object.keys(source);
	for (let i = 0; i < sourceKeys.length; i++) {
		const key = sourceKeys[i];
		const sourceValue = source[key];
		const targetValue = target[key];
		const merged = merge(targetValue, sourceValue, key, target, source);
		if (merged != null) target[key] = merged;
		else if (Array.isArray(sourceValue)) target[key] = mergeWith(targetValue ?? [], sourceValue, merge);
		else if (isObjectLike(targetValue) && isObjectLike(sourceValue)) target[key] = mergeWith(targetValue ?? {}, sourceValue, merge);
		else if (targetValue === void 0 || sourceValue !== void 0) target[key] = sourceValue;
	}
	return target;
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/object/pickBy.mjs
function pickBy(obj, shouldPick) {
	const result = {};
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const value = obj[key];
		if (shouldPick(value, key)) result[key] = value;
	}
	return result;
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/predicate/isBoolean.mjs
function isBoolean(x) {
	return typeof x === "boolean";
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/predicate/isNil.mjs
function isNil(x) {
	return x == null;
}

//#endregion
//#region node_modules/.pnpm/es-toolkit@1.39.0/node_modules/es-toolkit/dist/predicate/isString.mjs
function isString(value) {
	return typeof value === "string";
}

//#endregion
//#region src/utils.ts
function detectFile(files) {
	for (const file of files) {
		const absPath = (0, node_path.resolve)((0, node_process.cwd)(), file);
		if ((0, node_fs.existsSync)(absPath)) return absPath;
	}
}
function mergeOptions(a, b) {
	if (!a) return cloneDeep(b);
	if (!b) return cloneDeep(a);
	const res = cloneDeep(a);
	function mergeFunc(tar, src) {
		if (Array.isArray(tar) && Array.isArray(src)) return [...new Set(tar.concat(src))];
		else if (isPlainObject(tar) && isPlainObject(src)) return mergeWith(tar, src, mergeFunc);
	}
	return mergeWith(res, b, mergeFunc);
}
function log(...args) {
	return console.log("[eslint-import-resolver-oxc]", ...args);
}
async function tryRequireThenImport(module$1) {
	try {
		return require(module$1);
	} catch (error) {
		if (error.code === "ERR_REQUIRE_ESM" || error.code === "ERR_REQUIRE_ASYNC_MODULE") {
			const url = (0, node_url.pathToFileURL)(module$1);
			return (await import(url.toString())).default;
		} else throw error;
	}
}
function removeQuerystring(id) {
	const querystringIndex = id.lastIndexOf("?");
	if (querystringIndex >= 0) return id.slice(0, querystringIndex);
	return id;
}

//#endregion
//#region src/bundler/rspack.ts
function normalizeOptions$2(options) {
	if (!options.resolve) return;
	if (options.resolve.byDependency) [
		"commonjs",
		"amd",
		"esm"
	].forEach((k) => {
		const opt = options.resolve.byDependency[k];
		if (!opt) return;
		options.resolve = mergeOptions(options.resolve, opt);
	});
	for (const key in options.resolve) {
		const _key = key;
		if (Object.prototype.hasOwnProperty.call(options.resolve, _key)) {
			const val = options.resolve[_key];
			if (Array.isArray(val)) options.resolve[_key] = val.filter((v) => v !== "...");
		}
	}
	return options;
}
function transformAlias$1(alias) {
	if (isNil(alias)) return void 0;
	function resolveAliasOptions(val) {
		if (isBoolean(val)) return [null];
		else if (isString(val)) return [val];
		else return val.map((v) => isBoolean(v) ? null : v);
	}
	const _alias = {};
	if (Array.isArray(alias)) alias.forEach(({ alias: alias$1, name }) => {
		_alias[name] = resolveAliasOptions(alias$1);
	});
	else if (alias) for (const name in alias) _alias[name] = resolveAliasOptions(alias[name]);
	return _alias;
}
function transformRestrictions$1(restrictions) {
	return restrictions?.map((val) => ({ path: val }));
}
function transformTsConfig(tsConfig) {
	if (!tsConfig) return void 0;
	if (isString(tsConfig)) return { configFile: tsConfig };
	return tsConfig;
}
async function transformRspackConfig(path, _options = {}) {
	const { RspackCLI } = await tryRequireThenImport("@rspack/cli");
	const cli = new RspackCLI();
	let rspackOptions = await cli.loadConfig({
		config: path,
		configName: _options.configName ? [_options.configName] : void 0
	});
	if (Array.isArray(rspackOptions)) if (_options.merge) if (rspackOptions.length === 1) rspackOptions = rspackOptions[0];
	else {
		const { merge } = await tryRequireThenImport("webpack-merge");
		const merged = rspackOptions.reduce((acc, option) => merge(acc, option), {});
		rspackOptions = merged;
	}
	else if (_options.configName) {
		rspackOptions = rspackOptions.find((options$1) => options$1.name === _options.configName);
		if (!rspackOptions) {
			log(`config "${_options.configName}" not found`);
			return {};
		}
	} else {
		log("multiple configurations found, please specify `configName` or `merge`");
		return {};
	}
	const { config: rspackConfig } = await tryRequireThenImport("@rspack/core");
	const options = rspackConfig.getNormalizedRspackOptions(rspackOptions);
	rspackConfig.applyRspackOptionsDefaults(options);
	const config = normalizeOptions$2(options);
	if (!config || !config.resolve) return {};
	return {
		alias: transformAlias$1(config.resolve.alias),
		aliasFields: config.resolve.aliasFields,
		conditionNames: config.resolve.conditionNames,
		descriptionFiles: config.resolve.descriptionFiles,
		enforceExtension: isNil(config.resolve.enforceExtension) ? oxc_resolver.EnforceExtension.Auto : config.resolve.enforceExtension ? oxc_resolver.EnforceExtension.Enabled : oxc_resolver.EnforceExtension.Disabled,
		exportsFields: config.resolve.exportsFields,
		extensionAlias: transformAlias$1(config.resolve.extensionAlias),
		extensions: config.resolve.extensions,
		fallback: transformAlias$1(config.resolve.fallback),
		fullySpecified: config.resolve.fullySpecified,
		importsFields: config.resolve.importsFields,
		mainFields: config.resolve.mainFields,
		mainFiles: config.resolve.mainFiles,
		preferAbsolute: config.resolve.preferAbsolute,
		preferRelative: config.resolve.preferRelative,
		restrictions: transformRestrictions$1(config.resolve.restrictions),
		roots: config.resolve.roots,
		symlinks: config.resolve.symlinks,
		tsconfig: transformTsConfig(config.resolve.tsConfig)
	};
}
var rspack_default = {
	filename: ["rspack.config"],
	extensions: [
		"js",
		"mjs",
		"cjs"
	],
	transformConfig: transformRspackConfig
};

//#endregion
//#region src/bundler/vite.ts
async function transformViteConfig(path) {
	const { resolveConfig } = await tryRequireThenImport("vite");
	const config = await resolveConfig({ configFile: path }, "build", "production", "production");
	const { alias } = config.resolve;
	const resolvedAlias = {};
	if (Array.isArray(alias)) {
		const _alias = alias;
		_alias.forEach(({ find, replacement }) => {
			if (typeof find === "string") resolvedAlias[find] = [replacement];
		});
	} else if (alias) {
		const _alias = alias;
		for (const find in _alias) resolvedAlias[find] = [_alias[find]];
	}
	return {
		alias: resolvedAlias,
		mainFields: config.resolve.mainFields,
		extensions: config.resolve.extensions,
		conditionNames: config.resolve.conditions,
		symlinks: config.resolve.preserveSymlinks
	};
}
var vite_default = {
	filename: ["vite.config"],
	extensions: [
		"ts",
		"js",
		"mts",
		"mjs",
		"cts",
		"cjs"
	],
	transformConfig: transformViteConfig
};

//#endregion
//#region src/bundler/webpack.ts
function normalizeOptions$1(options) {
	if (options.resolve.byDependency) [
		"commonjs",
		"amd",
		"esm"
	].forEach((k) => {
		const opt = options.resolve.byDependency[k];
		if (!opt) return;
		options.resolve = mergeOptions(options.resolve, opt);
	});
	for (const key in options.resolve) {
		const _key = key;
		if (Object.prototype.hasOwnProperty.call(options.resolve, _key)) {
			const val = options.resolve[_key];
			if (Array.isArray(val)) options.resolve[_key] = val.filter((v) => v !== "...");
		}
	}
	return options;
}
function transformAlias(alias) {
	if (isNil(alias)) return void 0;
	function resolveAliasOptions(val) {
		if (isBoolean(val)) return [null];
		else if (isString(val)) return [val];
		else return val;
	}
	const _alias = {};
	if (Array.isArray(alias)) alias.forEach(({ alias: alias$1, name }) => {
		_alias[name] = resolveAliasOptions(alias$1);
	});
	else if (alias) for (const name in alias) _alias[name] = resolveAliasOptions(alias[name]);
	return _alias;
}
function transformMainFields(mainFields) {
	return mainFields?.flat();
}
function transformRestrictions(restrictions) {
	return restrictions?.map((val) => {
		if (isString(val)) return { path: val };
		else return { regex: val.toString() };
	});
}
async function transformWebpackConfig(path, _options = {}) {
	const WebpackCLI = await tryRequireThenImport("webpack-cli");
	const cli = new WebpackCLI();
	const webpackConfig = await cli.loadConfig({
		nodeEnv: "production",
		config: [path]
	});
	if (Array.isArray(webpackConfig.options)) if (_options.merge) if (webpackConfig.options.length === 1) webpackConfig.options = webpackConfig.options[0];
	else {
		const merge = await cli.tryRequireThenImport("webpack-merge", false);
		webpackConfig.options = webpackConfig.options.reduce((acc, options$1) => merge(acc, options$1), {});
	}
	else if (_options.configName) {
		const config$1 = webpackConfig.options.find((options$1) => options$1.name === _options.configName);
		if (config$1) webpackConfig.options = config$1;
		else {
			log(`config "${_options.configName}" not found`);
			return {};
		}
	} else {
		log("multiple configurations found, please specify `configName` or `merge`");
		return {};
	}
	const webpack = await cli.loadWebpack(false);
	const options = webpack.config.getNormalizedWebpackOptions(webpackConfig.options);
	webpack.config.applyWebpackOptionsDefaults(options);
	const config = normalizeOptions$1(options);
	if (!config || !config.resolve) return {};
	return {
		alias: transformAlias(config.resolve.alias),
		aliasFields: config.resolve.aliasFields,
		conditionNames: config.resolve.conditionNames,
		descriptionFiles: config.resolve.descriptionFiles,
		enforceExtension: isNil(config.resolve.enforceExtension) ? oxc_resolver.EnforceExtension.Auto : config.resolve.enforceExtension ? oxc_resolver.EnforceExtension.Enabled : oxc_resolver.EnforceExtension.Disabled,
		exportsFields: config.resolve.exportsFields,
		extensionAlias: transformAlias(config.resolve.extensionAlias),
		extensions: config.resolve.extensions,
		fallback: transformAlias(config.resolve.fallback),
		fullySpecified: config.resolve.fullySpecified,
		importsFields: config.resolve.importsFields,
		mainFields: transformMainFields(config.resolve.mainFields),
		mainFiles: config.resolve.mainFiles,
		preferAbsolute: config.resolve.preferAbsolute,
		preferRelative: config.resolve.preferRelative,
		restrictions: transformRestrictions(config.resolve.restrictions),
		roots: config.resolve.roots,
		symlinks: config.resolve.symlinks
	};
}
var webpack_default = {
	filename: [
		"webpack.config",
		".webpack/webpack.config",
		".webpack/webpackfile"
	],
	extensions: [
		"ts",
		"js",
		"mts",
		"mjs",
		"cts",
		"cjs"
	],
	transformConfig: transformWebpackConfig
};

//#endregion
//#region src/bundler/index.ts
const bundlerConfig = {
	vite: vite_default,
	webpack: webpack_default,
	rspack: rspack_default
};
async function getBundlerConfig(options) {
	if (options == null) return {};
	if (typeof options === "string") options = { path: options };
	let { type, path } = options;
	if (!type && !path) {
		log("Either `type` or `path` must be specified");
		return {};
	}
	if (!type) type = (0, node_path.basename)(path).split(".")[0];
	const config = bundlerConfig[type];
	if (!config) {
		log(`"${type}" config is not supported now`);
		return {};
	}
	if (!path) {
		const { filename, extensions } = config;
		path = detectFile(filename.flatMap((file) => extensions.map((ext) => `${file}.${ext}`)));
	}
	if (!path) {
		log(`Can't detect the bundler config, please try specify 'path'`);
		return {};
	}
	path = (0, node_path.resolve)((0, node_process.cwd)(), path);
	if (!(0, node_fs.existsSync)(path)) {
		log(`Can't find ${type} config: ${path}`);
		return {};
	}
	return await config.transformConfig(path, options?.options).catch((err) => {
		log(err);
		return {};
	});
}

//#endregion
//#region src/normalizeOptions.ts
/**
* some default options copy from
* https://github.com/import-js/eslint-import-resolver-typescript/blob/master/src/index.ts
* https://github.com/rolldown/rolldown/blob/main/crates/rolldown_resolver/src/resolver.rs
*/
const defaultOptions = {
	aliasFields: [["browser"]],
	conditionNames: [
		"default",
		"types",
		"import",
		"require",
		"node",
		"node-addons",
		"browser",
		"esm2020",
		"es2020",
		"es2015"
	],
	extensionAlias: {
		".js": [
			".ts",
			".tsx",
			".d.ts",
			".js"
		],
		".jsx": [
			".tsx",
			".d.ts",
			".jsx"
		],
		".cjs": [
			".cts",
			".d.cts",
			".cjs"
		],
		".mjs": [
			".mts",
			".d.mts",
			".mjs"
		]
	},
	extensions: [
		".ts",
		".tsx",
		".d.ts",
		".js",
		".jsx",
		".json",
		".node"
	],
	mainFields: [
		"types",
		"typings",
		"fesm2020",
		"fesm2015",
		"esm2020",
		"es2020",
		"main",
		"module",
		"browser",
		"jsnext:main"
	],
	roots: [(0, node_process.cwd)()]
};
function normalizeOptions(options = {}) {
	if (!options?.tsconfig) {
		const configFile = detectFile(["tsconfig.json", "jsconfig.json"]);
		if (configFile) defaultOptions.tsconfig = {
			configFile,
			references: "auto"
		};
	}
	return {
		...defaultOptions,
		...options
	};
}

//#endregion
//#region src/index.ts
let cachedOptionsHash;
let cachedResolver;
function resolve(source, file, options, resolver = null) {
	if ((0, node_module.isBuiltin)(source)) return {
		found: true,
		path: null
	};
	if (resolver == null) {
		options ??= {};
		const optionsHash = (0, stable_hash_x.stableHash)(options);
		if (!cachedResolver || cachedOptionsHash !== optionsHash) {
			options = normalizeOptions(options);
			cachedResolver = new oxc_resolver.ResolverFactory(options);
			cachedOptionsHash = optionsHash;
		}
		resolver = cachedResolver;
	}
	source = removeQuerystring(source);
	const result = resolver.sync((0, node_path.dirname)(file), source);
	return {
		found: !!result.path,
		path: result.path
	};
}
const interfaceVersion = 2;
function createOxcImportResolver(options) {
	if (options && Object.prototype.hasOwnProperty.call(options, "bundlerConfig")) return new Promise((resolve$3) => {
		getBundlerConfig(options.bundlerConfig).then((bundlerOptions) => {
			const resolver = createResolver({
				...pickBy(bundlerOptions, (val) => !isNil(val)),
				...options
			});
			resolve$3(resolver);
		});
	});
	else return createResolver(options);
}
async function createOxcImportResolverAsync(options) {
	return await createOxcImportResolver(options);
}
function createResolver(options) {
	const resolvedOptions = normalizeOptions(options);
	const resolver = new oxc_resolver.ResolverFactory(resolvedOptions);
	return {
		interfaceVersion: 3,
		name: "eslint-import-resolver-oxc",
		resolve(source, file) {
			return resolve(source, file, null, resolver);
		}
	};
}

//#endregion
exports.createOxcImportResolver = createOxcImportResolver;
exports.createOxcImportResolverAsync = createOxcImportResolverAsync;
exports.interfaceVersion = interfaceVersion;
exports.resolve = resolve;
exports.transformRspackConfig = transformRspackConfig;
exports.transformViteConfig = transformViteConfig;
exports.transformWebpackConfig = transformWebpackConfig;