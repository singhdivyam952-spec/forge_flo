import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(__dirname, '../../.env'),
];

const resolvedEnvPath = envCandidates.find((candidate) => fs.existsSync(candidate));

dotenv.config(resolvedEnvPath ? { path: resolvedEnvPath, override: true } : undefined);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:5000'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_URI_TEST: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),

  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional().default(''),
  AWS_S3_ENDPOINT: z.string().optional().default(''),
  AWS_S3_FORCE_PATH_STYLE: z.coerce.boolean().optional().default(false),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('noreply@manufacturing-erp.local'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),

  COMPANY_NAME: z.string().default('Forge Flo Manufacturing'),
  COMPANY_CODE: z.string().default('FFM'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  COOKIE_SECRET: z.string().min(16).default('change-me-cookie-secret-min-16-chars'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n❌ Invalid environment variables:\n${formatted}\n`);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
