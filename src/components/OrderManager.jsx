import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { apiRequest } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import '../shared.css';
import './OrderManager.css';

const OrderManager = ({ language = 'en', onAddOrder, onEditOrder }) => {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
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
        name: order.other_details.saler_name || order.other_details.seller_name || '',
        phone: order.other_details.phone || ''
      };
    } else if (order.transaction_type === 'sale' && order.other_details) {
      return {
        name: order.other_details.customer_name || '',
        phone: order.other_details.phone || ''
      };
    } else if (order.transaction_type === 'auction' && order.other_details) {
      return {
        name: order.other_details.auction_house || '',
        phone: order.other_details.phone || ''
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

  const handleDelete = async () => {
    try {
      await apiRequest(`/revenue/orders/${showDeleteConfirm.id}/`, { method: 'DELETE' });
      toast.success('Order deleted successfully');
      setShowDeleteConfirm(null);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handleEdit = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOpenMenuId(null);
      onEditOrder(order);
    }
  };

  const handleViewDetails = (order) => {
    setOpenMenuId(null);
    setSelectedViewOrder(order);
    setShowViewModal(true);
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      const response = await apiRequest(`/revenue/orders/${orderId}/generate_invoice/`, {
        method: 'GET'
      });
      if (!response.ok) {
        throw new Error('Invoice generation failed');
      }
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
    if (openMenuId === orderId) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setOpenMenuId(orderId);
  };

  return (
    <div className="order-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>{t.orders}</h2>
        <button className="btn-primary" onClick={onAddOrder}>{t.addOrder}</button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input
            type="text"
            placeholder="Search by transaction , customer, notes..."
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
            <option value="nagare">Nagare (流れ)</option>
            <option value="auction">Auction</option>
          </select>
          <select
            value={filters.transaction_catagory}
            onChange={(e) => handleFilterChange('transaction_catagory', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="local">Local</option>
            <option value="foreign">Foreign</option>
          </select>
          <input
            type="date"
            className="filter-input"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            className="filter-input"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            placeholder="End Date"
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sr</th>
                <th>{t.date}</th>
                <th>{t.type}</th>
                <th>Name</th>
                <th>Auction</th>
                <th>{t.items}</th>
                <th>{t.paymentStatus}</th>
                <th>{t.totalAmount}</th>
                <th style={{width: '60px'}}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const contact = getContactInfo(order);
                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => handleViewDetails(order)}
                      style={{ cursor: 'pointer' }}
                      className="table-row-hover"
                    >
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}>
                          {order.transaction_date}
                        </span>
                      </td>
                      <td>{order.transaction_type?.[0].toUpperCase() + order.transaction_type?.slice(1)}</td>
                      <td>{contact.name}</td>
                      <td>{order.auction_name}</td>
                      <td>{order.items?.length || 0}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <span className={`status-badge status-${order.payment_status}`} onClick={() => handleEditStatus(order)} style={{cursor: 'pointer'}}>
                          {t[order.payment_status]}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>¥{Number(order.total_amount || 0).toLocaleString()}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className={`btn-menu ${openMenuId === order.id ? 'active' : ''}`} onClick={(e) => handleMenuClick(e, order.id)}>⋮</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{t.previous}</button>
          <span>{t.page} {currentPage} {t.of} {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{t.next}</button>
        </div>
      </div>

      {openMenuId && (
        <div ref={menuRef} className="context-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          {(() => {
            const order = orders.find(o => o.id === openMenuId);
            return order ? (
              <>
                <button onClick={() => handleViewDetails(order)}>👁️ View Details</button>
                <button onClick={() => handleEdit(openMenuId)}>✏️ Edit</button>
                <button onClick={() => handleGenerateInvoice(openMenuId)}>📄 Download PDF</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(order); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Order"
        message={`Are you sure you want to delete this order? This action cannot be undone.`}
      />

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
      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedViewOrder(null); }}
        orderId={selectedViewOrder?.id}
        initialOrder={selectedViewOrder}
        onEdit={(order) => { onEditOrder(order); }}
      />
    </div>
  );
};

export default OrderManager;
