import Link from 'next/link';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const userId = await getSession();
  
  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <Link href="/" className="nav-brand">Premium Split</Link>
        <div className="nav-links">
          {userId ? (
            <>
              <Link href="/dashboard" className="nav-link">Dashboard</Link>
              <form action="/api/logout" method="POST" style={{ display: 'inline' }}>
                <button type="submit" className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">Login</Link>
              <Link href="/login" className="nav-link" style={{ opacity: 0.8 }}>Sign Up</Link>
            </>
          )}
          <Link href="/import" className="nav-link">Import</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4rem' }}>
        {/* Left — Copy */}
        <div style={{ flex: '1 1 55%' }}>
          <h1 className="slide-up">
            We split expenses,<br />
            not friendships.
          </h1>
          <p className="hero-sub slide-up" style={{ animationDelay: '0.2s' }}>
            Shared expenses for flatmates — multi-currency,
            intelligent CSV imports, and crystal-clear balances.
          </p>
          <div className="flex gap-2 mt-4 slide-up" style={{ animationDelay: '0.4s' }}>
            {userId ? (
              <Link href="/dashboard" className="btn btn-filled"><span>Go to Dashboard</span></Link>
            ) : (
              <Link href="/login" className="btn btn-filled"><span>Get Started</span></Link>
            )}
            <Link href="/import" className="btn"><span>Import CSV</span></Link>
          </div>
        </div>

        {/* Right — Mock Dashboard Card */}
        <div className="slide-up" style={{ flex: '0 1 380px', animationDelay: '0.5s' }}>
          <div style={{ 
            border: '1px solid var(--border)', 
            background: 'var(--black-soft)', 
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--grey)' }}>Flat 4B — May 2024</span>
              <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', border: '1px solid rgba(68,170,136,0.3)', color: 'var(--green-soft)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active</span>
            </div>

            {/* Balance rows */}
            {[
              { name: 'Aisha',  amount: '+ ₹2,450', color: 'var(--green-soft)' },
              { name: 'Rohan',  amount: '- ₹1,820', color: 'var(--red-soft)' },
              { name: 'Priya',  amount: '+ ₹640',   color: 'var(--green-soft)' },
              { name: 'Sam',    amount: '- ₹870',   color: 'var(--red-soft)' },
              { name: 'Meera',  amount: '- ₹400',   color: 'var(--amber-soft)' },
            ].map((m) => (
              <div key={m.name} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.7rem 0', 
                borderBottom: '1px solid rgba(255,255,255,0.04)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '28px', height: '28px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)', 
                    fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.05em', 
                    color: 'var(--cream)' 
                  }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>{m.name}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 500, color: m.color }}>{m.amount}</span>
              </div>
            ))}

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--grey)' }}>Total Expenses</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--cream)', letterSpacing: '-0.02em' }}>₹48,200</span>
            </div>
          </div>
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
          {userId ? (
            <Link href="/dashboard" className="btn slide-up" style={{ animationDelay: '0.3s' }}>
              <span>→ Enter App</span>
            </Link>
          ) : (
            <Link href="/login" className="btn slide-up" style={{ animationDelay: '0.3s' }}>
              <span>→ Enter App</span>
            </Link>
          )}
        </div>
      </section>

      {/* Platform Capabilities Showcase */}
      <section style={{ borderTop: '1px solid var(--border)', padding: '6rem 3rem' }}>
        <h2 className="slide-up" style={{ marginBottom: '4rem', textAlign: 'center' }}>Platform Capabilities</h2>

        <div className="grid-3 stagger" style={{ marginTop: '2rem' }}>
          <div className="card slide-up" style={{ padding: '3rem 2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Debt Simplification</h3>
            <p style={{ color: 'var(--grey)', lineHeight: '1.6' }}>
              Say goodbye to the chaotic web of micro-transactions. Our greedy settlement algorithm calculates net balances and mathematically minimizes the total number of payments required. A "Who Owes Whom" summary that actually makes sense.
            </p>
          </div>

          <div className="card slide-up" style={{ padding: '3rem 2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Temporal Membership</h3>
            <p style={{ color: 'var(--grey)', lineHeight: '1.6' }}>
              New flatmate moved in? Our temporal database schema tracks exact join and leave dates. The system actively cross-references expense dates to ensure members are never unfairly billed for historical group expenses.
            </p>
          </div>

          <div className="card slide-up" style={{ padding: '3rem 2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Interactive Staging Area</h3>
            <p style={{ color: 'var(--grey)', lineHeight: '1.6' }}>
              Upload your raw CSV and let our parsing engine do the work. It detects 12+ anomalies—from duplicates and negative amounts to bad dates—and places them in a beautiful Staging Area for your explicit approval before committing to the database.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '8rem 3rem', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'var(--black-soft)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <span className="slide-up" style={{ color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', display: 'block', marginBottom: '1.5rem' }}>Ready to simplify?</span>
          <h2 className="slide-up" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '2rem', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
            Stop arguing about money.<br />Start living your life.
          </h2>
          <p className="slide-up" style={{ color: 'var(--grey-light)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
            Join Premium Split today and let our algorithmic engine handle the awkward math for you.
          </p>
          <div className="flex gap-2 slide-up" style={{ justifyContent: 'center' }}>
            {userId ? (
              <Link href="/dashboard" className="btn btn-filled" style={{ padding: '1.25rem 3rem', fontSize: '0.85rem' }}>
                <span>Enter Application</span>
              </Link>
            ) : (
              <Link href="/login" className="btn btn-filled" style={{ padding: '1.25rem 3rem', fontSize: '0.85rem' }}>
                <span>Enter Application</span>
              </Link>
            )}
            <Link href="/import" className="btn" style={{ padding: '1.25rem 3rem', fontSize: '0.85rem' }}>
              <span>Test CSV Engine</span>
            </Link>
          </div>
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
