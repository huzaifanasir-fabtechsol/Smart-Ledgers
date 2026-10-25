import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Copy, Trash2, Filter } from 'lucide-react';
import { apiRequest, getErrorMessage } from '../api';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './DeleteConfirmModal';
import './TaxReports.css';

const formatNum = (val) => Number(val || 0).toLocaleString();

const sanitizeCategoryName = (name) => {
  if (!name) return '-';
  const clean = String(name).replace(/[぀-ヿ㐀-䶿一-鿿]+/g, '').replace(/\(\s*\)/g, '').trim();
  return clean || name;
};

const taxOf = (exp) => {
  const hasTax = exp.tax_percent_used && Number(exp.tax_percent_used) > 0;
  if (exp.tax_amount !== null && exp.tax_amount !== undefined) return Number(exp.tax_amount);
  return hasTax ? Math.round((Number(exp.amount || 0) * Number(exp.tax_percent_used)) / 100) : 0;
};

const ExpenseDuplicates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const filterQuery = location.search.replace(/^\?/, '');

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDuplicates = async () => {
    try {
      const response = await apiRequest(`/expenses/duplicates/${filterQuery ? `?${filterQuery}` : ''}`);
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to load duplicate expenses'));
      const data = await response.json();
      setGroups(Array.isArray(data.groups) ? data.groups : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load duplicate expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDuplicates();
  }, [filterQuery]);

  const handleBack = () => {
    // 'default' means this page was opened directly (no Expenses page in history)
    if (location.key !== 'default') navigate(-1);
    else navigate('/expenses');
  };

  const handleDelete = async () => {
    const exp = pendingDelete;
    setPendingDelete(null);
    if (!exp) return;
    setDeletingId(exp.id);
    try {
      const response = await apiRequest(`/expenses/${exp.id}/delete_duplicate/`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to delete expense'));
      // Drop the row; a group left with a single copy is no longer a duplicate
      setGroups((prev) =>
        prev
          .map((g) => ({ ...g, expenses: g.expenses.filter((e) => e.id !== exp.id) }))
          .filter((g) => g.expenses.length > 1)
      );
      toast.success('Duplicate expense deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    } finally {
      setDeletingId(null);
      fetchDuplicates();
    }
  };

  const extraCopies = groups.reduce((sum, g) => sum + g.expenses.length - 1, 0);

  return (
    <div className="tax-reports-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <PageHeader
        title="Duplicate Expenses"
        subtitle="Expenses whose data is identical in every field. Delete the extra copies; the last copy always stays."
        icon={Copy}
        actions={
          <button type="button" className="btn-report-type-switch" onClick={handleBack} title="Back to Expenses">
            <ArrowLeft size={16} />
            <span>Back to Expenses</span>
          </button>
        }
      />

      {filterQuery && (
        <div className="tax-detail-card tax-duplicates-filter-note">
          <Filter size={15} />
          <span>Showing duplicates within the filters applied on the Expenses page.</span>
          <button type="button" className="btn-filter-reset" onClick={() => navigate('/expenses/duplicates', { replace: true })}>
            Show all duplicates
          </button>
        </div>
      )}

      {loading ? (
        <div className="tax-detail-card tax-detail-status">Loading duplicate expenses...</div>
      ) : groups.length === 0 ? (
        <div className="tax-detail-card tax-detail-status">No duplicate expenses found.</div>
      ) : (
        <>
          <div className="tax-duplicates-summary">
            <strong>{extraCopies}</strong> extra {extraCopies === 1 ? 'copy' : 'copies'} in{' '}
            <strong>{groups.length}</strong> {groups.length === 1 ? 'group' : 'groups'}
          </div>

          {groups.map((group, gIdx) => {
            const first = group.expenses[0];
            return (
              <div key={first.id} className="tax-table-card">
                <div className="tax-detail-card-title tax-detail-table-title">
                  <Copy size={16} />
                  Group {gIdx + 1} · {group.expenses.length} identical copies
                  <span className="tax-detail-hint">
                    {first.title} · {first.date} · ¥{formatNum(Number(first.amount || 0) + taxOf(first))}
                  </span>
                </div>
                <div className="tax-table-wrapper" style={{ minHeight: 0 }}>
                  <table className="tax-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>ID</th>
                        <th style={{ width: 150 }}>Created</th>
                        <th style={{ width: 105 }}>Date</th>
                        <th>Title / Description</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'center', width: 90 }}>Payment</th>
                        <th style={{ textAlign: 'right', width: 120 }}>Pre-Tax (¥)</th>
                        <th style={{ textAlign: 'right', width: 110 }}>Tax (¥)</th>
                        <th style={{ textAlign: 'right', width: 120 }}>Total (¥)</th>
                        <th style={{ textAlign: 'center', width: 100 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.expenses.map((exp) => {
                        const amt = Number(exp.amount || 0);
                        const taxAmt = taxOf(exp);
                        return (
                          <tr key={exp.id}>
                            <td style={{ color: '#64748b' }}>#{exp.id}</td>
                            <td style={{ color: '#64748b' }}>
                              {exp.created_at ? new Date(exp.created_at).toLocaleString() : '-'}
                            </td>
                            <td style={{ fontWeight: 600 }}>{exp.date}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{exp.title}</div>
                              {exp.description && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{exp.description}</div>
                              )}
                            </td>
                            <td>{sanitizeCategoryName(exp.category_name)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`method-badge ${exp.is_cash ? 'cash' : 'bank'}`}>
                                {exp.is_cash ? 'Cash' : 'Bank'}
                              </span>
                            </td>
                            <td className="amount">¥{formatNum(amt)}</td>
                            <td className="amount tax">¥{formatNum(taxAmt)}</td>
                            <td className="amount total">¥{formatNum(amt + taxAmt)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn-duplicate-delete"
                                disabled={deletingId !== null}
                                onClick={() => setPendingDelete(exp)}
                                title="Delete this copy"
                              >
                                <Trash2 size={14} />
                                {deletingId === exp.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}

      <DeleteConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete Duplicate Expense"
        message={`Delete copy #${pendingDelete?.id} of "${pendingDelete?.title}"? The other identical copies stay. This action cannot be undone.`}
      />
    </div>
  );
};

export default ExpenseDuplicates;
