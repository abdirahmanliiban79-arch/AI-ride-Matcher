import type { RequestHandler } from 'express';

import { loginSchema, registerSchema } from '../schemas/auth.schemas';
import { getUserProfile, loginUser, registerUser } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);

  res.status(201).json({ user });
};

export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  res.json(result);
};

export const me: RequestHandler = async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  const user = await getUserProfile(auth.id);

  res.json({ user });
};