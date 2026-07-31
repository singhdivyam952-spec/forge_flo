import { Router } from 'express';
import authRoutes from './auth.routes';
import systemRoutes from './system.routes';
import marketingRoutes from './marketing.routes';
import { buildModuleRouters, buildSpecialRouters } from './modules';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: API health/readiness check
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Manufacturing ERP API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/marketing', marketingRoutes);
router.use(systemRoutes);

for (const mod of buildSpecialRouters()) {
  router.use(mod.path, mod.router);
}

for (const mod of buildModuleRouters()) {
  router.use(mod.path, mod.router);
}

export default router;
