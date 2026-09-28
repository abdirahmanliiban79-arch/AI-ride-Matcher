import type { AuthUser } from './user.types';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export {};