import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { env, isProduction } from './env';

const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, splat, json } = winston.format;

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${stack || message}${metaStr}`;
  })
);

const fileFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: fileFormat,
  defaultMeta: { service: 'manufacturing-erp-backend' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    })
  );
}

export const httpLogStream = {
  write: (message: string) => logger.http(message.trim()),
};

export default logger;
