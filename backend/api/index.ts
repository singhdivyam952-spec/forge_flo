import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';
import { connectDatabase } from '../src/config/database';

/**
 * Vercel serverless entry for the Express API.
 * Reuses the Mongo connection across warm invocations.
 */
let dbReady: Promise<unknown> | null = null;

function ensureDatabase(): Promise<unknown> {
  if (!dbReady) {
    dbReady = connectDatabase().catch((error) => {
      dbReady = null;
      throw error;
    });
  }
  return dbReady;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await ensureDatabase();
  app(req as never, res as never);
}
