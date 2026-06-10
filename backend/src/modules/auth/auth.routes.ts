import { Router } from 'express';
import {
  signup,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  googleRedirect,
  googleCallback,
  register,
} from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimit } from '../../middleware/rate-limit.middleware';

const router = Router();

// ─── Email / password ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user (creates workspace automatically)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Alice Smith }
 *               email: { type: string, format: email, example: alice@example.com }
 *               password: { type: string, minLength: 8, example: securepassword123 }
 *     responses:
 *       201:
 *         description: User created with workspace. Sets httpOnly refresh cookie.
 *       400: { description: Validation error }
 *       409: { description: Email already registered }
 */
router.post('/signup', authRateLimit, signup);

// Legacy alias
router.post('/register', authRateLimit, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Returns accessToken + workspaces. Sets httpOnly refresh cookie.
 *       401: { description: Invalid credentials }
 */
router.post('/login', authRateLimit, login);

// ─── Session ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token and return new access token
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200: { description: Returns new accessToken. Rotates refresh cookie. }
 *       401: { description: Missing, expired, or replayed refresh token }
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Revoke current session
 *     tags: [Authentication]
 *     responses:
 *       200: { description: Clears refresh cookie and revokes token }
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/logout/all:
 *   post:
 *     summary: Revoke all sessions for the authenticated user
 *     tags: [Authentication]
 *     responses:
 *       200: { description: Revokes all refresh tokens for this user }
 */
router.post('/logout/all', authenticate, logoutAll);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Return the authenticated user with workspace memberships
 *     tags: [Authentication]
 *     responses:
 *       200: { description: User object + workspaces array }
 *       401: { description: Missing or invalid access token }
 */
router.get('/me', authenticate, me);

// ─── Google OAuth ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth 2.0 flow
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       302: { description: Redirect to Google authorization page }
 *       400: { description: Google OAuth not configured }
 */
router.get('/google', googleRedirect);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback (called by Google, not by clients)
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       302: { description: Redirect to frontend /auth/callback with workspaceSlug }
 */
router.get('/google/callback', googleCallback);

export default router;
