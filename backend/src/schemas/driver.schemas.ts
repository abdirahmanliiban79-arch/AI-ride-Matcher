import { z } from 'zod';

export const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type AvailabilityBody = z.infer<typeof availabilitySchema>;
export type LocationBody = z.infer<typeof locationSchema>;