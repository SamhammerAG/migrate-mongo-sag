import ecsFormat from "@elastic/ecs-winston-format";
import winston from "winston";

export function initLogger() {
    const defaultLogLevel = "info";
    const defaultLogFilePath = "logs/log.json";

    const logger = winston.createLogger({
        level: process.env.Logger_LogLevel || defaultLogLevel,
        format: ecsFormat({ convertReqRes: true }),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                filename: process.env.Logger_LogFile || defaultLogFilePath,
                level: process.env.Logger_LogLevel
            })
        ]
    });

    return logger;
}
