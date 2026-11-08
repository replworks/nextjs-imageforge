import type { NextConfig } from "next";
import { resolveSettings, type ImageForgeOptions } from "./settings.js";

export type { ImageForgeOptions } from "./settings.js";

export function withImageForge(
  nextConfig: NextConfig,
  options: ImageForgeOptions = {},
): NextConfig {
  const settings = resolveSettings(options);
  const env: Record<string, string | undefined> = {
    ...nextConfig.env,
    IMAGEFORGE_BASE_URL: settings.baseUrl,
    IMAGEFORGE_BASE_PATH: nextConfig.basePath ?? "",
  };

  if (settings.service !== undefined) {
    env.IMAGEFORGE_SERVICE = settings.service;
  }

  return { ...nextConfig, env };
}
