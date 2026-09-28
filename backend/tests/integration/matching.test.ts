import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import { ObjectId } from 'mongodb';

import { connectToDatabase, disconnectFromDatabase, getDb } from '../../src/config/db';
import { env } from '../../src/config/env';
import { ensureIndexes } from '../../src/config/indexes';
import { createDriver, findDriverById, setDriverAvailabilityById } from '../../src/repositories/drivers.repository';
import { findRideMatchesByRideId } from '../../src/repositories/rideMatches.repository';
import { createRide, findRideById, type CreateRideInput } from '../../src/repositories/rides.repository';
import { createUser } from '../../src/repositories/users.repository';
import {
  matchRideForPassenger,
  type DecisionProvider,
} from '../../src/services/matching/matching.service';
import type { TypeSafeDecisionResult } from '../../src/services/typesafe/types';
import type { DriverDocument } from '../../src/types/driver.types';
import type { MatchType } from '../../src/types/rideMatch.types';
import type { RideDocument } from '../../src/types/ride.types';
import type { UserDocument } from '../../src/types/user.types';
import { AppError } from '../../src/utils/AppError';

let phoneCounter = 0;

function nextPhone(prefix: string): string {
  phoneCounter += 1;

  return `${prefix}${phoneCounter.toString().padStart(4, '0')}`;
}

async function createPassenger(): Promise<UserDocument> {
  return createUser({
    name: 'Test Passenger',
    phone: nextPhone('+1555100'),
    passwordHash: 'test-hash',
    role: 'passenger',
  });
}

async function createAvailableDriver(
  overrides: Partial<DriverDocument> = {},
): Promise<DriverDocument> {
  const user = await createUser({
    name: 'Test Driver',
    phone: nextPhone('+1555200'),
    passwordHash: 'test-hash',
    role: 'driver',
  });

  return createDriver({
    userId: user._id,
    vehicleType: 'economy',
    rating: 4.8,
    isAvailable: true,
    latitude: 0.01,
    longitude: 0,
    ...overrides,
  });
}

async function createTestRide(
  passengerId: ObjectId,
  overrides: Partial<CreateRideInput> = {},
): Promise<RideDocument> {
  return createRide({
    passengerId,
    pickup: { latitude: 0, longitude: 0 },
    destination: { latitude: 2, longitude: 2 },
    maxPrice: 25,
    preferredVehicleType: 'economy',
    maxWaitTime: 30,
    status: 'REQUESTED',
    assignedDriverId: null,
    ...overrides,
  });
}

function actorFor(passenger: UserDocument): { id: string; role: 'passenger' } {
  return { id: passenger._id.toHexString(), role: 'passenger' };
}

function decisionResult(
  selectedDriverId: string,
  confidence = 0.95,
  matchType: MatchType = 'best_match',
): TypeSafeDecisionResult {
  return {
    decision: { selectedDriverId, matchType, confidence },
    meta: { model: 'mock-model', provider: 'mock', latencyMs: 1, totalTokens: 10, cost: 0 },
  };
}

function mockProvider(result: TypeSafeDecisionResult): DecisionProvider {
  return async () => result;
}

async function expectAppError(
  promise: Promise<unknown>,
  statusCode: number,
  code: string,
): Promise<void> {
  await assert.rejects(
    promise,
    (error: unknown) =>
      error instanceof AppError && error.statusCode === statusCode && error.code === code,
  );
}

