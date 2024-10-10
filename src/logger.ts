import ecsFormat from "@elastic/ecs-winston-format";
import winston from "winston";

export function initLogger() {
    const defaultLogLevel = "info";
    const consoleLog = new winston.transports.Console();
    const fileLog = new winston.transports.File({ filename: process.env.Logger_LogFile });

    const logger = winston.createLogger({
        level: process.env.Logger_LogLevel || defaultLogLevel,
        format: ecsFormat({ convertReqRes: true }),
        transports: [consoleLog, fileLog]
    });

    return logger;
}
