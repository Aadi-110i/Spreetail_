import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { calculateGroupBalances } from '@/lib/balance-engine';

export default async function BalancesPage() {
  const userId = await getSession();
  if (!userId) redirect('/login');

  const groups = await prisma.group.findMany({
    include: { expenses: true },
  });

  const allBalancesResults = await Promise.all(
    groups.map(async (group) => {
      try {
        const { memberBalances, settlements } = await calculateGroupBalances(group.id);
        if (memberBalances.length > 0) {
          return { group, memberBalances, settlements };
        }
      } catch { /* skip */ }
      return null;
    })
  );
  
  const allBalances = allBalancesResults.filter((b): b is NonNullable<typeof b> => b !== null);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Balances</h1>
        <p style={{ marginTop: '0.5rem' }}>Individual balances and settlement suggestions across all groups</p>
      </div>

      {allBalances.length === 0 ? (
        <div className="card text-center" style={{ padding: '5rem 2rem' }}>
          <p>No balance data yet. Import expenses or add them manually.</p>
        </div>
      ) : (
        <div>
          {allBalances.map(({ group, memberBalances, settlements }) => (
            <div key={group.id} style={{ marginBottom: '3rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem' }}>{group.name}</h2>
                <span className="tag tag-default">{group.expenses.length} expenses</span>
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Total Paid</th>
                      <th>Total Owed</th>
                      <th style={{ textAlign: 'right' }}>Net Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberBalances.map((mb, i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar avatar-sm">{mb.name.charAt(0)}</div>
                            <span style={{ color: 'var(--cream)' }}>{mb.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-serif)' }}>₹{mb.totalPaid.toFixed(2)}</td>
                        <td style={{ fontFamily: 'var(--font-serif)' }}>₹{mb.totalOwed.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{
                            color: mb.netBalance >= 0 ? 'var(--green-soft)' : 'var(--red-soft)',
                            fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600,
                          }}>
                            {mb.netBalance >= 0 ? '+' : ''}₹{mb.netBalance.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {settlements.length > 0 && (
                <div className="card">
                  <h3 style={{ marginBottom: '1rem' }}>Simplest Settlements</h3>
                  {settlements.map((s, i) => (
                    <div key={i} className="card-row">
                      <div>
                        <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{s.from}</span>
                        <span style={{ color: 'var(--grey)', margin: '0 0.5rem' }}>→</span>
                        <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{s.to}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--cream)' }}>
                        ₹{s.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
