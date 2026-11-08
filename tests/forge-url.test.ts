import { afterEach, describe, expect, it, vi } from "vitest";
import { withImageForge } from "../src/config.js";
import { imageForge } from "../src/index.js";
import { composeForgeUrl } from "../src/url-api.js";

function embed(env: Record<string, string | undefined> | undefined) {
  vi.stubEnv("IMAGEFORGE_BASE_URL", env?.IMAGEFORGE_BASE_URL);
  vi.stubEnv("IMAGEFORGE_SERVICE", env?.IMAGEFORGE_SERVICE);
  vi.stubEnv("IMAGEFORGE_BASE_PATH", env?.IMAGEFORGE_BASE_PATH);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("imageForge Forge URL", () => {
  it("uses the default baseUrl when only service is set (AC-001)", () => {
    vi.stubEnv("IMAGEFORGE_BASE_URL", undefined);
    vi.stubEnv("IMAGEFORGE_SERVICE", undefined);
    embed(withImageForge({}, { service: "svc" }).env);

    expect(imageForge("cat.jpg", { w: 480 })).toBe(
      "https://img.repl.net/svc/cat.jpg?w=480",
    );
  });

  it("uses the default baseUrl when the config is not wrapped", () => {
    embed({ IMAGEFORGE_SERVICE: "svc" });

    expect(imageForge("/cat.jpg", { w: 480 })).toBe(
      "https://img.repl.net/svc/cat.jpg?w=480",
    );
  });

  it("includes basePath in the Forge URL path", () => {
    embed({
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_SERVICE: "svc",
      IMAGEFORGE_BASE_PATH: "/docs",
    });

    expect(imageForge("/cat.jpg", { w: 480 })).toBe(
      "https://img.repl.net/svc/docs/cat.jpg?w=480",
    );
  });

  it("returns a Forge URL when w is 0", () => {
    embed({
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_SERVICE: "svc",
      IMAGEFORGE_BASE_PATH: "",
    });

    expect(imageForge("/cat.jpg", { w: 0 })).toBe(
      "https://img.repl.net/svc/cat.jpg?w=0",
    );
  });

  it("lists only present options in the order w, h, fit, q, f (AC-004)", () => {
    embed({
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_SERVICE: "svc",
      IMAGEFORGE_BASE_PATH: "",
    });

    expect(
      imageForge("/cat.jpg", { f: "webp", q: 80, fit: "fill", h: 320, w: 480 }),
    ).toBe("https://img.repl.net/svc/cat.jpg?w=480&h=320&fit=fill&q=80&f=webp");
    expect(
      imageForge("/cat.jpg", { w: 480, h: null, fit: undefined, q: 80 }),
    ).toBe("https://img.repl.net/svc/cat.jpg?w=480&q=80");
  });

  it("passes option values through exactly as supplied (AC-004)", () => {
    embed({
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_SERVICE: "svc",
      IMAGEFORGE_BASE_PATH: "",
    });

    expect(imageForge("/cat.jpg", { w: 9999, h: -5, q: 0 })).toBe(
      "https://img.repl.net/svc/cat.jpg?w=9999&h=-5&q=0",
    );
    expect(imageForge("/cat.jpg", { w: "480", fit: "auto" })).toBe(
      "https://img.repl.net/svc/cat.jpg?w=480&fit=auto",
    );
  });

  it("keeps URL-reserved characters in option values unchanged", () => {
    embed({
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_SERVICE: "svc",
      IMAGEFORGE_BASE_PATH: "",
    });

    expect(imageForge("/cat.jpg", { w: "1&x=2", f: "a b/c?#%" })).toBe(
      "https://img.repl.net/svc/cat.jpg?w=1&x=2&f=a b/c?#%",
    );
  });

  it("raises an error mentioning service when service is unset and w is present (AC-005)", () => {
    embed({
      IMAGEFORGE_BASE_URL: "https://img.repl.net",
      IMAGEFORGE_SERVICE: undefined,
      IMAGEFORGE_BASE_PATH: "",
    });

    expect(() => imageForge("/cat.jpg", { w: 480 })).toThrow(/service/);
    expect(imageForge("/cat.jpg")).toBe("/cat.jpg");
  });

  it("uses a configured baseUrl", () => {
    embed(
      withImageForge(
        { basePath: "/docs" },
        { baseUrl: "https://forge.example", service: "svc" },
      ).env,
    );

    expect(imageForge("cat.jpg", { w: 480 })).toBe(
      "https://forge.example/svc/docs/cat.jpg?w=480",
    );
  });
});

describe("Forge URL composer", () => {
  it("joins baseUrl, service, Source URL, and query", () => {
    expect(
      composeForgeUrl(
        "/docs/cat.jpg",
        { w: 480, h: 320 },
        { baseUrl: "https://img.repl.net", service: "svc" },
      ),
    ).toBe("https://img.repl.net/svc/docs/cat.jpg?w=480&h=320");
  });

  it("raises an error mentioning service when service is empty", () => {
    expect(() =>
      composeForgeUrl(
        "/cat.jpg",
        { w: 480 },
        { baseUrl: "https://img.repl.net", service: "" },
      ),
    ).toThrow(/service/);
  });
});
