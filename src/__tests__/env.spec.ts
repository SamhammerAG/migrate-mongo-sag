import { getVaultKeys } from "../env";
import { describe, it, expect, afterEach } from "vitest";
import path from "path";

const envPath = [path.join(__dirname, ".env.test")];

// keys set on process.env during a test; cleaned up afterwards to keep tests isolated
const managedKeys: string[] = [];

function setEnv(key: string, value: string) {
    managedKeys.push(key);
    process.env[key] = value;
}

afterEach(() => {
    for (const key of managedKeys) delete process.env[key];
    managedKeys.length = 0;
});

describe("getVaultKeys", () => {
    it("should return all vaultKeys that are defined in env files", () => {
        // act
        const result = getVaultKeys(envPath);

        // assert that list of vaultKeys is returned
        expect(result).toStrictEqual({
            "VaultKey--kv-v2/data/mongodb/dev/Password": "MongoDb__Pass",
            "VaultKey--kv-v2/data/mongodb/dev/UserName": "MongoDb__User"
        });
    });

    it("should not modify process.env when resolving vault keys from files and env vars", () => {
        // arrange: env-provided vault key with a placeholder ($Env) defined in the file
        setEnv("MongoDbOptions__AdminUserName", "VaultKey--kv-v2/data/mongodb/$Env/UserName");

        // act
        getVaultKeys(envPath);

        // assert .env file values are not added to process.env
        expect(process.env).not.toHaveProperty("Env");
        expect(process.env).not.toHaveProperty("MongoDb__User");
        expect(process.env).not.toHaveProperty("MongoDb__Pass");
        expect(process.env).not.toHaveProperty("MongoDb__Url");

        // assert the env var itself was not expanded/mutated in place
        expect(process.env.MongoDbOptions__AdminUserName).toBe("VaultKey--kv-v2/data/mongodb/$Env/UserName");
    });

    it("should detect vaultKeys defined via environment variables", () => {
        // arrange: vault key only present in process.env under an allowed prefix
        setEnv("MongoDbOptions__AdminPassword", "VaultKey--kv-v2/data/mongodb/Password");

        // act
        const result = getVaultKeys(envPath);

        // assert env vault key is resolved in addition to the file ones
        expect(result).toHaveProperty("VaultKey--kv-v2/data/mongodb/Password", "MongoDbOptions__AdminPassword");
    });

    it("should let environment variables take priority over env files", () => {
        // arrange: same key exists in .env.test (expands to .../dev/UserName)
        setEnv("MongoDb__User", "VaultKey--kv-v2/data/mongodb/prod/UserName");

        // act
        const result = getVaultKeys(envPath);

        // assert env value wins and the file value is not present
        expect(result).toHaveProperty("VaultKey--kv-v2/data/mongodb/prod/UserName", "MongoDb__User");
        expect(result).not.toHaveProperty("VaultKey--kv-v2/data/mongodb/dev/UserName");
    });

    it("should expand placeholders in vaultKeys defined via environment variables", () => {
        // arrange: env-provided vault key with a placeholder ($Env) defined in the file
        setEnv("MongoDbOptions__AdminUserName", "VaultKey--kv-v2/data/mongodb/$Env/UserName");

        // act
        const result = getVaultKeys(envPath);

        // assert the placeholder was resolved using the file's Env=dev
        expect(result).toHaveProperty("VaultKey--kv-v2/data/mongodb/dev/UserName", "MongoDbOptions__AdminUserName");
    });

    it("should ignore non-VaultKey environment variables under an allowed prefix", () => {
        // arrange
        setEnv("MongoDbOptions__DatabaseHost", "localhost");

        // act
        const result = getVaultKeys(envPath);

        // assert plain value is not treated as a vault key
        expect(Object.values(result)).not.toContain("MongoDbOptions__DatabaseHost");
    });

    it("should ignore VaultKey values under a non-allowlisted name prefix", () => {
        // arrange
        setEnv("SomeOther__Secret", "VaultKey--kv-v2/data/other/Secret");

        // act
        const result = getVaultKeys(envPath);

        // assert the non-allowlisted variable is not resolved
        expect(result).not.toHaveProperty("VaultKey--kv-v2/data/other/Secret");
        expect(Object.values(result)).not.toContain("SomeOther__Secret");
    });
});
