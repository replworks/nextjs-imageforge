const loader = require.resolve("./loader.cjs");
function withProbe(nextConfig = {}) {
  const options = { baseUrl: "https://img.repl.net", service: "svc", basePath: nextConfig.basePath ?? "" };
  return {
    ...nextConfig,
    turbopack: {
      ...nextConfig.turbopack,
      rules: {
        ...nextConfig.turbopack?.rules,
        "*.{jsx,tsx}": {
          condition: { not: "foreign" },
          loaders: [{ loader, options }],
        },
      },
    },
    webpack(config, ctx) {
      config.module.rules.push({
        test: /\.[jt]sx$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: [{ loader, options }],
      });
      return typeof nextConfig.webpack === "function" ? nextConfig.webpack(config, ctx) : config;
    },
  };
}
module.exports = { withProbe };
