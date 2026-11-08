@replworks/nextjs-imageforge is a client for the Image Forge service

# Next.js Imageforge

[![CI](https://github.com/replworks/nextjs-imageforge/actions/workflows/ci.yml/badge.svg)](https://github.com/replworks/nextjs-imageforge/actions/workflows/ci.yml)
[![Publish package](https://github.com/replworks/nextjs-imageforge/actions/workflows/publish.yml/badge.svg)](https://github.com/replworks/nextjs-imageforge/actions/workflows/publish.yml)
[![npm version](https://img.shields.io/npm/v/%40replworks%2Fnextjs-imageforge?logo=npm)](https://www.npmjs.com/package/@replworks/nextjs-imageforge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Generates Image Forge URLs from Next.js `public/` image paths, through `className` tokens on JSX elements or the `imageForge()` function.

## Install

```bash
npm install @replworks/nextjs-imageforge
```

## Configure

```js
// next.config.mjs
import { withImageForge } from "@replworks/nextjs-imageforge/config";

export default withImageForge(
  { basePath: "/docs" },
  { baseUrl: "https://img.repl.net", service: "my-service" },
);
```

| Option    | Default                | Environment variable  |
| --------- | ---------------------- | --------------------- |
| `baseUrl` | `https://img.repl.net` | `IMAGEFORGE_BASE_URL` |
| `service` | none                   | `IMAGEFORGE_SERVICE`  |
| `prefix`  | `if-`                  | none                  |

Options take precedence over environment variables, which are also read from `.env` files. Settings apply after restarting `next dev` or rebuilding.

## className tokens

```jsx
<img src="/cat.jpg" className="rounded if-w-480 if-h-320 if-crop" />
// src="https://img.repl.net/my-service/docs/cat.jpg?w=480&h=320&fit=fill" class="rounded"
```

| Token                                     | Result                    |
| ----------------------------------------- | ------------------------- |
| `if-w-{n}`                                | `w=n`, clamped to 0..2000 |
| `if-h-{n}`                                | `h=n`, clamped to 0..2000 |
| `if-q-{n}`                                | `q=n`, clamped to 1..100  |
| `if-fit`                                  | `fit=fit`                 |
| `if-fill`, `if-crop`                      | `fit=fill`                |
| `if-fit-auto`                             | `fit=auto`                |
| `if-webp`, `if-avif`, `if-jpeg`, `if-png` | matching `f`              |
| `if-auto`                                 | omit `f`                  |

Tokens work on any JSX element with a literal `className`, including `next/image` `Image` (which also gets `unoptimized`) and components that pass `src` and `className` to an `<img>`. Only a literal `src` starting with a single `/` is rewritten.

## imageForge()

```tsx
import { imageForge } from "@replworks/nextjs-imageforge";

<img src={imageForge(path, { w: 480, f: "webp" })} />;
```

`imageForge()` returns the Source URL when `w` is absent, a Forge URL when `w` is present, and `null` for an empty path. Option values are passed through unchanged.

## License

MIT
