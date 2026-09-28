'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { RequireAuth } from '@/components/RequireAuth';
import { clearSession, getLastRideId, type StoredSession } from '@/lib/session';
import { useHydrated } from '@/lib/useHydrated';

export default function DashboardPage() {
  return <RequireAuth>{(session) => <Dashboard session={session} />}</RequireAuth>;
}

function Dashboard({ session }: { session: StoredSession }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lastRideId = hydrated ? getLastRideId() : null;

  function handleLogout() {
    clearSession();
    router.replace('/');
  }

  return (
    <section className="card">
      <h1>Welcome, {session.user.name}</h1>
      <p className="muted">
        Signed in as {session.user.role} · {session.user.phone}
      </p>
      <div className="actions">
        <Link className="btn" href="/rides/new">
          Create a ride
        </Link>
        {lastRideId && (
          <Link className="btn secondary" href={`/rides/${lastRideId}`}>
            Last ride
          </Link>
        )}
        {session.user.role === 'driver' && (
          <Link className="btn secondary" href="/driver">
            Driver area
          </Link>
        )}
      </div>
      <div className="actions">
        <button className="link" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </section>
  );
}