# Vendored type-aware backend

`@howells/lint` builds tsgolint 7.0.2004 with the native correction in `strict-void-return.patch`. The correction checks the applicable resolved signature before reporting callback return expectations from unrelated overloads. It preserves `typescript/strict-void-return: error` and ordinary callback enforcement, including value, async, assignment and void/any overloads.

`manifest.json` pins both source archives and Git revisions, all six upstream initialization patches, the repair patch, workspace checksums, test declarations, Go 1.26.4, compiler flags, licenses and the six expected executable hashes. The TypeScript-Go nested TypeScript submodule is unused: the required libraries are committed in the pinned TypeScript-Go archive. The workspace checksum input completes the existing upstream module graph without changing module versions. `licenses/` contains the upstream, Go runtime and linked-module notices.

Build with Node from `.node-version`, the pinned pnpm, Go 1.26.4, tar and patch:

```sh
pnpm install --frozen-lockfile
pnpm native:build --work-dir /absolute/path/to/new-build-directory
pnpm prepush
pnpm pack --pack-destination /absolute/path/to/package-directory
```

The work directory must be new and outside the repository. `--archive-dir` can reuse verified cached input archives. `GOMODCACHE`, `GOCACHE` and `GOPROXY=off` can reuse an already verified Go module cache without network access. The build applies patches with zero fuzz and no offsets, runs the native suite without updating snapshots, verifies Go modules and checks every compiled output against the manifest. It stages ignored `bin/` executables and `build.json`, which records the compiler hashes, native test results and each executable's embedded module and build information. `native:check`, prepush and prepack require the complete bundle with matching provenance, hashes and modes. pnpm's executable-file list preserves native executable modes in the tarball without adding public commands.

The dispatcher selects the bundled executable for macOS, Linux and Windows, on arm64 and x64. A nonempty `OXLINT_TSGOLINT_PATH` retains upstream override precedence; an empty override selects the bundle. Unsupported targets and broken bundles fail explicitly. There is no stock fallback, consumer download or Go build. Consumers need Node and the existing package dependencies. Oxfmt does not read the native bundle. The existing `oxlint-tsgolint` dependency remains pinned for upstream compatibility; its launcher is available only as an explicit override and its optional platform package remains an additional installation.

The tag-driven release workflow builds and packs once, then installs that exact tarball with lifecycle scripts disabled and executes the real Oxlint protocol on all six targets. It checks the actual Node platform and architecture, canonical `promisify(execFile)`, callback enforcement, overrides, missing bundles and Oxfmt. Smoke child processes use an empty tool PATH. Publishing requires every platform job to pass and retains npm trusted publishing with explicit provenance. Manual `workflow_dispatch` performs verification without publishing. Runner labels come from [GitHub's hosted runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

Cross-compilation and matching hashes do not certify execution on another OS or architecture. Native platform gates, OS version floors and signing must be assessed from actual runner results before a release is certified. Neither this source integration nor a local pack authorizes publishing a package version.
