import Link from "next/link";

export default function HomePage() {
  return (
    <section className="card">
      <h1>AI Ride Matcher</h1>
      <p>
        Passengers create ride requests. The backend filters eligible drivers with
        deterministic rules, then TypeSafe/Jev picks the best match. Every AI decision is
        validated before the backend assigns a driver.
      </p>
      <div className="actions">
        <Link className="btn" href="/login">
          Log in
        </Link>
        <Link className="btn secondary" href="/register">
          Register
        </Link>
      </div>
    </section>
  );
}