// Variant: additionally exclude any path containing a node_modules segment.
import { withImageForge } from "@replworks/nextjs-imageforge/config";
const config = withImageForge({
  basePath: "/docs",
  transpilePackages: ["fixture-dep"],
});
config.turbopack.rules["*.{js,jsx,tsx}"].condition = {
  all: [{ not: "foreign" }, { not: { path: /(^|[\\/])node_modules[\\/]/ } }],
};
export default config;
