import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ObjectId } from 'mongodb';

import {
  buildDriverCandidate,
  filterEligibleDrivers,
  satisfiesRideConstraints,
  type RideRequirements,
} from '../../src/services/matching/eligibility';
import type { DriverDocument } from '../../src/types/driver.types';

const BASE_REQUIREMENTS: RideRequirements = {
  pickup: { latitude: 0, longitude: 0 },
  destination: { latitude: 2, longitude: 2 },
  maxPrice: 100,
  preferredVehicleType: 'economy',
  maxWaitTime: 60,
};

function makeDriver(overrides: Partial<DriverDocument> = {}): DriverDocument {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(),
    vehicleType: 'economy',
    rating: 4.5,
    isAvailable: true,
    latitude: 0.01,
    longitude: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('driver eligibility (deterministic filtering)', () => {
  it('includes an eligible driver with computed distance, ETA and price', () => {
    const candidate = buildDriverCandidate(BASE_REQUIREMENTS, makeDriver());

    assert.ok(candidate);
    assert.equal(candidate.distanceFromPickup, 1.11);
    assert.equal(candidate.estimatedArrivalMinutes, 2.2);
    assert.equal(candidate.price, 2.56);
    assert.equal(candidate.rating, 4.5);
    assert.equal(candidate.vehicleType, 'economy');
  });

  it('excludes unavailable drivers', () => {
    assert.equal(buildDriverCandidate(BASE_REQUIREMENTS, makeDriver({ isAvailable: false })), null);
  });

  it('excludes drivers with the wrong vehicle type', () => {
    assert.equal(buildDriverCandidate(BASE_REQUIREMENTS, makeDriver({ vehicleType: 'comfort' })), null);
  });

  it('excludes drivers whose ETA exceeds maxWaitTime', () => {
    assert.equal(
      buildDriverCandidate({ ...BASE_REQUIREMENTS, maxWaitTime: 1 }, makeDriver()),
      null,
    );
  });

  it('excludes drivers whose price exceeds maxPrice', () => {
    assert.equal(buildDriverCandidate({ ...BASE_REQUIREMENTS, maxPrice: 2 }, makeDriver()), null);
  });

  it('excludes drivers with invalid coordinates', () => {
    assert.equal(buildDriverCandidate(BASE_REQUIREMENTS, makeDriver({ latitude: Number.NaN })), null);
    assert.equal(buildDriverCandidate(BASE_REQUIREMENTS, makeDriver({ latitude: 999 })), null);
    assert.equal(buildDriverCandidate(BASE_REQUIREMENTS, makeDriver({ longitude: -181 })), null);
  });

  it('treats ETA and price boundaries as inclusive', () => {
    assert.ok(buildDriverCandidate({ ...BASE_REQUIREMENTS, maxWaitTime: 2.2 }, makeDriver()));
    assert.ok(buildDriverCandidate({ ...BASE_REQUIREMENTS, maxPrice: 2.56 }, makeDriver()));
  });

  it('filters a mixed list preserving input order', () => {
    const candidates = filterEligibleDrivers(BASE_REQUIREMENTS, [
      makeDriver({ latitude: 0.005 }),
      makeDriver({ isAvailable: false }),
      makeDriver({ vehicleType: 'xl' }),
      makeDriver({ latitude: Number.NaN, longitude: 1 }),
      makeDriver({ latitude: 0.008 }),
    ]);

    assert.equal(candidates.length, 2);
    assert.ok(candidates[0]!.distanceFromPickup < candidates[1]!.distanceFromPickup);
  });

  it('checks constraints without availability for post-claim revalidation', () => {
    const claimedDriver = makeDriver({ isAvailable: false });

    assert.equal(satisfiesRideConstraints(BASE_REQUIREMENTS, claimedDriver), true);
    assert.equal(buildDriverCandidate(BASE_REQUIREMENTS, claimedDriver), null);
    assert.equal(
      satisfiesRideConstraints({ ...BASE_REQUIREMENTS, preferredVehicleType: 'xl' }, claimedDriver),
      false,
    );
  });
});