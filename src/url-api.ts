import type { UrlSettings } from "./settings-access.js";

export interface ImageForgeUrlOptions {
  w?: number | string | null;
  h?: number | string | null;
  fit?: string | null;
  q?: number | string | null;
  f?: string | null;
}

function isPassThroughUrl(path: string): boolean {
  return /^(?:https?:|\/\/|data:)/i.test(path);
}

export function resolveSourceUrl(path: string, basePath: string): string {
  return `${basePath.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function imageForgeWithSettings(
  path: string | null | undefined,
  options: ImageForgeUrlOptions,
  settings: UrlSettings,
): string | null {
  if (!path) {
    return null;
  }

  if (isPassThroughUrl(path)) {
    return path;
  }

  const sourceUrl = resolveSourceUrl(path, settings.basePath);
  if (options.w == null) {
    return sourceUrl;
  }

  throw new Error("Forge URLs are not implemented yet");
}
