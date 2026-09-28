import { Router } from 'express';

import {
  acceptRide,
  cancelRide,
  createRide,
  getRide,
  matchRide,
} from '../controllers/ride.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

export const ridesRouter = Router();

ridesRouter.post('/', authenticate, requireRole('passenger'), createRide);
ridesRouter.get('/:id', authenticate, getRide);
ridesRouter.post('/:id/match', authenticate, requireRole('passenger'), matchRide);
ridesRouter.post('/:id/accept', authenticate, requireRole('driver'), acceptRide);
ridesRouter.post('/:id/cancel', authenticate, cancelRide);