import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { checkNativeBundle, sha256 } from "../bin/native-integrity.mjs";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const nativeRoot = join(packageRoot, "vendor/tsgolint");
const manifestBytes = readFileSync(join(nativeRoot, "manifest.json"));
const manifest = JSON.parse(manifestBytes);
const { values } = parseArgs({
  options: {
    "work-dir": { type: "string" },
    "archive-dir": { type: "string" },
  },
});
assert.ok(
  values["work-dir"],
  "Pass --work-dir with a new build directory outside the repository."
);
const work = resolve(values["work-dir"]);
assert.ok(
  !work.startsWith(packageRoot),
  "Native build directories must be outside the repository."
);
mkdirSync(work); // Never reuse source trees or silently accept a previous build.
const archiveRoot = values["archive-dir"]
  ? resolve(values["archive-dir"])
  : join(work, "archives");
mkdirSync(archiveRoot, { recursive: true });

const run = (command, args, cwd = work, env = process.env) => {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`
  );
  return result.stdout;
};

const archive = async (input, filename) => {
  const destination = join(archiveRoot, filename);
  let data;
  try {
    data = readFileSync(destination);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const response = await fetch(input.url);
    assert.ok(response.ok, `Download failed: ${input.url}: ${response.status}`);
    data = Buffer.from(await response.arrayBuffer());
    writeFileSync(destination, data, { flag: "wx" });
  }
  assert.equal(data.length, input.bytes, `Archive size: ${filename}`);
  assert.equal(sha256(data), input.sha256, `Archive hash: ${filename}`);
  if (input.integrity) {
    assert.equal(
      `sha512-${createHash("sha512").update(data).digest("base64")}`,
      input.integrity
    );
  }
  return destination;
};

const extract = (filename, destination) => {
  mkdirSync(destination, { recursive: true });
  run("tar", ["-xzf", filename, "--strip-components=1", "-C", destination]);
};

for (const [file, hash] of Object.entries(manifest.files)) {
  assert.equal(
    sha256(readFileSync(join(nativeRoot, file))),
    hash,
    `Native input hash: ${file}`
  );
}
for (const source of manifest.sources) {
  console.log(`Verified source: ${source.repo}@${source.revision}`);
  extract(await archive(source, source.archive), join(work, source.directory));
}
const sourceRoot = join(work, "tsgolint");
for (const [file, hash] of Object.entries(manifest.upstreamManifests)) {
  assert.equal(
    sha256(readFileSync(join(sourceRoot, file))),
    hash,
    `Upstream manifest hash: ${file}`
  );
}
assert.deepEqual(
  readdirSync(join(sourceRoot, "patches"))
    .filter((file) => file.endsWith(".patch"))
    .sort(),
  manifest.initializationPatches
    .map((patch) => patch.path.slice("patches/".length))
    .sort()
);
const initialization = [];
for (const patch of manifest.initializationPatches) {
  const file = join(sourceRoot, patch.path);
  assert.equal(sha256(readFileSync(file)), patch.sha256);
  const output = run(
    "patch",
    ["--batch", "--forward", "--fuzz=0", "-p1", "-i", file],
    join(sourceRoot, "typescript-go")
  );
  assert.doesNotMatch(output, /fuzz|offset|FAILED|reversed/i);
  initialization.push({ path: patch.path, sha256: patch.sha256, output });
}
const collections = join(sourceRoot, "internal/collections");
mkdirSync(collections, { recursive: true });
for (const file of readdirSync(
  join(sourceRoot, "typescript-go/internal/collections")
)) {
  if (file.endsWith(".go") && !file.endsWith("_test.go")) {
    copyFileSync(
      join(sourceRoot, "typescript-go/internal/collections", file),
      join(collections, file)
    );
  }
}
const repairOutput = run(
  "patch",
  [
    "--batch",
    "--forward",
    "--fuzz=0",
    "-p1",
    "-i",
    join(nativeRoot, manifest.repairPatch),
  ],
  sourceRoot
);
assert.doesNotMatch(repairOutput, /fuzz|offset|FAILED|reversed/i);
// Complete checksums for the pinned workspace graph; no module versions change.
copyFileSync(
  join(nativeRoot, manifest.workspaceSum),
  join(sourceRoot, "go.work.sum")
);
for (const types of manifest.testTypes) {
  const filename = `${types.name.replace("@", "").replace("/", "-")}-${types.version}.tgz`;
  extract(
    await archive(types, filename),
    join(sourceRoot, "node_modules", types.name)
  );
}

const goEnv = {
  ...process.env,
  ...manifest.buildEnvironment,
  GOWORK: join(sourceRoot, "go.work"),
  GOPATH: join(work, "gopath"),
  GOMODCACHE: process.env.GOMODCACHE || join(work, "gomod"),
  GOCACHE: process.env.GOCACHE || join(work, "gocache"),
  GOTMPDIR: join(work, "tmp"),
  GOPROXY: process.env.GOPROXY || "https://proxy.golang.org",
  GOSUMDB: "sum.golang.org",
  GOPRIVATE: "",
  GONOSUMDB: "",
  GONOPROXY: "",
  GOTELEMETRY: "off",
};
mkdirSync(goEnv.GOTMPDIR);
const toolchain = JSON.parse(
  run(
    "go",
    ["env", "-json", "GOVERSION", "GOROOT", "GOHOSTOS", "GOHOSTARCH"],
    sourceRoot,
    goEnv
  )
);
assert.equal(
  toolchain.GOVERSION,
  manifest.toolchain,
  "Install the exact pinned Go toolchain; automatic toolchain downloads are disabled."
);
const hostEnv = {
  ...goEnv,
  GOOS: toolchain.GOHOSTOS,
  GOARCH: toolchain.GOHOSTARCH,
};
const nativeTestArgs = ["test", "./...", "-parallel=1", "-count=1", "-json"];
const testOutput = run("go", nativeTestArgs, sourceRoot, hostEnv);
writeFileSync(join(work, "native-tests.jsonl"), testOutput);
const events = testOutput
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const tests = {
  command: ["go", ...nativeTestArgs],
  passedPackages: events.filter(
    (event) => event.Action === "pass" && !event.Test
  ).length,
  skipped: events
    .filter((event) => event.Action === "skip" && event.Test)
    .map(({ Package, Test }) => ({ Package, Test })),
  logSha256: sha256(testOutput),
};
console.log(
  `Native source tests passed: ${tests.passedPackages} packages; ${tests.skipped.length} upstream skips (recorded in build.json).`
);
const verification = run("go", ["mod", "verify"], sourceRoot, hostEnv).trim();
assert.equal(
  sha256(readFileSync(join(sourceRoot, "go.work.sum"))),
  manifest.files[manifest.workspaceSum],
  "Go workspace checksums changed"
);

const targets = {};
for (const [target, binary] of Object.entries(manifest.targets)) {
  const output = join(work, binary.path);
  mkdirSync(resolve(output, ".."), { recursive: true });
  const env = { ...goEnv, GOOS: binary.goos, GOARCH: binary.goarch };
  const args = [
    "build",
    ...manifest.buildFlags,
    "-o",
    output,
    "./cmd/tsgolint",
  ];
  run("go", args, sourceRoot, env);
  const bytes = readFileSync(output);
  assert.equal(bytes.length, binary.bytes, `Built binary size: ${target}`);
  assert.equal(sha256(bytes), binary.sha256, `Built binary hash: ${target}`);
  chmodSync(output, 0o755);
  const buildInfo = run(
    "go",
    ["version", "-m", output],
    sourceRoot,
    hostEnv
  ).replace(`${output}: `, "");
  targets[target] = {
    binary,
    command: [
      "go",
      "build",
      ...manifest.buildFlags,
      "-o",
      binary.path,
      "./cmd/tsgolint",
    ],
    buildInfo,
  };
  console.log(`${target} ${bytes.length} bytes sha256 ${binary.sha256}`);
}

const exe = toolchain.GOHOSTOS === "windows" ? ".exe" : "";
const compilerRoot = join(
  toolchain.GOROOT,
  "pkg/tool",
  `${toolchain.GOHOSTOS}_${toolchain.GOHOSTARCH}`
);
const compilerHashes = Object.fromEntries(
  [
    ["go", join(toolchain.GOROOT, `bin/go${exe}`)],
    ["compile", join(compilerRoot, `compile${exe}`)],
    ["link", join(compilerRoot, `link${exe}`)],
  ].map(([name, file]) => [name, sha256(readFileSync(file))])
);
const build = {
  manifestSha256: sha256(manifestBytes),
  buildScriptSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
  toolchain: manifest.toolchain,
  host: `${toolchain.GOHOSTOS}-${toolchain.GOHOSTARCH}`,
  compilerHashes,
  flags: manifest.buildFlags,
  environment: manifest.buildEnvironment,
  initialization,
  repairOutput,
  moduleVerification: verification,
  nativeTests: tests,
  targets,
};
rmSync(join(nativeRoot, "bin"), { force: true, recursive: true });
cpSync(join(work, "bin"), join(nativeRoot, "bin"), { recursive: true });
writeFileSync(
  join(nativeRoot, "build.json"),
  `${JSON.stringify(build, null, 2)}\n`
);
checkNativeBundle(packageRoot);
console.log(
  "Staged all six verified executables and build provenance. Consumers only execute the bundled backend."
);
