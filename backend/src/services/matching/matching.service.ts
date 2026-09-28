import type { ObjectId } from 'mongodb';

import { env } from '../../config/env';
import { findAvailableDrivers } from '../../repositories/drivers.repository';
import { createRideMatch } from '../../repositories/rideMatches.repository';
import { findRideById, updateRideIfStatus } from '../../repositories/rides.repository';
import type { DriverDocument } from '../../types/driver.types';
import type { RideDocument } from '../../types/ride.types';
import type { MatchType } from '../../types/rideMatch.types';
import type { AuthUser } from '../../types/user.types';
import { AppError } from '../../utils/AppError';
import { logEvent } from '../../utils/logger';
import { toObjectId } from '../../utils/objectId';
import { claimDriver, releaseDriver } from '../drivers.service';
import { buildRideView, type RideView } from '../rides.service';
import type {
  TypeSafeCallMeta,
  TypeSafeDecisionRequest,
  TypeSafeDecisionResult,
} from '../typesafe/types';
import { requestTypeSafeDecision } from '../typesafe/typesafe.service';
import {
  filterEligibleDrivers,
  satisfiesRideConstraints,
  type RideRequirements,
} from './eligibility';

export type MatchOutcome = {
  ride: RideView;
  match: {
    matchType: MatchType;
    confidence: number;
    driverId: string | null;
  };
};

export type DecisionProvider = (
  request: TypeSafeDecisionRequest,
) => Promise<TypeSafeDecisionResult>;

function toRequirements(ride: RideDocument): RideRequirements {
  return {
    pickup: ride.pickup,
    destination: ride.destination,
    maxPrice: ride.maxPrice,
    preferredVehicleType: ride.preferredVehicleType,
    maxWaitTime: ride.maxWaitTime,
  };
}

function errorCodeOf(error: unknown): string {
  return error instanceof AppError ? error.code : 'UNKNOWN';
}

function toAiFields(meta: TypeSafeCallMeta): Record<string, unknown> {
  return {
    aiCalled: true,
    aiModel: meta.model,
    aiProvider: meta.provider,
    aiLatencyMs: meta.latencyMs,
    aiTotalTokens: meta.totalTokens,
    aiCost: meta.cost,
  };
}

async function reloadRide(rideId: string): Promise<RideDocument> {
  const current = await findRideById(rideId);
  if (!current) {
    throw new AppError(404, 'RIDE_NOT_FOUND', 'Ride was not found');
  }

  return current;
}

async function revertToRequested(rideId: string): Promise<RideDocument> {
  const reverted = await updateRideIfStatus(rideId, 'MATCHING', { status: 'REQUESTED' });
  if (reverted) {
    return reverted;
  }

  return reloadRide(rideId);
}

async function ensureRideMatching(ride: RideDocument): Promise<void> {
  if (ride.status === 'MATCHING') {
    return;
  }

  const matching = await updateRideIfStatus(ride._id.toHexString(), 'REQUESTED', {
    status: 'MATCHING',
  });
  if (matching) {
    return;
  }

  const current = await reloadRide(ride._id.toHexString());
  if (current.status === 'MATCHING') {
    return;
  }

  throw new AppError(
    409,
    'INVALID_RIDE_TRANSITION',
    `Cannot match a ride with status ${current.status}`,
  );
}

async function finishWithoutAssignment(
  ride: RideDocument,
  matchType: 'no_match' | 'human_review',
  driverId: ObjectId | null,
  confidence: number,
  candidateCount: number,
  startedAt: number,
  extra: Record<string, unknown> = {},
): Promise<MatchOutcome> {
  try {
    await createRideMatch({ rideId: ride._id, driverId, confidence, matchType });
  } catch (error) {
    await revertToRequested(ride._id.toHexString());
    logEvent('ride_match', {
      rideId: ride._id.toHexString(),
      candidateCount,
      outcome: 'error',
      durationMs: Date.now() - startedAt,
      errorCode: errorCodeOf(error),
      ...extra,
    });
    throw error;
  }

  const reverted = await revertToRequested(ride._id.toHexString());
  logEvent('ride_match', {
    rideId: ride._id.toHexString(),
    candidateCount,
    outcome: matchType,
    confidence,
    durationMs: Date.now() - startedAt,
    ...extra,
  });

  return {
    ride: await buildRideView(reverted),
    match: { matchType, confidence, driverId: null },
  };
}

