import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const CarManager = () => {
  const [cars, setCars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [formData, setFormData] = useState({
    category: '', name: '', description: '', model: '', chassis_number: '', year: new Date().getFullYear()
  });

  useEffect(() => { fetchCars(); fetchCategories(); }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchCars = async () => {
    try {
      const response = await apiRequest(`/revenue/cars/?search=${search}`);
      const data = await response.json();
      setCars(data.results || data);
    } catch (error) {
      toast.error('Failed to load cars');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiRequest('/revenue/categories/');
      const data = await response.json();
      setCategories(data.results || data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCar) {
        await apiRequest(`/revenue/cars/${editingCar.id}/`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Car updated');
      } else {
        await apiRequest('/revenue/cars/', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Car added');
      }
      setShowModal(false);
      setEditingCar(null);
      setFormData({ category: '', name: '', description: '', model: '', chassis_number: '', year: new Date().getFullYear() });
      fetchCars();
    } catch (error) {
      toast.error('Failed to save car');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this car?')) return;
    try {
      await apiRequest(`/revenue/cars/${id}/`, { method: 'DELETE' });
      toast.success('Car deleted');
      fetchCars();
    } catch (error) {
      toast.error('Failed to delete car');
    }
  };

  const openEdit = (car) => {
    setEditingCar(car);
    setFormData(car);
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
        <h2>Car Management</h2>
        <button className="btn-primary" onClick={() => { setShowModal(true); setEditingCar(null); setFormData({ category: '', name: '', description: '', model: '', chassis_number: '', year: new Date().getFullYear() }); }}>Add Car</button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Search cars..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Model</th>
            <th>Category</th>
            <th>Chassis Number</th>
            <th>Year</th>
            <th style={{width: '60px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cars.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.model}</td>
              <td>{c.category_name}</td>
              <td>{c.chassis_number}</td>
              <td>{c.year}</td>
              <td>
                <button className="btn-menu" onClick={(e) => handleMenuClick(e, c.id)}>⋮</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEdit(cars.find(c => c.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCar ? 'Edit Car' : 'Add Car'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Chassis Number</label>
                <input type="text" value={formData.chassis_number} onChange={(e) => setFormData({...formData, chassis_number: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Year</label>
                <input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required />
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

export default CarManager;
