import ecsFormat from "@elastic/ecs-winston-format";
import winston, { format } from "winston";

export function initLogger() {
    const consoleLog = new winston.transports.Console();
    const fileLog = new winston.transports.File({ filename: process.env.Logger_LogFile });
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

    const logger = winston.createLogger({
        level: process.env.Logger_LogLevel,
        format: format.combine(fieldsFormat, ecsJsonFormat),
        transports: [consoleLog, fileLog]
    });

    return logger;
}
