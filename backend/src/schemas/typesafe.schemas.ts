import { z } from 'zod';

import { MATCH_TYPES } from '../types/rideMatch.types';

export const typeSafeDecisionSchema = z.object({
  selectedDriverId: z.string().min(1),
  matchType: z.enum(MATCH_TYPES),
  confidence: z.number().min(0).max(1),
});

export type TypeSafeDecisionPayload = z.infer<typeof typeSafeDecisionSchema>;