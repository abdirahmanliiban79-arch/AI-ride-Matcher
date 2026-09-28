import type { Request, RequestHandler } from 'express';

import { createRideSchema, rideIdParamSchema } from '../schemas/ride.schemas';
import { matchRideForPassenger } from '../services/matching/matching.service';
import {
  acceptRideByDriver,
  cancelRideForActor,
  createRideForPassenger,
  getRideForActor,
} from '../services/rides.service';
import type { AuthUser } from '../types/user.types';
import { AppError } from '../utils/AppError';

function requireAuth(req: Request): AuthUser {
  const auth = req.auth;
  if (!auth) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  }

  return auth;
}

export const createRide: RequestHandler = async (req, res) => {
  const input = createRideSchema.parse(req.body);
  const ride = await createRideForPassenger(requireAuth(req).id, input);

  res.status(201).json({ ride });
};

export const getRide: RequestHandler = async (req, res) => {
  const { id } = rideIdParamSchema.parse(req.params);
  const ride = await getRideForActor(id, requireAuth(req));

  res.json({ ride });
};

export const acceptRide: RequestHandler = async (req, res) => {
  const { id } = rideIdParamSchema.parse(req.params);
  const ride = await acceptRideByDriver(id, requireAuth(req).id);

  res.json({ ride });
};

export const cancelRide: RequestHandler = async (req, res) => {
  const { id } = rideIdParamSchema.parse(req.params);
  const ride = await cancelRideForActor(id, requireAuth(req));

  res.json({ ride });
};

export const matchRide: RequestHandler = async (req, res) => {
  const { id } = rideIdParamSchema.parse(req.params);
  const result = await matchRideForPassenger(id, requireAuth(req));

  res.json(result);
};