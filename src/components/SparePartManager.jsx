import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const INITIAL_FORM = { name: '', location: '', description: '' };

const SparePartManager = () => {
  const [spareParts, setSpareParts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [formData, setFormData] = useState(INITIAL_FORM);
  const menuRef = useRef(null);

  useEffect(() => { fetchSpareParts(); }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchSpareParts = async () => {
    try {
      const response = await apiRequest(`/spare-parts/?page_size=1000&search=${encodeURIComponent(search)}`);
      const data = await response.json();
      setSpareParts(data.results || data || []);
    } catch (error) {
      toast.error('Failed to load spare parts');
    }
  };

  const openCreate = () => {
    setEditingSparePart(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const openEdit = (sparePart) => {
    setEditingSparePart(sparePart);
    setFormData({
      name: sparePart.name || '',
      location: sparePart.location || '',
      description: sparePart.description || '',
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSparePart) {
        await apiRequest(`/spare-parts/${editingSparePart.id}/`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Shop updated');
      } else {
        await apiRequest('/spare-parts/', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Shop added');
      }
      setShowModal(false);
      setEditingSparePart(null);
      setFormData(INITIAL_FORM);
      fetchSpareParts();
    } catch (error) {
      toast.error('Failed to save shop');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this spare part?')) return;
    try {
      await apiRequest(`/spare-parts/${id}/`, { method: 'DELETE' });
      toast.success('Shop deleted');
      fetchSpareParts();
    } catch (error) {
      toast.error('Failed to delete shop');
    }
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
        <h2>Shops Management</h2>
        <button className="btn-primary" onClick={openCreate}>Add Shop</button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Search shops..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Sr.</th>
            <th>Name</th>
            <th>Location</th>
            <th>Description</th>
            <th style={{ width: '60px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {spareParts.map((item, idx) => (
            <tr key={item.id}>
              <td>{idx + 1}</td>
              <td>{item.name}</td>
              <td>{item.location || '-'}</td>
              <td>{item.description || '-'}</td>
              <td>
                <button className="btn-menu" onClick={(e) => handleMenuClick(e, item.id)}>⋮</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEdit(spareParts.find(s => s.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingSparePart ? 'Edit Shop' : 'Add Shop'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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

export default SparePartManager;
