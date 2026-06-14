'use client';

import { useState, useRef } from 'react';
import { importCSV, commitImport } from '@/actions/import';
import type { ImportReport, ParsedExpense } from '@/lib/csv-parser';
import Link from 'next/link';

export default function ImportPage() {
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    const text = await file.text();
    const rep = await importCSV(text);
    setReport(rep);
    setStep('review');
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const resolveAnomaly = (id: string, resolution: 'approved' | 'rejected') => {
    setResolutions(prev => ({ ...prev, [id]: resolution }));
  };

  const resolveAll = (resolution: 'approved' | 'rejected') => {
    if (!report) return;
    const newRes: Record<string, 'approved' | 'rejected'> = {};
    report.anomalies.forEach(a => { newRes[a.id] = resolution; });
    setResolutions(newRes);
  };

  const handleCommit = async () => {
    if (!report) return;
    setLoading(true);
    const expensesToImport = report.parsedExpenses.filter(exp => {
      const allRejected = exp.anomalies.length > 0 && exp.anomalies.every(a => resolutions[a.id] === 'rejected');
      return !allRejected;
    });
    const res = await commitImport(expensesToImport, resolutions);
    setResult(res);
    setStep('complete');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <header style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="nav-brand" style={{ position: 'static' }}>Premium Split</Link>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="nav-link" style={{ position: 'static' }}>Dashboard</Link>
          <Link href="/dashboard/groups" className="nav-link" style={{ position: 'static' }}>Groups</Link>
        </nav>
      </header>

      <div style={{ padding: '3rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>Data Import</h1>
          <p style={{ marginTop: '0.5rem' }}>Upload your CSV. We detect anomalies. You approve.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-3 items-center" style={{ marginBottom: '4rem' }}>
          {['Upload', 'Review & Approve', 'Complete'].map((label, i) => {
            const currentIndex = step === 'upload' ? 0 : step === 'review' ? 1 : 2;
            const isActive = i === currentIndex;
            const isDone = i < currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                <div style={{
                  width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${isDone ? 'var(--green-soft)' : isActive ? 'var(--cream)' : 'var(--border)'}`,
                  color: isDone ? 'var(--green-soft)' : isActive ? 'var(--cream)' : 'var(--grey)',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: isActive ? 'var(--cream)' : 'var(--grey)',
                  fontWeight: isActive ? 500 : 400,
                }}>{label}</span>
                {i < 2 && <div style={{ width: '40px', height: '1px', background: 'var(--border)' }} />}
              </div>
            );
          })}
        </div>

        {/* Upload */}
        {step === 'upload' && (
          <div className="fade-in">
            <div className="upload-zone"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>
                {loading ? 'Processing...' : 'Drop CSV here'}
              </h2>
              <p>or click to browse</p>
              <input ref={fileRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} style={{ display: 'none' }} />
            </div>
            <div className="text-center mt-4">
              <button className="btn" onClick={async () => {
                setLoading(true);
                const res = await fetch('/expenses_export.csv');
                const text = await res.text();
                const rep = await importCSV(text);
                setReport(rep);
                setStep('review');
                setLoading(false);
              }}>
                <span>Load sample CSV →</span>
              </button>
            </div>
          </div>
        )}

        {/* Review */}
        {step === 'review' && report && (
          <div className="fade-in">
            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: '3rem' }}>
              <div style={{ padding: '2rem' }}>
                <div className="stat-label">Total Rows</div>
                <div className="stat-value">{report.totalRows}</div>
              </div>
              <div style={{ padding: '2rem' }}>
                <div className="stat-label">Valid</div>
                <div className="stat-value" style={{ color: 'var(--green-soft)' }}>{report.validRows}</div>
              </div>
              <div style={{ padding: '2rem' }}>
                <div className="stat-label">With Issues</div>
                <div className="stat-value" style={{ color: 'var(--amber-soft)' }}>{report.anomalyRows}</div>
              </div>
              <div style={{ padding: '2rem' }}>
                <div className="stat-label">Anomalies</div>
                <div className="stat-value" style={{ color: 'var(--red-soft)' }}>{report.anomalies.length}</div>
              </div>
            </div>

            {/* Anomalies */}
            <div className="card" style={{ marginBottom: '3rem' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                <h3>Anomaly Review</h3>
                <div className="flex gap-1">
                  <button className="btn btn-sm" onClick={() => resolveAll('approved')}><span>Approve All</span></button>
                  <button className="btn btn-danger-outline btn-sm" onClick={() => resolveAll('rejected')}><span>Reject All</span></button>
                </div>
              </div>
              <p style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                Review each anomaly. Approve to import with suggested fix, or reject to skip.
                <span style={{ color: 'var(--cream)', fontWeight: 500 }}> All changes require your approval.</span>
              </p>

              {report.anomalies.length === 0 ? (
                <p style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--green-soft)' }}>No anomalies — all data is clean.</p>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {report.anomalies.map(anomaly => (
                    <div key={anomaly.id} className="anomaly-row">
                      <div className={`anomaly-indicator ${anomaly.severity}`} />
                      <div style={{ flex: 1 }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                          <div className="flex items-center gap-2">
                            <span className={`tag tag-${anomaly.severity === 'error' ? 'danger' : anomaly.severity === 'warning' ? 'warning' : 'default'}`}>
                              {anomaly.type.replace(/_/g, ' ')}
                            </span>
                            <small>Row {anomaly.rowNumber} · {anomaly.field}</small>
                          </div>
                          <div className="flex gap-1">
                            <button
                              className={`btn btn-sm ${resolutions[anomaly.id] === 'approved' ? 'btn-filled' : ''}`}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.6rem' }}
                              onClick={() => resolveAnomaly(anomaly.id, 'approved')}
                            >
                              <span>✓</span>
                            </button>
                            <button
                              className={`btn btn-sm ${resolutions[anomaly.id] === 'rejected' ? 'btn-danger-outline' : ''}`}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.6rem', borderColor: resolutions[anomaly.id] === 'rejected' ? 'var(--red-soft)' : undefined }}
                              onClick={() => resolveAnomaly(anomaly.id, 'rejected')}
                            >
                              <span>✗</span>
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', margin: '0.25rem 0' }}>
                          {anomaly.description}
                        </p>
                        {anomaly.suggestedValue && (
                          <small style={{ color: 'var(--accent)' }}>
                            Suggested: <code style={{ background: 'var(--grey-dark)', padding: '0.1rem 0.35rem' }}>{anomaly.suggestedValue}</code>
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data Preview */}
            <div className="card" style={{ marginBottom: '3rem', overflowX: 'auto' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Parsed Data</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Paid By</th>
                    <th>Amount</th>
                    <th>Split</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.parsedExpenses.map(exp => (
                    <tr key={exp.rowNumber}>
                      <td style={{ color: 'var(--grey)' }}>{exp.rowNumber}</td>
                      <td>{exp.date.toLocaleDateString()}</td>
                      <td style={{ color: 'var(--cream)' }}>{exp.description}</td>
                      <td>{exp.paidBy}</td>
                      <td style={{ fontFamily: 'var(--font-serif)' }}>
                        {exp.currency === 'USD' ? '$' : '₹'}{exp.totalAmount.toFixed(2)}
                      </td>
                      <td>{exp.splitType} ({exp.splits.length})</td>
                      <td>
                        {exp.anomalies.length === 0 ? (
                          <span className="tag tag-success">Clean</span>
                        ) : (
                          <span className="tag tag-danger">{exp.anomalies.length} issues</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commit */}
            <div className="text-center">
              <button className="btn btn-filled" onClick={handleCommit} disabled={loading}>
                <span>{loading ? 'Importing...' : `Import ${report.parsedExpenses.length} Expenses →`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Complete */}
        {step === 'complete' && result && (
          <div className="fade-in text-center" style={{ padding: '4rem 0' }}>
            <h2 style={{ marginBottom: '1rem' }}>Import Complete</h2>
            <p style={{ marginBottom: '3rem' }}>Your expenses have been imported into the database.</p>

            <div className="grid-2" style={{ maxWidth: '400px', margin: '0 auto 3rem' }}>
              <div style={{ padding: '2rem' }}>
                <div className="stat-label">Imported</div>
                <div className="stat-value" style={{ color: 'var(--green-soft)' }}>{result.imported}</div>
              </div>
              <div style={{ padding: '2rem' }}>
                <div className="stat-label">Skipped</div>
                <div className="stat-value" style={{ color: 'var(--red-soft)' }}>{result.skipped}</div>
              </div>
            </div>

            {report && (
              <div className="card" style={{ maxWidth: '600px', margin: '0 auto 3rem', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '1rem' }}>Import Report</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{report.summary}</p>
                <div style={{ fontSize: '0.8rem' }}>
                  <div className="card-row" style={{ padding: '0.5rem 0' }}>
                    <span>Errors</span>
                    <span style={{ color: 'var(--red-soft)' }}>{report.anomalies.filter(a => a.severity === 'error').length}</span>
                  </div>
                  <div className="card-row" style={{ padding: '0.5rem 0' }}>
                    <span>Warnings</span>
                    <span style={{ color: 'var(--amber-soft)' }}>{report.anomalies.filter(a => a.severity === 'warning').length}</span>
                  </div>
                  <div className="card-row" style={{ padding: '0.5rem 0' }}>
                    <span>Info</span>
                    <span>{report.anomalies.filter(a => a.severity === 'info').length}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2" style={{ justifyContent: 'center' }}>
              <Link href="/dashboard" className="btn btn-filled"><span>Dashboard</span></Link>
              <button className="btn" onClick={() => { setStep('upload'); setReport(null); setResult(null); setResolutions({}); }}>
                <span>Import Another</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
