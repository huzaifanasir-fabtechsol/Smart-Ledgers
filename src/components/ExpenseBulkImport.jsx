import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { apiRequest, downloadFile } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';

const SEEN_JOB_KEY = 'expenseImportSeenJobId';
const POLL_INTERVAL_MS = 1500;

const COLUMNS = [
  'Date', 'Transaction ID', 'Withdraw Amount', 'Deposit Amount', 'Description',
  'Notes', 'Title', 'Category', 'Tax Way', 'Tax Rate',
];

const infoBoxStyle = {
  marginBottom: '1rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5,
};
const errorBoxStyle = {
  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem',
  maxHeight: '220px', overflowY: 'auto', marginTop: '0.5rem', marginBottom: '0.5rem',
};
const linkButtonStyle = {
  background: 'transparent', border: 'none', color: '#2563eb', padding: 0, fontSize: '0.8125rem',
  fontWeight: '600', cursor: 'pointer', textDecoration: 'underline',
};

const fetchLatestJob = async () => {
  const response = await apiRequest('/expenses/bulk-import/');
  if (!response.ok) throw new Error('Failed to load import status');
  const data = await response.json();
  return data.job;
};

// Transactions from an import that now carry more than one expense, with all their expenses.
const fetchReview = async (jobId) => {
  const response = await apiRequest(`/expenses/bulk-import/review/?job=${jobId}`);
  if (!response.ok) throw new Error('Failed to load linked expenses');
  const data = await response.json();
  return data.transactions || [];
};

const yen = (value) => `¥${Number(value || 0).toLocaleString()}`;

