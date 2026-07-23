import { initLogger, getLogFile, defaultLogFile } from "../logger";
import { describe, it, expect, afterEach } from "vitest";

const logKeys = ["Logger_LogFile", "Logger_LogLevel"];

afterEach(() => {
    for (const key of logKeys) delete process.env[key];
});

describe("logger", () => {
    it("should initialize without throwing when log env values are unset", () => {
        // arrange: simulate a failed initEnv where no Logger_* values were loaded
        for (const key of logKeys) delete process.env[key];

        // act + assert: winston must not crash on a missing filename
        expect(() => initLogger()).not.toThrow();
    });

    it("should fall back to the default log file when Logger_LogFile is unset", () => {
        delete process.env.Logger_LogFile;

        expect(getLogFile()).toBe(defaultLogFile);
    });

    it("should use Logger_LogFile when it is set", () => {
        process.env.Logger_LogFile = "custom/path.json";

        expect(getLogFile()).toBe("custom/path.json");
    });
});
