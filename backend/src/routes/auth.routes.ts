import { Router } from 'express';

import { login, me, register } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { authRateLimiter } from '../middlewares/rateLimit';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, register);
authRouter.post('/login', authRateLimiter, login);
authRouter.get('/me', authenticate, me);