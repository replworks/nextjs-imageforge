import { readdir, readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { withImageForge } from "../src/config.js";
import {
  DEFAULT_BASE_URL,
  DEFAULT_PREFIX,
  resolveSettings,
} from "../src/settings.js";

function clearEnvironment() {
  vi.stubEnv("IMAGEFORGE_BASE_URL", undefined);
  vi.stubEnv("IMAGEFORGE_SERVICE", undefined);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("settings definition", () => {
  it("applies defaults without options or environment variables", () => {
    clearEnvironment();

    expect(resolveSettings()).toEqual({
      baseUrl: "https://img.repl.net",
      service: undefined,
      prefix: "if-",
    });
    expect(DEFAULT_BASE_URL).toBe("https://img.repl.net");
    expect(DEFAULT_PREFIX).toBe("if-");
  });

  it("reads IMAGEFORGE_BASE_URL and IMAGEFORGE_SERVICE from the environment", () => {
    vi.stubEnv("IMAGEFORGE_BASE_URL", "https://env.example");
    vi.stubEnv("IMAGEFORGE_SERVICE", "env-service");

    expect(resolveSettings()).toEqual({
      baseUrl: "https://env.example",
      service: "env-service",
      prefix: "if-",
    });
  });

  it("gives options precedence over environment variables", () => {
    vi.stubEnv("IMAGEFORGE_BASE_URL", "https://env.example");
    vi.stubEnv("IMAGEFORGE_SERVICE", "env-service");

    expect(
      resolveSettings({
        baseUrl: "https://option.example",
        service: "option-service",
        prefix: "img-",
      }),
    ).toEqual({
      baseUrl: "https://option.example",
      service: "option-service",
      prefix: "img-",
    });
  });

  it("sets prefix only through options", () => {
    vi.stubEnv("IMAGEFORGE_PREFIX", "env-");

    expect(resolveSettings().prefix).toBe("if-");
  });
});

describe("withImageForge settings delivery", () => {
  it("adds resolved settings to env with defaults", () => {
    clearEnvironment();

    expect(withImageForge({}).env).toEqual({
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_BASE_PATH: "",
    });
  });

  it("honors values loaded into the environment, such as from .env files", () => {
    vi.stubEnv("IMAGEFORGE_BASE_URL", "https://dotenv.example");
    vi.stubEnv("IMAGEFORGE_SERVICE", "from-dotenv");

    expect(withImageForge({ basePath: "/docs" }).env).toEqual({
      IMAGEFORGE_BASE_URL: "https://dotenv.example",
      IMAGEFORGE_SERVICE: "from-dotenv",
      IMAGEFORGE_BASE_PATH: "/docs",
    });
  });

  it("gives options precedence over environment variables", () => {
    vi.stubEnv("IMAGEFORGE_BASE_URL", "https://env.example");
    vi.stubEnv("IMAGEFORGE_SERVICE", "env-service");

    expect(
      withImageForge(
        {},
        { baseUrl: "https://option.example", service: "option-service" },
      ).env,
    ).toEqual({
      IMAGEFORGE_BASE_URL: "https://option.example",
      IMAGEFORGE_SERVICE: "option-service",
      IMAGEFORGE_BASE_PATH: "",
    });
  });

  it("preserves every existing config field", () => {
    clearEnvironment();
    const webpack = (config: unknown) => config;
    const rules = { "*.svg": { loaders: ["svg-loader"], as: "*.js" } };
    const nextConfig = {
      basePath: "/docs",
      reactStrictMode: true,
      env: { OTHER: "kept" },
      turbopack: { rules },
      webpack,
      images: { unoptimized: false },
    };
    const snapshot = structuredClone({ ...nextConfig, webpack: undefined });

    const result = withImageForge(nextConfig, { service: "svc" });

    expect(result.basePath).toBe("/docs");
    expect(result.reactStrictMode).toBe(true);
    expect(result.turbopack).toBe(nextConfig.turbopack);
    expect(result.turbopack?.rules).toBe(rules);
    expect(result.webpack).toBe(webpack);
    expect(result.images).toBe(nextConfig.images);
    expect(result.env).toEqual({
      OTHER: "kept",
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_SERVICE: "svc",
      IMAGEFORGE_BASE_PATH: "/docs",
    });
    expect({ ...nextConfig, webpack: undefined }).toEqual(snapshot);
  });
});

describe("environment access", () => {
  it("reads environment values only in the settings definition module", async () => {
    const sourceDirectory = new URL("../src/", import.meta.url);
    const files = (await readdir(sourceDirectory)).filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".d.ts"),
    );
    const readers: string[] = [];

    for (const file of files) {
      const source = await readFile(new URL(file, sourceDirectory), "utf8");
      if (source.includes("process.env")) {
        readers.push(file);
      }
    }

    expect(readers).toEqual(["settings.ts"]);
  });
});
