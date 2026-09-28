'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { RequireAuth } from '@/components/RequireAuth';
import { ApiError } from '@/lib/api/client';
import { getDriverProfile, updateAvailability } from '@/lib/api/drivers';
import type { StoredSession } from '@/lib/session';
import type { DriverProfile } from '@/types/api';

export default function DriverPage() {
  return (
    <RequireAuth role="driver">{(session) => <DriverOverview session={session} />}</RequireAuth>
  );
}

function DriverOverview({ session }: { session: StoredSession }) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDriverProfile(session.token)
      .then((result) => {
        setProfile(result.driver);
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof ApiError ? caught.message : 'Failed to load driver profile');
      });
  }, [session.token]);

  async function toggleAvailability() {
    if (!profile) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await updateAvailability(session.token, !profile.isAvailable);
      setProfile(result.driver);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to update availability');
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <section className="card">
        <h1>Driver area</h1>
        {error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>}
      </section>
    );
  }

  return (
    <section className="card">
      <h1>Driver area</h1>
      <p className="muted">
        {session.user.name} · {session.user.phone}
      </p>
      <dl className="detail-grid">
        <div>
          <dt>Vehicle</dt>
          <dd>{profile.vehicleType}</dd>
        </div>
        <div>
          <dt>Rating</dt>
          <dd>{profile.rating}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{profile.isAvailable ? 'Available' : 'Unavailable'}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>
            {profile.latitude}, {profile.longitude}
          </dd>
        </div>
      </dl>
      <div className="actions">
        <button className="btn" disabled={busy} onClick={() => void toggleAvailability()}>
          {profile.isAvailable ? 'Go unavailable' : 'Go available'}
        </button>
        <Link className="btn secondary" href="/driver/settings">
          Settings
        </Link>
        <Link className="btn secondary" href="/driver/rides">
          Rides
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
    </section>
  );
}