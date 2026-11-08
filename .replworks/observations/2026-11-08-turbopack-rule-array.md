# Observation: Turbopack applies every rule item under one glob key

Date: 2026-11-08
Code: `probes/2026-11-08-turbopack-rule-array/`
Next.js: 16.4.5, Node 24, App Router

## Question

When `turbopack.rules["*.{js,jsx,tsx}"]` already holds a Developer rule, does Turbopack
apply both the Developer's rule and the package's rule if the key holds an array of both?

## Setup

- T-007 fixture app (`tests/fixtures/next-app`) with `fixture-dep` in `transpilePackages`,
  package installed from an `npm pack` tarball.
- Developer loader `dev-loader.cjs` replaces the text `__DEV_MARKER__` with `dev-rule-ran`.
- Page `app/marker/page.tsx`: `<p id="marker">__DEV_MARKER__</p>` and
  `<img id="m" src="/cat.png" className="rounded if-w-480" />`.
- Package rule: `{ condition: { all: [{ not: "foreign" }, { not: { path: /(^|[\\/])node_modules[\\/]/ } }] }, loaders: [<loader>] }`.
- `PROBE_MODE` selects the value of the key:
  - `none`: package rule only;
  - `array`: `[developerRuleItem, packageRuleItem]`;
  - `array-rev`: `[packageRuleItem, developerRuleItem]`;
  - `shorthand`: `[{ loader: devLoader }, packageRuleItem]` (loader item + rule item).

## Observed

| Mode | `next build` (Turbopack) | `next dev` (Turbopack) |
| --- | --- | --- |
| `none` | marker `__DEV_MARKER__`; `m` is Forge URL `?w=480`, `class="rounded"` | not run |
| `array` | marker `dev-rule-ran`; `m` Forge URL, `class="rounded"` | same |
| `array-rev` | marker `dev-rule-ran`; `m` Forge URL, `class="rounded"` | not run |
| `shorthand` | marker `dev-rule-ran`; `m` Forge URL, `class="rounded"` | same |

In every mode the `node_modules` dependency stayed unchanged (`src="/cat.png" class="rounded if-w-99"`).

## Conclusion

- Turbopack applies every matching item of an array under one glob key, in both build and dev,
  whether the Developer's items are rule objects or loader items.
- The package can keep an existing value for `*.{js,jsx,tsx}` by turning it into an array
  and appending its own rule item.
