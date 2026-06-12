import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { recordSettlement } from '@/actions/expenses';
import { calculateGroupBalances } from '@/lib/balance-engine';
import Link from 'next/link';

type Params = Promise<{ id: string }>;

export default async function SettlePage({ params }: { params: Params }) {
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: { include: { user: true }, where: { leftAt: null } } },
  });

  if (!group) notFound();

  const { settlements: suggested } = await calculateGroupBalances(id);

  return (
    <div className="fade-in">
      <Link href={`/dashboard/groups/${id}`} style={{ fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>← Back to {group.name}</Link>
      <h1 style={{ marginTop: '1rem', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Settle Debts</h1>
      <p style={{ marginBottom: '3rem' }}>Record a payment between group members</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Suggested */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', margin: 0 }}>Suggested Settlements</h3>
          <div style={{ marginTop: '1.5rem' }}>
            {suggested.length === 0 ? (
              <p style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--green-soft)' }}>All settled up</p>
            ) : (
              <div>
                {suggested.map((s, i) => (
                  <div key={i} className="card-row">
                    <div>
                      <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{s.from}</span>
                      <span style={{ color: 'var(--grey)', margin: '0 0.5rem' }}>pays</span>
                      <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{s.to}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--cream)' }}>
                      ₹{s.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', margin: 0 }}>Record Payment</h3>
          <form action={recordSettlement} style={{ marginTop: '1.5rem' }}>
            <input type="hidden" name="groupId" value={id} />
            <div className="form-group">
              <label className="form-label">From</label>
              <select name="payerId" className="form-select" required>
                {group.members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <select name="payeeId" className="form-select" required>
                {group.members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input type="number" name="amount" className="form-input" step="0.01" min="0" required />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select name="currency" className="form-select">
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-filled" style={{ width: '100%', justifyContent: 'center' }}>
              <span>Record Settlement →</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
