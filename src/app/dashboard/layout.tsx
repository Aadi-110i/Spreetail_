import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSession();
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect('/login');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Nav */}
      <header style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="nav-brand" style={{ position: 'static', mixBlendMode: 'normal' }}>Premium Split</Link>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="nav-link" style={{ position: 'static' }}>Dashboard</Link>
          <Link href="/dashboard/groups" className="nav-link" style={{ position: 'static' }}>Groups</Link>
          <Link href="/dashboard/balances" className="nav-link" style={{ position: 'static' }}>Balances</Link>
          <Link href="/import" className="btn btn-sm"><span>Import CSV</span></Link>
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
        </nav>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '3rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
