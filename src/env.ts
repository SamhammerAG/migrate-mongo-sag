import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { getVault } from "@samhammer/vault-client-sag";
import { clone, invert, pickBy } from "lodash";

export async function loadEnv() {
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
    // load env for vault to temporary env
    const tempEnv = clone(process.env);
    const vaultEnv = config({ path, processEnv: tempEnv });
    const vaultValues = pickBy(vaultEnv.parsed, (value) => value.startsWith("VaultKey"));
    const vaultEnvExpanded = expand({ parsed: vaultValues, processEnv: tempEnv });

    return invert(vaultEnvExpanded.parsed);
}
