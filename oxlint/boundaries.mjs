import { defineConfig } from "oxlint";

export const boundaryJsPlugins = [
	{ name: "boundaries", specifier: "eslint-plugin-boundaries" },
];

export const boundarySettings = {
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
	"boundaries/elements": [
		{ type: "app", pattern: "apps/*", capture: ["name"] },
		{ type: "package", pattern: "packages/*", capture: ["name"] },
	],
};

export const boundaryRules = {
	"boundaries/dependencies": [
		"error",
		{
			default: "allow",
			checkUnknownLocals: true,
			rules: [
				{
					from: { type: "package" },
					disallow: [{ to: { type: "app" } }],
					message: "Packages must not import from apps.",
				},
				{
					from: { type: "app" },
					disallow: [
						{
							to: {
								type: "app",
								captured: { name: "!{{ from.captured.name }}" },
							},
						},
					],
					message: "Apps must not import from other apps.",
				},
			],
		},
	],
};

export default defineConfig({
	jsPlugins: boundaryJsPlugins,
	settings: boundarySettings,
	rules: boundaryRules,
});
