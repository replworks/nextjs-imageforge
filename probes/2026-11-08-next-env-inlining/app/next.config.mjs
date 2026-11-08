import { withProbe } from "probe-pkg/config";
console.log("[probe] config sees IMAGEFORGE_SERVICE =", process.env.IMAGEFORGE_SERVICE);
export default withProbe({ basePath: "/docs", env: { OTHER: "kept" } });
