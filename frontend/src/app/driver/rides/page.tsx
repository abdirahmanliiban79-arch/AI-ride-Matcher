'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { RequireAuth } from '@/components/RequireAuth';
import { ApiError } from '@/lib/api/client';
import { getDriverProfile } from '@/lib/api/drivers';
import { acceptRide, cancelRide, getRide } from '@/lib/api/rides';
import type { StoredSession } from '@/lib/session';
import type { Ride } from '@/types/api';

export default function DriverRidesPage() {
  return <RequireAuth role="driver">{(session) => <DriverRides session={session} />}</RequireAuth>;
}

function DriverRides({ session }: { session: StoredSession }) {
  const [rideId, setRideId] = useState('');
  const [ride, setRide] = useState<Ride | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getDriverProfile(session.token)
      .then((result) => setDriverId(result.driver.id))
      .catch(() => setDriverId(null));
  }, [session.token]);

  const openRide = useCallback(
    async (id: string) => {
      setBusy(true);
      setError(null);

      try {
        const result = await getRide(session.token, id);
        setRide(result.ride);
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'Failed to load ride');
        setRide(null);
      } finally {
        setBusy(false);
      }
    },
    [session.token],
  );

  function handleOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void openRide(rideId.trim());
  }

  async function handleAccept() {
    if (!ride) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await acceptRide(session.token, ride.id);
      setRide(result.ride);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to accept ride');
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    if (!ride) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await cancelRide(session.token, ride.id);
      setRide(result.ride);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to cancel ride');
    } finally {
      setBusy(false);
    }
  }

  const isAssigned =
    ride !== null && ride.assignedDriverId !== null && ride.assignedDriverId === driverId;

  return (
    <section className="card">
      <h1>My rides</h1>
      <p className="muted">Open a matched ride by its ID to accept or decline it.</p>
      <form className="form" onSubmit={handleOpen}>
        <label>
          Ride ID
          <input value={rideId} onChange={(event) => setRideId(event.target.value)} required />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          Open ride
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {ride && (
        <div>
          <p className="ride-id muted">{ride.id}</p>
          <p>
            <span className={`badge badge-${ride.status.toLowerCase()}`}>{ride.status}</span>
          </p>
          <p className="muted">
            Pickup {ride.pickup.latitude}, {ride.pickup.longitude} → destination{' '}
            {ride.destination.latitude}, {ride.destination.longitude}
          </p>
          <div className="actions">
            {isAssigned && ride.status === 'MATCHED' && (
              <button className="btn" disabled={busy} onClick={() => void handleAccept()}>
                Accept ride
              </button>
            )}
            {isAssigned && (ride.status === 'MATCHED' || ride.status === 'ACCEPTED') && (
              <button className="btn secondary" disabled={busy} onClick={() => void handleDecline()}>
                Decline / cancel
              </button>
            )}
            <button className="btn secondary" disabled={busy} onClick={() => void openRide(ride.id)}>
              Refresh
            </button>
          </div>
        </div>
      )}
    </section>
  );
}