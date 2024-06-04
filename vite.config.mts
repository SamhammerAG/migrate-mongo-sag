import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "node:module";
import { dependencies } from "./package.json";

/**
 * Core modules could be imported in two ways, with or without the `node:` specifier, so we create a list of all possible core modules.
 */
const allCoreModules = builtinModules.flatMap((moduleName) => [moduleName, `node:${moduleName}`]);

/**
 * Extract the external dependencies but keep monorepo workspace packages as part of the bundle.
 */
const externalDependencies = Object.entries(dependencies).map(([key]) => key);

export default defineConfig({
    build: {
        target: "node18",
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            fileName: () => `migrate-mongo.js`,
            name: "migrateMongo",
            formats: ["cjs"]
        },
        rollupOptions: {
            external: [...allCoreModules, ...externalDependencies]
        }
    }
});
