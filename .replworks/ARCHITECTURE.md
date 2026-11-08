# ARCHITECTURE: @replworks/nextjs-imageforge

## 1. Purpose

The product has one explicit URL API and one source convenience layer. Registration resolves settings once, hands them to the host's build for the URL API, and attaches the convenience layer, which rewrites JSX elements while the host compiles application source and delegates URL work to the same URL API.

## 2. Components

| ID | Component | Responsibility |
| --- | --- | --- |
| C1 | URL API | Accepts an Image Path and direct options; returns a Source URL, a Forge URL, or null. |
| C2 | Source URL Resolver | Builds the root-relative Source URL from the Image Path and the host's base path. |
| C3 | Forge URL Composer | Builds the Forge URL and query string from a Source URL and direct options. |
| C4 | Settings Access | Supplies the settings embedded by the host's build to C1, on the server and in the browser. |
| C5 | Settings Definition | Defines settings, defaults, option-over-environment precedence, and environment mapping. |
| C6 | Registration | Takes the host config and options, resolves settings through C5, extends the host config so the host's build embeds the settings for C4, and attaches C8 to the host's source compilation with the same settings. |
| C7 | DSL Parser | Maps tokens to DSL options and consumed tokens. It clamps only DSL values. |
| C8 | JSX Transformer | Finds eligible JSX elements in one application source file, applies C7, and rewrites `src`, `className`, and, for the host's image component, the unoptimized marker, through C1. |

External capabilities are supplied by the host: the base path setting, environment loading, build-time embedding of config values, source compilation with transform hooks, and HTML output. The product never contacts Image Forge.

## 3. Data flow

### Registration flow

`host config + options -> C6 -> C5 -> extended host config -> host build embeds settings and runs C8`

C6 runs once when the host loads its config. It keeps every existing config field, including existing transform hooks, and only adds the settings entries and the C8 hooks.

### Direct flow

`Developer -> C1 -> C4, C2, C3 -> URL or null`

C1 returns null for an empty path and passes absolute URLs through. Otherwise it obtains the Source URL from C2, returns it unchanged when w is absent, and otherwise delegates to C3. The flow is the same on the server and in the browser.

### DSL flow

`application source file -> host compilation -> C8 -> C7 -> C1 -> rewritten source -> host compilation continues`

For each application source file, C8 visits JSX opening elements, takes tokens from a literal `className`, and asks C7 for options. When C7 reports at least one recognized token, C8 removes the consumed tokens and, for an eligible `src`, replaces it with the C1 result computed with the settings from C6. The DSL supplies `w=0` when a recognized token exists without a width token.

## 4. Transformer boundaries

- C8 handles one file at a time and only JSX opening elements; the element name does not affect eligibility.
- Tokens come only from a literal string `className`. An expression `className` leaves the element untouched.
- Only a literal `src` starting with a single `/` is eligible for rewriting. Any other `src` is kept as is.
- Consumed tokens are removed from `className`; a `className` left empty is removed.
- The unoptimized marker is added only to an element bound, in the same file, to the default import of the host's image component, and only when its `src` was rewritten.
- C8 changes only the attribute ranges it rewrites; all other source text is kept byte for byte.
- C8 never evaluates code, follows imports, or inspects files outside the one it is given.

## 5. DSL parser ownership

C7 owns all token-to-option decisions:

- width and height clamp to 0..2000;
- quality clamps to 1..100;
- format and fit aliases map to their documented values;
- repeated values use the last token in source order;
- only tokens with the configured prefix and a recognized form are consumed.

C7 returns `options` and `consumed`. It performs no URL work and does not depend on the source syntax tree.

## 6. Settings ownership

- C5 is the only component that reads the Developer's environment values.
- C6 resolves settings once per host config load and hands the same values to the host's build for C4 and to C8.
- C4 reads only the settings that the host's build embedded from C6; it never reads the Developer's environment values. When nothing was embedded, C4 supplies the C5 defaults.
- C1, C2, and C3 receive settings from C4 or from C8 and do not read environment values or host configuration themselves.

## 7. Invariants

- Direct URL API options are never clamped or otherwise modified.
- DSL clamping does not change direct URL API behavior.
- C8 never duplicates Source URL resolution or Forge URL composition; it always calls C1.
- An element with no recognized token is left unchanged.
- A recognized token is removed exactly once; an unrecognized prefixed token remains.
- C6 never removes or changes an existing host config field.
- The same path and options produce the same URL on the server, in the browser, and through the DSL.
- No state is shared between files or between calls.

## 8. Failure boundaries

- An unset service raises the service configuration error when a Forge URL is needed, in either flow.
- An ineligible `src` or an expression attribute is a no-op, not an error.
- Option values the Image Forge service treats specially produce no error in the product.

## 9. Non-goals

- No Image component, no image loader, and no change to the host's image pipeline beyond the unoptimized marker.
- No reading of expressions, helper calls, or other files.
- No Markdown or MDX processing.
- No absolute Source URLs.
- No network calls, URL validation, caching, or custom option presets.
