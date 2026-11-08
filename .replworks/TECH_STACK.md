# TECH_STACK

## 1. Languages / runtimes / frameworks / libraries

- Language: TypeScript with `strict` enabled.
- Runtime: Node.js `>=20.9.0` (the engine required by Next.js 16).
- Framework: Next.js, peer dependency `^16.0.0`.
- Package manager: npm.
- Module system: ESM only (`"type": "module"`).
- Runtime dependency `@babel/parser`. Reason: parsing Application Source JSX for the JSX Class DSL; Next.js exposes no public parser API.
- No other runtime dependencies.
- Development dependency `typescript`. Reason: compiler and type check.
- Development dependency `vitest`. Reason: test runner.
- Development dependency `next` `^16.0.0`. Reason: config types and fixture builds.
- Development dependencies `react` and `react-dom`. Reason: fixture builds.
- Development dependency `prettier`. Reason: code formatter.

## 2. Framework- or tool-mandated paths and file names

- `package.json` MUST exist at the repository root.
- `package-lock.json` MUST NOT be committed.
- `src/` MUST hold package source.
- `tests/` MUST hold tests; fixture Next.js projects MUST live under `tests/fixtures/`.
- `dist/` MUST hold build output and MUST NOT be committed.
- `tsconfig.json` MUST be the TypeScript config file name.
- `vitest.config.ts` MUST be the Vitest config file name.
- `.prettierrc.json` MUST be the Prettier config file name.
- `.github/workflows/` MUST hold GitHub Actions workflow files.
- `LICENSE` MUST exist at the repository root.
- The package entry `.` MUST export `imageForge`.
- The package entry `./config` MUST export `withImageForge`.

## 3. Coding conventions specific to the chosen stack

- Code MUST be formatted with Prettier using its default options.
- `withImageForge()` MUST deliver resolved settings by adding entries to `nextConfig.env`: `IMAGEFORGE_BASE_URL`, `IMAGEFORGE_SERVICE` (omitted when unset), and `IMAGEFORGE_BASE_PATH` (from `nextConfig.basePath`, empty when unset).
- The `.` entry MUST read settings only as literal `process.env.IMAGEFORGE_BASE_URL`, `process.env.IMAGEFORGE_SERVICE`, and `process.env.IMAGEFORGE_BASE_PATH` expressions, so Next.js inlines them at build time.
- The `.` entry MUST NOT import `next`, `@babel/parser`, or Node.js built-in modules.
- `next` imports in `src/` MUST be type-only.
- The JSX Class DSL MUST be one webpack-loader-compatible source transform, registered by `withImageForge()` for both bundlers (observation `2026-11-08-jsx-class-dsl`):
  - Turbopack: an entry in `turbopack.rules` for `*.{js,jsx,tsx}` with `condition: { all: [{ not: "foreign" }, { not: { path: /(^|[\\/])node_modules[\\/]/ } }] }`, the loader as an absolute path, and JSON-serializable loader options. The rule MUST NOT set `as`. `{ not: "foreign" }` alone does not exclude packages listed in `transpilePackages` (observation `2026-11-08-turbopack-foreign-transpile`).
  - When `turbopack.rules["*.{js,jsx,tsx}"]` already exists, its value (a single rule object or an array) MUST be kept, and the package rule MUST be appended to it as an array; Turbopack applies every item (observation `2026-11-08-turbopack-rule-array`).
  - webpack: a rule in the `webpack` config function with `test` for `.js`, `.jsx`, `.tsx`, `exclude: /node_modules/`, and `enforce: "pre"`. An existing `webpack` function MUST still be called.
- The loader module MUST be CommonJS (`.cjs`). It MAY load the package's ESM modules with dynamic `import()`.
- The loader MUST parse with `@babel/parser` using the `jsx` plugin, plus `typescript` for `.tsx`, and MUST rewrite the source by splicing attribute ranges, leaving all other source text unchanged.
- The loader MUST return the source unchanged without parsing when it does not contain the configured prefix.

## 4. Testing rules

- Tests MUST use Vitest.
- Test files MUST be named `*.test.ts`.
- Fixture tests MUST build a fixture project with the `next build` CLI and assert on the generated HTML and browser chunks.
- Fixture tests MUST cover both the default bundler (Turbopack) and `next build --webpack`.
- Unit tests of the JSX transform MUST run the transform on source strings directly.
- Code coverage MUST NOT be measured or required.

## 5. Configuration rules

- `withImageForge()` option names MUST be `baseUrl`, `service`, `prefix`.
- Environment variable names MUST be `IMAGEFORGE_BASE_URL`, `IMAGEFORGE_SERVICE`.
- Environment variables MUST be read only in the settings definition module, from `process.env` inside `withImageForge()`. Next.js loads `.env` files before evaluating `next.config` (observation `2026-11-08-next-env-inlining`).
- The package MUST NOT define, read, or store secrets.

## 6. Deployment rules

- Distribution target MUST be npm.
- Package name MUST be `@replworks/nextjs-imageforge`, published with public access.
- Releases MUST be GitHub releases with semver tags in the format `vMAJOR.MINOR.PATCH`, for example `v1.0.0`.
- Publishing MUST run in GitHub Actions when a GitHub release is published, with npm provenance.
- CI MUST be GitHub Actions.
- The CI matrix MUST be Node `22` and `24`, each with the latest Next.js `16.x`.
- CI MUST install dependencies with `npm install`.
- CI MUST run the verification commands below.
- License MUST be MIT.

Verification commands:

```text
npm run format:check
npm run typecheck
npm run build
npm test
```

## 7. Security rules tied to the chosen stack

- None stated.

## 8. Non-goals

- Linters and static analysis tools beyond the TypeScript type check, including ESLint, MUST NOT be used.
- Code coverage measurement MUST NOT be used.
- Bundlers for the package build MUST NOT be used; `tsc` emits `dist/`.
