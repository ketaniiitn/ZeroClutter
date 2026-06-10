import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthenticatedRequest, WorkspaceRequest } from '../types';
import { getWorkspaceMembership } from '../modules/workspace/workspace.service';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  // Legacy tokens used `id` instead of `sub`
  id?: string;
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authorization token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.sub || payload.id || '',
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

const ROLE_RANK: Record<Role, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

/**
 * Middleware factory that requires the authenticated user to be a workspace
 * member with at least `minRole`. Reads workspaceId from req.params.workspaceId
 * or req.body.workspaceId.
 */
export const requireWorkspaceRole = (minRole: Role = 'MEMBER') =>
  async (req: WorkspaceRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new UnauthorizedError('Authentication required'));

      const workspaceId =
        (req.params.workspaceId as string) ||
        (req.body?.workspaceId as string) ||
        (req.query?.workspaceId as string);

      if (!workspaceId) return next(new ForbiddenError('Workspace context required'));

      const membership = await getWorkspaceMembership(req.user.id, workspaceId);

      if (!membership) return next(new ForbiddenError('You are not a member of this workspace'));

      const userRank = ROLE_RANK[membership.role as Role] ?? 0;
      const requiredRank = ROLE_RANK[minRole];

      if (userRank < requiredRank) {
        return next(new ForbiddenError(`Requires ${minRole} role or higher`));
      }

      req.workspace = { workspaceId, role: membership.role as Role };
      next();
    } catch (err) { next(err); }
  };
