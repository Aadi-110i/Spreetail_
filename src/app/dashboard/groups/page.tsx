import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function GroupsPage() {
  const userId = await getSession();
  if (!userId) redirect('/login');

  const groups = await prisma.group.findMany({
    include: {
      _count: { select: { members: true, expenses: true } },
      members: { include: { user: true }, where: { leftAt: null } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center" style={{ marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Groups</h1>
          <p style={{ marginTop: '0.5rem' }}>Manage your shared expense groups</p>
        </div>
        <Link href="/dashboard/groups/new" className="btn btn-filled"><span>+ Create Group</span></Link>
      </div>

      {groups.length === 0 ? (
        <div className="card text-center" style={{ padding: '5rem 2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>No groups yet</h2>
          <p style={{ marginBottom: '2rem' }}>Create a group or import expenses from a CSV file</p>
          <div className="flex gap-2" style={{ justifyContent: 'center' }}>
            <Link href="/dashboard/groups/new" className="btn btn-filled"><span>Create</span></Link>
            <Link href="/import" className="btn"><span>Import CSV</span></Link>
          </div>
        </div>
      ) : (
        <div>
          {groups.map((group, i) => (
            <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
              <div className="card-row slide-up" style={{ padding: '2rem 0', animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-3">
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--cream)', minWidth: '200px' }}>
                    {group.name}
                  </div>
                  <div className="flex gap-1">
                    {group.members.slice(0, 5).map(m => (
                      <div key={m.id} className="avatar avatar-sm">{m.user.name.charAt(0)}</div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tag tag-default">{group._count.expenses} expenses</span>
                  <span className="tag tag-default">{group._count.members} members</span>
                  <span style={{ color: 'var(--grey)', fontSize: '1.5rem' }}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
