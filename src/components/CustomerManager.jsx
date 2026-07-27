import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest, getErrorMessage } from '../api';
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

  useEffect(() => { fetchCustomers(); }, [search, currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will also delete all related orders.')) return;
    try {
      const response = await apiRequest(`/revenue/customers/${id}/`, { method: 'DELETE' });
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(errorMessage);
      }
      toast.success('Customer deleted');
      fetchCustomers();
      setOpenMenuId(null);
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
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 80;
    const top = rect.bottom + 5 + menuHeight > window.innerHeight ? rect.top - menuHeight - 5 : rect.bottom + 5;
    setMenuPos({ top, left: rect.right - 120 });
    setOpenMenuId(openMenuId === id ? null : id);
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
                customers.map((c, index )=> (
                  <tr key={c.id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>{c.bank_name}</td>
                    <td>{c.account_number}</td>
                    <td>
                      <button className="btn-menu" onClick={(e) => handleMenuClick(e, c.id)}>⋮</button>
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

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEdit(customers.find(c => c.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
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
              <div className="modal-actions">
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

export default CustomerManager;
