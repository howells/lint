import { fileURLToPath } from "node:url";

import { checkNativeBundle } from "../bin/native-integrity.mjs";

const { manifest } = checkNativeBundle(
  fileURLToPath(new URL("../", import.meta.url))
);
console.log(
  `Verified ${Object.keys(manifest.targets).length} pinned native executables, build provenance and licenses.`
);
