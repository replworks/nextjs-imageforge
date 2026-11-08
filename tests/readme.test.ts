import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("README", () => {
  it("states on its first line that the package is a client for the Image Forge service (AC-021)", async () => {
    const readme = await readFile(
      new URL("../README.md", import.meta.url),
      "utf8",
    );

    expect(readme.split("\n")[0]).toMatch(/client for the Image Forge service/);
  });
});
