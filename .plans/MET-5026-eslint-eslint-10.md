# ASMO-XXXX – Step 1/4: Update ESLint 8 → 10 (flat config)

> Roadmap: 1. ESLint 10 → 2. Vitest 5 → 3. Vite → tsdown → 4. ESM + migrate-mongo 14 + mongodb driver.
> Each step is its own branch/PR and must leave `yarn lint`, `yarn test`, `yarn build` green.

## Rationale

ESLint 8 has been EOL since Oct 2024, and ESLint 9 has been EOL since 2026-08-06. ESLint 10 removes the legacy
`.eslintrc` format completely, so we have to move to flat config (`eslint.config.mjs`). The current
plugins also have to change: `@typescript-eslint/*` v7 does not support ESLint 9/10, and
`eslint-plugin-import` (latest 2.32.0) only supports `eslint` up to `^9`. This step only changes lint
tooling. It does not touch runtime code, apart from fixes the new rules may require.

## Acceptance criteria

- [x] `eslint` is updated to `^10` and `@eslint/js` `^10` is added.
- [x] `.eslintrc.cjs`, `.eslintsag.cjs` and `.eslintignore` are replaced by a single `eslint.config.ts`
      (loaded via `jiti`, same setup as the other `sag-js` projects).
- [x] `@rushstack/eslint-patch`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` and
      `eslint-plugin-import` are removed. `typescript-eslint` (v8, unified package) and
      `eslint-plugin-import-x` are added instead.
- [x] `eslint-config-prettier` is updated to `^10` and used via `eslint-config-prettier/flat` (`skipFormatting`).
      `eslint-plugin-prettier` is removed; formatting is left to prettier itself (format on save / `yarn format`).
- [x] All current SAG rules are still active, with the same severity (see Technical details).
- [x] `dist/`, `.temp/` and `.yarn/` are ignored. `migrations/` is linted as CommonJS.
- [x] `yarn lint` passes in CI. New findings from changed `recommended` sets are fixed or explicitly
      turned off with a short justification.
- [x] VS Code "fix all on save" still works with the flat config (ESLint extension v3+).

## Technical details

### Packages

| remove | add / update |
| --- | --- |
| `eslint@8` | `eslint@^10`, `@eslint/js@^10` |
| `@rushstack/eslint-patch` | – (not needed with flat config) |
| `@typescript-eslint/eslint-plugin@7`, `@typescript-eslint/parser@7` | `typescript-eslint@^8` (peer `eslint ^8.57 \|\| ^9 \|\| ^10`, `typescript >=4.8.4 <6.1`) |
| `eslint-plugin-import@2` | `eslint-plugin-import-x@^4` (peer includes `^10`) |
| `eslint-config-prettier@8`, `eslint-plugin-prettier` | `eslint-config-prettier@^10` |
| – | `globals` (for `globals.node`) |
| – | `jiti@^2` (loads `eslint.config.ts`) |

### `eslint.config.ts` (outline)

Use `defineConfig` and `globalIgnores` from `eslint/config`, with named blocks like the other `sag-js` projects:

1. `globalIgnores(["dist/", ".temp/", ".yarn/"])` replaces `.eslintignore`.
2. `app/typescript` (`**/*.{ts,mts}`): extends `js.configs.recommended` and `tseslint.configs.recommended`,
   sets `globals.node`. Rules: `@typescript-eslint/consistent-type-imports: error`,
   `@typescript-eslint/explicit-member-accessibility: error`. The old `no-console: off` /
   `no-debugger: off` overrides are dropped: `no-console` is not in recommended anyway, and
   `no-debugger` should catch leftover `debugger` statements.
3. `app/imports` (`**/*.{ts,mts,js,mjs}`): registers `import-x`, so the import rules already cover the
   CommonJS migrations and are fully effective once they move to ESM. Rules `import-x/first`,
   `import-x/newline-after-import`, `import-x/no-duplicates`, `import-x/no-self-import`: `error`.
4. `app/migrate-mongo` (`migrate-mongo-config.js`, `migrations/**/*.js`): `js.configs.recommended` as
   CommonJS with `globals.node`. `no-unused-vars` uses `args: "none"`, because migrate-mongo fixes the
   `up(db, client)` / `down(db, client)` signature and most scripts don't use `client`.
5. `eslint-config-prettier/flat` comes last and turns off rules that conflict with prettier.

### Things to watch

- ESLint 10 looks up the config **from the directory of each linted file**, not from the cwd. With a
  single root config that makes no difference here.
- `/* eslint-env */` comments now cause **errors**. The only one is in `.eslintsag.cjs`, which is deleted.
- Node requirement: `^20.19 || ^22.13 || >=24`. Volta pins 24.22.1, so CI is fine.
- typescript-eslint v8 changed `recommended` (for example `no-unused-vars` options,
  `no-unused-expressions`, `no-require-imports`). Expect a few new findings in `src/`.
- The `lint` script can stay `eslint ./src`. Optionally lint `.` so the config files are covered too.
- Out of scope: the TypeScript version bump. `tsconfig.json` already contains
  `"ignoreDeprecations": "6.0"`, but TS 5.4.5 is installed. Decide on the TS version in its own small task.
