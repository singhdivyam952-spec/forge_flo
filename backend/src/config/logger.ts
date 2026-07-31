import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { env, isProduction } from './env';

const isServerless = Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const logsDir = isServerless ? path.join('/tmp', 'logs') : path.resolve(process.cwd(), 'logs');

let canWriteFiles = false;
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  canWriteFiles = true;
} catch {
  canWriteFiles = false;
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

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? combine(timestamp(), json()) : consoleFormat,
  }),
];

if (canWriteFiles) {
  transports.push(
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
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: fileFormat,
  defaultMeta: { service: 'manufacturing-erp-backend' },
  transports,
  exitOnError: false,
});

export const httpLogStream = {
  write: (message: string) => logger.http(message.trim()),
};

export default logger;