describe('matching pipeline (integration)', () => {
  before(async () => {
    if (!env.MONGODB_URI.includes('_test')) {
      throw new Error('Tests must run against a database whose name ends with _test');
    }

    await connectToDatabase();
  });

  beforeEach(async () => {
    await getDb().dropDatabase();
    await ensureIndexes(getDb());
  });

  after(async () => {
    await getDb().dropDatabase();
    await disconnectFromDatabase();
  });

  it('assigns the selected driver and records the match', async () => {
    const passenger = await createPassenger();
    const driver = await createAvailableDriver();
    const ride = await createTestRide(passenger._id);

    const outcome = await matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
      requestDecision: mockProvider(decisionResult(driver._id.toHexString(), 0.93)),
    });

    assert.equal(outcome.match.matchType, 'best_match');
    assert.equal(outcome.match.driverId, driver._id.toHexString());
    assert.equal(outcome.ride.status, 'MATCHED');
    assert.equal(outcome.ride.assignedDriverId, driver._id.toHexString());
    assert.equal(outcome.ride.driver?.id, driver._id.toHexString());

    const reloadedDriver = await findDriverById(driver._id.toHexString());
    assert.equal(reloadedDriver?.isAvailable, false);

    const matches = await findRideMatchesByRideId(ride._id.toHexString());
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.matchType, 'best_match');
    assert.equal(matches[0]?.driverId?.toHexString(), driver._id.toHexString());
    assert.equal(matches[0]?.confidence, 0.93);
  });

  it('rejects an AI selection outside the candidate list', async () => {
    const passenger = await createPassenger();
    const driver = await createAvailableDriver();
    const ride = await createTestRide(passenger._id);
    const unknownDriverId = new ObjectId().toHexString();

    await expectAppError(
      matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
        requestDecision: mockProvider(decisionResult(unknownDriverId)),
      }),
      502,
      'AI_INVALID_SELECTION',
    );

    const reloadedRide = await findRideById(ride._id.toHexString());
    assert.equal(reloadedRide?.status, 'REQUESTED');
    assert.equal(reloadedRide?.assignedDriverId, null);
    assert.equal((await findRideMatchesByRideId(ride._id.toHexString())).length, 0);

    const reloadedDriver = await findDriverById(driver._id.toHexString());
    assert.equal(reloadedDriver?.isAvailable, true);
  });

  it('returns a controlled conflict when the driver is claimed during the AI call', async () => {
    const passenger = await createPassenger();
    const driver = await createAvailableDriver();
    const ride = await createTestRide(passenger._id);

    const racingProvider: DecisionProvider = async () => {
      await setDriverAvailabilityById(driver._id, false);

      return decisionResult(driver._id.toHexString());
    };

    await expectAppError(
      matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
        requestDecision: racingProvider,
      }),
      409,
      'DRIVER_ASSIGNMENT_CONFLICT',
    );

    const reloadedRide = await findRideById(ride._id.toHexString());
    assert.equal(reloadedRide?.status, 'REQUESTED');
    assert.equal(reloadedRide?.assignedDriverId, null);
    assert.equal((await findRideMatchesByRideId(ride._id.toHexString())).length, 0);
  });

  it('downgrades low-confidence best_match to human_review without assigning', async () => {
    const passenger = await createPassenger();
    const driver = await createAvailableDriver();
    const ride = await createTestRide(passenger._id);

    const outcome = await matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
      requestDecision: mockProvider(decisionResult(driver._id.toHexString(), 0.2)),
    });

    assert.equal(outcome.match.matchType, 'human_review');
    assert.equal(outcome.match.driverId, null);
    assert.equal(outcome.ride.status, 'REQUESTED');

    const reloadedDriver = await findDriverById(driver._id.toHexString());
    assert.equal(reloadedDriver?.isAvailable, true);

    const matches = await findRideMatchesByRideId(ride._id.toHexString());
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.matchType, 'human_review');
    assert.equal(matches[0]?.driverId?.toHexString(), driver._id.toHexString());
  });

  it('handles AI no_match without assigning', async () => {
    const passenger = await createPassenger();
    const driver = await createAvailableDriver();
    const ride = await createTestRide(passenger._id);

    const outcome = await matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
      requestDecision: mockProvider(decisionResult(driver._id.toHexString(), 0.1, 'no_match')),
    });

    assert.equal(outcome.match.matchType, 'no_match');
    assert.equal(outcome.match.driverId, null);
    assert.equal(outcome.ride.status, 'REQUESTED');
  });

  it('propagates AI failures and reverts the ride to REQUESTED', async () => {
    const passenger = await createPassenger();
    await createAvailableDriver();
    const ride = await createTestRide(passenger._id);

    const failingProvider: DecisionProvider = async () => {
      throw new AppError(502, 'AI_PROVIDER_ERROR', 'provider down');
    };

    await expectAppError(
      matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
        requestDecision: failingProvider,
      }),
      502,
      'AI_PROVIDER_ERROR',
    );
    assert.equal((await findRideById(ride._id.toHexString()))?.status, 'REQUESTED');

    const timeoutProvider: DecisionProvider = async () => {
      throw new AppError(504, 'AI_TIMEOUT', 'timed out');
    };

    await expectAppError(
      matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
        requestDecision: timeoutProvider,
      }),
      504,
      'AI_TIMEOUT',
    );
    assert.equal((await findRideById(ride._id.toHexString()))?.status, 'REQUESTED');
  });

  it('does not consult the AI when no driver is eligible', async () => {
    const passenger = await createPassenger();
    const ride = await createTestRide(passenger._id);
    let calls = 0;

    const provider: DecisionProvider = async () => {
      calls += 1;

      return decisionResult(new ObjectId().toHexString());
    };

    const outcome = await matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
      requestDecision: provider,
    });

    assert.equal(calls, 0);
    assert.equal(outcome.match.matchType, 'no_match');
    assert.equal(outcome.ride.status, 'REQUESTED');
  });

  it('allows only one of two concurrent matches to claim a driver', async () => {
    const passengerA = await createPassenger();
    const passengerB = await createPassenger();
    const driver = await createAvailableDriver();
    const rideA = await createTestRide(passengerA._id);
    const rideB = await createTestRide(passengerB._id);
    const provider = mockProvider(decisionResult(driver._id.toHexString()));

    const results = await Promise.allSettled([
      matchRideForPassenger(rideA._id.toHexString(), actorFor(passengerA), {
        requestDecision: provider,
      }),
      matchRideForPassenger(rideB._id.toHexString(), actorFor(passengerB), {
        requestDecision: provider,
      }),
    ]);

    const fulfilled = results.find(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof matchRideForPassenger>>> =>
        result.status === 'fulfilled',
    );
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    assert.ok(fulfilled, 'exactly one match should succeed');
    assert.ok(rejected, 'exactly one match should fail');
    assert.ok(rejected.reason instanceof AppError);
    assert.equal(rejected.reason.code, 'DRIVER_ASSIGNMENT_CONFLICT');
    assert.equal(fulfilled.value.match.matchType, 'best_match');

    const matchCount = await getDb()
      .collection('rideMatches')
      .countDocuments({ driverId: driver._id });
    assert.equal(matchCount, 1);

    const statuses = await Promise.all(
      [rideA, rideB].map(async (ride) => (await findRideById(ride._id.toHexString()))?.status),
    );
    assert.ok(statuses.includes('MATCHED'));
    assert.ok(statuses.includes('REQUESTED'));

    const reloadedDriver = await findDriverById(driver._id.toHexString());
    assert.equal(reloadedDriver?.isAvailable, false);
  });

  it('emits exactly one structured outcome event for a successful match', async () => {
    const passenger = await createPassenger();
    const driver = await createAvailableDriver();
    const ride = await createTestRide(passenger._id);
    const logMock = mock.method(console, 'log', () => undefined);

    try {
      await matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
        requestDecision: mockProvider(decisionResult(driver._id.toHexString(), 0.95)),
      });
    } finally {
      logMock.mock.restore();
    }

    const events = logMock.mock.calls
      .map((call) => call.arguments[0])
      .filter((line): line is string => typeof line === 'string')
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((entry) => entry.event === 'ride_match');

    assert.equal(events.length, 1);
    const event = events[0];
    assert.ok(event, 'one ride_match event expected');
    assert.equal(event.outcome, 'best_match');
    assert.equal(event.rideId, ride._id.toHexString());
    assert.equal(event.candidateCount, 1);
    assert.equal(event.selectedDriverId, driver._id.toHexString());
    assert.equal(event.confidence, 0.95);
    assert.equal(typeof event.durationMs, 'number');
    assert.equal(event.aiCalled, true);
    assert.equal(event.aiModel, 'mock-model');
    assert.equal(event.aiProvider, 'mock');
    assert.ok(!('apiKey' in event));
    assert.ok(!('authorization' in event));
  });

  it('logs no_match attempts that never call the AI', async () => {
    const passenger = await createPassenger();
    const ride = await createTestRide(passenger._id);
    const logMock = mock.method(console, 'log', () => undefined);

    try {
      await matchRideForPassenger(ride._id.toHexString(), actorFor(passenger), {
        requestDecision: async () => {
          throw new Error('AI must not be called');
        },
      });
    } finally {
      logMock.mock.restore();
    }

    const events = logMock.mock.calls
      .map((call) => call.arguments[0])
      .filter((line): line is string => typeof line === 'string')
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((entry) => entry.event === 'ride_match');

    assert.equal(events.length, 1);
    const event = events[0];
    assert.ok(event, 'one ride_match event expected');
    assert.equal(event.outcome, 'no_match');
    assert.equal(event.candidateCount, 0);
    assert.equal(event.aiCalled, false);
  });

  it('surfaces database failures instead of assigning', async () => {
    await disconnectFromDatabase();

    await assert.rejects(
      matchRideForPassenger('000000000000000000000000', {
        id: '000000000000000000000000',
        role: 'passenger',
      }),
      /Database connection has not been established/,
    );

    await connectToDatabase();
  });
});