const ExpenseBulkImport = ({ companyAccounts = [], onImported }) => {
  const [job, setJob] = useState(null);
  const [seenJobId, setSeenJobId] = useState(() => localStorage.getItem(SEEN_JOB_KEY));
  const [showModal, setShowModal] = useState(false);
  const [account, setAccount] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [rowErrors, setRowErrors] = useState(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const [viewingLast, setViewingLast] = useState(false);
  const [review, setReview] = useState(null);   // { jobId, items }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isActive = Boolean(job?.is_active);
  const hasUnseenResult = Boolean(job) && !isActive && String(job.id) !== seenJobId;
  const showingResult = Boolean(job) && !isActive && (hasUnseenResult || viewingLast);
  const reviewJobId = showingResult && job.status === 'completed' ? job.id : null;
  const reviewItems = review && review.jobId === reviewJobId ? review.items : null;

  // Load the transactions to review whenever a completed import's result is on screen.
  useEffect(() => {
    if (!reviewJobId) return undefined;
    let cancelled = false;
    fetchReview(reviewJobId)
      .then((items) => { if (!cancelled) setReview({ jobId: reviewJobId, items }); })
      .catch(() => { if (!cancelled) setReview({ jobId: reviewJobId, items: [] }); });
    return () => { cancelled = true; };
  }, [reviewJobId]);

  const announceFinished = (finishedJob) => {
    if (finishedJob.status === 'completed') {
      toast.success('Import finished successfully');
      if (onImported) onImported();
    } else {
      toast.error('Import failed. Nothing was saved.');
    }
  };

  // Pick up an import that is still running (or finished) from an earlier visit to this page.
  useEffect(() => {
    let cancelled = false;
    fetchLatestJob()
      .then((latest) => { if (!cancelled) setJob(latest); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // While an import is active, keep polling until it finishes.
  useEffect(() => {
    if (!isActive) return undefined;
    let cancelled = false;
    let timer;
    const poll = async () => {
      try {
        const latest = await fetchLatestJob();
        if (cancelled) return;
        setJob(latest);
        if (latest && !latest.is_active) {
          announceFinished(latest);
          return;
        }
      } catch {
        // Temporary network problem: keep polling.
      }
      if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_MS);
    };
    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const markSeen = () => {
    if (!job) return;
    localStorage.setItem(SEEN_JOB_KEY, String(job.id));
    setSeenJobId(String(job.id));
  };

  const closeModal = () => {
    if (hasUnseenResult) markSeen();
    setViewingLast(false);
    setShowModal(false);
    setRowErrors(null);
  };

  const startAnother = () => {
    markSeen();
    setViewingLast(false);
    setFile(null);
    setRowErrors(null);
  };

  const handleDeleteExpense = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      const response = await apiRequest(`/expenses/${target.id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete expense');
      toast.success(`Expense #${target.id} deleted`);
      if (onImported) onImported();
    } catch {
      toast.error('Failed to delete expense');
    }
    try {
      setReview({ jobId: job.id, items: await fetchReview(job.id) });
    } catch {
      // Keep the current list; it refreshes the next time the result is opened.
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadFile('/expenses/bulk-import/template/', 'expense_import_template.xlsx');
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRowErrors(null);

    if (!account) {
      toast.error('Please select a company account');
      return;
    }
    if (!file) {
      toast.error('Please select an Excel (.xlsx) file');
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('company_account', account);
      payload.append('file', file);

      const response = await apiRequest('/expenses/bulk-import/', { method: 'POST', body: payload });
      const data = await response.json();

      if (response.status === 409) {
        // Another import is already running: show its progress instead.
        setJob(data.job);
        toast.info(data.error);
        return;
      }
      if (!response.ok) {
        if (data.row_errors && data.row_errors.length > 0) {
          setRowErrors(data.row_errors);
          setTotalErrors(data.total_errors || data.row_errors.length);
        }
        toast.error(data.error || 'Failed to import file');
        return;
      }

      setJob(data.job);
      setFile(null);
      if (data.job.is_active) {
        toast.success(`File validated. Importing ${data.job.total_rows} rows...`);
      } else {
        announceFinished(data.job);
      }
    } catch {
      toast.error('Failed to process file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  let buttonLabel = '📥 Bulk Import';
  if (isActive) buttonLabel = `⏳ Importing... ${job.percent}%`;
  else if (hasUnseenResult) buttonLabel = job.status === 'completed' ? '✅ Import finished' : '⚠️ Import failed';

  const renderProgress = () => (
    <div className="modal-form">
      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem' }}>
        {job.status === 'pending' ? 'Waiting to start...' : 'Importing...'} {job.file_name}
      </div>
      <div
        role="progressbar"
        aria-valuenow={job.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: 12, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}
      >
        <div style={{ width: `${job.percent}%`, height: '100%', background: '#2563eb', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
        <span>{job.processed_rows} of {job.total_rows} rows</span>
        <span>{job.percent}%</span>
      </div>
      <div style={{ ...infoBoxStyle, marginTop: '1rem', marginBottom: 0 }}>
        You can close this window and keep working. The import continues in the background and its
        status will be shown here when you come back.
      </div>
    </div>
  );

  const renderResult = () => {
    if (job.status === 'failed') {
      return (
        <div className="modal-form">
          <div style={errorBoxStyle}>
            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              ⚠️ Import failed: {job.file_name}
            </div>
            <div style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{job.error}</div>
          </div>
        </div>
      );
    }

    const result = job.result || {};
    const rows = [
      ['Rows in file', result.total_rows],
      ['Transactions created', result.transactions_created],
      ['Transactions already existing', result.transactions_existing],
      ['Expenses created', result.expenses_created],
      ['Expenses already existing', result.expenses_existing],
      ['Deposit rows (no expense)', result.deposit_rows],
    ];
    const createdCategories = result.categories_created || [];
    const warnings = result.warnings || [];

    return (
      <div className="modal-form">
        <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '0.75rem' }}>
          ✅ Import completed: {job.file_name}
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #e2e8f0' }}
            >
              <span style={{ color: '#475569' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value ?? 0}</span>
            </div>
          ))}
        </div>
        {createdCategories.length > 0 && (
          <div style={{ ...infoBoxStyle, marginTop: '1rem', marginBottom: 0 }}>
            <b>New categories created:</b> {createdCategories.join(', ')}
          </div>
        )}
        {renderReview(warnings.length)}
      </div>
    );
  };

  // Live list (re-read from the server), so it shrinks as duplicates are deleted.
  const renderReview = (warningCount) => {
    if (reviewItems === null) {
      return warningCount > 0 ? (
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>Loading linked expenses...</div>
      ) : null;
    }
    if (reviewItems.length === 0) {
      return warningCount > 0 ? (
        <div style={{ ...infoBoxStyle, marginTop: '1rem', marginBottom: 0 }}>
          ✅ Every transaction flagged by this import now has a single expense.
        </div>
      ) : null;
    }

    return (
      <div style={{ marginTop: '1.25rem' }}>
        <div style={{ ...errorBoxStyle, background: '#fffbeb', border: '1px solid #fcd34d', maxHeight: 'none' }}>
          <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
            Please review: {reviewItems.length} transaction{reviewItems.length === 1 ? '' : 's'} now
            {reviewItems.length === 1 ? ' has' : ' have'} more than one expense
          </div>
          <div style={{ color: '#92400e', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            If two expenses below are the same charge, delete one of them.
          </div>
        </div>
        <div className="table-container" style={{ minHeight: 0, marginTop: '0.75rem' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Title</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewItems.map((tx) => (
                <Fragment key={tx.id}>
                  <tr>
                    <td colSpan={8} style={{ background: '#f1f5f9', textAlign: 'left', color: '#1e293b' }}>
                      <b>Transaction {tx.transaction_id}</b>
                      {' · '}{tx.date}
                      {' · '}{Number(tx.withdraw) > 0 ? `Withdraw ${yen(tx.withdraw)}` : `Deposit ${yen(tx.deposit)}`}
                      {tx.description ? ` · ${tx.description}` : ''}
                      {tx.notes ? <span style={{ color: '#64748b' }}>{` · ${tx.notes}`}</span> : null}
                    </td>
                  </tr>
                  {tx.expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>#{expense.id}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{expense.date}</td>
                      <td>{expense.title}</td>
                      <td>{expense.description || '-'}</td>
                      <td>{expense.category || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <b>{yen(expense.total_amount)}</b>
                        {Number(expense.tax_amount) > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {yen(expense.amount)} + tax {yen(expense.tax_amount)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '0.15rem 0.55rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
                          background: expense.from_this_import ? '#dbeafe' : '#f1f5f9',
                          color: expense.from_this_import ? '#1d4ed8' : '#475569',
                        }}
                        >
                          {expense.from_this_import ? 'This import' : 'Existing'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderRadius: 10 }}
                          onClick={() => setDeleteTarget(expense)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} id="expense-bulk-import-form" className="modal-form">
      {job && !isActive && (
        <div style={{ ...infoBoxStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <span>
            Last import: <b>{job.file_name}</b> ({job.status === 'completed' ? 'completed' : 'failed'}
            {job.finished_at ? `, ${new Date(job.finished_at).toLocaleString()}` : ''})
          </span>
          <button type="button" onClick={() => setViewingLast(true)} style={{ ...linkButtonStyle, whiteSpace: 'nowrap' }}>
            View result
          </button>
        </div>
      )}
      <div style={infoBoxStyle}>
        <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: '#1e293b' }}>Excel columns (all required):</div>
        <div style={{ marginBottom: '0.5rem' }}>{COLUMNS.join(' · ')}</div>
        <ul style={{ margin: '0 0 0.5rem', paddingLeft: '1.1rem' }}>
          <li>Each row needs either a Withdraw Amount or a Deposit Amount, not both.</li>
          <li>Withdraw rows create a transaction and an expense. Tax Way is Inclusive or Exclusive.</li>
          <li>Deposit rows create a transaction only; Title, Category and tax columns may be left blank.</li>
          <li>The whole file is checked first. If any row is wrong, nothing is imported.</li>
        </ul>
        <button type="button" onClick={handleDownloadTemplate} style={linkButtonStyle}>
          📥 Download Excel Template
        </button>
      </div>

      <div className="form-group">
        <label>Company Account <span style={{ color: 'red' }}>*</span></label>
        <select className="form-input" value={account} onChange={(e) => setAccount(e.target.value)} required>
          <option value="">Select Account</option>
          {companyAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Excel File (.xlsx) <span style={{ color: 'red' }}>*</span></label>
        <input
          type="file"
          accept=".xlsx"
          className="form-input"
          onChange={(e) => {
            setFile(e.target.files[0] || null);
            setRowErrors(null);
          }}
          required
        />
      </div>

      {rowErrors && rowErrors.length > 0 && (
        <div style={errorBoxStyle}>
          <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            ⚠️ Nothing was imported. Fix these and upload again ({totalErrors}):
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#b91c1c', fontSize: '0.8125rem', lineHeight: 1.4 }}>
            {rowErrors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
          {totalErrors > rowErrors.length && (
            <div style={{ color: '#991b1b', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
              Showing the first {rowErrors.length} of {totalErrors}.
            </div>
          )}
        </div>
      )}
    </form>
  );

  let body;
  let actions;
  if (isActive) {
    body = renderProgress();
    actions = <button type="button" className="btn-secondary" onClick={closeModal}>Close</button>;
  } else if (showingResult) {
    body = renderResult();
    actions = (
      <>
        <button type="button" className="btn-secondary" onClick={startAnother}>Import another file</button>
        <button type="button" className="btn-primary" onClick={closeModal}>Done</button>
      </>
    );
  } else {
    body = renderForm();
    actions = (
      <>
        <button type="button" className="btn-secondary" onClick={closeModal} disabled={uploading}>Cancel</button>
        <button type="submit" form="expense-bulk-import-form" className="btn-primary" disabled={uploading}>
          {uploading ? 'Validating...' : 'Validate & Import'}
        </button>
      </>
    );
  }

  return (
    <>
      <button className="btn-secondary" onClick={() => setShowModal(true)}>
        {buttonLabel}
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: showingResult && reviewItems?.length ? 1100 : 640 }}>
            <div className="modal-header">
              <h3>Bulk Import Expenses & Transactions</h3>
              <button className="modal-close" type="button" onClick={closeModal} disabled={uploading}>×</button>
            </div>
            {body}
            <div className="modal-actions">{actions}</div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={deleteTarget
          ? `Delete expense #${deleteTarget.id} '${deleteTarget.title}' ${yen(deleteTarget.total_amount)} `
            + `(${deleteTarget.category || 'no category'}, ${deleteTarget.date})? This cannot be undone. `
            + 'The bank transaction itself is kept.'
          : ''}
      />
    </>
  );
};

export default ExpenseBulkImport;
