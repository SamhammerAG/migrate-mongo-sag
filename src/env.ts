import { config, populate } from "dotenv";
import { expand } from "dotenv-expand";
import { getVault } from "@samhammer/vault-client-sag";
import { clone, invert, pickBy } from "lodash";
import { execSync } from "child_process";
import type { Command } from "commander";

export async function loadEnv(cmd: Command) {
    // load command options to process.env
    loadCommand(cmd);

    // load branch to process.env
    loadBranchName();

    // define files to load
    const path = [".env.local", ".env"];

    // load vault values to process.env
    const vaultKeys = getVaultKeys(path);
    const vault = await getVault();
    await vault.loadSecretsToEnv(vaultKeys);

    // load env to process.env
    const env = config({ path });
    expand({ parsed: env.parsed });
}

export function getVaultKeys(path: string[]) {
    // load env for vault to temporary env; otherwise placeholders that target a field with VaultKey would be replaced before VaultValues are loaded
    const tempEnv = clone(process.env);
    const vaultEnv = config({ path, processEnv: tempEnv });
    const vaultValues = pickBy(vaultEnv.parsed, (value) => value.startsWith("VaultKey"));
    const vaultEnvExpanded = expand({ parsed: vaultValues, processEnv: tempEnv });

    return invert(vaultEnvExpanded.parsed);
}

export async function loadCommand(cmd: Command) {
    // only load options when they are set; otherwise we would overwrite env values with empty value
    const env = cmd.getOptionValue("env");
    const brand = cmd.getOptionValue("brand");
    const suffix = cmd.getOptionValue("suffix");

    const parsed = {} as Record<string, string>;
    if (env) parsed.Environment = env;
    if (brand) parsed.Brand = brand;
    if (suffix) parsed.Suffix = suffix;

    populate(process.env, parsed, { override: true });
}

export function loadBranchName() {
    // only load when not already defined
    if (process.env.Branch) return;

    const branchName = execSync("git rev-parse --abbrev-ref HEAD")
        .toString("utf-8")
        .replace(/[\n\r\s]+$/, "");

    const parsed = { Branch: branchName };

    populate(process.env, parsed);
}
