import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseDsl } from "../src/dsl-parser.js";

describe("DSL parser token table", () => {
  it.each([
    ["if-w-480", { w: 480 }],
    ["if-h-320", { h: 320, w: 0 }],
    ["if-q-80", { q: 80, w: 0 }],
    ["if-fit", { fit: "fit", w: 0 }],
    ["if-fill", { fit: "fill", w: 0 }],
    ["if-crop", { fit: "fill", w: 0 }],
    ["if-fit-auto", { fit: "auto", w: 0 }],
    ["if-webp", { f: "webp", w: 0 }],
    ["if-avif", { f: "avif", w: 0 }],
    ["if-jpeg", { f: "jpeg", w: 0 }],
    ["if-png", { f: "png", w: 0 }],
    ["if-auto", { w: 0 }],
  ])("maps %s to its documented result", (token, options) => {
    expect(parseDsl(token, "if-")).toEqual({ options, consumed: [token] });
  });

  it("omits f after if-auto", () => {
    expect(parseDsl("if-w-480 if-webp if-auto", "if-")).toEqual({
      options: { w: 480 },
      consumed: ["if-w-480", "if-webp", "if-auto"],
    });
  });
});

describe("DSL parser rules", () => {
  it("uses the last value of each option and maps if-crop to fill (AC-011)", () => {
    expect(
      parseDsl("if-w-100 if-w-480 if-fit if-crop if-png if-webp", "if-"),
    ).toEqual({
      options: { w: 480, fit: "fill", f: "webp" },
      consumed: [
        "if-w-100",
        "if-w-480",
        "if-fit",
        "if-crop",
        "if-png",
        "if-webp",
      ],
    });
  });

  it("clamps out-of-range numbers (AC-011)", () => {
    expect(parseDsl("if-w-3000 if-h--5 if-q-0", "if-").options).toEqual({
      w: 2000,
      h: 0,
      q: 1,
    });
    expect(parseDsl("if-w--10 if-h-2001 if-q-120", "if-").options).toEqual({
      w: 0,
      h: 2000,
      q: 100,
    });
  });

  it("supplies w=0 when a recognized token has no width token (AC-012)", () => {
    expect(parseDsl("if-h-320 if-crop", "if-").options).toEqual({
      w: 0,
      h: 320,
      fit: "fill",
    });
  });

  it("keeps unknown prefixed tokens and other words unconsumed (AC-013)", () => {
    expect(
      parseDsl("rounded if-unknown if-w-abc if-w-480 if-blur", "if-"),
    ).toEqual({ options: { w: 480 }, consumed: ["if-w-480"] });
  });

  it("returns no options when no token is recognized", () => {
    expect(parseDsl("rounded if-unknown", "if-")).toEqual({
      options: {},
      consumed: [],
    });
    expect(parseDsl("", "if-")).toEqual({ options: {}, consumed: [] });
  });

  it("handles arbitrary whitespace between tokens", () => {
    expect(parseDsl("  rounded\n\tif-w-480   if-webp ", "if-")).toEqual({
      options: { w: 480, f: "webp" },
      consumed: ["if-w-480", "if-webp"],
    });
  });

  it("uses a custom prefix for every token (AC-019)", () => {
    expect(
      parseDsl(
        "img-w-480 img-h-320 img-crop img-q-80 img-avif if-w-10",
        "img-",
      ),
    ).toEqual({
      options: { w: 480, h: 320, fit: "fill", q: 80, f: "avif" },
      consumed: ["img-w-480", "img-h-320", "img-crop", "img-q-80", "img-avif"],
    });
  });

  it("does not treat Object prototype names as tokens", () => {
    expect(parseDsl("if-constructor if-toString", "if-")).toEqual({
      options: {},
      consumed: [],
    });
  });
});

describe("DSL parser boundaries", () => {
  it("has no syntax-tree dependency", async () => {
    const source = await readFile(
      new URL("../src/dsl-parser.ts", import.meta.url),
      "utf8",
    );
    const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(specifiers).toEqual(["./url-api.js"]);
  });
});
