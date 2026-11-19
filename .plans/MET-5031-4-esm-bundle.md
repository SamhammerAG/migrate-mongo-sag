# MET-5031 – Step 4/4: Switch the CLI bundle to ESM

> Roadmap: 1. ESLint 10 → 2. Vitest 5 → 3. Vite → tsdown → 4. ESM bundle. The update to migrate-mongo 14
> and a newer mongodb driver is not part of this plan and gets its own plan.

## Rationale

The source is already written as ESM, but tsdown still emits CommonJS. Emitting ESM removes the
CommonJS interop layer, silences tsdown's "use ESM" warning, and prepares the update to ESM-only
dependencies. Consumers must not notice the switch: they keep calling the `migrate-mongo` bin, and their
CommonJS `migrate-mongo-config.js` and migrations keep working unchanged.

## Acceptance criteria

- [ ] **Prerequisite:** a `@samhammer/vault-client-sag` release is available whose named exports
      (`getVault`) can be imported from Node ESM, and this package depends on it.
- [ ] `lodash` and `@types/lodash` are replaced by `lodash-es` (in `dependencies`) and `@types/lodash-es`.
      `src/env.ts` keeps named imports (`clone`, `invert`, `pickBy`).
- [ ] `tsdown.config.mts` emits `format: "esm"` with the output file `dist/migrate-mongo.mjs`.
      `outputOptions.strict` is removed (ESM is always strict).
- [ ] `bin.migrate-mongo` and the `migrate-mongo` script point to `dist/migrate-mongo.mjs`.
- [ ] `package.json` stays **without** `"type": "module"`. The local `migrate-mongo-config.js` and
      `migrations/**/*.js` stay CommonJS and are not changed.
- [ ] `dist/` contains only `migrate-mongo.mjs`, its first line is the shebang, and all `dependencies`,
      `peerDependencies` and Node builtins stay external (`import` list compared with the previous
      `require` list, with `lodash` replaced by `lodash-es`).
- [ ] The built CLI starts under Node 24 without "Named export … not found" errors (`--help`).
- [ ] Smoke test against a local test DB with the CommonJS sample config and migrations: `status`,
      `create`, `up`, `down`.
- [ ] `yarn lint`, `yarn typecheck`, `yarn test` and `yarn build` pass, and `yarn npm publish --dry-run`
      shows `LICENSE`, `README.md`, `dist/migrate-mongo.mjs` and `package.json`.
- [ ] The release notes mention that the bin file is now `dist/migrate-mongo.mjs` (only relevant for
      anyone who calls the file path directly instead of the `migrate-mongo` bin).

## Technical details

- **Why `.mjs` instead of `"type": "module"`:** Node decides the module format per file. `.mjs` is always
  ESM, while `.js` follows the nearest `package.json`. With `"type": "module"`, every `.js` file in this
  repo would become ESM, including the CommonJS sample config and migrations used for local testing.
  `.mjs` limits the switch to the bundle. Consumers are not affected either way, because their files
  follow their own `package.json`.
- **Consumer files:** migrate-mongo loads the consumer's config and migrations itself
  (`lib/env/config.js`, `lib/env/migrationsDir.js`) with `require()`, and falls back to `import()` on
  `ERR_REQUIRE_ESM`. The format of our bundle does not change this. Migrations copied to `<cwd>/.temp`
  (`src/migrations.ts`) keep the consumer's `package.json` as the nearest one, so their format stays the same.
- **Named imports from CommonJS:** in real Node ESM, `import { x } from "cjs-package"` only works if
  Node's CommonJS export detection finds `x`. Vitest does **not** catch this, because Vite bridges
  CommonJS and ESM imports on its own, so the check must run against the built CLI. A check on Node 24
  with the current dependencies found:
  - ok: `dotenv`, `dotenv-expand`, `migrate-mongo` (11), `commander`, `@elastic/elasticsearch`,
    `date-fns`, `winston`.
  - fails: `lodash` (`clone`, `invert`, `pickBy`) and `@samhammer/vault-client-sag` (`getVault`).
- **lodash → lodash-es:** `lodash-es` is real ESM with the same API and release line as `lodash`.
  migrate-mongo 14 no longer depends on lodash. If `vault-client-sag` also switches to `lodash-es` in its
  ESM change, only `lodash-es` remains in the dependency tree.
- **vault-client-sag:** must be changed first in its own repository (real ESM output, or CommonJS with
  exports that Node can detect), then released and updated here.
- **tsdown:** `outExtensions: () => ({ js: ".mjs" })` keeps the extension explicit and independent of
  `"type"`. `src/` uses no `require`, `__dirname` or `module.exports`, so no shims are needed.
  `package.json` stays inlined via the JSON import.
- `default` imports of CommonJS modules (`@elastic/ecs-winston-format`, `winston`, `fs`, `readline`,
  `path`) work in Node ESM, because they map to `module.exports`. Checked for `@elastic/ecs-winston-format`
  and `winston`: neither sets `__esModule`, so the ESM default is the same object the current CommonJS
  bundle uses.
