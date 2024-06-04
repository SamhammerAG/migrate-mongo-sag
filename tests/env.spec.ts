import { getVaultKeys } from "../src/env";
import { describe, it, expect } from "vitest";
import path from "path";

describe("getVaultKeys", () => {
    it("should return all vaultKeys that are defined in env files", () => {
        // arrange
        const envPath = [path.join(__dirname, ".env.test")];

        // act
        const result = getVaultKeys(envPath);

        // assert that list of vaultKeys is returned
        expect(result).toStrictEqual({
            "VaultKey--kv-v2/data/mongodb/dev/Password": "MongoDb__Pass",
            "VaultKey--kv-v2/data/mongodb/dev/UserName": "MongoDb__User"
        });

        // assert that .env values are not added to process.env
        expect(process.env).not.toHaveProperty("Env");
        expect(process.env).not.toHaveProperty("MongoDb__User");
        expect(process.env).not.toHaveProperty("MongoDb__Pass");
        expect(process.env).not.toHaveProperty("MongoDb__Url");
    });
});
