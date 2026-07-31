import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import '../shared.css';
import './OrderManager.css';

const RestaurantManager = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({ name: '', location: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => { fetchRestaurants(); }, [search, currentPage]);

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

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/restaurants/?search=${search}&page=${currentPage}`);
      const data = await response.json();
      setRestaurants(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRestaurant) {
        await apiRequest(`/restaurants/${editingRestaurant.id}/`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Restaurant updated');
      } else {
        await apiRequest('/restaurants/', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Restaurant added');
      }
      setShowModal(false);
      setEditingRestaurant(null);
      setFormData({ name: '', location: '', description: '' });
      setCurrentPage(1);
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to save restaurant');
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/restaurants/${showDeleteConfirm.id}/`, { method: 'DELETE' });
      toast.success('Restaurant deleted');
      setShowDeleteConfirm(null);
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to delete restaurant');
    }
  };

  const openEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData(restaurant);
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
    <div className="restaurant-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>Restaurant Management</h2>
        <button className="btn-primary" onClick={() => { setShowModal(true); setEditingRestaurant(null); setFormData({ name: '', location: '', description: '' }); }}>Add Restaurant</button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input type="text" placeholder="Search restaurants..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="filter-input" />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Name</th>
                <th>Location</th>
                <th>Description</th>
                <th style={{width: '60px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading restaurants...</span>
                    </div>
                  </td>
                </tr>
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No restaurants found
                  </td>
                </tr>
              ) : (
                restaurants.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{(currentPage - 1) * 10 + idx + 1}</td>
                    <td>{r.name}</td>
                    <td>{r.location}</td>
                    <td>{r.description}</td>
                    <td>
                      <button className={`btn-menu ${openMenuId === r.id ? 'active' : ''}`} onClick={(e) => handleMenuClick(e, r.id)}>⋮</button>
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
            const restaurant = restaurants.find(r => r.id === openMenuId);
            return restaurant ? (
              <>
                <button onClick={() => openEdit(restaurant)}>✏️ Edit</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(restaurant); setOpenMenuId(null); }}>🗑️ Delete</button>
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
              <h3>{editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" className="form-input" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
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
        title="Delete Restaurant"
        message={`Are you sure you want to delete "${showDeleteConfirm?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default RestaurantManager;
