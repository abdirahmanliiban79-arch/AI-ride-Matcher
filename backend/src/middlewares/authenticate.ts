import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env';
import { USER_ROLES } from '../types/user.types';
import { AppError } from '../utils/AppError';

const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(USER_ROLES),
});

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Missing bearer token'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const payload = tokenPayloadSchema.parse(decoded);

    req.auth = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
};