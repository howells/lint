import { defineConfig } from "oxlint";
import { RECOMMENDED_RULES } from "oxlint-plugin-react-doctor";
import core from "ultracite/oxlint/core";
import ultraciteReact from "ultracite/oxlint/react";

export default defineConfig({
	extends: [core, ultraciteReact],
	jsPlugins: [
		{ name: "react-doctor", specifier: "oxlint-plugin-react-doctor" },
	],
	rules: RECOMMENDED_RULES,
});
