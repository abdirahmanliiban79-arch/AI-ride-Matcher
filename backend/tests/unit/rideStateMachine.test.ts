import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DRIVER_CANCELLABLE_STATUSES,
  PASSENGER_CANCELLABLE_STATUSES,
  assertRideTransition,
  canTransitionRide,
} from '../../src/services/rideStateMachine';
import type { RideStatus } from '../../src/types/ride.types';
import { AppError } from '../../src/utils/AppError';

describe('ride state machine', () => {
  it('allows the happy path transitions', () => {
    const path: Array<[RideStatus, RideStatus]> = [
      ['REQUESTED', 'MATCHING'],
      ['MATCHING', 'MATCHED'],
      ['MATCHED', 'ACCEPTED'],
      ['ACCEPTED', 'IN_PROGRESS'],
      ['IN_PROGRESS', 'COMPLETED'],
    ];

    for (const [from, to] of path) {
      assert.equal(canTransitionRide(from, to), true, `${from} -> ${to}`);
    }
  });

  it('allows cancellation from every non-terminal state', () => {
    const cancellable: RideStatus[] = [
      'REQUESTED',
      'MATCHING',
      'MATCHED',
      'ACCEPTED',
      'IN_PROGRESS',
    ];

    for (const status of cancellable) {
      assert.equal(canTransitionRide(status, 'CANCELLED'), true, status);
    }
  });

  it('rejects skipping states and terminal transitions', () => {
    const invalid: Array<[RideStatus, RideStatus]> = [
      ['REQUESTED', 'MATCHED'],
      ['REQUESTED', 'ACCEPTED'],
      ['MATCHING', 'ACCEPTED'],
      ['MATCHED', 'IN_PROGRESS'],
      ['COMPLETED', 'CANCELLED'],
      ['COMPLETED', 'REQUESTED'],
      ['CANCELLED', 'REQUESTED'],
      ['CANCELLED', 'MATCHING'],
    ];

    for (const [from, to] of invalid) {
      assert.equal(canTransitionRide(from, to), false, `${from} -> ${to}`);
    }
  });

  it('throws a controlled AppError for invalid transitions', () => {
    assert.throws(
      () => assertRideTransition('COMPLETED', 'CANCELLED'),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 409 &&
        error.code === 'INVALID_RIDE_TRANSITION',
    );
  });

  it('keeps cancellation permissions explicit', () => {
    assert.deepEqual([...DRIVER_CANCELLABLE_STATUSES], ['MATCHED', 'ACCEPTED']);
    assert.deepEqual(
      [...PASSENGER_CANCELLABLE_STATUSES],
      ['REQUESTED', 'MATCHING', 'MATCHED', 'ACCEPTED', 'IN_PROGRESS'],
    );
  });
});