import { describe, expect, it } from "vitest";
import {
  transformJsx,
  type TransformSettings,
} from "../src/jsx-transformer.js";

const settings: TransformSettings = {
  baseUrl: "https://img.repl.net",
  service: "svc",
  basePath: "",
  prefix: "if-",
};

function transform(source: string, filename = "page.tsx", overrides = {}) {
  return transformJsx(source, filename, { ...settings, ...overrides });
}

describe("JSX transformer rewrites", () => {
  it("rewrites src and removes consumed tokens (AC-009)", () => {
    expect(
      transform(
        `const a = <img src="/cat.jpg" className="rounded if-w-480 if-h-320 if-crop" />;`,
      ),
    ).toBe(
      `const a = <img src="https://img.repl.net/svc/cat.jpg?w=480&h=320&fit=fill" className="rounded" />;`,
    );
  });

  it("removes an emptied className attribute (AC-010)", () => {
    expect(transform(`<img src="/cat.jpg" className="if-w-480" />`)).toBe(
      `<img src="https://img.repl.net/svc/cat.jpg?w=480" />`,
    );
    expect(transform(`<img className="if-w-480" src="/cat.jpg" />`)).toBe(
      `<img src="https://img.repl.net/svc/cat.jpg?w=480" />`,
    );
    expect(
      transform(`<img\n  className="if-w-480"\n  src="/cat.jpg"\n/>`),
    ).toBe(`<img\n  src="https://img.repl.net/svc/cat.jpg?w=480"\n/>`);
    expect(transform(`<img src="/cat.jpg" className='if-w-480'/>`)).toBe(
      `<img src="https://img.repl.net/svc/cat.jpg?w=480"/>`,
    );
  });

  it("includes basePath and keeps the quote style", () => {
    expect(
      transform(
        `<img src='/cat.jpg' className='if-w-480 if-webp' />`,
        "a.tsx",
        {
          basePath: "/docs",
        },
      ),
    ).toBe(`<img src='https://img.repl.net/svc/docs/cat.jpg?w=480&f=webp' />`);
  });

  it("rewrites any element name, including custom components and member expressions", () => {
    expect(
      transform(`<Avatar src="/me.png" className="if-w-64 ring" alt="me" />`),
    ).toBe(
      `<Avatar src="https://img.repl.net/svc/me.png?w=64" className="ring" alt="me" />`,
    );
    expect(transform(`<ui.Pic src="/me.png" className="if-q-80" />`)).toBe(
      `<ui.Pic src="https://img.repl.net/svc/me.png?w=0&q=80" />`,
    );
  });

  it("uses a custom prefix (AC-019)", () => {
    expect(
      transform(
        `<img src="/cat.jpg" className="if-w-1 img-w-480" />`,
        "a.tsx",
        { prefix: "img-" },
      ),
    ).toBe(
      `<img src="https://img.repl.net/svc/cat.jpg?w=480" className="if-w-1" />`,
    );
  });

  it("keeps unknown prefixed tokens (AC-013)", () => {
    expect(transform(`<img src="/a.png" className="if-blur if-w-10" />`)).toBe(
      `<img src="https://img.repl.net/svc/a.png?w=10" className="if-blur" />`,
    );
  });

  it("rewrites nested elements and elements inside attribute expressions", () => {
    expect(
      transform(
        `<div className="box"><Card icon={<img src="/i.png" className="if-w-16" />}><img src="/b.png" className="if-w-32" /></Card></div>`,
      ),
    ).toBe(
      `<div className="box"><Card icon={<img src="https://img.repl.net/svc/i.png?w=16" />}><img src="https://img.repl.net/svc/b.png?w=32" /></Card></div>`,
    );
  });
});

describe("JSX transformer ineligible src (AC-014)", () => {
  it.each([
    `src="cat.jpg"`,
    `src="https://example.com/cat.jpg"`,
    `src="//cdn.example.com/cat.jpg"`,
    `src="data:image/png;base64,AAAA"`,
    `src={path}`,
    `src={"/cat.jpg"}`,
    ``,
  ])("keeps %s and removes recognized tokens", (src) => {
    const attribute = src ? `${src} ` : "";
    expect(
      transform(`<img ${attribute}className="rounded if-w-480" alt="x" />`),
    ).toBe(`<img ${attribute}className="rounded" alt="x" />`);
  });
});

describe("JSX transformer unchanged elements (AC-015)", () => {
  it("leaves an element without recognized tokens unchanged", () => {
    const source = `<img src="/cat.jpg" className="rounded if-unknown" />`;
    expect(transform(source)).toBe(source);
  });

  it("leaves an expression className unchanged", () => {
    for (const source of [
      `<img src="/cat.jpg" className={"if-w-480"} />`,
      `<img src="/cat.jpg" className={\`if-w-480\`} />`,
      `<img src="/cat.jpg" className={cn("if-w-480")} />`,
    ]) {
      expect(transform(source)).toBe(source);
    }
  });
});

