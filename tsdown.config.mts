import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { "migrate-mongo": "src/index.ts" },
    format: "esm",
    platform: "node",
    target: "node24",
    // Keep `.mjs` explicitly: only the bundle is ESM, while the CommonJS sample config and migrations in
    // this repo stay `.js` files without `"type": "module"`.
    outExtensions: () => ({ js: ".mjs" }),
    dts: false,
    clean: true
});
