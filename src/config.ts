import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { resolveSettings, type ImageForgeOptions } from "./settings.js";

export type { ImageForgeOptions } from "./settings.js";

export const LOADER_RULE_GLOB = "*.{js,jsx,tsx}";

export function loaderPath(): string {
  return fileURLToPath(new URL("./loader.cjs", import.meta.url));
}

type WebpackFunction = NonNullable<NextConfig["webpack"]>;
type TurbopackRules = NonNullable<
  NonNullable<NextConfig["turbopack"]>["rules"]
>;

export type ImageForgeConfig<T extends NextConfig> = T & {
  env: NonNullable<NextConfig["env"]>;
  turbopack: NonNullable<NextConfig["turbopack"]>;
  webpack: WebpackFunction;
};

export function withImageForge<T extends NextConfig>(
  nextConfig: T,
  options: ImageForgeOptions = {},
): ImageForgeConfig<T> {
  const settings = resolveSettings(options);
  const basePath = nextConfig.basePath ?? "";
  const env: Record<string, string | undefined> = {
    ...nextConfig.env,
    IMAGEFORGE_BASE_URL: settings.baseUrl,
    IMAGEFORGE_BASE_PATH: basePath,
  };

  if (settings.service !== undefined) {
    env.IMAGEFORGE_SERVICE = settings.service;
  }

  const loaderOptions: Record<string, string> = {
    baseUrl: settings.baseUrl,
    basePath,
    prefix: settings.prefix,
  };
  if (settings.service !== undefined) {
    loaderOptions.service = settings.service;
  }
  const loader = { loader: loaderPath(), options: loaderOptions };

  const existingRules = nextConfig.turbopack?.rules;
  const existing = existingRules?.[LOADER_RULE_GLOB];
  const rule = {
    condition: {
      all: [
        { not: "foreign" },
        { not: { path: /(^|[\\/])node_modules[\\/]/ } },
      ],
    },
    loaders: [loader],
  } satisfies TurbopackRules[string];

  const existingWebpack = nextConfig.webpack;
  const webpack: WebpackFunction = (config, context) => {
    config.module.rules.push({
      test: /\.(js|jsx|tsx)$/,
      exclude: /node_modules/,
      enforce: "pre",
      use: [loader],
    });
    return typeof existingWebpack === "function"
      ? existingWebpack(config, context)
      : config;
  };

  return {
    ...nextConfig,
    env,
    turbopack: {
      ...nextConfig.turbopack,
      rules: {
        ...existingRules,
        [LOADER_RULE_GLOB]:
          existing === undefined
            ? rule
            : [...(Array.isArray(existing) ? existing : [existing]), rule],
      },
    },
    webpack,
  };
}
