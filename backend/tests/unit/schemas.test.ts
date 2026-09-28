import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ZodError } from 'zod';

import { loginSchema, registerSchema } from '../../src/schemas/auth.schemas';
import { availabilitySchema, locationSchema } from '../../src/schemas/driver.schemas';
import { createRideSchema, rideIdParamSchema } from '../../src/schemas/ride.schemas';

const VALID_REGISTRATION = {
  name: 'Amina',
  phone: '+15550000001',
  password: 'secret123',
  role: 'passenger',
};

const VALID_RIDE = {
  pickup: { latitude: 0, longitude: 0 },
  destination: { latitude: 2, longitude: 2 },
  maxPrice: 25,
  preferredVehicleType: 'economy',
  maxWaitTime: 15,
};

describe('request schemas', () => {
  it('accepts valid registration payloads and trims strings', () => {
    const parsed = registerSchema.parse({
      ...VALID_REGISTRATION,
      name: '  Amina  ',
      phone: ' +15550000001 ',
    });

    assert.equal(parsed.name, 'Amina');
    assert.equal(parsed.phone, '+15550000001');
  });

  it('rejects short passwords and unknown roles', () => {
    assert.throws(() => registerSchema.parse({ ...VALID_REGISTRATION, password: 'short' }), ZodError);
    assert.throws(() => registerSchema.parse({ ...VALID_REGISTRATION, role: 'captain' }), ZodError);
  });

  it('rejects login payloads without credentials', () => {
    assert.throws(() => loginSchema.parse({ phone: '+1555', password: '' }), ZodError);
  });

  it('accepts valid ride payloads', () => {
    assert.equal(createRideSchema.parse(VALID_RIDE).maxWaitTime, 15);
  });

  it('rejects rides with bad coordinates, price, vehicle or wait time', () => {
    assert.throws(
      () => createRideSchema.parse({ ...VALID_RIDE, pickup: { latitude: 91, longitude: 0 } }),
      ZodError,
    );
    assert.throws(() => createRideSchema.parse({ ...VALID_RIDE, maxPrice: -5 }), ZodError);
    assert.throws(
      () => createRideSchema.parse({ ...VALID_RIDE, preferredVehicleType: 'rocket' }),
      ZodError,
    );
    assert.throws(() => createRideSchema.parse({ ...VALID_RIDE, maxWaitTime: 0 }), ZodError);
    assert.throws(() => createRideSchema.parse({ ...VALID_RIDE, maxWaitTime: 1.5 }), ZodError);
  });

  it('validates driver payloads', () => {
    assert.equal(availabilitySchema.parse({ isAvailable: true }).isAvailable, true);
    assert.throws(() => availabilitySchema.parse({ isAvailable: 'yes' }), ZodError);
    assert.equal(locationSchema.parse({ latitude: -90, longitude: 180 }).latitude, -90);
    assert.throws(() => locationSchema.parse({ latitude: -90.1, longitude: 0 }), ZodError);
    assert.throws(() => locationSchema.parse({ latitude: 0, longitude: 180.1 }), ZodError);
  });

  it('rejects empty ride ids', () => {
    assert.throws(() => rideIdParamSchema.parse({ id: '' }), ZodError);
  });
});