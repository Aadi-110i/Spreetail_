import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { calculateGroupBalances } from '@/lib/balance-engine';
import { addMemberToGroup, removeMemberFromGroup } from '@/actions/groups';

type Params = Promise<{ id: string }>;

export default async function GroupDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: 'asc' } },
      expenses: {
        include: { payer: true, splits: { include: { user: true } } },
        orderBy: { date: 'desc' },
      },
      settlements: {
        include: { payer: true, payee: true },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!group) notFound();

  const { memberBalances, settlements: suggestedSettlements } = await calculateGroupBalances(id);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '4rem' }}>
        <Link href="/dashboard/groups" style={{ fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>← Back to Groups</Link>
        <h1 style={{ marginTop: '1rem', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>{group.name}</h1>
        {group.description && <p style={{ marginTop: '0.5rem' }}>{group.description}</p>}
        <div className="flex gap-2 mt-4">
          <Link href={`/dashboard/groups/${id}/expenses/new`} className="btn btn-filled"><span>+ Add Expense</span></Link>
          <Link href={`/dashboard/groups/${id}/settle`} className="btn"><span>Settle Debts</span></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div style={{ padding: '2rem' }}>
          <div className="stat-label">Members</div>
          <div className="stat-value">{group.members.filter(m => !m.leftAt).length}</div>
        </div>
        <div style={{ padding: '2rem' }}>
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{group.expenses.length}</div>
        </div>
        <div style={{ padding: '2rem' }}>
          <div className="stat-label">Settlements</div>
          <div className="stat-value">{group.settlements.length}</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Who Owes Whom — Aisha */}
          {suggestedSettlements.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', margin: 0 }}>Who Owes Whom</h3>
              <div style={{ marginTop: '1.5rem' }}>
                {suggestedSettlements.map((s, i) => (
                  <div key={i} className="card-row">
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-sm">{s.from.charAt(0)}</div>
                      <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{s.from}</span>
                      <span style={{ color: 'var(--grey)', margin: '0 0.25rem' }}>→</span>
                      <div className="avatar avatar-sm">{s.to.charAt(0)}</div>
                      <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{s.to}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--cream)' }}>
                      ₹{s.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Balances — Rohan */}
          {memberBalances.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', margin: 0 }}>Individual Balances</h3>
              <div style={{ marginTop: '1.5rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Paid</th>
                      <th>Owed</th>
                      <th style={{ textAlign: 'right' }}>Net</th>
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
                        <td>₹{mb.totalPaid.toFixed(2)}</td>
                        <td>₹{mb.totalOwed.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: mb.netBalance >= 0 ? 'var(--green-soft)' : 'var(--red-soft)', fontWeight: 600, fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>
                            {mb.netBalance >= 0 ? '+' : ''}₹{mb.netBalance.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>All Expenses</h3>
              <span className="tag tag-default">{group.expenses.length}</span>
            </div>
            {group.expenses.length === 0 ? (
              <p style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--grey)' }}>No expenses yet</p>
            ) : (
              <div>
                {group.expenses.map(exp => (
                  <div key={exp.id} className="card-row">
                    <div>
                      <div style={{ color: 'var(--cream)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{exp.description}</div>
                      <small style={{ color: 'var(--grey-light)' }}>
                        Paid by {exp.payer.name} · {exp.date.toLocaleDateString()} · {exp.splits.length} people
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--cream)' }}>
                        {exp.currency === 'USD' ? '$' : '₹'}{exp.amount.toFixed(2)}
                      </div>
                      {exp.currency === 'USD' && (
                        <small style={{ color: 'var(--grey-light)' }}>≈ ₹{(exp.amount * 83.5).toFixed(0)}</small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Members */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', margin: 0 }}>Members</h3>
            <div style={{ marginTop: '1.5rem' }}>
              {group.members.map(m => (
                <div key={m.id} className="card-row" style={{ padding: '0.75rem 0' }}>
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm">{m.user.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--cream)' }}>{m.user.name}</div>
                      <small style={{ color: 'var(--grey-light)' }}>Joined {m.joinedAt.toLocaleDateString()}</small>
                    </div>
                  </div>
                  {m.leftAt ? (
                    <span className="tag tag-danger">Left</span>
                  ) : (
                    <form action={removeMemberFromGroup}>
                      <input type="hidden" name="groupId" value={id} />
                      <input type="hidden" name="memberId" value={m.id} />
                      <button type="submit" className="btn btn-danger-outline btn-sm"><span>Remove</span></button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Member */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', margin: 0 }}>Add Member</h3>
            <form action={addMemberToGroup} style={{ marginTop: '1.5rem' }}>
              <input type="hidden" name="groupId" value={id} />
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" name="name" className="form-input" placeholder="Sam" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" placeholder="sam@flat4b.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Join Date</label>
                <input type="date" name="joinedAt" className="form-input" />
              </div>
              <button type="submit" className="btn btn-filled" style={{ width: '100%', justifyContent: 'center' }}><span>Add Member</span></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
