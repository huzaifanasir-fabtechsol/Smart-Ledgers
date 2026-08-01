import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiRequest } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import '../shared.css';

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [companyAccounts, setCompanyAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAccount, setBulkAccount] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkErrors, setBulkErrors] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    date: '',
    company_account: ''
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    withdraw: '',
    deposit: '',
    description: '',
    notes: '',
    company_account: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchCompanyAccounts();
  }, [currentPage, filters]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    const handleCloseMenu = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });
      
      const response = await apiRequest(`/revenue/transactions/?${params}`);
      const data = await response.json();
      setTransactions(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 10));
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyAccounts = async () => {
    try {
      const response = await apiRequest('/revenue/company-accounts/');
      const data = await response.json();
      setCompanyAccounts(data.results || data || []);
    } catch (error) {
      toast.error('Failed to load company accounts');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', date: '', company_account: '' });
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      transaction_id: '',
      withdraw: '',
      deposit: '',
      description: '',
      notes: '',
      company_account: ''
    });
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      transaction_id: transaction.transaction_id || '',
      withdraw: transaction.withdraw || '',
      deposit: transaction.deposit || '',
      description: transaction.description || '',
      notes: transaction.notes || '',
      company_account: transaction.company_account || ''
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!formData.company_account) {
      toast.error('Company account is required');
      return;
    }

    setLoading(true);
    try {
      const endpoint = editingTransaction 
        ? `/revenue/transactions/${editingTransaction.id}/`
        : '/revenue/transactions/';
      const method = editingTransaction ? 'PATCH' : 'POST';

      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          withdraw: formData.withdraw ? parseFloat(formData.withdraw) : 0,
          deposit: formData.deposit ? parseFloat(formData.deposit) : 0
        })
      });

      if (!response.ok) throw new Error('Failed to save transaction');

      toast.success(editingTransaction ? 'Transaction updated successfully' : 'Transaction created successfully');
      setShowModal(false);
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/revenue/transactions/${showDeleteConfirm.id}/`, { method: 'DELETE' });
      toast.success('Transaction deleted successfully');
      setShowDeleteConfirm(null);
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleDownloadSampleTemplate = () => {
    const csvContent = "date,transection id,withdraw amount,depostie amount,description,notes\n" +
      "2026-08-01,TXN-1001,500.00,0.00,Office Supplies,Purchased printer paper & ink\n" +
      "2026-08-02,TXN-1002,0.00,1500.00,Client Payment,Services rendered for July";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_transactions_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkErrors(null);

    if (!bulkAccount) {
      toast.error('Please select a company account');
      return;
    }
    if (!bulkFile) {
      toast.error('Please select an Excel (.xlsx / .xls) file');
      return;
    }

    setBulkUploading(true);
    try {
      const payload = new FormData();
      payload.append('company_account', bulkAccount);
      payload.append('file', bulkFile);

      const response = await apiRequest('/revenue/transactions/bulk_upload/', {
        method: 'POST',
        body: payload
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.row_errors && data.row_errors.length > 0) {
          setBulkErrors(data.row_errors);
          toast.error(data.error || 'Validation failed. Please check error details.');
        } else {
          toast.error(data.error || 'Failed to upload bulk transactions');
        }
        return;
      }

      toast.success(data.message || 'Transactions imported successfully!');
      setShowBulkModal(false);
      setBulkFile(null);
      setBulkAccount('');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to process file. Please try again.');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleMenuClick = (e, transactionId) => {
    e.stopPropagation();
    if (openMenuId === transactionId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setOpenMenuId(transactionId);
  };

  return (
    <div className="transaction-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="page-header">
        <h2>Transactions</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn-secondary" 
            onClick={() => {
              setBulkErrors(null);
              setBulkFile(null);
              setBulkAccount('');
              setShowBulkModal(true);
            }}
          >
            📥 Bulk Import XLSX
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            + Add Transaction
          </button>
        </div>
      </div>

      <div className="table-section">
        <div className="filters">
          <input
            type="text"
            placeholder="Search by description, notes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="filter-input"
          />
          <select
            value={filters.company_account}
            onChange={(e) => handleFilterChange('company_account', e.target.value)}
            className="filter-select"
          >
            <option value="">All Accounts</option>
            {companyAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.bank_name} - {account.account_number}
              </option>
            ))}
          </select>
          <button onClick={handleClearFilters} className="btn-secondary">
            Clear
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sr</th>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Description</th>
                <th>Withdraw</th>
                <th>Deposit</th>
                <th>Balance</th>
                <th>Account</th>
                <th style={{width: '60px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, index) => (
                  <tr key={transaction.id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>{transaction.date}</td>
                    <td>{transaction.transaction_id || '-'}</td>
                    <td>{transaction.description}</td>
                    <td className="amount-cell">
                      {transaction.withdraw > 0 ? `¥${Number(transaction.withdraw).toLocaleString()}` : '-'}
                    </td>
                    <td className="amount-cell">
                      {transaction.deposit > 0 ? `¥${Number(transaction.deposit).toLocaleString()}` : '-'}
                    </td>
                    <td className="amount-cell">¥{Number(transaction.balance).toLocaleString()}</td>
                    <td>
                      {companyAccounts.find(acc => acc.id === transaction.company_account)?.bank_name || '-'}
                    </td>
                    <td>
                      <button className={`btn-menu ${openMenuId === transaction.id ? 'active' : ''}`} onClick={(e) => handleMenuClick(e, transaction.id)}>⋮</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {openMenuId && (
        <div ref={menuRef} className="context-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          {(() => {
            const transaction = transactions.find(t => t.id === openMenuId);
            return transaction ? (
              <>
                <button onClick={() => openEditModal(transaction)}>✏️ Edit</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(transaction); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transaction ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Company Account</label>
                <select
                  className="form-input"
                  value={formData.company_account}
                  onChange={(e) => setFormData({...formData, company_account: e.target.value})}
                  required
                >
                  <option value="">Select Account</option>
                  {companyAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Withdraw Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.withdraw}
                    onChange={(e) => setFormData({...formData, withdraw: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Deposit Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.deposit}
                    onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Transaction description"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Import Transactions</h3>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleBulkSubmit} className="modal-form">
              <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: '#1e293b' }}>Excel Format Requirements:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', marginBottom: '0.5rem' }}>
                  <span>📅 <b>date</b> (YYYY-MM-DD)</span>
                  <span>🔢 <b>transection id</b></span>
                  <span>💸 <b>withdraw amount</b></span>
                  <span>💰 <b>depostie amount</b></span>
                  <span>📝 <b>description</b> (Required)</span>
                  <span>📌 <b>notes</b></span>
                </div>
                <button 
                  type="button" 
                  onClick={handleDownloadSampleTemplate}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', padding: 0, fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  📥 Download Sample CSV Template
                </button>
              </div>

              <div className="form-group">
                <label>Company Account <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="form-input"
                  value={bulkAccount}
                  onChange={(e) => setBulkAccount(e.target.value)}
                  required
                >
                  <option value="">Select Account</option>
                  {companyAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Excel File (.xlsx / .xls) <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="form-input"
                  onChange={(e) => {
                    setBulkFile(e.target.files[0] || null);
                    setBulkErrors(null);
                  }}
                  required
                />
              </div>

              {bulkErrors && bulkErrors.length > 0 && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    ⚠️ Pre-validation Errors ({bulkErrors.length}):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#b91c1c', fontSize: '0.8125rem', lineHeight: '1.4' }}>
                    {bulkErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowBulkModal(false)} disabled={bulkUploading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={bulkUploading}>
                  {bulkUploading ? 'Validating & Importing...' : 'Validate & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction "${showDeleteConfirm?.description}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default TransactionManager;