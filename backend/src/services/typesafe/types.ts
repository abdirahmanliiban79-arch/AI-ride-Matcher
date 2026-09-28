import type { MatchType } from '../../types/rideMatch.types';
import type { DriverCandidate, RideRequirements } from '../matching/eligibility';

export type TypeSafeDecisionRequest = {
  requirements: RideRequirements;
  candidates: DriverCandidate[];
};

export type TypeSafeDecision = {
  selectedDriverId: string;
  matchType: MatchType;
  confidence: number;
};

export type TypeSafeCallMeta = {
  model: string;
  provider: string | null;
  latencyMs: number;
  totalTokens: number | null;
  cost: number | null;
};

export type TypeSafeDecisionResult = {
  decision: TypeSafeDecision;
  meta: TypeSafeCallMeta;
};