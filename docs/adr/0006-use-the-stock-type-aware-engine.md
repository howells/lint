# 0006. Use the stock type-aware engine

Type-aware rules run on the published `oxlint-tsgolint` binary, pinned as a dependency. The `howells-*` binaries point Oxlint at it through `OXLINT_TSGOLINT_PATH`, because a consumer that installs only this package has no `node_modules/.bin/tsgolint` for Oxlint to find.

3.10.0 to 3.10.2 shipped a patched build instead: six executables compiled from a pinned tsgolint with a 628-line Go patch, so that `typescript/strict-void-return` stopped reporting `promisify(execFile)`. That took the package from 0.9 MB to 136 MB in every consumer, beside the stock binary it still installed, and every release needed a local Go toolchain and about 26 GB of build files.

One false positive does not justify owning a compiler fork. `typescript/strict-void-return` stays at `error`, as Ultracite ships it. Checked on 2026-11-13: stock 7.0.2005 and upstream 7.0.2007 both report `promisify(execFile)`; 24 files in 11 consumer repos use that form. Each takes a disable comment with a reason until upstream resolves the callback's overload:

```ts
// oxlint-disable-next-line typescript/strict-void-return -- promisify(execFile) picks an overload the rule misreads
const run = promisify(execFile);
```

Consequence: the fix belongs upstream in `oxc-project/tsgolint`. When it lands, the disables go.
