import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
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
  const [formData, setFormData] = useState({ name: '', location: '', description: '' });

  useEffect(() => { fetchRestaurants(); }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await apiRequest(`/restaurants/?search=${search}`);
      const data = await response.json();
      setRestaurants(data.results || data);
    } catch (error) {
      toast.error('Failed to load restaurants');
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
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to save restaurant');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this restaurant?')) return;
    try {
      await apiRequest(`/restaurants/${id}/`, { method: 'DELETE' });
      toast.success('Restaurant deleted');
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
        <h2>Restaurant Management</h2>
        <button className="btn-primary" onClick={() => { setShowModal(true); setEditingRestaurant(null); setFormData({ name: '', location: '', description: '' }); }}>Add Restaurant</button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Search restaurants..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Description</th>
            <th style={{width: '60px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.location}</td>
              <td>{r.description}</td>
              <td>
                <button className="btn-menu" onClick={(e) => handleMenuClick(e, r.id)}>⋮</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEdit(restaurants.find(r => r.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRestaurant ? 'Edit Restaurant' : 'Add Restaurant'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
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

export default RestaurantManager;
