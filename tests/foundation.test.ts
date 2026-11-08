import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { imageForge } from "../src/index.js";
import { withImageForge } from "../src/config.js";

describe("package foundation", () => {
  it("exposes the . and ./config entries", async () => {
    const pkg = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    );

    expect(pkg.name).toBe("@replworks/nextjs-imageforge");
    expect(pkg.type).toBe("module");
    expect(Object.keys(pkg.exports)).toEqual([
      ".",
      "./config",
      "./package.json",
    ]);
    expect(typeof imageForge).toBe("function");
    expect(typeof withImageForge).toBe("function");
  });

  it("wraps a Next.js config without error", () => {
    expect(() => withImageForge({ reactStrictMode: true })).not.toThrow();
    expect(withImageForge({ reactStrictMode: true }).reactStrictMode).toBe(
      true,
    );
  });
});
