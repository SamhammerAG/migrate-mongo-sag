import { config, populate } from "dotenv";
import { expand } from "dotenv-expand";
import { getVault } from "@samhammer/vault-client-sag";
import { clone, invert, pickBy } from "lodash";
import { execSync } from "child_process";
import type { Command } from "commander";

// define files to load
const path = [".env.local", ".env"];

export async function initEnv(cmd: Command) {
    try {
        if (process.env.TRACE) console.log("int env...");

        await loadCommand(cmd);
        await loadBranchName();
        await loadVault();
        await loadEnvFiles();

        if (process.env.TRACE) console.log("finished init env");
    } catch (error) {
        console.error(`init env failed`, error);
    }
}

export function loadEnvFiles() {
    if (process.env.TRACE) console.log("loading env files...");

    const env = config({ path });
    expand({ parsed: env.parsed });
}

export async function loadVault() {
    if (process.env.TRACE) console.log("loading vault...");

    // load vault values to process.env
    const vaultKeys = getVaultKeys(path);
    if (process.env.TRACE) console.log("requesting vault keys", vaultKeys);

    const vault = await getVault();
    await vault.loadSecretsToEnv(vaultKeys);
    if (process.env.TRACE) console.log("finished loading from vault");
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
    if (process.env.TRACE) console.log("loading command options...");

    // only load options when they are set; otherwise we would overwrite env values with empty value
    const env = cmd.getOptionValue("env");
    const brand = cmd.getOptionValue("brand");
    const suffix = cmd.getOptionValue("suffix");

    const parsed = {} as Record<string, string>;
    if (env) parsed.Environment = env;
    if (brand) parsed.Brand = brand;
    if (suffix) parsed.Suffix = suffix;

    populate(process.env, parsed, { override: true });

    if (process.env.TRACE) console.log("set options", parsed);
}

export function loadBranchName() {
    if (process.env.TRACE) console.log("loading branch...");

    // only load when not already defined
    if (process.env.Branch) {
        if (process.env.TRACE) console.log("skip branch cause its defined already", process.env.Branch);
        return;
    }

    const branchName = execSync("git rev-parse --abbrev-ref HEAD")
        .toString("utf-8")
        .replace(/[\n\r\s]+$/, "");

    const parsed = { Branch: branchName };
    populate(process.env, parsed);

    if (process.env.TRACE) console.log("set branch", parsed);
}
