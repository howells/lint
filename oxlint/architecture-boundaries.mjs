import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginSpecifier = new URL(
  "../vendor/eslint-plugin-boundaries/dist/index.js",
  import.meta.url
).href;
const resolverPath = fileURLToPath(
  new URL(
    "../vendor/eslint-import-resolver-oxc/dist/index.cjs",
    import.meta.url
  )
);

const nextFeatureLayers = {
  app: 4,
  pages: 4,
  components: 3,
  features: 2,
  entities: 1,
  lib: 0,
  shared: 0,
};

/** Preserve the next-feature layer direction using upstream import analysis. */
export function createNextFeatureBoundaryConfig(rootPath) {
  const layers = Object.entries(nextFeatureLayers);
  return {
    jsPlugins: [{ name: "boundaries", specifier: pluginSpecifier }],
    settings: {
      "boundaries/root-path": path.resolve(rootPath),
      "boundaries/include": ["src/**"],
      "boundaries/elements": layers.map(([type]) => ({
        type,
        pattern: `src/${type}`,
      })),
      "import/resolver": {
        [resolverPath]: {
          tsconfig: {
            configFile: path.resolve(rootPath, "tsconfig.json"),
            references: "auto",
          },
        },
      },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          policies: layers.flatMap(([from, level]) => {
            const forbidden = layers
              .filter(([, targetLevel]) => level < targetLevel)
              .map(([type]) => type);
            return forbidden.length > 0
              ? [
                  {
                    from: { element: { type: from } },
                    disallow: { to: { element: { type: forbidden } } },
                  },
                ]
              : [];
          }),
        },
      ],
    },
  };
}
