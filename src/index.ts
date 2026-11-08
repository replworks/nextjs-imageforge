import { readSettings } from "./settings-access.js";
import {
  imageForgeWithSettings,
  type ImageForgeUrlOptions,
} from "./url-api.js";

export type { ImageForgeUrlOptions } from "./url-api.js";

export function imageForge(
  path: string | null | undefined,
  options: ImageForgeUrlOptions = {},
): string | null {
  return imageForgeWithSettings(path, options, readSettings());
}
