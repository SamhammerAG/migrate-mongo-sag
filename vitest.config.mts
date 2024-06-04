import { mergeConfig, defineConfig } from "vitest/config";
import viteConfig from "./vite.config.mts";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            unstubEnvs: true,
            unstubGlobals: true,
            globals: true
        }
    })
);
