# Observation: build-time JSX class DSL via a loader registered from next.config

Date: 2026-11-08
Code: `probes/2026-11-08-jsx-class-dsl/`
Next.js: 16.4.5, Node 24, App Router, `@babel/parser` 7.x

## Question

Can a package, registered only through a `next.config` wrapper, rewrite literal
`src` / `className` JSX attributes in the application's own `.tsx` files at build
time, for any component, with Turbopack and webpack, in Server and Client Components?

## Setup

- `probe-dsl` installed from an `npm pack` tarball.
- `withProbe()` adds:
  - Turbopack: `turbopack.rules["*.{jsx,tsx}"] = { condition: { not: "foreign" }, loaders: [{ loader: <absolute path>, options: <JSON> }] }`.
  - webpack: a rule `{ test: /\.[jt]sx$/, exclude: /node_modules/, enforce: "pre", use: [loader] }`.
- The loader parses the source with `@babel/parser` (`jsx`, `typescript`), finds JSX opening
  elements whose `className` is a string literal containing `if-` tokens, removes those
  tokens, rewrites a literal `src` starting with a single `/`, and, only when the element
  name is the local default import from `next/image`, inserts `unoptimized`.
- App: `basePath: "/docs"`; `<img>`, `<Image>` (next/image), a custom `<Avatar src className>`
  in a Server Component, and `<img>` / `<Image>` in a `"use client"` page.

## Observed

| Check | Turbopack build | webpack build (`--webpack`) | `next dev` (Turbopack) |
| --- | --- | --- | --- |
| Loader receives raw TSX of app files (not `node_modules`) | yes | yes | yes |
| `<img className="rounded if-w-480">` | `src=".../svc/docs/cat.png?w=480" class="rounded"` | same | same |
| `<Image className="if-w-480 if-webp">` | `src` is Forge URL `?w=480&f=webp`, no `srcset`, no `/_next/image`, no `class` | same | same |
| Custom `<Avatar className="if-w-64">` | inner `<img>` gets Forge URL, `class` removed | same | same |
| Element without tokens | unchanged | unchanged | unchanged |
| Client Component | prerendered HTML and browser chunk contain the Forge URL | same | same |
| `className={expr}` inside `Avatar.tsx` | untouched | untouched | untouched |

Failure seen: with `as: "*.tsx"` in the Turbopack rule, the build failed with
`Can't resolve './page.tsx.tsx'`. Omitting `as` works.

## Conclusion

- A `next.config` wrapper can register a source transform for app JSX with both bundlers and in dev.
- The transform is component-agnostic: it acts on literal attributes only, so any component
  that forwards `src` and `className` works.
- For `next/image`, adding `unoptimized` makes the Forge URL the final `src` with no
  `remotePatterns` needed; responsive `srcset` is lost.
- A JSX parser is required; `@babel/parser` was used as a runtime dependency of the package.
