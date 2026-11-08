import type { UrlSettings } from "./settings-access.js";

export interface ImageForgeUrlOptions {
  w?: number | string | null;
  h?: number | string | null;
  fit?: string | null;
  q?: number | string | null;
  f?: string | null;
}

const optionOrder = ["w", "h", "fit", "q", "f"] as const;

function isPassThroughUrl(path: string): boolean {
  return /^(?:https?:|\/\/|data:)/i.test(path);
}

export function resolveSourceUrl(path: string, basePath: string): string {
  return `${basePath.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function composeForgeUrl(
  sourceUrl: string,
  options: ImageForgeUrlOptions,
  settings: Pick<UrlSettings, "baseUrl" | "service">,
): string {
  if (!settings.service) {
    throw new Error(
      "Image Forge service is not configured: set the `service` option of withImageForge() or IMAGEFORGE_SERVICE",
    );
  }

  const query = optionOrder
    .filter((name) => options[name] != null)
    .map((name) => `${name}=${String(options[name])}`)
    .join("&");

  return `${settings.baseUrl}/${settings.service}${sourceUrl}?${query}`;
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

  return composeForgeUrl(sourceUrl, options, settings);
}
