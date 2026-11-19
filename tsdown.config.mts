import { defineConfig } from "tsdown";

export default defineConfig({
    entry: { "migrate-mongo": "src/index.ts" },
    format: "cjs",
    platform: "node",
    target: "node24",
    // Keep `.js` explicitly: tsdown defaults to `.cjs` for platform "node", which would break the `bin` path.
    outExtensions: () => ({ js: ".js" }),
    dts: false,
    clean: true,
    outputOptions: {
        // Emit "use strict" like the previous Vite build did; the ESM sources assume strict mode.
        strict: true
    }
});
