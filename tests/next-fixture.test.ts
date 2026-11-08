import { execFile, spawn, type ChildProcess } from "node:child_process";
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const run = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const fixtures = join(root, "tests", "fixtures");
const forge = "https://img.repl.net/fixture-svc/docs/cat.png";
const ids = [
  "plain",
  "bare",
  "nimg",
  "avatar",
  "badge",
  "untouched",
  "api",
  "dep",
];

type Attributes = Record<string, string>;
type Page = Record<string, Attributes>;

const developerMarker = '<p id="marker">developer-rule-ran</p>';

let workDir = "";
let appDir = "";

function childEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  delete env.NODE_ENV;
  delete env.IMAGEFORGE_BASE_URL;
  delete env.IMAGEFORGE_SERVICE;
  delete env.IMAGEFORGE_BASE_PATH;
  return env;
}

async function version(name: string): Promise<string> {
  const pkg = JSON.parse(
    await readFile(join(root, "node_modules", name, "package.json"), "utf8"),
  );
  return pkg.version;
}

async function pack(dir: string, destination: string): Promise<string> {
  const { stdout } = await run(
    "npm",
    ["pack", "--json", "--pack-destination", destination],
    { cwd: dir },
  );
  return join(destination, JSON.parse(stdout)[0].filename);
}

function parseImages(html: string): Page {
  const page: Page = {};
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    const attributes: Attributes = {};
    for (const match of tag.slice(4).matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) {
      attributes[match[1]] = (match[2] ?? "").replaceAll("&amp;", "&");
    }
    if (attributes.id) {
      page[attributes.id] = attributes;
    }
  }
  return page;
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

async function browserChunks(): Promise<string> {
  const files = (await listFiles(join(appDir, ".next", "static"))).filter(
    (file) => file.endsWith(".js"),
  );
  return (await Promise.all(files.map((file) => readFile(file, "utf8")))).join(
    "\n",
  );
}

async function build(args: string[]): Promise<{
  server: Page;
  client: Page;
  html: string[];
  chunks: string;
}> {
  await rm(join(appDir, ".next"), { recursive: true, force: true });
  await run(
    process.execPath,
    [
      join(appDir, "node_modules", "next", "dist", "bin", "next"),
      "build",
      ...args,
    ],
    { cwd: appDir, env: childEnv(), maxBuffer: 64 * 1024 * 1024 },
  );
  const htmlDir = join(appDir, ".next", "server", "app");
  const html = await Promise.all(
    ["index.html", "client.html"].map((name) =>
      readFile(join(htmlDir, name), "utf8"),
    ),
  );
  return {
    server: parseImages(html[0]),
    client: parseImages(html[1]),
    html,
    chunks: await browserChunks(),
  };
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, () => {
      const address = server.address();
      server.close(() =>
        resolve(typeof address === "object" && address ? address.port : 0),
      );
    });
  });
}

function stop(child: ChildProcess | undefined): void {
  if (child?.pid && child.exitCode === null) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }
}

function expectPage(page: Page): void {
  expect(Object.keys(page).sort()).toEqual([...ids].sort());

  expect(page.plain.src).toBe(`${forge}?w=480&h=320&fit=fill`);
  expect(page.plain.class).toBe("rounded");

  expect(page.bare.src).toBe(`${forge}?w=480`);
  expect(page.bare).not.toHaveProperty("class");

  expect(page.nimg.src).toBe(`${forge}?w=480&f=webp`);
  expect(page.nimg).not.toHaveProperty("srcset");
  expect(page.nimg).not.toHaveProperty("class");
  expect(JSON.stringify(page.nimg)).not.toContain("/_next/image");

  expect(page.avatar.src).toBe(`${forge}?w=64`);
  expect(page.avatar).not.toHaveProperty("class");

  expect(page.badge.src).toBe(`${forge}?w=32&q=100`);
  expect(page.badge.class).toBe("badge");

  expect(page.untouched.src).toBe("/cat.png");
  expect(page.untouched.class).toBe("rounded");

  expect(page.api.src).toBe(`${forge}?w=200`);

  expect(page.dep.src).toBe("/cat.png");
  expect(page.dep.class).toBe("rounded if-w-99");

  for (const attributes of Object.values(page)) {
    expect(attributes).not.toHaveProperty("unoptimized");
  }
}

