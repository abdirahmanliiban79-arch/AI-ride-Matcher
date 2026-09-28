import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { haversineDistanceKm } from '../../src/utils/distance';

const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };

describe('haversineDistanceKm', () => {
  it('returns 0 for the same point', () => {
    assert.equal(haversineDistanceKm(PARIS, PARIS), 0);
  });

  it('computes Paris to London (~343.5 km)', () => {
    const distance = haversineDistanceKm(PARIS, LONDON);
    assert.ok(Math.abs(distance - 343.5) < 1, `got ${distance}`);
  });

  it('is symmetric', () => {
    assert.equal(haversineDistanceKm(PARIS, LONDON), haversineDistanceKm(LONDON, PARIS));
  });

  it('handles antimeridian crossings', () => {
    const distance = haversineDistanceKm(
      { latitude: 0, longitude: 179.9 },
      { latitude: 0, longitude: -179.9 },
    );
    assert.ok(Math.abs(distance - 22.24) < 0.5, `got ${distance}`);
  });

  it('computes 1 degree of latitude as ~111.19 km', () => {
    const distance = haversineDistanceKm(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    assert.ok(Math.abs(distance - 111.19) < 0.5, `got ${distance}`);
  });

  it('computes 1 degree of longitude at the equator as ~111.19 km', () => {
    const distance = haversineDistanceKm(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    );
    assert.ok(Math.abs(distance - 111.19) < 0.5, `got ${distance}`);
  });
});