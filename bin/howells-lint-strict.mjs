#!/usr/bin/env node

import { runPackageBin } from "./run-package-bin.mjs";

const args = process.argv.slice(2);
const passthroughOptions = new Set(["--help", "-h", "--version", "-V"]);
const targets = args.length === 0 || args[0].startsWith("-") ? [".", ...args] : args;

const strictRuleOptions = [
  "--only=security",
  "--skip=security/noSecrets",
  "--only=correctness/noConstAssign",
  "--only=correctness/noUnreachable",
  "--only=correctness/noInvalidConstructorSuper",
  "--only=correctness/noSetterReturn",
  "--only=correctness/noUnsafeFinally",
  "--only=correctness/noUnsafeOptionalChaining",
  "--only=correctness/noGlobalObjectCalls",
  "--only=correctness/noSelfAssign",
  "--only=correctness/noSwitchDeclarations",
  "--only=suspicious/noDebugger",
  "--only=suspicious/noDoubleEquals",
  "--only=suspicious/noExplicitAny",
  "--only=suspicious/noCatchAssign",
  "--only=suspicious/noFunctionAssign",
  "--only=suspicious/noGlobalAssign",
  "--only=suspicious/noRedeclare",
  "--only=suspicious/noSparseArray",
  "--only=suspicious/noVar",
  "--only=suspicious/noDuplicateCase",
  "--only=suspicious/noDuplicateObjectKeys",
  "--only=suspicious/noDuplicateParameters",
  "--only=suspicious/noFallthroughSwitchClause",
  "--only=suspicious/noFocusedTests",
];

const resolvedArgs = passthroughOptions.has(args[0])
  ? args
  : ["lint", ...strictRuleOptions, ...targets];

runPackageBin("@biomejs/biome", "biome", resolvedArgs);
