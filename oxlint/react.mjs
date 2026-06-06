import { defineConfig } from "oxlint";
import { RECOMMENDED_RULES } from "oxlint-plugin-react-doctor";
import ultraciteReact from "ultracite/oxlint/react";
import core from "./core.mjs";

export default defineConfig({
	extends: [core, ultraciteReact],
	jsPlugins: [
		{ name: "react-doctor", specifier: "oxlint-plugin-react-doctor" },
	],
	rules: RECOMMENDED_RULES,
});
