import type { ObjectId } from 'mongodb';

export const MATCH_TYPES = ['best_match', 'no_match', 'human_review'] as const;

export type MatchType = (typeof MATCH_TYPES)[number];

export type RideMatchDocument = {
  _id: ObjectId;
  rideId: ObjectId;
  driverId: ObjectId | null;
  confidence: number;
  matchType: MatchType;
  createdAt: Date;
};