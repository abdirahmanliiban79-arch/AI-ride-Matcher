import type { RequestHandler } from 'express';

import type { UserRole } from '../types/user.types';
import { AppError } from '../utils/AppError';

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    const auth = req.auth;

    if (!auth) {
      next(new AppError(401, 'UNAUTHENTICATED', 'Authentication required'));
      return;
    }

    if (!roles.includes(auth.role)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}