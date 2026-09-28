import { Router } from 'express';

import {
  getAvailableDrivers,
  getMyDriverProfile,
  updateMyAvailability,
  updateMyLocation,
} from '../controllers/driver.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

export const driversRouter = Router();

driversRouter.get('/available', authenticate, getAvailableDrivers);
driversRouter.get('/me', authenticate, requireRole('driver'), getMyDriverProfile);
driversRouter.patch('/me/availability', authenticate, requireRole('driver'), updateMyAvailability);
driversRouter.patch('/me/location', authenticate, requireRole('driver'), updateMyLocation);