# MET-5031 – Step 2/4: Update Vitest 4 → 5 and decouple it from the Vite build config

> Roadmap: 1. ESLint 10 → 2. Vitest 5 → 3. Vite → tsdown → 4. ESM + migrate-mongo 14 + mongodb driver.

## Rationale

`vitest.config.mts` currently merges `vite.config.mts`, which is the library *build* config. Step 3
removes Vite as the bundler, so the test config has to stand on its own first. Doing this together
with the Vitest major update keeps the bundler swap in step 3 a pure build change.

## Acceptance criteria

- [x] `vitest` is updated to `^5` (latest 5.1.0; peer `vite ^6.4 || ^7 || ^8`; Node `^22.12 || ^24 || >=26`).
      Done: `^5.1.0` (resolves to 5.1.0; 5.1.1 is still blocked by the 14-day age gate).
- [x] `vitest.config.mts` no longer imports `vite.config.mts`. It only contains test options
      (`unstubEnvs`, `unstubGlobals`, `globals`).
- [x] All existing specs (`env`, `logger`, `elasticClient`) pass unchanged, or with minimal API
      adjustments documented in the PR. Done: 16/16 tests pass, no spec changes needed.
- [x] `yarn build` output is unchanged (Vite still builds in this step). Checked with `diff -r` against
      the build from before the update.

## Technical details

- Read the Vitest 5 migration guide before bumping. The suite only uses `describe/it/expect/vi`,
  `beforeEach/afterEach` and env stubbing, so the impact should be small. Check in particular any
  changes to `vi.stubEnv` / `unstubEnvs` behaviour, because `env.spec.ts` depends on it.
- Vitest brings its own Vite as a dependency. After step 3, `vite` should no longer be a direct
  devDependency unless something still needs it explicitly.
- `globals: true` is used. Keep it, or switch the specs to explicit imports (they already import
  from `vitest`) and drop `globals`.
