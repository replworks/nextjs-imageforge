import { createRequire } from "node:module";
import { isAbsolute } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { withImageForge } from "../src/config.js";

const glob = "*.{js,jsx,tsx}";
const condition = {
  all: [{ not: "foreign" }, { not: { path: /(^|[\\/])node_modules[\\/]/ } }],
};

afterEach(() => {
  vi.unstubAllEnvs();
});

function clearEnvironment() {
  vi.stubEnv("IMAGEFORGE_BASE_URL", undefined);
  vi.stubEnv("IMAGEFORGE_SERVICE", undefined);
}

type Rule = {
  condition: unknown;
  loaders: { loader: string; options: Record<string, string> }[];
  as?: string;
};

function webpackConfig() {
  return { module: { rules: [] as unknown[] } };
}

describe("Turbopack registration", () => {
  it("adds the loader rule for js, jsx, and tsx without `as`", () => {
    clearEnvironment();
    const result = withImageForge(
      { basePath: "/docs" },
      { service: "svc", prefix: "img-" },
    );
    const rule = result.turbopack?.rules?.[glob] as Rule;

    expect(rule.condition).toEqual(condition);
    expect(rule).not.toHaveProperty("as");
    expect(rule.loaders).toHaveLength(1);
    expect(isAbsolute(rule.loaders[0].loader)).toBe(true);
    expect(rule.loaders[0].loader).toMatch(/loader\.cjs$/);
    expect(rule.loaders[0].options).toEqual({
      baseUrl: "https://img.repl.net",
      service: "svc",
      basePath: "/docs",
      prefix: "img-",
    });
    expect(JSON.parse(JSON.stringify(rule.loaders[0].options))).toEqual(
      rule.loaders[0].options,
    );
  });

  it("omits service from loader options when unset", () => {
    clearEnvironment();
    const rule = withImageForge({}).turbopack?.rules?.[glob] as Rule;

    expect(rule.loaders[0].options).toEqual({
      baseUrl: "https://img.repl.net",
      basePath: "",
      prefix: "if-",
    });
  });

  it("keeps existing turbopack fields and rules", () => {
    const svg = { loaders: ["svg-loader"], as: "*.js" };
    const result = withImageForge({
      turbopack: { root: "/repo", rules: { "*.svg": svg } },
    });

    expect(result.turbopack?.root).toBe("/repo");
    expect(result.turbopack?.rules?.["*.svg"]).toBe(svg);
  });

  it("appends to an existing single rule for the same glob", () => {
    const existing = { loaders: ["dev-loader"] };
    const rules = withImageForge({ turbopack: { rules: { [glob]: existing } } })
      .turbopack?.rules?.[glob] as unknown[];

    expect(rules).toHaveLength(2);
    expect(rules[0]).toBe(existing);
    expect((rules[1] as Rule).condition).toEqual(condition);
  });

  it("appends to an existing array for the same glob", () => {
    const first = "dev-loader";
    const second = { loaders: ["other-loader"], condition: "browser" as const };
    const rules = withImageForge({
      turbopack: { rules: { [glob]: [first, second] } },
    }).turbopack?.rules?.[glob] as unknown[];

    expect(rules).toHaveLength(3);
    expect(rules[0]).toBe(first);
    expect(rules[1]).toBe(second);
    expect((rules[2] as Rule).condition).toEqual(condition);
  });
});

describe("webpack registration", () => {
  it("pushes a pre-enforced rule for js, jsx, and tsx outside node_modules", () => {
    clearEnvironment();
    const config = webpackConfig();
    const turbopackRule = withImageForge({ basePath: "/docs" }).turbopack
      ?.rules?.[glob] as Rule;
    const result = withImageForge({ basePath: "/docs" }).webpack!(config, {
      dev: false,
    } as never);
    const rule = config.module.rules[0] as {
      test: RegExp;
      exclude: RegExp;
      enforce: string;
      use: unknown[];
    };

    expect(result).toBe(config);
    expect(config.module.rules).toHaveLength(1);
    expect(rule.enforce).toBe("pre");
    expect(rule.exclude.test("/app/node_modules/pkg/index.js")).toBe(true);
    for (const file of ["a.js", "a.jsx", "a.tsx"]) {
      expect(rule.test.test(file)).toBe(true);
    }
    for (const file of ["a.ts", "a.mdx", "a.md"]) {
      expect(rule.test.test(file)).toBe(false);
    }
    expect(rule.use).toEqual(turbopackRule.loaders);
  });

  it("still calls an existing webpack function and returns its result", () => {
    const config = webpackConfig();
    const context = { dev: true };
    const replaced = { replaced: true };
    const existing = vi.fn((received: unknown) => {
      expect((received as typeof config).module.rules).toHaveLength(1);
      return replaced;
    });

    const result = withImageForge({ webpack: existing }).webpack!(
      config,
      context as never,
    );

    expect(existing).toHaveBeenCalledWith(config, context);
    expect(result).toBe(replaced);
  });
});

describe("loader module", () => {
  const require = createRequire(import.meta.url);
  const loader = require("../dist/loader.cjs") as (
    this: unknown,
    source: string,
  ) => void;
  const settings = {
    baseUrl: "https://img.repl.net",
    service: "svc",
    basePath: "/docs",
    prefix: "if-",
  };

  function runLoader(
    source: string,
    options: Record<string, string> = settings,
    resourcePath = "/app/page.tsx",
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      loader.call(
        {
          resourcePath,
          getOptions: () => options,
          async: () => (error: Error | null, result?: string) =>
            error ? reject(error) : resolve(result as string),
        },
        source,
      );
    });
  }

  it("returns source without the prefix unchanged", async () => {
    const source = `const a = <img src="/cat.jpg" className="rounded" />;`;
    expect(await runLoader(source)).toBe(source);
  });

  it("rewrites eligible elements with the given settings", async () => {
    expect(
      await runLoader(
        `const a = <img src="/cat.jpg" className="rounded if-w-480" />;`,
      ),
    ).toBe(
      `const a = <img src="https://img.repl.net/svc/docs/cat.jpg?w=480" className="rounded" />;`,
    );
  });

  it("parses .tsx with the typescript plugin and .jsx without it", async () => {
    const tsx = `const a = (x: number) => <img src="/cat.jpg" className="if-w-1" />;`;
    expect(await runLoader(tsx, settings, "/app/page.tsx")).toContain("w=1");
    await expect(runLoader(tsx, settings, "/app/page.jsx")).rejects.toThrow();
  });

  it("reports the service error when service is unset", async () => {
    const { service: _service, ...withoutService } = settings;
    await expect(
      runLoader(`<img src="/cat.jpg" className="if-w-480" />`, withoutService),
    ).rejects.toThrow(/service/);
  });
});
