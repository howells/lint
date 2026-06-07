import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const oxlintBin = path.join(repoRoot, "node_modules", ".bin", "oxlint");
const reactPresetUrl = pathToFileURL(path.join(repoRoot, "oxlint", "react.mjs")).href;
const nextPresetUrl = pathToFileURL(path.join(repoRoot, "oxlint", "next.mjs")).href;

async function writeFixture(root, relativePath, source) {
  const filePath = path.join(root, relativePath);
  await writeFile(filePath, source, { flag: "w" });
}

async function runOxlint(root) {
  try {
    await execFileAsync(
      oxlintBin,
      [
        "--config",
        path.join(root, "oxlint.config.mjs"),
        "--format",
        "json",
        path.join(root, "src"),
      ],
      { cwd: root },
    );
    return { status: 0, stdout: "[]" };
  } catch (error) {
    return {
      status: error.code,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
}

function diagnosticsForRule(stdout, code) {
  const report = JSON.parse(stdout);
  const diagnostics = report.diagnostics ?? report;
  return diagnostics.filter((diagnostic) => diagnostic.code === code);
}

test("React preset rejects generic component suffixes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "howells-lint-"));

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import react from ${JSON.stringify(reactPresetUrl)};\nexport default react;\n`,
    );
    await mkdir(path.join(root, "src", "app", "orders"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "home"), { recursive: true });
    await writeFixture(
      root,
      "src/user-wrapper.tsx",
      "export function UserWrapper() { return <div />; }\n",
    );
    await writeFixture(
      root,
      "src/checkout-client.tsx",
      "export const CheckoutClient = () => <button />;\n",
    );
    await writeFixture(
      root,
      "src/dashboard-page.tsx",
      "export default function DashboardPage() { return <main />; }\n",
    );
    await writeFixture(
      root,
      "src/account-content.tsx",
      "export function AccountContent() { return <section />; }\n",
    );
    await writeFixture(
      root,
      "src/app/orders/page.tsx",
      "export default function Page() { return <main />; }\n",
    );
    await writeFixture(
      root,
      "src/app/page.tsx",
      "export default function Page() { return <main />; }\n",
    );
    // Component named "HomePage" in a page.tsx should be allowed —
    // the "Page" suffix is natural inside an actual page file.
    await writeFixture(
      root,
      "src/app/home/page.tsx",
      "export default function HomePage() { return <main />; }\n",
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-generic-component-suffix)",
    );
    const messages = ruleDiagnostics.map((diagnostic) => diagnostic.message);
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    assert.equal(
      messages.filter((message) => message.includes("Avoid generic component suffix")).length,
      6,
    );
    assert.match(ruleOutput, /user-wrapper\.tsx/);
    assert.match(ruleOutput, /UserWrapper/);
    assert.match(ruleOutput, /checkout-client\.tsx/);
    assert.match(ruleOutput, /CheckoutClient/);
    assert.match(ruleOutput, /dashboard-page\.tsx/);
    assert.match(ruleOutput, /DashboardPage/);
    assert.doesNotMatch(ruleOutput, /account-content\.tsx/);
    assert.doesNotMatch(ruleOutput, /app\/orders\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /app\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /app\/home\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /HomePage/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("Next preset rejects pages that only pass through to one client component", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "howells-lint-"));

  try {
    await writeFile(
      path.join(root, "oxlint.config.mjs"),
      `import next from ${JSON.stringify(nextPresetUrl)};\nexport default next;\n`,
    );
    await mkdir(path.join(root, "src", "app", "account"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "checkout"), { recursive: true });
    await mkdir(path.join(root, "src", "app", "marketing"), { recursive: true });

    await writeFixture(
      root,
      "src/app/checkout/page.tsx",
      'import { CheckoutExperience } from "./checkout-experience";\n\nexport default function Page() {\n  return <CheckoutExperience />;\n}\n',
    );
    await writeFixture(
      root,
      "src/app/checkout/checkout-experience.tsx",
      '"use client";\n\nexport function CheckoutExperience() {\n  return <button type="button" />;\n}\n',
    );
    await writeFixture(
      root,
      "src/app/account/page.tsx",
      'import { AccountOverview } from "./account-overview";\n\nexport default async function Page() {\n  const account = await getAccount();\n  return <AccountOverview account={account} />;\n}\n\nasync function getAccount() {\n  return { id: "account_1" };\n}\n',
    );
    await writeFixture(
      root,
      "src/app/account/account-overview.tsx",
      "export function AccountOverview() {\n  return <section />;\n}\n",
    );
    await writeFixture(
      root,
      "src/app/marketing/page.tsx",
      "export default function Page() {\n  return <main />;\n}\n",
    );

    const result = await runOxlint(root);
    assert.notEqual(result.status, 0);

    const ruleDiagnostics = diagnosticsForRule(
      result.stdout,
      "howells(no-single-client-component-page)",
    );
    const ruleOutput = JSON.stringify(ruleDiagnostics);

    assert.equal(ruleDiagnostics.length, 1);
    assert.match(ruleOutput, /checkout\/page\.tsx/);
    assert.match(ruleOutput, /CheckoutExperience/);
    assert.match(ruleOutput, /client component/);
    assert.doesNotMatch(ruleOutput, /account\/page\.tsx/);
    assert.doesNotMatch(ruleOutput, /marketing\/page\.tsx/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
