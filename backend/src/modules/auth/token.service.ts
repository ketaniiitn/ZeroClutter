import crypto from 'crypto';
import prisma from '../../config/database';

const EXPIRY_DAYS = 7;

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const expiresAt = (): Date =>
  new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

export const createRefreshToken = async (
  userId: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const familyId = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      familyId,
      userId,
      expiresAt: expiresAt(),
      userAgent,
      ipAddress,
    },
  });

  return token;
};

/**
 * Validates a refresh token, rotates it (revoke old → issue new), and returns
 * the userId and fresh token. Throws on any invalid/expired/replayed token.
 */
export const rotateRefreshToken = async (
  rawToken: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ userId: string; newToken: string }> => {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record) {
    throw Object.assign(new Error('Token not found'), { code: 'INVALID_TOKEN' });
  }

  // Replay attack: a revoked token was re-used — invalidate the whole family
  if (record.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: record.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw Object.assign(new Error('Token already used'), { code: 'TOKEN_REUSE' });
  }

  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    throw Object.assign(new Error('Token expired'), { code: 'TOKEN_EXPIRED' });
  }

  // Revoke the consumed token
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  // Issue replacement in the same family
  const newToken = crypto.randomBytes(32).toString('hex');
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(newToken),
      familyId: record.familyId,
      userId: record.userId,
      expiresAt: expiresAt(),
      userAgent,
      ipAddress,
    },
  });

  return { userId: record.userId, newToken };
};

export const revokeRefreshToken = async (rawToken: string): Promise<void> => {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const revokeAllUserTokens = async (userId: string): Promise<number> => {
  const { count } = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
};
