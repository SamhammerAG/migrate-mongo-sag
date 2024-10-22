import ecsFormat from "@elastic/ecs-winston-format";
import winston, { format } from "winston";

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
                Environment: process.env.Environment,
                Branch: process.env.Branch
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
