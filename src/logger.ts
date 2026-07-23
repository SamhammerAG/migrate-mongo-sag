import ecsFormat from "@elastic/ecs-winston-format";
import winston, { format } from "winston";
import { name, version } from "../package.json";

export const defaultLogFile = "logs/log.json";
export const defaultLogLevel = "info";

export function initLogger() {
    const consoleLog = new winston.transports.Console({
        format: format.simple()
    });

    const ecsJsonFormat = ecsFormat();
    const fieldsFormat = format((info) => {
        return {
            ...info,
            fields: {
                Brand: process.env.Brand,
                EnvironmentName: process.env.Environment,
                BranchName: process.env.Branch,
                AssemblyName: name,
                AssemblyVersion: version
            }
        };
    })();

    const fileLog = new winston.transports.File({
        filename: getLogFile(),
        format: format.combine(fieldsFormat, ecsJsonFormat)
    });

    const logger = winston.createLogger({
        level: getLogLevel(),
        transports: [consoleLog, fileLog]
    });

    return logger;
}

// resolve log config with defaults so logging works even when env init did not complete;
// getLogFile is shared with the elastic sync so both read the same file
export function getLogFile() {
    return process.env.Logger_LogFile || defaultLogFile;
}

export function getLogLevel() {
    return process.env.Logger_LogLevel || defaultLogLevel;
}
