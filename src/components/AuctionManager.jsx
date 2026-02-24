import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const AuctionManager = () => {
  const [auctions, setAuctions] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => { fetchAuctions(); }, [search, pageSize, currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await apiRequest(`/revenue/auctions/?search=${search}&pageSize=${pageSize}&page=${currentPage}`);
      const data = await response.json();
      setAuctions(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      toast.error('Failed to load auctions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAuction) {
        await apiRequest(`/revenue/auctions/${editingAuction.id}/`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Auction updated');
      } else {
        await apiRequest('/revenue/auctions/', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Auction added');
      }
      setShowModal(false);
      setEditingAuction(null);
      setFormData({ name: '', description: '' });
      setCurrentPage(1);
      fetchAuctions();
    } catch (error) {
      toast.error('Failed to save auction');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this auction?')) return;
    try {
      await apiRequest(`/revenue/auctions/${id}/`, { method: 'DELETE' });
      toast.success('Auction deleted');
      fetchAuctions();
    } catch (error) {
      toast.error('Failed to delete auction');
    }
  };

  const openEdit = (auction) => {
    setEditingAuction(auction);
    setFormData(auction);
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
        <h2>Auction Management</h2>
        <button className="btn-primary" onClick={() => { setShowModal(true); setEditingAuction(null); setFormData({ name: '', description: '' }); }}>Add Auction</button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Search auctions..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th style={{width: '60px'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((a, index )=> (
            <tr key={a.id}>
              <td>{index + 1}</td>
              <td>{a.name}</td>
              <td>{a.description}</td>
              <td>
                <button className="btn-menu" onClick={(e) => handleMenuClick(e, a.id)}>⋮</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
        <span>Page {currentPage} of {Math.ceil(totalCount / pageSize) || 1}</span>
        <button disabled={currentPage >= Math.ceil(totalCount / pageSize)} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
      </div>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => openEdit(auctions.find(a => a.id === openMenuId))}>Edit</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingAuction ? 'Edit Auction' : 'Add Auction'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
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

export default AuctionManager;