function srcAndClass(page: Page) {
  return Object.fromEntries(
    Object.entries(page).map(([id, attributes]) => [
      id,
      { src: attributes.src, class: attributes.class },
    ]),
  );
}

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), "nextjs-imageforge-fixture-"));
  const packages = join(workDir, "packages");
  appDir = join(workDir, "app");
  await cp(join(fixtures, "next-app"), appDir, { recursive: true });
  await run("mkdir", ["-p", packages]);
  const packageTarball = await pack(root, packages);
  const depTarball = await pack(join(fixtures, "next-dep"), packages);

  await writeFile(
    join(appDir, "package.json"),
    JSON.stringify(
      {
        name: "nextjs-imageforge-fixture",
        private: true,
        dependencies: {
          "@replworks/nextjs-imageforge": `file:${packageTarball}`,
          "fixture-dep": `file:${depTarball}`,
          next: await version("next"),
          react: await version("react"),
          "react-dom": await version("react-dom"),
        },
        devDependencies: {
          "@types/node": "*",
          "@types/react": "^19.0.0",
          typescript: await version("typescript"),
        },
      },
      null,
      2,
    ),
  );
  await run("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: appDir,
    env: childEnv(),
    maxBuffer: 64 * 1024 * 1024,
  });
}, 600_000);

afterAll(async () => {
  if (workDir) {
    await rm(workDir, { recursive: true, force: true });
  }
}, 120_000);

describe.each([
  ["Turbopack", []],
  ["webpack", ["--webpack"]],
])("next build with %s", (_name, args) => {
  let output: Awaited<ReturnType<typeof build>>;

  beforeAll(async () => {
    output = await build(args);
  }, 600_000);

  it("renders the DSL and imageForge() results in a Server Component (AC-008, AC-009, AC-016, AC-017, AC-020)", () => {
    expectPage(output.server);
  });

  it("renders the DSL and imageForge() results in a Client Component (AC-008, AC-009, AC-016, AC-017, AC-020)", () => {
    expectPage(output.client);
  });

  it("produces the same output in Server and Client Components (AC-008, AC-018)", () => {
    expect(srcAndClass(output.client)).toEqual(srcAndClass(output.server));
  });

  it("keeps the Developer's existing rule and webpack function (AC-007)", () => {
    for (const html of output.html) {
      expect(html).toContain(developerMarker);
    }
    expect(output.chunks).not.toContain("__DEVELOPER_MARKER__");
  });

  it("ships rewritten Client Component source in browser chunks", () => {
    expect(output.chunks).toContain(`${forge}?w=480&h=320&fit=fill`);
    expect(output.chunks).toContain("fixture-svc");
    expect(output.chunks).not.toContain("if-w-480");
    expect(output.chunks).toContain("rounded if-w-99");
  });
});

describe("next dev with Turbopack", () => {
  let child: ChildProcess | undefined;
  let server: Page;
  let client: Page;
  const html: string[] = [];

  beforeAll(async () => {
    await rm(join(appDir, ".next"), { recursive: true, force: true });
    const port = await freePort();
    child = spawn(
      process.execPath,
      [
        join(appDir, "node_modules", "next", "dist", "bin", "next"),
        "dev",
        "--port",
        String(port),
      ],
      { cwd: appDir, env: childEnv(), detached: true, stdio: "pipe" },
    );
    let log = "";
    await new Promise<void>((resolve, reject) => {
      const onData = (data: Buffer) => {
        log += data.toString();
        if (/Ready in/.test(log)) {
          resolve();
        }
      };
      child!.stdout!.on("data", onData);
      child!.stderr!.on("data", onData);
      child!.once("exit", (code) =>
        reject(new Error(`next dev exited with ${code}:\n${log}`)),
      );
    });
    const fetchPage = async (path: string) => {
      const response = await fetch(`http://localhost:${port}${path}`);
      const body = await response.text();
      expect(response.status, body).toBe(200);
      html.push(body);
      return parseImages(body);
    };
    server = await fetchPage("/docs");
    client = await fetchPage("/docs/client");
  }, 600_000);

  afterAll(() => {
    stop(child);
  });

  it("renders the DSL in Server and Client Components (AC-018)", () => {
    expectPage(server);
    expectPage(client);
    expect(srcAndClass(client)).toEqual(srcAndClass(server));
  });

  it("keeps the Developer's existing Turbopack rule", () => {
    for (const body of html) {
      expect(body).toContain(developerMarker);
    }
  });
});
