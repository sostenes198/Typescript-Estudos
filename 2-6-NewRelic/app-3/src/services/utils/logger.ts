import winston, { Logger } from "winston";
import packageJson from "../../../package.json";
import { storage } from "./local.storage";

const _logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS"
    }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
  defaultMeta: {
    service: packageJson.name,
    serviceVersion: packageJson.version,
    pid: process.pid,
    test: "TESTANDOOO"
  }
});

storage.setLogger(_logger);

const getLogger = (): Logger => {
  const logger = storage.getLogger();
  return logger as Logger;
};

const info = (message: string, ...meta: any[]) => {
  getLogger().info(message, ...meta);
};

const error = (message: string, ...meta: any[]) => {
  getLogger().error(message, ...meta);
};

const warn = (message: string, ...meta: any[]) => {
  getLogger().warn(message, ...meta);
};

const debug = (message: string, ...meta: any[]) => {
  getLogger().debug(message, ...meta);
};

const log = (level: string, message: string, ...meta: any[]) => {
  getLogger().log(level, message, ...meta);
};

const child = (...meta: any) => {
  const logger = getLogger().child(meta);
  storage.setLogger(logger);
};

export { info, error, warn, debug, log, child };
