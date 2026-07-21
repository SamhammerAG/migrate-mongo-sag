# ASMO-8144 – Resolve Vault keys defined via environment variables

## Rationale

Vault references (values starting with the `VaultKey` sentinel) are only resolved when
they are declared in an `.env` / `.env.local` file. When the same reference is provided
through a real environment variable, it is silently ignored and never resolved by Vault.

The reason is that `getVaultKeys` in `src/env.ts` detects Vault references from
`config({ path, processEnv }).parsed`, which contains **only** the values parsed out of the
`.env` files – never entries that already exist in `process.env`.

Goal: environment variables must also be scanned for Vault references, and they must take
**priority** over values coming from `.env` files. Scanning must be limited to an explicit
allowlist of name prefixes rather than the entire process environment.

## Acceptance criteria

- [ ] `getVaultKeys` detects `VaultKey` references that are supplied via `process.env`
      (not only via `.env` files).
- [ ] Only `process.env` entries whose **name** matches an explicit prefix allowlist are
      considered; unrelated/system variables are never read.
- [ ] When the same key is defined in both `process.env` and an `.env` file, the value from
      `process.env` wins.
- [ ] Placeholder expansion (e.g. `$Env`) keeps working for both sources.
- [ ] The function still does not leak or write non-Vault `.env` values into `process.env`
      (the existing "values are not added to process.env" guarantee is preserved).
- [ ] A documented decision on the allowlist approach is captured (see Technical details).
- [ ] Automated tests are written that prove env variables are resolved and take priority
      over the `.env` file.

## Technical details

### Change in `src/env.ts` (`getVaultKeys`)

- Introduce an explicit, named prefix allowlist near the top of the module, e.g.:

  ```ts
  const vaultKeyEnvPrefixes = ["Logger_", "MongoDbOptions__", "MongoDb__"];
  ```

- Keep the current file-based detection: parse the files into a temp env and take the
  `VaultKey`-prefixed entries from `.parsed`.
- Additionally pick entries from `process.env` that pass **two gates**:
  1. the variable **name** starts with one of `vaultKeyEnvPrefixes`, and
  2. the variable **value** starts with the `VaultKey` sentinel.
  Filter by name first so values of non-matching (system/unrelated) variables are never read.
- Merge the two maps so that **`process.env` overrides the file values** (e.g.
  `{ ...fileVaultValues, ...envVaultValues }`).
- Run the existing `expand({ parsed, processEnv: tempEnv })` on the merged map so that
  placeholders resolve against the combined environment, then `invert` the result as before.
- Guard against non-string values when applying `startsWith`.

### Security / design decision: prefix allowlist + value sentinel (two gates)

We limit env scanning to an explicit name-prefix allowlist combined with the existing
`VaultKey` value sentinel, rather than scanning the whole environment.

- **Name-prefix allowlist first**: only variables under the app's own config namespaces
  (`Logger_`, `MongoDbOptions__`, `MongoDb__`) are inspected. Values of system/unrelated
  variables (PATH, tokens, CI vars) are never read. This addresses the concern about touching
  every environment variable and any perceived cost/risk of doing so.
- **Value sentinel second**: among allowlisted names, only values starting with `VaultKey`
  become Vault lookups. Unused variables under the same prefix that are plain values (e.g.
  spare `MongoDbOptions__*` not used by this project) are ignored.
- **No leakage path**: we never log or emit the environment; only resolved key *names* are
  TRACE-logged, never values.
- **Extensibility**: adding a new namespaced variable requires no code change; adding a new
  namespace is a one-line edit to `vaultKeyEnvPrefixes`.
- Prefix note: use `Logger_` (single underscore) to match existing variables such as
  `Logger_LogFile` and `Logger_ClientUrl`.

### Tests (`src/__tests__/env.spec.ts`)

Add cases that set the relevant variables on `process.env` inside the test (with cleanup so
tests stay isolated):

- Vault key defined **only** via `process.env` (under an allowed prefix) is returned.
- Vault key defined in **both** `.env` file and `process.env` returns the value from
  `process.env` (priority check).
- Non-`VaultKey` env variables under an allowed prefix are ignored.
- A `VaultKey` value under a **non-allowlisted** name prefix is ignored.
- The existing test (file-only detection) keeps passing unchanged.