export async function matchRideForPassenger(
  rideId: string,
  actor: AuthUser,
  options: { requestDecision?: DecisionProvider } = {},
): Promise<MatchOutcome> {
  const requestDecision = options.requestDecision ?? requestTypeSafeDecision;
  const startedAt = Date.now();

  const ride = await findRideById(rideId);
  if (!ride) {
    throw new AppError(404, 'RIDE_NOT_FOUND', 'Ride was not found');
  }

  if (ride.passengerId.toHexString() !== actor.id) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this ride');
  }

  await ensureRideMatching(ride);

  const requirements = toRequirements(ride);
  const availableDrivers = await findAvailableDrivers();
  const candidates = filterEligibleDrivers(requirements, availableDrivers);

  const attemptFields = (): Record<string, unknown> => ({
    rideId: ride._id.toHexString(),
    candidateCount: candidates.length,
    durationMs: Date.now() - startedAt,
  });

  if (candidates.length === 0) {
    return finishWithoutAssignment(ride, 'no_match', null, 0, 0, startedAt, {
      aiCalled: false,
    });
  }

  let result: TypeSafeDecisionResult;
  try {
    result = await requestDecision({ requirements, candidates });
  } catch (error) {
    await revertToRequested(ride._id.toHexString());
    logEvent('ride_match', {
      ...attemptFields(),
      outcome: 'ai_error',
      errorCode: errorCodeOf(error),
      aiCalled: true,
    });
    throw error;
  }

  const { decision, meta } = result;
  const aiFields = toAiFields(meta);
  const candidateIds = new Set(candidates.map((candidate) => candidate.driverId));
  const selectedIsCandidate = candidateIds.has(decision.selectedDriverId);

  if (decision.matchType === 'no_match') {
    return finishWithoutAssignment(
      ride,
      'no_match',
      null,
      decision.confidence,
      candidates.length,
      startedAt,
      aiFields,
    );
  }

  if (decision.matchType === 'human_review') {
    const driverId = selectedIsCandidate ? toObjectId(decision.selectedDriverId) : null;

    return finishWithoutAssignment(
      ride,
      'human_review',
      driverId,
      decision.confidence,
      candidates.length,
      startedAt,
      { selectedDriverId: decision.selectedDriverId, ...aiFields },
    );
  }

  if (!selectedIsCandidate) {
    await revertToRequested(ride._id.toHexString());
    logEvent('ride_match', {
      ...attemptFields(),
      outcome: 'invalid_selection',
      selectedDriverId: decision.selectedDriverId,
      confidence: decision.confidence,
      ...aiFields,
    });
    throw new AppError(
      502,
      'AI_INVALID_SELECTION',
      'AI selected a driver outside the candidate list',
    );
  }

  if (decision.confidence < env.TYPE_SAFE_CONFIDENCE_THRESHOLD) {
    return finishWithoutAssignment(
      ride,
      'human_review',
      toObjectId(decision.selectedDriverId),
      decision.confidence,
      candidates.length,
      startedAt,
      { selectedDriverId: decision.selectedDriverId, ...aiFields },
    );
  }

  const driverObjectId = toObjectId(decision.selectedDriverId);

  let claimed: DriverDocument | null = null;
  try {
    claimed = await claimDriver(driverObjectId);
  } catch (error) {
    await revertToRequested(ride._id.toHexString());
    logEvent('ride_match', {
      ...attemptFields(),
      outcome: 'error',
      selectedDriverId: decision.selectedDriverId,
      errorCode: errorCodeOf(error),
      ...aiFields,
    });
    throw error;
  }

  if (!claimed) {
    await revertToRequested(ride._id.toHexString());
    logEvent('ride_match', {
      ...attemptFields(),
      outcome: 'conflict',
      reason: 'driver_claimed',
      selectedDriverId: decision.selectedDriverId,
      confidence: decision.confidence,
      ...aiFields,
    });
    throw new AppError(
      409,
      'DRIVER_ASSIGNMENT_CONFLICT',
      'The selected driver was just assigned to another ride',
    );
  }

  if (!satisfiesRideConstraints(requirements, claimed)) {
    await releaseDriver(claimed._id);
    await revertToRequested(ride._id.toHexString());
    logEvent('ride_match', {
      ...attemptFields(),
      outcome: 'conflict',
      reason: 'driver_not_eligible',
      selectedDriverId: claimed._id.toHexString(),
      confidence: decision.confidence,
      ...aiFields,
    });
    throw new AppError(
      409,
      'DRIVER_ASSIGNMENT_CONFLICT',
      'The selected driver no longer satisfies the ride constraints',
    );
  }

  try {
    await createRideMatch({
      rideId: ride._id,
      driverId: claimed._id,
      confidence: decision.confidence,
      matchType: 'best_match',
    });

    const updated = await updateRideIfStatus(ride._id.toHexString(), 'MATCHING', {
      status: 'MATCHED',
      assignedDriverId: claimed._id,
    });

    if (!updated) {
      throw new AppError(409, 'RIDE_STATUS_CONFLICT', 'Ride status changed while matching');
    }

    logEvent('ride_match', {
      ...attemptFields(),
      outcome: 'best_match',
      selectedDriverId: claimed._id.toHexString(),
      confidence: decision.confidence,
      ...aiFields,
    });

    return {
      ride: await buildRideView(updated),
      match: {
        matchType: 'best_match',
        confidence: decision.confidence,
        driverId: claimed._id.toHexString(),
      },
    };
  } catch (error) {
    await releaseDriver(claimed._id);
    await revertToRequested(ride._id.toHexString());
    logEvent('ride_match', {
      ...attemptFields(),
      outcome: 'error',
      selectedDriverId: claimed._id.toHexString(),
      errorCode: errorCodeOf(error),
      ...aiFields,
    });
    throw error;
  }
}