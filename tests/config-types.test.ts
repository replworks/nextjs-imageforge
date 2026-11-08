import { describe, expectTypeOf, it } from "vitest";
import { withImageForge } from "../src/config.js";

describe("withImageForge types (AC-007)", () => {
  it("keeps the specific type of the given config", () => {
    const config = withImageForge(
      {
        output: "standalone" as const,
        async redirects() {
          return [{ source: "/a", destination: "/b", permanent: false }];
        },
      },
      { service: "svc" },
    );

    expectTypeOf(config.redirects).toBeFunction();
    expectTypeOf(config.output).toEqualTypeOf<"standalone">();
    expectTypeOf(config.redirects).not.toBeNullable();
  });

  it("always returns env, turbopack, and webpack", () => {
    const config = withImageForge({});

    expectTypeOf(config.env).not.toBeNullable();
    expectTypeOf(config.turbopack).not.toBeNullable();
    expectTypeOf(config.webpack).not.toBeNullable();
  });
});
