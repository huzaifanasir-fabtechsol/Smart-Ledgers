import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest, getErrorMessage } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import '../shared.css';
import './OrderManager.css';

const CustomerManager = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '', email: '', address: '', phone: '', account_number: '', branch_code: '', bank_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => { fetchCustomers(); }, [search, currentPage]);

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

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/revenue/customers/?search=${search}&page=${currentPage}`);
      const data = await response.json();
      setCustomers(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = editingCustomer
        ? await apiRequest(`/revenue/customers/${editingCustomer.id}/`, { method: 'PUT', body: JSON.stringify(formData) })
        : await apiRequest('/revenue/customers/', { method: 'POST', body: JSON.stringify(formData) });
      
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(errorMessage);
      }
      
      toast.success(editingCustomer ? 'Customer updated' : 'Customer added');
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', address: '', phone: '', account_number: '', branch_code: '', bank_name: '', swift_code: '' });
      setCurrentPage(1);
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || 'Failed to save customer');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiRequest(`/revenue/customers/${showDeleteConfirm.id}/`, { method: 'DELETE' });
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(errorMessage);
      }
      toast.success('Customer deleted');
      setShowDeleteConfirm(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete customer');
    }
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleMenuClick = (e, id) => {
    e.stopPropagation();
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setOpenMenuId(id);
  };

  return (
    <div className="customer-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>Customer Management</h2>
        <button className="btn-primary" onClick={() => { setShowModal(true); setEditingCustomer(null); setFormData({ name: '', email: '', address: '', phone: '', account_number: '', branch_code: '', bank_name: '' }); }}>Add Customer</button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input type="text" placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="filter-input" />
        </div>

        <div className="table-container">
          <table>
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
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c, index) => (
                  <tr key={c.id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>{c.bank_name}</td>
                    <td>{c.account_number}</td>
                    <td>
                      <button className={`btn-menu ${openMenuId === c.id ? 'active' : ''}`} onClick={(e) => handleMenuClick(e, c.id)}>⋮</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
          <span>Page {currentPage} of {Math.ceil(totalCount / 10) || 1}</span>
          <button disabled={currentPage >= Math.ceil(totalCount / 10)} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        </div>
      </div>

      {/* Context Menu */}
      {openMenuId && (
        <div ref={menuRef} className="context-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          {(() => {
            const customer = customers.find(c => c.id === openMenuId);
            return customer ? (
              <>
                <button onClick={() => openEdit(customer)}>✏️ Edit</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(customer); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" className="form-input" value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input type="text" className="form-input" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Branch Code</label>
                <input type="text" className="form-input" value={formData.branch_code} onChange={(e) => setFormData({...formData, branch_code: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Swift Code</label>
                <input type="text" className="form-input" value={formData.swift_code} onChange={(e) => setFormData({...formData, swift_code: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
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
        title="Delete Customer"
        message={`Are you sure you want to delete "${showDeleteConfirm?.name}"? This will also delete all related orders.`}
      />
    </div>
  );
};

export default CustomerManager;
