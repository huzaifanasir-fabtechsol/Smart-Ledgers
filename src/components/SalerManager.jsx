import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const SalerManager = () => {
  const [salers, setSalers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSaler, setEditingSaler] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '', email: '', address: '', phone: '', account_number: '', branch_code: '', bank_name: '', swift_code: ''
  });

  useEffect(() => { fetchSalers(); }, [search, currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchSalers = async () => {
    try {
      const response = await apiRequest(`/revenue/salers/?search=${search}&page=${currentPage}`);
      const data = await response.json();
      setSalers(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      toast.error('Failed to load salers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSaler) {
        await apiRequest(`/revenue/salers/${editingSaler.id}/`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Saler updated');
      } else {
        await apiRequest('/revenue/salers/', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Saler added');
      }
      setShowModal(false);
      setEditingSaler(null);
      setFormData({ name: '', email: '', address: '', phone: '', account_number: '', branch_code: '', bank_name: '', swift_code: '' });
      setCurrentPage(1);
      fetchSalers();
    } catch (error) {
      toast.error('Failed to save saler');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saler? This will also delete all related orders.')) return;
    try {
      await apiRequest(`/revenue/salers/${id}/`, { method: 'DELETE' });
      toast.success('Saler deleted');
      fetchSalers();
      setOpenMenuId(null);
    } catch (error) {
      toast.error('Failed to delete saler');
    }
  };

  const openEdit = (saler) => {
    setEditingSaler(saler);
    setFormData(saler);
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
        <h2>Saler Management</h2>
        <button className="btn-primary" onClick={() => { setShowModal(true); setEditingSaler(null); setFormData({ name: '', email: '', address: '', phone: '', account_number: '', branch_code: '', bank_name: '', swift_code: '' }); }}>Add Saler</button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Search salers..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Sr</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Bank</th>
            <th>Account</th>
            <th style={{width: '60px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {salers.map((s, index )=> (
            <tr key={s.id}>
              <td>{(currentPage - 1) * 10 + index + 1}</td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.phone}</td>
              <td>{s.bank_name}</td>
              <td>{s.account_number}</td>
              <td>
                <button className="btn-menu" onClick={(e) => handleMenuClick(e, s.id)}>⋮</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
        <span>Page {currentPage} of {Math.ceil(totalCount / 10) || 1}</span>
        <button disabled={currentPage >= Math.ceil(totalCount / 10)} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </div>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEdit(salers.find(s => s.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingSaler ? 'Edit Saler' : 'Add Saler'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} required />
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
                <label>Swift Code</label>
                <input type="text" value={formData.swift_code} onChange={(e) => setFormData({...formData, swift_code: e.target.value})} required />
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

export default SalerManager;
