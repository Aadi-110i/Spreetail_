import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <Link href="/" className="nav-brand">Premium Split</Link>
        <div className="nav-links">
          <Link href="/login" className="nav-link">Login</Link>
          <Link href="/import" className="nav-link">Import</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <h1 className="slide-up">
          We split expenses,<br />
          not friendships.
        </h1>
        <p className="hero-sub slide-up" style={{ animationDelay: '0.2s' }}>
          Shared expenses for flatmates — multi-currency,
          intelligent CSV imports, and crystal-clear balances.
        </p>
        <div className="flex gap-2 mt-4 slide-up" style={{ animationDelay: '0.4s' }}>
          <Link href="/login" className="btn btn-filled"><span>Get Started</span></Link>
          <Link href="/import" className="btn"><span>Import CSV</span></Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: '1px solid var(--border)' }}>
        <div className="grid-3 stagger">
          <div className="card slide-up">
            <h3 style={{ marginBottom: '1.5rem' }}>Fair Splits</h3>
            <p style={{ fontSize: '0.95rem' }}>
              Equal, percentage, or exact amounts. Every split method your group needs,
              handled with precision.
            </p>
          </div>
          <div className="card slide-up">
            <h3 style={{ marginBottom: '1.5rem' }}>Smart Importer</h3>
            <p style={{ fontSize: '0.95rem' }}>
              Detects 12+ types of anomalies in CSV files — duplicates,
              bad dates, currency errors — automatically.
            </p>
          </div>
          <div className="card slide-up">
            <h3 style={{ marginBottom: '1.5rem' }}>Multi-Currency</h3>
            <p style={{ fontSize: '0.95rem' }}>
              Seamless USD to INR conversion with full transparency.
              No hidden rates, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom */}
      <section className="section">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 className="slide-up">Selected work</h2>
            <p className="slide-up" style={{ marginTop: '1rem', animationDelay: '0.15s' }}>
              Built with Next.js, Prisma, and SQLite.<br />
              Designed for flatmates who deserve better.
            </p>
          </div>
          <Link href="/login" className="btn slide-up" style={{ animationDelay: '0.3s' }}>
            <span>→ Enter App</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Premium Split © 2024
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Spreetail Assignment
          </span>
        </div>
      </footer>
    </>
  );
}
