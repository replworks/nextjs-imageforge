export interface ImageForgeUrlOptions {
  w?: number | string | null;
  h?: number | string | null;
  fit?: string | null;
  q?: number | string | null;
  f?: string | null;
}

export function imageForge(
  path: string | null | undefined,
  options: ImageForgeUrlOptions = {},
): string | null {
  void path;
  void options;
  return null;
}
