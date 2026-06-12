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

      {/* Platform Capabilities Showcase */}
      <section style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '8rem 3rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <h2 className="slide-up" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>Engineered for Precision</h2>
          <p className="slide-up" style={{ maxWidth: '600px', margin: '1.5rem auto 0', color: 'var(--grey)' }}>
            Beneath the minimalist interface lies a powerful, mathematically rigorous backend designed to handle edge cases effortlessly.
          </p>
        </div>

        {/* Feature 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', borderBottom: '1px solid var(--border)' }}>
          <div className="slide-up" style={{ padding: '6rem 4rem', borderRight: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem' }}>01 / Algorithmic Efficiency</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--cream)', textTransform: 'none', margin: '1rem 0 1.5rem', letterSpacing: '-0.02em' }}>Debt Simplification</h3>
            <p style={{ color: 'var(--grey-light)', lineHeight: '1.8', fontSize: '1.05rem' }}>
              Say goodbye to the chaotic web of micro-transactions. We implemented a highly optimized Greedy Settlement Algorithm that first calculates absolute net balances, then iteratively matches the maximum debtor to the maximum creditor. The result? The mathematical minimum number of required transactions.
            </p>
          </div>
          <div className="slide-up" style={{ padding: '6rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black-soft)' }}>
            <div style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--black)', width: '100%', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '2px', height: '100%', background: 'var(--cream)' }}></div>
              <pre style={{ color: 'var(--grey)', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: '1.6', overflowX: 'auto' }}>
{`function simplifyDebts(balances) {
  const transactions = [];
  while (true) {
    const maxDebtor = getMin(balances);
    const maxCreditor = getMax(balances);
    
    if (balances[maxDebtor] === 0) break;
    
    const amount = Math.min(
      -balances[maxDebtor], 
       balances[maxCreditor]
    );
    // Execute minimal transaction
    transactions.push({ 
      from: maxDebtor, to: maxCreditor, amount 
    });
  }
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', borderBottom: '1px solid var(--border)' }}>
          <div className="slide-up" style={{ padding: '6rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black-soft)', order: -1 }}>
            <div style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--black)', width: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'var(--red-soft)', opacity: 0.5 }}></div>
              <pre style={{ color: 'var(--grey)', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: '1.6', overflowX: 'auto' }}>
{`[ERROR] Row 12: Invalid Allocation
- Issue: Percentages provided 
  (A:25, R:25, P:25, M:30) total 105%.
- Action: Mathematical invariant failed. 
  Row blocked in staging area.

[ERROR] Row 13: Temporal Paradox
- Issue: "Sam" included in expense 
  dated 03-25, joined on 04-01.
- Action: Import blocked.`}
              </pre>
            </div>
          </div>
          <div className="slide-up" style={{ padding: '6rem 4rem', borderLeft: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem' }}>02 / Data Integrity</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--cream)', textTransform: 'none', margin: '1rem 0 1.5rem', letterSpacing: '-0.02em' }}>Interactive Staging Area</h3>
            <p style={{ color: 'var(--grey-light)', lineHeight: '1.8', fontSize: '1.05rem' }}>
              We never fail silently, and we never guess. Upload your raw CSV and let our custom parsing engine detect over 12 anomalies—from mathematical impossibilities to duplicate records. Faulty data is quarantined in a beautiful Staging Area for your explicit approval before committing to the database.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))' }}>
          <div className="slide-up" style={{ padding: '6rem 4rem', borderRight: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem' }}>03 / Advanced Architecture</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--cream)', textTransform: 'none', margin: '1rem 0 1.5rem', letterSpacing: '-0.02em' }}>Temporal Membership</h3>
            <p style={{ color: 'var(--grey-light)', lineHeight: '1.8', fontSize: '1.05rem' }}>
              When new flatmates move in, things usually get complicated. Our normalized database schema tracks exact <code>joinedAt</code> and <code>leftAt</code> timestamps. The ingestion engine actively cross-references expense dates against temporal records to guarantee members are never unfairly billed for historical group expenses.
            </p>
          </div>
          <div className="slide-up" style={{ padding: '6rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black-soft)' }}>
            <div style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--black)', width: '100%', position: 'relative' }}>
              <pre style={{ color: 'var(--grey)', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: '1.6', overflowX: 'auto' }}>
{`model GroupMember {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  
  // Temporal Tracking Logic
  joinedAt  DateTime  @default(now())
  leftAt    DateTime?
  
  group     Group     @relation(...)
  user      User      @relation(...)
  
  @@unique([groupId, userId])
}`}
              </pre>
            </div>
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
