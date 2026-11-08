import { fileURLToPath } from "node:url";
import { withImageForge } from "@replworks/nextjs-imageforge/config";

const markerLoader = fileURLToPath(
  new URL("./marker-loader.cjs", import.meta.url),
);

export default withImageForge({
  basePath: "/docs",
  transpilePackages: ["fixture-dep"],
  turbopack: {
    rules: {
      "*.{js,jsx,tsx}": {
        condition: { not: "foreign" },
        loaders: [{ loader: markerLoader }],
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.tsx$/,
      exclude: /node_modules/,
      use: [{ loader: markerLoader }],
    });
    return config;
  },
});
