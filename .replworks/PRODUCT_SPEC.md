# PRODUCT_SPEC: @replworks/nextjs-imageforge

## Purpose

- The product is a Next.js package named `@replworks/nextjs-imageforge`.
- The product is a client for the Image Forge service and generates Forge URLs from image paths.
- The primary interface is a JSX Class DSL: recognized tokens in a literal `className` of any JSX element in the Developer's application source.
- `imageForge()` is the explicit API for values that are not literals, usable in any module that Next.js compiles: Server Components, Client Components, Route Handlers, and other application code.
- The product changes no component. A Developer applies it by adding tokens to `className`, or by passing the `imageForge()` result to an attribute such as `src`.

Definitions:

- Image Path: a path string of a file served from the Next.js `public/` directory, with or without a leading `/`, or null/undefined.
- Source URL: the root-relative URL of that public file, built from the Next.js `basePath`.
- Forge URL: a URL pointing to Image Forge.
- Option: one of `w`, `h`, `fit`, `q`, or `f`.
- DSL Token: a whitespace-separated word in a literal `className` value that starts with the configured prefix.
- Application Source: `.js`, `.jsx`, and `.tsx` files that Next.js compiles from the Developer's project, excluding files under `node_modules`.

## Goals

- Configure Image Forge once through `next.config` options or environment variables.
- Let a Developer write `<img src="/cat.jpg" className="rounded if-w-480" />` without SDK calls.
- Let the same tokens work on `next/image` `Image` and on any other component that takes `src` and `className`, without changing that component.
- Let a Developer write `<img src={imageForge(path, { w: 480 })} />` for non-literal values, with the same result in a Server Component and a Client Component.
- Require no change to the rest of the Developer's Next.js config or components.

## Inputs and configuration

- The Developer wraps the exported Next.js config as `withImageForge(nextConfig, options?)`.
- `nextConfig` is a Next.js config object.
- Options are `baseUrl`, `service`, and `prefix`.
- `baseUrl` defaults to `https://img.repl.net`.
- `service` has no default.
- `prefix` defaults to `if-`.
- `IMAGEFORGE_BASE_URL` and `IMAGEFORGE_SERVICE` map to `baseUrl` and `service`. They are read from the process environment and the project's `.env` files.
- An option value takes precedence over its environment variable.
- `prefix` is set only through options.
- `withImageForge()` returns the given config with every existing field preserved, including existing `env` entries, `turbopack.rules`, and a `webpack` function.
- Settings are fixed when `next dev` starts or `next build` runs; changes apply after a restart or a rebuild.

## Explicit API behavior

- `imageForge(path, options?)` accepts an Image Path and an optional object with `w`, `h`, `fit`, `q`, and `f`.
- It returns null for a null, undefined, or empty path.
- It returns an absolute URL (`http:`, `https:`), a protocol-relative URL (`//`), or a `data:` URL unchanged.
- With `w` absent (null or undefined), it returns the Source URL.
- With `w` present (including `0`), it returns a Forge URL.
- The Source URL is the Next.js `basePath` joined with the Image Path by exactly one `/`. It is always root-relative.
- The Forge URL is `baseUrl` + `/` + `service` + the Source URL + `?` + query.
- The query order is `w`, `h`, `fit`, `q`, `f`; null and undefined options are omitted.
- Option values are passed through without validation, clamping, encoding, or modification.
- The same call returns the same URL in a Server Component and in a Client Component.

## JSX Class DSL

The product rewrites eligible JSX elements in Application Source while Next.js compiles it, in `next dev` and `next build`.

Eligible elements:

- Any JSX element, whatever its name, whose `className` attribute is a string literal. Tokens are read from `className`.

The default prefix is `if-`; every token below uses the configured prefix.

| Token | Result |
| --- | --- |
| `if-w-{n}` | `w=n`, clamped to 0..2000 |
| `if-h-{n}` | `h=n`, clamped to 0..2000 |
| `if-q-{n}` | `q=n`, clamped to 1..100 |
| `if-fit` | `fit=fit` |
| `if-fill`, `if-crop` | `fit=fill` |
| `if-fit-auto` | `fit=auto` |
| `if-webp`, `if-avif`, `if-jpeg`, `if-png` | matching `f` |
| `if-auto` | omit `f` |

