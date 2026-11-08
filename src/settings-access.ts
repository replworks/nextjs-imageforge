export interface UrlSettings {
  baseUrl: string;
  service?: string;
  basePath: string;
}

export function readSettings(): UrlSettings {
  return {
    baseUrl: process.env.IMAGEFORGE_BASE_URL ?? "",
    service: process.env.IMAGEFORGE_SERVICE,
    basePath: process.env.IMAGEFORGE_BASE_PATH ?? "",
  };
}
