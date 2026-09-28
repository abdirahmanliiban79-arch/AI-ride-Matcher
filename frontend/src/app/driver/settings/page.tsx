'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { RequireAuth } from '@/components/RequireAuth';
import { ApiError } from '@/lib/api/client';
import { getDriverProfile, updateAvailability, updateLocation } from '@/lib/api/drivers';
import type { StoredSession } from '@/lib/session';
import type { DriverProfile } from '@/types/api';

export default function DriverSettingsPage() {
  return (
    <RequireAuth role="driver">{(session) => <DriverSettings session={session} />}</RequireAuth>
  );
}

function DriverSettings({ session }: { session: StoredSession }) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [latitude, setLatitude] = useState('0');
  const [longitude, setLongitude] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDriverProfile(session.token)
      .then((result) => {
        setProfile(result.driver);
        setLatitude(String(result.driver.latitude));
        setLongitude(String(result.driver.longitude));
        setError(null);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof ApiError ? caught.message : 'Failed to load driver profile');
      });
  }, [session.token]);

  async function handleSaveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const result = await updateLocation(session.token, {
        latitude: Number(latitude),
        longitude: Number(longitude),
      });
      setProfile(result.driver);
      setNotice('Location updated');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to update location');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleAvailability() {
    if (!profile) {
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const result = await updateAvailability(session.token, !profile.isAvailable);
      setProfile(result.driver);
      setNotice(result.driver.isAvailable ? 'You are now available' : 'You are now unavailable');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to update availability');
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <section className="card">
        <h1>Driver settings</h1>
        {error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>}
      </section>
    );
  }

  return (
    <section className="card">
      <h1>Driver settings</h1>
      <p className="muted">
        {profile.isAvailable ? 'Currently available for rides' : 'Currently not accepting rides'}
      </p>
      <form className="form" onSubmit={handleSaveLocation}>
        <div className="grid-2">
          <label>
            Latitude
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              required
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              required
            />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        {notice && <p className="success">{notice}</p>}
        <div className="actions">
          <button className="btn" type="submit" disabled={busy}>
            Save location
          </button>
          <button
            className="btn secondary"
            type="button"
            disabled={busy}
            onClick={() => void handleToggleAvailability()}
          >
            {profile.isAvailable ? 'Go unavailable' : 'Go available'}
          </button>
        </div>
      </form>
    </section>
  );
}