Rules:

- Tokens are processed in source order; the last recognized value of each option wins.
- If no width token is present but another recognized token is present, the DSL supplies `w=0`.
- Only recognized tokens are removed; unknown prefixed tokens and other words remain, joined by single spaces.
- If nothing remains in `className`, the `className` attribute is removed.
- If no recognized token is present, the element is unchanged.
- Only a string literal `src` starting with a single `/` is rewritten to the `imageForge()` result for that path and the parsed options.
- Any other `src` (relative, absolute, protocol-relative, `data:`, missing, or an expression) is left unchanged; recognized tokens are still removed.
- An element whose `className` is an expression is unchanged.
- When `src` is rewritten on an element whose name is the default import of `next/image` in the same file, the attribute `unoptimized` is added unless already present. That element then renders the Forge URL as its only `src`, without a responsive `srcset`.
- No other attribute is added, removed, or changed.

## Installation

- `npm install @replworks/nextjs-imageforge` installs the package.
- The Developer wraps the config in `next.config` with `withImageForge()`.

## Errors and non-goals

- A Forge URL request with an unset service raises an error mentioning `service`. In Application Source this fails the build or the dev compilation.
- The product does not provide an Image component.
- The product does not provide a `next/image` loader.
- The product does not read tokens from expressions, template literals, or helper calls such as `cn(...)`.
- The product does not process files under `node_modules`, `.ts` files, Markdown, or MDX.
- The product does not build absolute Source URLs.
- The product does not validate or clamp values passed directly to `imageForge()`.
- The product does not contact Image Forge itself.

## Acceptance criteria

- AC-001: With `service` set and no other settings, `imageForge("cat.jpg", { w: 480 })` returns `https://img.repl.net/{service}/cat.jpg?w=480`.
- AC-002: `imageForge("/cat.jpg")` returns the Source URL; without `basePath` it is `/cat.jpg`, and with `basePath` `/docs` it is `/docs/cat.jpg`.
- AC-003: `imageForge(null)`, `imageForge(undefined)`, and `imageForge("")` return null.
- AC-004: The query lists only present options, in the order `w`, `h`, `fit`, `q`, `f`, with values exactly as supplied.
- AC-005: With `service` unset and `w` present, `imageForge()` raises an error mentioning `service`; with `w` absent, it returns the Source URL.
- AC-006: Options override `IMAGEFORGE_BASE_URL` and `IMAGEFORGE_SERVICE`; without either, defaults apply; values in `.env` are honored.
- AC-007: `withImageForge()` preserves every existing config field, including existing `env` entries, `turbopack.rules`, and a `webpack` function.
- AC-008: In a Next.js build, the same `imageForge()` call renders the same URL in a Server Component and in a Client Component.
- AC-009: `<img src="/cat.jpg" className="rounded if-w-480 if-h-320 if-crop" />` renders `src` as the Forge URL with `w=480&h=320&fit=fill` and `class="rounded"`.
- AC-010: `<img src="/cat.jpg" className="if-w-480" />` renders with no `class` attribute.
- AC-011: Last values win, `if-crop` maps to fill, and out-of-range DSL numbers clamp to the ranges above.
- AC-012: A recognized token without a width token emits `w=0`.
- AC-013: Unknown prefixed tokens remain in `className`.
- AC-014: A relative, absolute, protocol-relative, `data:`, or expression `src` stays unchanged while recognized tokens are removed.
- AC-015: An element with no recognized token, or with an expression `className`, is unchanged.
- AC-016: A `next/image` `Image` with tokens and a rewritten `src` renders the Forge URL as `src` with no `srcset` and no `/_next/image` URL; other elements get no `unoptimized` attribute.
- AC-017: A custom component that forwards `src` and `className` to an inner `<img>` renders the Forge URL on that `<img>`.
- AC-018: The DSL produces the same output in Server Components and Client Components, in `next dev` and `next build`.
- AC-019: A custom `prefix` replaces `if-` for every token.
- AC-020: Files under `node_modules` are not transformed.
- AC-021: The first line of the README states that the package is a client for the Image Forge service.
