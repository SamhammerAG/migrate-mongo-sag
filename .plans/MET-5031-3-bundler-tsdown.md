# MET-5031 – Step 3/4: Replace Vite build with tsdown (or tsup)

> Roadmap: 1. ESLint 10 → 2. Vitest 5 → 3. Vite → tsdown → 4. ESM + migrate-mongo 14 + mongodb driver.

## Rationale

This package is a Node CLI, not a web library. Vite's library mode needs manual workarounds for that:
a hand-written list of node builtins and dependencies as `external`, `target: node18`, and a lib `name`
that is meaningless for CJS. A library bundler for Node handles all of this by default.

**Bundler choice:** tsup's own README says *"This project is not actively maintained anymore. Please
consider using tsdown instead."* (tsup 9.0.0 was still published in 2026-10, but only as maintenance.)
tsdown is the official successor. It is built on Rolldown, has a tsup-compatible config shape and an
official migration guide. **Recommendation: tsdown.** If we prefer a 1.x tool, tsup 9 also works,
and the config below maps almost 1:1. Both need Node `^22.18 || ^24.11`, which Volta 24.22.1 meets.

## Acceptance criteria

- [x] `vite.config.mts` is removed, and `vite` is removed from devDependencies (unless Vitest needs it pinned).
      Done: `vite.config.mts` is removed. `vite` stays a devDependency, because Vitest 5 declares
      `vite` as a **non-optional peer dependency** and does not ship it itself. It is now only Vitest's
      engine, so it is updated from `^6.4.3` to `^8.3.6` (newest version past the 14-day age gate).
- [x] `tsdown.config.ts` is added, and `build` is changed to `tsdown`. Done as `tsdown.config.mts`:
      with a `.ts` file and no `"type": "module"`, Node prints `MODULE_TYPELESS_PACKAGE_JSON` on every
      build. `.mts` matches `vitest.config.mts`. It can become `.ts` in step 4.
- [x] Output keeps the **same format (CJS)** and the **same path** `dist/migrate-mongo.js`, so `bin`
      and consumers do not change in this step (the ESM switch is step 4).
- [x] `package.json` stays **without** `"type": "module"` in this step. Otherwise Node treats the CJS
      output `dist/migrate-mongo.js`, `migrate-mongo-config.js` and `migrations/**/*.js` as ESM.
- [x] tsdown is pinned to a minor range (e.g. `~0.23.x`), because it is still 0.x and minor releases may
      contain breaking changes. Done: `~0.23.5` (0.23.7 is still blocked by the 14-day age gate).
- [x] The build still produces a **single file**: `dist/` contains only `migrate-mongo.js` (no extra
      chunks, `.d.ts` or source maps). If chunks ever appear (for example after adding a dynamic
      `import()`), disable code splitting or inline dynamic imports.
- [x] The shebang `#!/usr/bin/env node` is preserved in the output. tsdown keeps the source hashbang
      as the first line (`#! /usr/bin/env node`, with the space from `src/index.ts`, as before), so no banner is needed.
- [x] All `dependencies` and Node builtins stay external. `package.json` is inlined as before
      (name/version are read at runtime). The `require(...)` list of the old Vite and new tsdown output is identical.
- [x] No `.d.ts` is emitted (it is a CLI and there is no `types` entry).
- [ ] `yarn migrate-mongo` (build + run) works locally. Smoke test: `--help`, `status`, `create`,
      `up` against a local test DB. Partly done: `--help` and `--version` work, and `yarn migrate-mongo up`
      was verified manually against a local DB (with the ESM build from step 4). `status` and `create` are still open.
- [x] The CI build passes, and `yarn npm publish --dry-run` shows the same file set as before.
      `yarn npm publish --dry-run` shows the same 4 files (LICENSE, README.md, dist/migrate-mongo.js,
      package.json). The CI steps (lint, typecheck, test, build) pass locally.

## Technical details

- Config outline: `entry: { "migrate-mongo": "src/index.ts" }`, `format: "cjs"`, `platform: "node"`,
  `target: "node24"` (matches Volta/README; currently `node18`), `dts: false`, `clean: true`.
- **Output extension:** tsdown defaults to `fixedExtension: true` for `platform: "node"`, so the
  output would be `dist/migrate-mongo.cjs` and the `bin` path would break. Either set
  `fixedExtension: false` (the extension then follows the package type, so `.js` without
  `"type": "module"`), or set `outExtensions: () => ({ js: ".js" })` explicitly. The explicit option is
  preferred, because it does not change silently when `"type"` changes in step 4.
- **Shebang:** the tsdown docs do not mention hashbang handling. Check that the first line of the
  output is `#!/usr/bin/env node`. If it is missing, add it via `outputOptions.banner`.
  The executable bit does not matter: npm/yarn set it on install for `bin` entries.
- `.yarnrc.yml` has `npmMinimalAgeGate: 14d`. Very fresh tsdown/rolldown versions may not be
  installable yet, so pick a version that is at least 14 days old.
- tsdown (like tsup) externalizes `dependencies` and `peerDependencies` from `package.json`
  automatically. The custom `builtinModules` / `dependencies` external logic can be dropped.
- Compare the old and new `dist/migrate-mongo.js` (size, `require(...)` list) to make sure nothing is
  suddenly bundled or left unresolved.
- `tsconfig.json`: `declaration: true` can be removed, because nothing consumes it. Keep `resolveJsonModule`.
  (Already gone: `tsconfig.json` has `noEmit: true` and no `declaration`.)
- **Implementation notes:** the output is no longer minified (13.8 kB instead of 7.8 kB), which gives
  readable stack traces. `outputOptions.strict: true` keeps the `"use strict"` directive that the Vite
  output had; Rolldown's default `"auto"` would drop it. tsdown prints an informational warning that
  recommends ESM; that goes away in step 4.
