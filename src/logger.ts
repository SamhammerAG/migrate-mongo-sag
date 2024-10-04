import ecsFormat from "@elastic/ecs-winston-format";
import winston from "winston";

export function initLogger() {
    const logger = winston.createLogger({
        level: process.env.Logger_LogLevel,
        format: ecsFormat({ convertReqRes: true }),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                filename: process.env.Logger_LogFile,
                level: process.env.Logger_LogLevel
            })
        ]
    });

    return logger;
}
