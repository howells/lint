import { defineConfig } from "oxlint";

export const boundaryJsPlugins = [{ name: "boundaries", specifier: "eslint-plugin-boundaries" }];

export const boundarySettings = {
  "boundaries/elements": [
    { capture: ["name"], pattern: "apps/*", type: "app" },
    { capture: ["name"], pattern: "packages/*", type: "package" },
  ],
  "import/resolver": {
    node: {
      extensions: [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"],
    },
    typescript: {
      alwaysTryTypes: true,
      noWarnOnMultipleProjects: true,
      project: ["tsconfig.json", "apps/*/tsconfig.json", "packages/*/tsconfig.json"],
    },
  },
};

export const boundaryRules = {
  "boundaries/dependencies": [
    "error",
    {
      checkUnknownLocals: true,
      default: "allow",
      rules: [
        {
          disallow: [{ to: { type: "app" } }],
          from: { type: "package" },
          message: "Packages must not import from apps.",
        },
        {
          disallow: [
            {
              to: {
                captured: { name: "!{{ from.captured.name }}" },
                type: "app",
              },
            },
          ],
          from: { type: "app" },
          message: "Apps must not import from other apps.",
        },
      ],
    },
  ],
};

export default defineConfig({
  jsPlugins: boundaryJsPlugins,
  rules: boundaryRules,
  settings: boundarySettings,
});
