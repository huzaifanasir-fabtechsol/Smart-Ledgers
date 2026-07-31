import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import '../shared.css';
import './OrderManager.css';

const INITIAL_FORM = { name: '', address: '', description: '' };

const SparePartManager = () => {
  const [spareParts, setSpareParts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [formData, setFormData] = useState(INITIAL_FORM);
  const menuRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => { fetchSpareParts(); }, [search, currentPage]);

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

  const fetchSpareParts = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/spare-parts/?search=${encodeURIComponent(search)}&page=${currentPage}`);
      const data = await response.json();
      setSpareParts(data.results || data || []);
      setTotalCount(data.count || 0);
    } catch (error) {
      toast.error('Failed to load spare parts');
    } finally {
      setLoading(false);
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
      address: sparePart.address || '',
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
      setCurrentPage(1);
      fetchSpareParts();
    } catch (error) {
      toast.error('Failed to save shop');
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/spare-parts/${showDeleteConfirm.id}/`, { method: 'DELETE' });
      toast.success('Shop deleted');
      setShowDeleteConfirm(null);
      fetchSpareParts();
    } catch (error) {
      toast.error('Failed to delete shop');
    }
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
    <div className="spare-part-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>Shops Management</h2>
        <button className="btn-primary" onClick={openCreate}>Add Shop</button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input type="text" placeholder="Search shops..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="filter-input" />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Name</th>
                <th>Address</th>
                <th>Description</th>
                <th style={{ width: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading shops...</span>
                    </div>
                  </td>
                </tr>
              ) : spareParts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No shops found
                  </td>
                </tr>
              ) : (
                spareParts.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * 10 + idx + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.address || '-'}</td>
                    <td>{item.description || '-'}</td>
                    <td>
                      <button className={`btn-menu ${openMenuId === item.id ? 'active' : ''}`} onClick={(e) => handleMenuClick(e, item.id)}>⋮</button>
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
            const item = spareParts.find(s => s.id === openMenuId);
            return item ? (
              <>
                <button onClick={() => openEdit(item)}>✏️ Edit</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(item); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSparePart ? 'Edit Shop' : 'Add Shop'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" className="form-input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
        title="Delete Shop"
        message={`Are you sure you want to delete "${showDeleteConfirm?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default SparePartManager;
