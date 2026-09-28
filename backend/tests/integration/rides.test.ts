import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import type { ObjectId } from 'mongodb';

import { connectToDatabase, disconnectFromDatabase, getDb } from '../../src/config/db';
import { env } from '../../src/config/env';
import { ensureIndexes } from '../../src/config/indexes';
import {
  createDriver,
  findDriverById,
  setDriverAvailabilityById,
} from '../../src/repositories/drivers.repository';
import {
  createRide,
  updateRideIfStatus,
  type CreateRideInput,
} from '../../src/repositories/rides.repository';
import { createUser } from '../../src/repositories/users.repository';
import { acceptRideByDriver, cancelRideForActor } from '../../src/services/rides.service';
import type { DriverDocument } from '../../src/types/driver.types';
import type { RideDocument } from '../../src/types/ride.types';
import type { UserDocument } from '../../src/types/user.types';
import { AppError } from '../../src/utils/AppError';

let phoneCounter = 5000;

function nextPhone(prefix: string): string {
  phoneCounter += 1;

  return `${prefix}${phoneCounter}`;
}

async function createPassenger(): Promise<UserDocument> {
  return createUser({
    name: 'Lifecycle Passenger',
    phone: nextPhone('+1555300'),
    passwordHash: 'test-hash',
    role: 'passenger',
  });
}

async function createDriverWithProfile(): Promise<{
  user: UserDocument;
  driver: DriverDocument;
}> {
  const user = await createUser({
    name: 'Lifecycle Driver',
    phone: nextPhone('+1555400'),
    passwordHash: 'test-hash',
    role: 'driver',
  });

  const driver = await createDriver({
    userId: user._id,
    vehicleType: 'economy',
    rating: 4.7,
    isAvailable: true,
    latitude: 0.01,
    longitude: 0,
  });

  return { user, driver };
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

describe('ride lifecycle (integration)', () => {
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

  it('accepts a matched ride and rejects a second accept', async () => {
    const passenger = await createPassenger();
    const { user, driver } = await createDriverWithProfile();
    const ride = await createTestRide(passenger._id);
    await updateRideIfStatus(ride._id.toHexString(), 'REQUESTED', {
      status: 'MATCHED',
      assignedDriverId: driver._id,
    });

    const accepted = await acceptRideByDriver(ride._id.toHexString(), user._id.toHexString());
    assert.equal(accepted.status, 'ACCEPTED');

    await expectAppError(
      acceptRideByDriver(ride._id.toHexString(), user._id.toHexString()),
      409,
      'INVALID_RIDE_TRANSITION',
    );
  });

  it('blocks drivers that are not assigned to the ride', async () => {
    const passenger = await createPassenger();
    const { driver } = await createDriverWithProfile();
    const { user: otherDriverUser } = await createDriverWithProfile();
    const ride = await createTestRide(passenger._id);
    await updateRideIfStatus(ride._id.toHexString(), 'REQUESTED', {
      status: 'MATCHED',
      assignedDriverId: driver._id,
    });

    await expectAppError(
      acceptRideByDriver(ride._id.toHexString(), otherDriverUser._id.toHexString()),
      403,
      'FORBIDDEN',
    );
  });

  it('releases the driver when the driver cancels a matched ride', async () => {
    const passenger = await createPassenger();
    const { user, driver } = await createDriverWithProfile();
    const ride = await createTestRide(passenger._id);
    await updateRideIfStatus(ride._id.toHexString(), 'REQUESTED', {
      status: 'MATCHED',
      assignedDriverId: driver._id,
    });
    await setDriverAvailabilityById(driver._id, false);

    const cancelled = await cancelRideForActor(ride._id.toHexString(), {
      id: user._id.toHexString(),
      role: 'driver',
    });

    assert.equal(cancelled.status, 'CANCELLED');
    const reloadedDriver = await findDriverById(driver._id.toHexString());
    assert.equal(reloadedDriver?.isAvailable, true);

    await expectAppError(
      acceptRideByDriver(ride._id.toHexString(), user._id.toHexString()),
      409,
      'INVALID_RIDE_TRANSITION',
    );
  });

  it('lets the passenger cancel and blocks other passengers', async () => {
    const passenger = await createPassenger();
    const otherPassenger = await createPassenger();
    const ride = await createTestRide(passenger._id);

    await expectAppError(
      cancelRideForActor(ride._id.toHexString(), {
        id: otherPassenger._id.toHexString(),
        role: 'passenger',
      }),
      403,
      'FORBIDDEN',
    );

    const cancelled = await cancelRideForActor(ride._id.toHexString(), {
      id: passenger._id.toHexString(),
      role: 'passenger',
    });
    assert.equal(cancelled.status, 'CANCELLED');

    await expectAppError(
      cancelRideForActor(ride._id.toHexString(), {
        id: passenger._id.toHexString(),
        role: 'passenger',
      }),
      409,
      'INVALID_RIDE_TRANSITION',
    );
  });

  it('rejects cancellation of completed rides', async () => {
    const passenger = await createPassenger();
    const { driver } = await createDriverWithProfile();
    const ride = await createTestRide(passenger._id);
    const rideId = ride._id.toHexString();

    await updateRideIfStatus(rideId, 'REQUESTED', { status: 'MATCHING' });
    await updateRideIfStatus(rideId, 'MATCHING', { status: 'MATCHED', assignedDriverId: driver._id });
    await updateRideIfStatus(rideId, 'MATCHED', { status: 'ACCEPTED' });
    await updateRideIfStatus(rideId, 'ACCEPTED', { status: 'IN_PROGRESS' });
    await updateRideIfStatus(rideId, 'IN_PROGRESS', { status: 'COMPLETED' });

    await expectAppError(
      cancelRideForActor(rideId, { id: passenger._id.toHexString(), role: 'passenger' }),
      409,
      'INVALID_RIDE_TRANSITION',
    );
  });
});