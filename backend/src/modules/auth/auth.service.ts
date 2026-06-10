import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { createRefreshToken } from './token.service';
import { createWorkspace, getWorkspacesForUser } from '../workspace/workspace.service';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';

// ─── JWT ──────────────────────────────────────────────────────────────────────

export const signAccessToken = (userId: string, email: string, name: string): string =>
  jwt.sign({ sub: userId, email, name }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

// ─── Email / password ─────────────────────────────────────────────────────────

export const signupUser = async (
  name: string,
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string,
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('A user with this email already exists');

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, authProvider: 'EMAIL' },
    select: { id: true, name: true, email: true, avatarUrl: true, emailVerified: true, authProvider: true },
  });

  const workspace = await createWorkspace(user.id, `${name}'s Workspace`);
  const refreshToken = await createRefreshToken(user.id, userAgent, ipAddress);
  const accessToken = signAccessToken(user.id, user.email, user.name);

  return {
    user,
    accessToken,
    refreshToken,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      planTier: workspace.planTier,
      role: 'OWNER' as const,
    },
    isNewUser: true,
  };
};

export const loginUser = async (
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string,
) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately vague error — do not reveal whether account exists
  if (!user || !user.password) {
    throw new UnauthorizedError('Invalid email or password');
  }
  if (!user.isActive) {
    throw new ForbiddenError('Account deactivated. Contact support.');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  let workspaces = await getWorkspacesForUser(user.id);

  // Auto-create workspace for accounts that predate workspace support
  if (workspaces.length === 0) {
    const ws = await createWorkspace(user.id, `${user.name}'s Workspace`);
    workspaces = [{ id: ws.id, name: ws.name, slug: ws.slug, planTier: ws.planTier, role: 'OWNER' }];
  }

  const refreshToken = await createRefreshToken(user.id, userAgent, ipAddress);
  const accessToken = signAccessToken(user.id, user.email, user.name);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
    },
    accessToken,
    refreshToken,
    workspaces,
    activeWorkspace: workspaces[0],
  };
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export const exchangeGoogleCode = async (code: string, redirectUri: string): Promise<GoogleUserInfo> => {
  const tokenRes = await axios.post<GoogleTokenResponse>(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  const userRes = await axios.get<GoogleUserInfo>(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } },
  );

  return userRes.data;
};

export const resolveGoogleUser = async (
  googleId: string,
  email: string,
  name: string,
  avatarUrl?: string | null,
  userAgent?: string,
  ipAddress?: string,
) => {
  let user = await prisma.user.findUnique({ where: { googleId } });
  let isNewUser = false;

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    if (existingByEmail) {
      // Link Google to existing account
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId,
          emailVerified: true,
          ...(avatarUrl ? { avatarUrl } : {}),
        },
      });
    } else {
      user = await prisma.user.create({
        data: { email, name, googleId, avatarUrl, emailVerified: true, authProvider: 'GOOGLE' },
      });
      isNewUser = true;
    }
  } else if (avatarUrl && avatarUrl !== user.avatarUrl) {
    user = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
  }

  if (!user.isActive) throw new ForbiddenError('Account deactivated. Contact support.');

  let workspaces = await getWorkspacesForUser(user.id);

  if (workspaces.length === 0) {
    const ws = await createWorkspace(user.id, `${user.name}'s Workspace`);
    workspaces = [{ id: ws.id, name: ws.name, slug: ws.slug, planTier: ws.planTier, role: 'OWNER' }];
    isNewUser = true;
  }

  const refreshToken = await createRefreshToken(user.id, userAgent, ipAddress);
  const accessToken = signAccessToken(user.id, user.email, user.name);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
    },
    accessToken,
    refreshToken,
    workspaces,
    activeWorkspace: workspaces[0],
    isNewUser,
  };
};

// ─── /auth/me ─────────────────────────────────────────────────────────────────

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true, emailVerified: true, authProvider: true, isActive: true },
  });

  if (!user || !user.isActive) throw new UnauthorizedError('User not found');

  const workspaces = await getWorkspacesForUser(userId);
  return { user, workspaces };
};
