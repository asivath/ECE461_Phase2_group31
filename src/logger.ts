import { createLogger, format, transports, Logger as WinstonLogger } from "winston";

// Define custom log levels
const customLevels = {
  levels: {
    startup: 0,
    error: 1,
    warn: 2,
    dataChange: 3,
    request: 4,
    stateChange: 5,
    userInteraction: 6,
    risk: 7,
    wait: 8,
    progress: 9,
    branch: 10,
    summary: 11,
    info: 12,
    debug: 13
  }
};

type CustomLogger = {
  startup: (message: string) => void;
  dataChange: (message: string) => void;
  request: (message: string) => void;
  stateChange: (message: string) => void;
  userInteraction: (message: string) => void;
  risk: (message: string) => void;
  wait: (message: string) => void;
  progress: (message: string) => void;
  branch: (message: string) => void;
  summary: (message: string) => void;
} & WinstonLogger;

const logger: CustomLogger = createLogger({
  levels: customLevels.levels,
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [new transports.Console(), new transports.File({ filename: "application.log" })]
}) as CustomLogger;

export default logger;
