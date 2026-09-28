import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Ride Matcher",
  description: "Experimental ride matching with TypeSafe/Jev as the decision engine",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            AI Ride Matcher
          </Link>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/rides/new">New ride</Link>
            <Link href="/driver">Driver</Link>
            <Link href="/login">Login</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}