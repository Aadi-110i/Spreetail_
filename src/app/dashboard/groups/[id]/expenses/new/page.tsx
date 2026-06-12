import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { addExpense } from '@/actions/expenses';
import Link from 'next/link';

type Params = Promise<{ id: string }>;

export default async function NewExpensePage({ params }: { params: Params }) {
  const { id } = await params;
  
  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: { include: { user: true }, where: { leftAt: null } } },
  });

  if (!group) notFound();

  return (
    <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <Link href={`/dashboard/groups/${id}`} style={{ fontSize: '0.75rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>← Back to {group.name}</Link>
        <h2 style={{ marginTop: '2rem', marginBottom: '3rem' }}>Add Expense</h2>

        <form action={addExpense}>
          <input type="hidden" name="groupId" value={id} />

          <div className="form-group">
            <label className="form-label">Description</label>
            <input type="text" name="description" className="form-input" placeholder="Groceries" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input type="number" name="amount" className="form-input" placeholder="0.00" step="0.01" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select name="currency" className="form-select">
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Paid By</label>
            <select name="payerId" className="form-select" required>
              {group.members.map(m => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" name="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="form-group">
            <label className="form-label">Split Type</label>
            <select name="splitType" className="form-select" required>
              <option value="equal">Equal Split</option>
              <option value="exact">Exact Amounts</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Split Among</label>
            <input type="text" name="splitDetails" className="form-input" 
              defaultValue={group.members.map(m => m.userId).join(',')} required />
            <small style={{ display: 'block', marginTop: '0.5rem' }}>
              {group.members.map(m => m.user.name).join(', ')}
            </small>
          </div>

          <button type="submit" className="btn btn-filled" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            <span>Add Expense →</span>
          </button>
        </form>
      </div>
    </div>
  );
}
