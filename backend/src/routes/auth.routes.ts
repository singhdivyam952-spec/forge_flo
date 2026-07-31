import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { audit } from '../middleware/audit';
import { AuditAction } from '../constants';
import {
  changePasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from '../validators/auth.validators';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeCode, firstName, email, password]
 *             properties:
 *               employeeCode: { type: string, example: EMP-001 }
 *               firstName: { type: string, example: Jane }
 *               lastName: { type: string, example: Doe }
 *               email: { type: string, example: jane.doe@example.com }
 *               password: { type: string, example: StrongP@ssw0rd }
 *     responses:
 *       201:
 *         description: Account created successfully
 */
router.post('/register', authRateLimiter, validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: jane.doe@example.com }
 *               password: { type: string, example: StrongP@ssw0rd }
 *     responses:
 *       200:
 *         description: Logged in successfully
 */
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  audit({ action: AuditAction.Login, module: 'auth' }),
  authController.login
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a valid refresh token for a new access token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out of the current session
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  '/logout',
  authenticate,
  validate({ body: logoutSchema }),
  audit({ action: AuditAction.Logout, module: 'auth' }),
  authController.logout
);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Log out of all active sessions/devices
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 */
router.post(
  '/logout-all',
  authenticate,
  audit({ action: AuditAction.Logout, module: 'auth' }),
  authController.logoutAll
);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the current user's password
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  audit({ action: AuditAction.PasswordChange, module: 'auth' }),
  authController.changePassword
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user fetched successfully
 */
router.get('/me', authenticate, authController.me);

export default router;
