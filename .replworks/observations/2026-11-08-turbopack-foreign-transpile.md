# Observation: Turbopack `foreign` condition and `transpilePackages`

Date: 2026-11-08
Code: `probes/2026-11-08-turbopack-foreign-transpile/`
Next.js: 16.4.5, Node 24, App Router

## Question

Does the documented Turbopack rule condition `{ not: "foreign" }` keep the loader
off files under `node_modules` (AC-020) in every case?

## Setup

- T-007 fixture app (`tests/fixtures/next-app`), `basePath: "/docs"`, `.env` service.
- `fixture-dep` installed from an `npm pack` tarball (real copy under `node_modules`),
  exporting `<img id="dep" src="/cat.png" className="rounded if-w-99" />` written in JSX.
- A dependency with JSX needs `transpilePackages: ["fixture-dep"]`; without it
  both bundlers fail to compile the file (Turbopack: `Expected ';', got 'ident'`;
  webpack: `You may need an additional loader`).

## Observed

| Rule | Turbopack build | Turbopack dev | webpack build (`exclude: /node_modules/`) |
| --- | --- | --- | --- |
| `condition: { not: "foreign" }` (documented) | dep rewritten: `src=".../fixture-svc/docs/cat.png?w=99" class="rounded"` | dep rewritten (same) | dep unchanged |
| `condition: { all: [{ not: "foreign" }, { not: { path: /(^\|[\\/])node_modules[\\/]/ } }] }` | dep unchanged: `src="/cat.png" class="rounded if-w-99"` | dep unchanged | dep unchanged |

- A path regex requiring a separator before `node_modules` (`/[\\/]node_modules[\\/]/`)
  did not match: Turbopack matches `path` against the project-relative path
  (`node_modules/fixture-dep/index.js`).
- With the path condition, every other fixture assertion still passed in both bundlers and in dev.

## Conclusion

- Turbopack does not treat packages listed in `transpilePackages` as `foreign`, so
  `{ not: "foreign" }` alone transforms them, violating AC-020.
- Adding `{ not: { path: /(^|[\\/])node_modules[\\/]/ } }` excludes them with Turbopack.
