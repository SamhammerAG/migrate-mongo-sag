import ecsFormat from "@elastic/ecs-winston-format";
import winston, { format } from "winston";
import { name, version } from "../package.json";

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
        filename: process.env.Logger_LogFile,
        format: format.combine(fieldsFormat, ecsJsonFormat)
    });

    const logger = winston.createLogger({
        level: process.env.Logger_LogLevel,
        transports: [consoleLog, fileLog]
    });

    return logger;
}
