# TASKS

Execution checklist in dependency order (AGENTS.md).
AC- IDs refer to PRODUCT_SPEC.md. C- IDs and section numbers refer to ARCHITECTURE.md.
"Unit tests passing" means the unit tests written for that task pass.

- [x] T-001 Project foundation
  - Satisfies: TECH_STACK.md
  - External boundary: no
  - Acceptance criteria:
    - Every constraint in TECH_STACK.md is satisfied.
    - Every verification command defined in TECH_STACK.md passes.
    - The package exposes the `.` and `./config` entries; `withImageForge()` can wrap a Next.js config without error.
    - CI runs on the Node matrix defined in TECH_STACK.md.

- [x] T-002 Developer configures the product through `withImageForge()` options and environment variables
  - Satisfies: PRODUCT_SPEC.md Inputs and configuration
  - External boundary: no
  - Acceptance criteria:
    - AC-006 and AC-007 pass.
    - Without options or environment variables, `baseUrl` is `https://img.repl.net`, `service` is unset, and `prefix` is `if-`.
    - Environment values are read only by C5 (ARCHITECTURE.md Section 6).
    - Unit tests passing.

- [x] T-003 Developer obtains a Source URL, or null, from `imageForge()`
  - Satisfies: PRODUCT_SPEC.md Explicit API behavior
  - External boundary: no
  - Acceptance criteria:
    - AC-002 passes for no `basePath` and for `basePath` `/docs`.
    - AC-003 passes.
    - Absolute, protocol-relative, and `data:` URLs are returned unchanged.
    - With `w` absent, `h`, `fit`, `q`, and `f` supplied together still return the Source URL.
    - Unit tests passing.

- [x] T-004 Developer obtains a Forge URL from `imageForge()`
  - Satisfies: PRODUCT_SPEC.md Explicit API behavior; Errors and non-goals
  - External boundary: no
  - Acceptance criteria:
    - AC-001, AC-004, and AC-005 pass.
    - The Forge URL path includes `basePath`.
    - An option value containing URL-reserved characters appears in the query exactly as supplied.
    - Unit tests passing.

- [x] T-005 DSL Parser maps tokens to options
  - Satisfies: PRODUCT_SPEC.md JSX Class DSL (token table and rules)
  - External boundary: no
  - Acceptance criteria:
    - Every token in the table maps to its documented result.
    - AC-011, AC-012, AC-013, and AC-019 pass at the parser level.
    - The parser returns `options` and `consumed` and has no syntax-tree dependency (ARCHITECTURE.md Section 5).
    - Unit tests passing.

- [x] T-006 JSX Transformer rewrites eligible elements in a source file
  - Satisfies: PRODUCT_SPEC.md JSX Class DSL; Errors and non-goals
  - External boundary: no
  - Acceptance criteria:
    - AC-009, AC-010, AC-014, and AC-015 pass on source strings.
    - The `unoptimized` rule of AC-016 passes on source strings, including a renamed default import of `next/image` and a non-`next/image` element named `Image`.
    - Source text outside the rewritten attribute ranges is unchanged (ARCHITECTURE.md Section 4).
    - Source without the configured prefix is returned unchanged without parsing.
    - An unset service with an eligible `src` raises the service error.
    - Unit tests passing.

- [x] T-007 Developer sizes images through `className` in a Next.js app
  - Satisfies: PRODUCT_SPEC.md JSX Class DSL; Explicit API behavior; AC-008
  - External boundary: no
  - Acceptance criteria:
    - `withImageForge()` registers the transform for both bundlers as defined in TECH_STACK.md Section 3, keeping existing `turbopack.rules` and `webpack` functions.
    - In a fixture Next.js 16 build with `basePath` and a `.env` file, with Turbopack and with `--webpack`: AC-008, AC-009, AC-016, AC-017, AC-018 (`next build`), and AC-020 pass.
    - AC-018 passes for `next dev` with Turbopack.
    - Unit tests passing.

- [x] T-008 README first-line slot states the package is a client for the Image Forge service
  - Satisfies: PRODUCT_SPEC.md AC-021
  - External boundary: no
  - Acceptance criteria:
    - AC-021 passes.
    - The wording beyond what AC-021 checks is not part of this task (human-owned, AGENTS.md HUMAN_OWNED_CHANGES).
