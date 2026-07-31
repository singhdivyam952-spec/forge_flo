import swaggerJSDoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { env } from './env';

const swaggerDefinition: swaggerJSDoc.SwaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Manufacturing ERP API',
    version: '1.0.0',
    description:
      'REST API for the Manufacturing ERP system covering authentication, inventory, production, quality, purchase, sales and finance modules.',
    contact: {
      name: `${env.COMPANY_NAME} Engineering`,
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: `${env.API_URL}/api/v1`,
      description: env.NODE_ENV === 'production' ? 'Production server' : 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Something went wrong' },
          errorCode: { type: 'string', example: 'BAD_REQUEST' },
          errors: { type: 'object', nullable: true },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalItems: { type: 'number', example: 100 },
          totalPages: { type: 'number', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'Users', description: 'User management' },
    { name: 'Health', description: 'Service health checks' },
  ],
};

/** `glob` (used internally by swagger-jsdoc) requires forward slashes even on Windows. */
function toGlobPath(...segments: string[]): string {
  return path.join(...segments).split(path.sep).join('/');
}

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    toGlobPath(__dirname, '../routes/*.ts'),
    toGlobPath(__dirname, '../routes/*.js'),
    toGlobPath(__dirname, '../models/*.ts'),
    toGlobPath(__dirname, '../models/*.js'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Manufacturing ERP API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );
}

export default setupSwagger;
