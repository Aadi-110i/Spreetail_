import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardPage() {
  const userId = await getSession();
  const user = await prisma.user.findUnique({
    where: { id: userId! },
    include: {
      groupMembers: {
        include: { group: { include: { _count: { select: { members: true, expenses: true } } } } },
        where: { leftAt: null },
      },
      expensesPaid: { orderBy: { date: 'desc' }, take: 8, include: { group: true } },
    },
  });

  const totalExpenses = await prisma.expense.count();
  const totalGroups = await prisma.group.count();
  const totalUsers = await prisma.user.count();

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>{user?.name}</h1>
        <p style={{ marginTop: '0.5rem', color: 'var(--grey-light)' }}>Your financial overview</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card">
          <div className="stat-label">Groups</div>
          <div className="stat-value">{user?.groupMembers.length || 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{totalExpenses}</div>
        </div>
        <div className="card">
          <div className="stat-label">Active Members</div>
          <div className="stat-value">{totalUsers}</div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Groups */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0 }}>Your Groups</h3>
            <Link href="/dashboard/groups/new" className="btn btn-sm"><span>+ New</span></Link>
          </div>
          {user?.groupMembers.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center' }}>
              <p style={{ marginBottom: '1.5rem', color: 'var(--grey)' }}>No groups yet</p>
              <Link href="/import" className="btn btn-sm"><span>Import CSV</span></Link>
            </div>
          ) : (
            <div>
              {user?.groupMembers.map(gm => (
                <Link key={gm.id} href={`/dashboard/groups/${gm.groupId}`}>
                  <div className="card-row">
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '1.05rem', marginBottom: '0.25rem' }}>{gm.group.name}</div>
                      <small style={{ color: 'var(--grey-light)' }}>{gm.group._count.expenses} expenses · {gm.group._count.members} members</small>
                    </div>
                    <span style={{ color: 'var(--grey)', fontSize: '1.25rem' }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent */}
        <div className="card">
          <h3 style={{ marginBottom: '2rem', margin: 0 }}>Recent Expenses</h3>
          {user?.expensesPaid.length === 0 ? (
            <p style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--grey)' }}>No expenses yet</p>
          ) : (
            <div>
              {user?.expensesPaid.map(exp => (
                <div key={exp.id} className="card-row">
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{exp.description}</div>
                    <small style={{ color: 'var(--grey-light)' }}>{exp.date.toLocaleDateString()} · {exp.group.name}</small>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--cream)' }}>
                    {exp.currency === 'USD' ? '$' : '₹'}{exp.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
