import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { signupSchema, loginSchema } from './auth.validation';
import {
  signupUser,
  loginUser,
  getMe,
  exchangeGoogleCode,
  resolveGoogleUser,
  signAccessToken,
} from './auth.service';
import { rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from './token.service';
import { getWorkspacesForUser } from '../workspace/workspace.service';
import { sendSuccess } from '../../utils/response';
import { ValidationError, UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../types';
import { env } from '../../config/env';

// ─── Cookie helpers ────────────────────────────────────────────────────────────

const COOKIE_NAME = 'zc_refresh';

const setCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd(),
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearCookie = (res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
};

// ─── Signup ────────────────────────────────────────────────────────────────────

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = signupSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.details.map((d) => d.message).join('; '));

    const result = await signupUser(
      value.name, value.email, value.password,
      req.headers['user-agent'], req.ip,
    );

    setCookie(res, result.refreshToken);
    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      workspace: result.workspace,
      isNewUser: true,
    }, 201);
  } catch (err) { next(err); }
};

// ─── Login ─────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) throw new ValidationError(error.details.map((d) => d.message).join('; '));

    const result = await loginUser(
      value.email, value.password,
      req.headers['user-agent'], req.ip,
    );

    setCookie(res, result.refreshToken);
    sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
      workspaces: result.workspaces,
      activeWorkspace: result.activeWorkspace,
    });
  } catch (err) { next(err); }
};

// ─── Refresh ───────────────────────────────────────────────────────────────────

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME];
    if (!rawToken) throw new UnauthorizedError('Refresh token missing');

    const { userId, newToken } = await rotateRefreshToken(
      rawToken,
      req.headers['user-agent'],
      req.ip,
    );

    const user = await getMe(userId);
    const accessToken = signAccessToken(userId, user.user.email, user.user.name);

    setCookie(res, newToken);
    sendSuccess(res, { accessToken, user: user.user, workspaces: user.workspaces });
  } catch (err: unknown) {
    clearCookie(res as Response);
    const code = (err as { code?: string }).code;
    if (code === 'TOKEN_REUSE' || code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
      next(new UnauthorizedError('Session expired. Please sign in again.'));
    } else {
      next(err);
    }
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────────

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME];
    if (rawToken) await revokeRefreshToken(rawToken);
    clearCookie(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

// ─── Logout all devices ────────────────────────────────────────────────────────

export const logoutAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await revokeAllUserTokens(req.user!.id);
    clearCookie(res);
    sendSuccess(res, { message: 'Logged out from all devices', revokedSessions: count });
  } catch (err) { next(err); }
};

// ─── Get me ────────────────────────────────────────────────────────────────────

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await getMe(req.user!.id);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

// ─── Google OAuth ──────────────────────────────────────────────────────────────

export const googleRedirect = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      res.status(400).json({ success: false, error: { code: 'OAUTH_NOT_CONFIGURED', message: 'Google OAuth is not configured on this server' } });
      return;
    }

    // Use a signed JWT as stateless CSRF state (avoids Redis dependency)
    const state = jwt.sign({ nonce: Math.random().toString(36) }, env.JWT_SECRET, { expiresIn: '10m' });

    const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch (err) { next(err); }
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const frontendUrl = env.FRONTEND_URL;

  try {
    const { code, state, error: oauthError } = req.query as Record<string, string>;

    if (oauthError) {
      res.redirect(`${frontendUrl}/login?error=oauth_denied`);
      return;
    }

    // Verify state JWT
    try {
      jwt.verify(state, env.JWT_SECRET);
    } catch {
      res.redirect(`${frontendUrl}/login?error=invalid_state`);
      return;
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/auth/google/callback`;
    const googleUser = await exchangeGoogleCode(code, redirectUri);

    if (!googleUser.email_verified) {
      res.redirect(`${frontendUrl}/login?error=email_not_verified`);
      return;
    }

    const result = await resolveGoogleUser(
      googleUser.sub,
      googleUser.email,
      googleUser.name,
      googleUser.picture,
      req.headers['user-agent'],
      req.ip,
    );

    setCookie(res, result.refreshToken);

    // Redirect to frontend callback — NO token in URL
    // Frontend calls POST /auth/refresh to obtain access token from the cookie
    const params = new URLSearchParams({
      workspaceSlug: result.activeWorkspace.slug,
      isNewUser: String(result.isNewUser),
    });
    res.redirect(`${frontendUrl}/auth/callback?${params}`);
  } catch (err) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr.response?.status === 400) {
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    } else {
      next(err);
    }
  }
};

// ─── Legacy alias (keep old /auth/register path working) ──────────────────────

export const register = signup;
