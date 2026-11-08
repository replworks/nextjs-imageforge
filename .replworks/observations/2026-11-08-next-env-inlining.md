# Observation: next.config `env` inlining into an installed package

Date: 2026-11-08
Code: `probes/2026-11-08-next-env-inlining/`
Next.js: 16.4.5, Node 24, App Router

## Question

Can a function in a package's config entry, called from `next.config.mjs`,
deliver settings to the same package's runtime entry through `nextConfig.env`,
for Server Components, Client Components, and dynamic server rendering?
Are `.env` files loaded before `next.config.mjs` is evaluated?

## Setup

- `probe-pkg` installed from an `npm pack` tarball (a real `node_modules` copy, not a symlink).
- `probe-pkg/config` returns `{ ...nextConfig, env: { ...nextConfig.env, IMAGEFORGE_SERVICE, IMAGEFORGE_BASE_PATH } }`.
- `probe-pkg` reads `process.env.IMAGEFORGE_SERVICE` and `process.env.IMAGEFORGE_BASE_PATH`.
- `.env` contains `IMAGEFORGE_SERVICE=from-dotenv`; `next.config.mjs` sets `basePath: "/docs"` and `env: { OTHER: "kept" }`.

## Observed

| Check | Turbopack (`next build`) | webpack (`next build --webpack`) |
| --- | --- | --- |
| `process.env.IMAGEFORGE_SERVICE` inside `next.config.mjs` | `from-dotenv` | `from-dotenv` |
| Static Server Component HTML | `service=from-dotenv\|base=/docs` | same |
| Existing `env.OTHER` preserved | `kept` | `kept` |
| Client Component browser chunk (`.next/static`) | contains `service=from-dotenv\|base=/docs` | same |
| `force-dynamic` page via `next start` with `.env` removed and the variable unset | `service=from-dotenv\|base=/docs` (value fixed at build) | not checked |

## Conclusion

- `.env` files are loaded before `next.config.mjs` runs.
- `nextConfig.env` values are inlined at build time into installed package code,
  in server output and in browser chunks, with both bundlers.
- Values are fixed at build time; changing the runtime environment after build has no effect.
