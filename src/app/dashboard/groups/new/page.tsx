import { createGroup } from '@/actions/groups';
import Link from 'next/link';

export default function NewGroupPage() {
  return (
    <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <Link href="/dashboard/groups" style={{ fontSize: '0.8rem', color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>← Back to Groups</Link>
        <h2 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>New Group</h2>
        <p style={{ marginBottom: '3rem', fontSize: '0.9rem' }}>Start tracking shared expenses</p>

        <form action={createGroup}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Group Name</label>
            <input type="text" id="name" name="name" className="form-input" placeholder="Flat 4B" required />
          </div>
          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea id="description" name="description" className="form-textarea" placeholder="Shared apartment expenses..." rows={3} />
          </div>
          <button type="submit" className="btn btn-filled" style={{ width: '100%', justifyContent: 'center' }}>
            <span>Create Group →</span>
          </button>
        </form>
      </div>
    </div>
  );
}
