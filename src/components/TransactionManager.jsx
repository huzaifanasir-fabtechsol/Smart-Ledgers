import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiRequest } from '../api';
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
  const menuRef = useRef(null);

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
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await apiRequest(`/revenue/transactions/${transactionId}/`, { method: 'DELETE' });
      toast.success('Transaction deleted successfully');
      setOpenMenuId(null);
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const handleMenuClick = (e, transactionId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 80;
    const top = rect.bottom + 5 + menuHeight > window.innerHeight ? rect.top - menuHeight - 5 : rect.bottom + 5;
    setMenuPos({ top, left: rect.right - 120 });
    setOpenMenuId(openMenuId === transactionId ? null : transactionId);
  };

  return (
    <div className="transaction-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="page-header">
        <h2>Transactions</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          Add Transaction
        </button>
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
                      <button className="btn-menu" onClick={(e) => handleMenuClick(e, transaction.id)}>⋮</button>
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

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEditModal(transactions.find(t => t.id === openMenuId))}>
            Edit
          </button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>
            Delete
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transaction ID</label>
                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Company Account</label>
                <select
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

              <div className="form-row">
                <div className="form-group">
                  <label>Withdraw Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Transaction description"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
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
    </div>
  );
};

export default TransactionManager;