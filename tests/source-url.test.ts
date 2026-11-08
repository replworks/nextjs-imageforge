import { afterEach, describe, expect, it, vi } from "vitest";
import { imageForge } from "../src/index.js";
import { resolveSourceUrl } from "../src/url-api.js";

function useBasePath(basePath: string) {
  vi.stubEnv("IMAGEFORGE_BASE_URL", "https://img.repl.net");
  vi.stubEnv("IMAGEFORGE_SERVICE", "svc");
  vi.stubEnv("IMAGEFORGE_BASE_PATH", basePath);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Source URL resolver", () => {
  it("joins basePath and the Image Path with exactly one slash", () => {
    expect(resolveSourceUrl("cat.jpg", "")).toBe("/cat.jpg");
    expect(resolveSourceUrl("/cat.jpg", "")).toBe("/cat.jpg");
    expect(resolveSourceUrl("cat.jpg", "/docs")).toBe("/docs/cat.jpg");
    expect(resolveSourceUrl("/cat.jpg", "/docs")).toBe("/docs/cat.jpg");
    expect(resolveSourceUrl("//cat.jpg", "/docs/")).toBe("/docs/cat.jpg");
  });
});

describe("imageForge Source URL", () => {
  it("returns the Source URL without basePath (AC-002)", () => {
    useBasePath("");

    expect(imageForge("/cat.jpg")).toBe("/cat.jpg");
    expect(imageForge("cat.jpg")).toBe("/cat.jpg");
    expect(imageForge("/images/cat.jpg")).toBe("/images/cat.jpg");
  });

  it("returns the Source URL with basePath /docs (AC-002)", () => {
    useBasePath("/docs");

    expect(imageForge("/cat.jpg")).toBe("/docs/cat.jpg");
    expect(imageForge("cat.jpg")).toBe("/docs/cat.jpg");
  });

  it("returns null for null, undefined, and empty paths (AC-003)", () => {
    useBasePath("/docs");

    expect(imageForge(null)).toBeNull();
    expect(imageForge(undefined)).toBeNull();
    expect(imageForge("")).toBeNull();
    expect(imageForge(null, { w: 480 })).toBeNull();
  });

  it("returns absolute, protocol-relative, and data: URLs unchanged", () => {
    useBasePath("/docs");
    const urls = [
      "http://example.com/cat.jpg",
      "https://example.com/cat.jpg",
      "//cdn.example.com/cat.jpg",
      "data:image/png;base64,iVBORw0KGgo=",
    ];

    for (const url of urls) {
      expect(imageForge(url)).toBe(url);
      expect(imageForge(url, { w: 480 })).toBe(url);
    }
  });

  it("returns the Source URL when w is absent and other options are supplied", () => {
    useBasePath("/docs");
    const options = { h: 320, fit: "fill", q: 80, f: "webp" };

    expect(imageForge("/cat.jpg", options)).toBe("/docs/cat.jpg");
    expect(imageForge("/cat.jpg", { ...options, w: null })).toBe(
      "/docs/cat.jpg",
    );
    expect(imageForge("/cat.jpg", { ...options, w: undefined })).toBe(
      "/docs/cat.jpg",
    );
  });

  it("returns the Source URL with service unset when w is absent", () => {
    vi.stubEnv("IMAGEFORGE_SERVICE", undefined);
    vi.stubEnv("IMAGEFORGE_BASE_PATH", "");

    expect(imageForge("/cat.jpg", { h: 320 })).toBe("/cat.jpg");
  });
});

describe(". entry imports", () => {
  it("imports only its own relative modules", async () => {
    const { readFile } = await import("node:fs/promises");
    for (const file of ["index.ts", "settings-access.ts", "url-api.ts"]) {
      const source = await readFile(
        new URL(`../src/${file}`, import.meta.url),
        "utf8",
      );
      const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map(
        (match) => match[1],
      );

      for (const specifier of specifiers) {
        expect(specifier).toMatch(/^\.\//);
      }
    }
  });
});
