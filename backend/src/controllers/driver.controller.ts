import type { Request, RequestHandler } from 'express';

import { availabilitySchema, locationSchema } from '../schemas/driver.schemas';
import {
  getDriverProfileByUserId,
  listAvailableDrivers,
  setDriverAvailability,
  setDriverLocation,
} from '../services/drivers.service';
import { AppError } from '../utils/AppError';

function requireAuthId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  return auth.id;
}

export const getMyDriverProfile: RequestHandler = async (req, res) => {
  const driver = await getDriverProfileByUserId(requireAuthId(req));

  res.json({ driver });
};

export const getAvailableDrivers: RequestHandler = async (_req, res) => {
  const drivers = await listAvailableDrivers();

  res.json({ drivers });
};

export const updateMyAvailability: RequestHandler = async (req, res) => {
  const input = availabilitySchema.parse(req.body);
  const driver = await setDriverAvailability(requireAuthId(req), input.isAvailable);

  res.json({ driver });
};

export const updateMyLocation: RequestHandler = async (req, res) => {
  const input = locationSchema.parse(req.body);
  const driver = await setDriverLocation(requireAuthId(req), input);

  res.json({ driver });
};