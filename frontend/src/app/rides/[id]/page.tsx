'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';

import { RequireAuth } from '@/components/RequireAuth';
import { ApiError } from '@/lib/api/client';
import { getDriverProfile } from '@/lib/api/drivers';
import { acceptRide, cancelRide, getRide, matchRide } from '@/lib/api/rides';
import type { StoredSession } from '@/lib/session';
import type { Ride, RideMatch } from '@/types/api';

const PASSENGER_CANCELLABLE: Ride['status'][] = [
  'REQUESTED',
  'MATCHING',
  'MATCHED',
  'ACCEPTED',
  'IN_PROGRESS',
];

const DRIVER_CANCELLABLE: Ride['status'][] = ['MATCHED', 'ACCEPTED'];

function describeMatch(match: RideMatch): string {
  const percent = Math.round(match.confidence * 100);

  if (match.matchType === 'best_match') {
    return `Matched with the best driver (confidence ${percent}%).`;
  }

  if (match.matchType === 'human_review') {
    return `Needs human review: AI confidence ${percent}% is below the configured threshold.`;
  }

  return 'No eligible drivers right now. Try again in a moment.';
}

export default function RideDetailPage({ params }: PageProps<'/rides/[id]'>) {
  const { id } = use(params);

  return <RequireAuth>{(session) => <RideDetail rideId={id} session={session} />}</RequireAuth>;
}

function RideDetail({ rideId, session }: { rideId: string; session: StoredSession }) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [match, setMatch] = useState<RideMatch | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getRide(session.token, rideId);
      setRide(result.ride);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to load ride');
    }
  }, [rideId, session.token]);

  useEffect(() => {
    getRide(session.token, rideId)
      .then((result) => {
        setRide(result.ride);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof ApiError ? caught.message : 'Failed to load ride');
      });

    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load, rideId, session.token]);

  useEffect(() => {
    if (session.user.role !== 'driver') {
      return;
    }

    void getDriverProfile(session.token)
      .then((result) => setDriverId(result.driver.id))
      .catch(() => setDriverId(null));
  }, [session.token, session.user.role]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Action failed');
    } finally {
      setBusy(false);
      void load();
    }
  }

  function handleMatch() {
    return run(async () => {
      const outcome = await matchRide(session.token, rideId);
      setRide(outcome.ride);
      setMatch(outcome.match);
    });
  }

  function handleAccept() {
    return run(async () => {
      const result = await acceptRide(session.token, rideId);
      setRide(result.ride);
    });
  }

  function handleCancel() {
    return run(async () => {
      const result = await cancelRide(session.token, rideId);
      setRide(result.ride);
    });
  }

  if (!ride) {
    return (
      <section className="card">
        <h1>Ride</h1>
        {error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>}
        <p>
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </section>
    );
  }

  const isOwner = session.user.role === 'passenger' && ride.passengerId === session.user.id;
  const isAssignedDriver =
    session.user.role === 'driver' &&
    ride.assignedDriverId !== null &&
    ride.assignedDriverId === driverId;

  return (
    <section className="card">
      <h1>Ride</h1>
      <p className="ride-id muted">{ride.id}</p>
      <p>
        <span className={`badge badge-${ride.status.toLowerCase()}`}>{ride.status}</span>
      </p>

      <dl className="detail-grid">
        <div>
          <dt>Pickup</dt>
          <dd>
            {ride.pickup.latitude}, {ride.pickup.longitude}
          </dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>
            {ride.destination.latitude}, {ride.destination.longitude}
          </dd>
        </div>
        <div>
          <dt>Vehicle</dt>
          <dd>{ride.preferredVehicleType}</dd>
        </div>
        <div>
          <dt>Max price</dt>
          <dd>{ride.maxPrice}</dd>
        </div>
        <div>
          <dt>Max wait</dt>
          <dd>{ride.maxWaitTime} min</dd>
        </div>
      </dl>

      {ride.driver && (
        <p>
          Driver: {ride.driver.name} · {ride.driver.vehicleType} · rating {ride.driver.rating}
        </p>
      )}

      {match && <p className="muted">{describeMatch(match)}</p>}

      <div className="actions">
        {isOwner && ride.status === 'REQUESTED' && (
          <button className="btn" disabled={busy} onClick={() => void handleMatch()}>
            Find driver
          </button>
        )}
        {isOwner && ride.status === 'MATCHING' && (
          <span className="muted">Matching in progress…</span>
        )}
        {isOwner && PASSENGER_CANCELLABLE.includes(ride.status) && (
          <button className="btn secondary" disabled={busy} onClick={() => void handleCancel()}>
            Cancel ride
          </button>
        )}
        {isAssignedDriver && ride.status === 'MATCHED' && (
          <button className="btn" disabled={busy} onClick={() => void handleAccept()}>
            Accept ride
          </button>
        )}
        {isAssignedDriver && DRIVER_CANCELLABLE.includes(ride.status) && (
          <button className="btn secondary" disabled={busy} onClick={() => void handleCancel()}>
            Decline / cancel
          </button>
        )}
        <button className="btn secondary" disabled={busy} onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}