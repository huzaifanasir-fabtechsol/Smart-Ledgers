import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const OrderManager = ({ language = 'en', onAddOrder }) => {
  const t = translations[language];
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  
  const [filters, setFilters] = useState({
    payment_status: '',
    transaction_type: '',
    transaction_catagory: '',
    start_date: '',
    end_date: '',
    search: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });
      
      const response = await apiRequest(`/revenue/orders/?${params}`);
      const data = await response.json();
      setOrders(data.results || data);
      if (data.count) {
        setTotalPages(Math.ceil(data.count / pageSize));
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getContactInfo = (order) => {
    if (order.transaction_type === 'purchase' && order.other_details) {
      return {
        name: order.other_details.seller_name || '',
        phone: order.other_details.seller_phone || ''
      };
    } else if (order.transaction_type === 'sale' && order.other_details) {
      return {
        name: order.other_details.buyer_name || '',
        phone: order.other_details.buyer_phone || ''
      };
    } else if (order.transaction_type === 'auction' && order.other_details) {
      return {
        name: order.other_details.auction_house || '',
        phone: ''
      };
    }
    return { name: order.customer_name || '', phone: '' };
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      payment_status: '',
      transaction_type: '',
      transaction_catagory: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      await apiRequest(`/revenue/orders/${orderId}/`, { method: 'DELETE' });
      toast.success('Order deleted successfully');
      setOpenMenuId(null);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      const response = await apiRequest(`/revenue/orders/${orderId}/generate_invoice/`, {
        method: 'GET'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${orderId}.pdf`;
      a.click();
      toast.success('Invoice generated successfully');
      setOpenMenuId(null);
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleEditStatus = (order) => {
    setEditingOrder(order);
    setPaymentStatus(order.payment_status || 'pending');
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest(`/revenue/orders/${editingOrder.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: paymentStatus })
      });
      toast.success('Payment status updated successfully');
      fetchOrders();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (e, orderId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 100;
    const top = rect.bottom + 5 + menuHeight > window.innerHeight ? rect.top - menuHeight - 5 : rect.bottom + 5;
    setMenuPos({ top, left: rect.right - 120 });
    setOpenMenuId(openMenuId === orderId ? null : orderId);
  };

  return (
    <div className="order-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="table-section">
        <div className="table-header">
          <h3>{t.orders}</h3>
          <button className="btn-primary" onClick={onAddOrder}>{t.addOrder}</button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by order, customer, notes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
          <select
            value={filters.payment_status}
            onChange={(e) => handleFilterChange('payment_status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={filters.transaction_type}
            onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="sale">Sale</option>
            <option value="purchase">Purchase</option>
            <option value="auction">Auction</option>
          </select>
          <select
            value={filters.transaction_catagory}
            onChange={(e) => handleFilterChange('transaction_catagory', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="local">Local</option>
            <option value="imported">Imported</option>
          </select>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="filter-input filter-date"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="filter-input filter-date"
            placeholder="End Date"
          />
          <button className="btn-secondary" onClick={handleClearFilters}>Clear</button>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loader">Loading...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t.date}</th>
                  <th>{t.type}</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>{t.items}</th>
                  <th>{t.paymentStatus}</th>
                  <th>{t.totalAmount}</th>
                  <th style={{width: '60px'}}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const contact = getContactInfo(order);
                  return (
                    <tr key={order.id}>
                      <td>{order.transaction_date}</td>
                      <td>{order.transaction_type?.[0].toUpperCase() + order.transaction_type?.slice(1)}</td>
                      <td>{contact.name}</td>
                      <td>{contact.phone}</td>
                      <td>{order.items?.length || 0}</td>
                      <td><span className={`status-badge status-${order.payment_status}`} onClick={() => handleEditStatus(order)} style={{cursor: 'pointer'}}>{t[order.payment_status]}</span></td>
                      <td>${order.items?.reduce((sum, item) => sum + (Number(item.vehicle_price) || 0), 0).toLocaleString()}</td>
                      <td>
                        <button className="btn-menu" onClick={(e) => handleMenuClick(e, order.id)}>⋮</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{t.previous}</button>
          <span>{t.page} {currentPage} {t.of} {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{t.next}</button>
        </div>
      </div>

      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          <button className="menu-item" onClick={() => handleGenerateInvoice(openMenuId)}>Invoice</button>
          <button className="menu-item delete" onClick={() => handleDelete(openMenuId)}>Delete</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update Payment Status</h3>
            <form onSubmit={handleUpdateStatus}>
              <div className="form-group">
                <label>{t.paymentStatus}</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} required>
                  <option value="pending">{t.pending}</option>
                  <option value="completed">{t.completed}</option>
                  <option value="failed">{t.failed}</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={loading}>{t.cancel}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
