'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { RequireAuth } from '@/components/RequireAuth';
import { ApiError } from '@/lib/api/client';
import { createRide } from '@/lib/api/rides';
import { setLastRideId, type StoredSession } from '@/lib/session';
import type { VehicleType } from '@/types/api';

export default function NewRidePage() {
  return <RequireAuth role="passenger">{(session) => <NewRide session={session} />}</RequireAuth>;
}

function NewRide({ session }: { session: StoredSession }) {
  const router = useRouter();
  const [pickupLat, setPickupLat] = useState('0');
  const [pickupLng, setPickupLng] = useState('0');
  const [destinationLat, setDestinationLat] = useState('2');
  const [destinationLng, setDestinationLng] = useState('2');
  const [maxPrice, setMaxPrice] = useState('25');
  const [maxWaitTime, setMaxWaitTime] = useState('15');
  const [vehicleType, setVehicleType] = useState<VehicleType>('economy');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await createRide(session.token, {
        pickup: { latitude: Number(pickupLat), longitude: Number(pickupLng) },
        destination: {
          latitude: Number(destinationLat),
          longitude: Number(destinationLng),
        },
        maxPrice: Number(maxPrice),
        preferredVehicleType: vehicleType,
        maxWaitTime: Number(maxWaitTime),
      });

      setLastRideId(result.ride.id);
      router.push(`/rides/${result.ride.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not create ride');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h1>New ride</h1>
      <form className="form" onSubmit={handleSubmit}>
        <div className="grid-2">
          <label>
            Pickup latitude
            <input
              type="number"
              step="any"
              value={pickupLat}
              onChange={(event) => setPickupLat(event.target.value)}
              required
            />
          </label>
          <label>
            Pickup longitude
            <input
              type="number"
              step="any"
              value={pickupLng}
              onChange={(event) => setPickupLng(event.target.value)}
              required
            />
          </label>
        </div>
        <div className="grid-2">
          <label>
            Destination latitude
            <input
              type="number"
              step="any"
              value={destinationLat}
              onChange={(event) => setDestinationLat(event.target.value)}
              required
            />
          </label>
          <label>
            Destination longitude
            <input
              type="number"
              step="any"
              value={destinationLng}
              onChange={(event) => setDestinationLng(event.target.value)}
              required
            />
          </label>
        </div>
        <div className="grid-2">
          <label>
            Max price
            <input
              type="number"
              step="any"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              required
            />
          </label>
          <label>
            Max wait (minutes)
            <input
              type="number"
              min="1"
              value={maxWaitTime}
              onChange={(event) => setMaxWaitTime(event.target.value)}
              required
            />
          </label>
        </div>
        <label>
          Vehicle type
          <select
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value as VehicleType)}
          >
            <option value="economy">economy</option>
            <option value="comfort">comfort</option>
            <option value="xl">xl</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create ride'}
        </button>
      </form>
    </section>
  );
}