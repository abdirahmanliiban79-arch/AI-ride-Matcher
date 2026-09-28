import { z } from 'zod';

import { VEHICLE_TYPES } from '../types/driver.types';

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const createRideSchema = z.object({
  pickup: coordinateSchema,
  destination: coordinateSchema,
  maxPrice: z.number().positive().max(100000),
  preferredVehicleType: z.enum(VEHICLE_TYPES),
  maxWaitTime: z.number().int().positive().max(1440),
});

export const rideIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateRideBody = z.infer<typeof createRideSchema>;