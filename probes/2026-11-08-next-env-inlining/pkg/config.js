export function withProbe(nextConfig = {}) {
  return {
    ...nextConfig,
    env: {
      ...nextConfig.env,
      IMAGEFORGE_SERVICE: process.env.IMAGEFORGE_SERVICE ?? "unset-at-config",
      IMAGEFORGE_BASE_PATH: nextConfig.basePath ?? "",
    },
  };
}
