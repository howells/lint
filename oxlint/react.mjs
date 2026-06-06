import { defineConfig } from "oxlint";
import { RECOMMENDED_RULES } from "oxlint-plugin-react-doctor";
import ultraciteReact from "ultracite/oxlint/react";
import core from "./core.mjs";

const reactDoctorPluginSpecifier = import.meta.resolve("oxlint-plugin-react-doctor");
const howellsPolicyPluginSpecifier = new URL("./howells-policy-plugin.mjs", import.meta.url).href;

export default defineConfig({
  extends: [core, ultraciteReact],
  jsPlugins: [
    { name: "react-doctor", specifier: reactDoctorPluginSpecifier },
    { name: "howells", specifier: howellsPolicyPluginSpecifier },
  ],
  rules: {
    ...RECOMMENDED_RULES,
    "howells/no-generic-component-suffix": "error",
    "react-doctor/no-giant-component": "error",
  },
});
