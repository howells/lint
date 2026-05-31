import { defineConfig } from "oxlint";
import { NEXTJS_RULES } from "oxlint-plugin-react-doctor";
import ultraciteNext from "ultracite/oxlint/next";
import react from "./react.mjs";

export default defineConfig({
	extends: [react, ultraciteNext],
	rules: NEXTJS_RULES,
});
