import 'express-async-errors';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env, isProduction, isTest } from './config/env';
import { httpLogStream } from './config/logger';
import { setupSwagger } from './config/swagger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRouter from './routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  if (!isTest) {
    app.use(morgan(isProduction ? 'combined' : 'dev', { stream: httpLogStream }));
  }

  app.use(globalRateLimiter);

  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  setupSwagger(app);

  app.use('/api/v1', apiRouter);

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: `${env.COMPANY_NAME} - Manufacturing ERP API`,
      data: {
        docs: '/api-docs',
        health: '/api/v1/health',
      },
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

export default app;
