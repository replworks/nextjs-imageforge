export interface ImageForgeOptions {
  baseUrl?: string;
  service?: string;
  prefix?: string;
}

export interface ImageForgeSettings {
  baseUrl: string;
  service?: string;
  prefix: string;
}

export const DEFAULT_BASE_URL = "https://img.repl.net";
export const DEFAULT_PREFIX = "if-";

export function resolveSettings(
  options: ImageForgeOptions = {},
  environment: Record<string, string | undefined> = process.env,
): ImageForgeSettings {
  return {
    baseUrl:
      options.baseUrl ?? environment.IMAGEFORGE_BASE_URL ?? DEFAULT_BASE_URL,
    service: options.service ?? environment.IMAGEFORGE_SERVICE,
    prefix: options.prefix ?? DEFAULT_PREFIX,
  };
}
