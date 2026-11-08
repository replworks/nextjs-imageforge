import type { ImageForgeUrlOptions } from "./url-api.js";

export interface ParsedDsl {
  options: ImageForgeUrlOptions;
  consumed: string[];
}

const fitTokens: Record<string, string> = {
  fit: "fit",
  fill: "fill",
  crop: "fill",
  "fit-auto": "auto",
};

const formatTokens: Record<string, string> = {
  webp: "webp",
  avif: "avif",
  jpeg: "jpeg",
  png: "png",
};

function boundedNumber(
  value: string,
  minimum: number,
  maximum: number,
): number | undefined {
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) {
    return undefined;
  }

  return Math.min(maximum, Math.max(minimum, Number(value)));
}

export function parseDsl(value: string, prefix: string): ParsedDsl {
  const options: ImageForgeUrlOptions = {};
  const consumed: string[] = [];
  let hasWidth = false;

  for (const token of value.split(/\s+/).filter(Boolean)) {
    if (!token.startsWith(prefix)) {
      continue;
    }

    const name = token.slice(prefix.length);
    const numberMatch = /^(w|h|q)-(.+)$/.exec(name);
    if (numberMatch) {
      const kind = numberMatch[1] as "w" | "h" | "q";
      const [minimum, maximum] = kind === "q" ? [1, 100] : [0, 2000];
      const parsed = boundedNumber(numberMatch[2], minimum, maximum);
      if (parsed !== undefined) {
        options[kind] = parsed;
        consumed.push(token);
        if (kind === "w") {
          hasWidth = true;
        }
      }
      continue;
    }

    if (Object.hasOwn(fitTokens, name)) {
      options.fit = fitTokens[name];
      consumed.push(token);
      continue;
    }

    if (Object.hasOwn(formatTokens, name)) {
      options.f = formatTokens[name];
      consumed.push(token);
      continue;
    }

    if (name === "auto") {
      delete options.f;
      consumed.push(token);
    }
  }

  if (consumed.length > 0 && !hasWidth) {
    options.w = 0;
  }

  return { options, consumed };
}