describe("JSX transformer unoptimized marker (AC-016)", () => {
  it("adds unoptimized to the default import of next/image", () => {
    expect(
      transform(
        `import Image from "next/image";\nexport default () => <Image src="/cat.jpg" className="if-w-480" alt="" />;`,
      ),
    ).toBe(
      `import Image from "next/image";\nexport default () => <Image src="https://img.repl.net/svc/cat.jpg?w=480" unoptimized alt="" />;`,
    );
  });

  it("follows a renamed default import", () => {
    expect(
      transform(
        `import Img from "next/image";\nconst a = <Img src="/cat.jpg" className="if-w-480" />;\nconst b = <Image src="/cat.jpg" className="if-w-480" />;`,
      ),
    ).toBe(
      `import Img from "next/image";\nconst a = <Img src="https://img.repl.net/svc/cat.jpg?w=480" unoptimized />;\nconst b = <Image src="https://img.repl.net/svc/cat.jpg?w=480" />;`,
    );
  });

  it("does not add unoptimized to an Image not imported from next/image", () => {
    for (const header of [
      `function Image(props) { return <img {...props} />; }`,
      `import Image from "./image";`,
      `import { Image } from "next/image";`,
    ]) {
      expect(
        transform(`${header}\n<Image src="/cat.jpg" className="if-w-480" />`),
      ).toBe(
        `${header}\n<Image src="https://img.repl.net/svc/cat.jpg?w=480" />`,
      );
    }
  });

  it("does not add unoptimized to other elements or when src is not rewritten", () => {
    expect(
      transform(
        `import Image from "next/image";\n<img src="/a.png" className="if-w-1" />;\n<Image src="a.png" className="if-w-1" />;\n<Image src={p} className="if-w-1" />;`,
      ),
    ).toBe(
      `import Image from "next/image";\n<img src="https://img.repl.net/svc/a.png?w=1" />;\n<Image src="a.png" />;\n<Image src={p} />;`,
    );
  });

  it("does not add unoptimized twice", () => {
    expect(
      transform(
        `import Image from "next/image";\n<Image unoptimized src="/a.png" className="if-w-1" />`,
      ),
    ).toBe(
      `import Image from "next/image";\n<Image unoptimized src="https://img.repl.net/svc/a.png?w=1" />`,
    );
  });

  it("handles generic type arguments on the element", () => {
    expect(
      transform(
        `import Image from "next/image";\n<Image<Props> src="/a.png" className="if-w-1" />`,
      ),
    ).toBe(
      `import Image from "next/image";\n<Image<Props> src="https://img.repl.net/svc/a.png?w=1" unoptimized />`,
    );
  });
});

describe("JSX transformer source preservation", () => {
  it("keeps text outside the rewritten attribute ranges byte for byte", () => {
    const before = `"use client";\r\n// if-w-1 in a comment\r\nimport Image from "next/image";\r\n\r\nexport function Page<T,>({ items }: { items: T[] }) {\r\n  const label = "if-w-2";\r\n  return (\r\n    <section   data-x='1'>\r\n      {/* note */}\r\n      <Image\r\n        alt="cat"\r\n        src="/cat.jpg"\r\n        className="if-w-480   rounded"\r\n        width={480}\r\n      />\r\n    </section>\r\n  );\r\n}\r\n`;
    const after = transform(before);
    const rewrittenSrc = `src="https://img.repl.net/svc/cat.jpg?w=480" unoptimized`;

    expect(after).toBe(
      before
        .replace(`src="/cat.jpg"`, rewrittenSrc)
        .replace(`className="if-w-480   rounded"`, `className="rounded"`),
    );
  });

  it("returns source without the prefix unchanged without parsing", () => {
    const invalid = `this is <not valid {{ jsx`;
    expect(transform(invalid)).toBe(invalid);
    expect(() => transform(`${invalid} if-w-1`)).toThrow();
  });

  it("parses TypeScript only for .tsx files", () => {
    const typed = `const a = <img src="/a.png" className="if-w-1" alt={x as string} />;`;
    expect(transform(typed, "page.tsx")).toContain("?w=1");
    expect(() => transform(typed, "page.jsx")).toThrow();
    expect(() => transform(typed, "page.js")).toThrow();
    expect(
      transform(`const a = <img src="/a.png" className="if-w-1" />;`, "a.jsx"),
    ).toBe(`const a = <img src="https://img.repl.net/svc/a.png?w=1" />;`);
  });
});

describe("JSX transformer service error", () => {
  it("raises the service error for an eligible src with an unset service", () => {
    expect(() =>
      transform(`<img src="/a.png" className="if-w-1" />`, "a.tsx", {
        service: undefined,
      }),
    ).toThrow(/service/);
  });

  it("does not raise when src is not eligible", () => {
    expect(
      transform(`<img src="a.png" className="if-w-1" />`, "a.tsx", {
        service: undefined,
      }),
    ).toBe(`<img src="a.png" />`);
  });
});

describe("JSX transformer parse failures", () => {
  it("fails instead of passing through a file with the prefix that cannot be parsed", () => {
    expect(() =>
      transform(`const x = <img src="/a.png" className="if-w-1" ;`),
    ).toThrow();
  });
});
