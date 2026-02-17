import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const CompanyAccountManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [formData, setFormData] = useState({
    bank_name: '', account_number: '', branch_code: '', account_holder: '', swift_code: ''
  });

  useEffect(() => { fetchAccounts(); }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiRequest(`/revenue/company-accounts/?search=${search}`);
      const data = await response.json();
      setAccounts(data.results || data);
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await apiRequest(`/revenue/company-accounts/${editingAccount.id}/`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Account updated');
      } else {
        await apiRequest('/revenue/company-accounts/', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Account added');
      }
      setShowModal(false);
      setEditingAccount(null);
      setFormData({ bank_name: '', account_number: '', branch_code: '', account_holder: '', swift_code: '' });
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to save account');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    try {
      await apiRequest(`/revenue/company-accounts/${id}/`, { method: 'DELETE' });
      toast.success('Account deleted');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const openEdit = (account) => {
    setEditingAccount(account);
    setFormData(account);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleMenuClick = (e, id) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 80;
    const top = rect.bottom + 5 + menuHeight > window.innerHeight ? rect.top - menuHeight - 5 : rect.bottom + 5;
    setMenuPos({ top, left: rect.right - 120 });
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="order-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>Company Bank Accounts</h2>
        <button className="btn-primary" onClick={() => { setShowModal(true); setEditingAccount(null); setFormData({ bank_name: '', account_number: '', branch_code: '', account_holder: '', swift_code: '' }); }}>Add Account</button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Bank Name</th>
            <th>Account Holder</th>
            <th>Account Number</th>
            <th>Branch Code</th>
            <th>SWIFT Code</th>
            <th style={{width: '60px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map(a => (
            <tr key={a.id}>
              <td>{a.bank_name}</td>
              <td>{a.account_holder}</td>
              <td>{a.account_number}</td>
              <td>{a.branch_code}</td>
              <td>{a.swift_code}</td>
              <td>
                <button className="btn-menu" onClick={(e) => handleMenuClick(e, a.id)}>⋮</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEdit(accounts.find(a => a.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingAccount ? 'Edit Account' : 'Add Account'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Account Holder</label>
                <input type="text" value={formData.account_holder} onChange={(e) => setFormData({...formData, account_holder: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input type="text" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Branch Code</label>
                <input type="text" value={formData.branch_code} onChange={(e) => setFormData({...formData, branch_code: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>SWIFT Code</label>
                <input type="text" value={formData.swift_code} onChange={(e) => setFormData({...formData, swift_code: e.target.value})} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAccountManager;
