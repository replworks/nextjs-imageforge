// Documented rule (TECH_STACK §3): condition { not: "foreign" } only.
// Used with the T-007 fixture (tests/fixtures/next-app) + fixture-dep installed from a tarball.
import { withImageForge } from "@replworks/nextjs-imageforge/config";
export default withImageForge({
  basePath: "/docs",
  transpilePackages: ["fixture-dep"],
});
