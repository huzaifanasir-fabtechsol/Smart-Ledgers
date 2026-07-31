import { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Download, 
  Printer, 
  Calendar, 
  User, 
  Building2, 
  Car, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Tag,
  MapPin,
  Phone,
  Edit3
} from 'lucide-react';
import { apiRequest } from '../api';
import { toast } from 'react-toastify';
import '../shared.css';

const InvoiceDetailsModal = ({ isOpen, onClose, orderId, initialOrder = null, onEdit = null }) => {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
    } else if (isOpen && initialOrder) {
      setOrder(initialOrder);
    }
  }, [isOpen, orderId, initialOrder]);

  const fetchOrderDetails = async (id) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/revenue/orders/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        toast.error('Failed to load invoice details');
      }
    } catch {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!order?.id) return;
    setDownloadingPdf(true);
    try {
      const response = await apiRequest(`/revenue/orders/${order.id}/generate_invoice/`);
      if (!response.ok) throw new Error('Invoice PDF generation failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${order.order_number || order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invoice PDF downloaded successfully');
    } catch {
      toast.error('Failed to download invoice PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'completed' || s === 'paid') {
      return (
        <span className="status-badge status-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}>
          <CheckCircle2 size={14} /> Completed
        </span>
      );
    }
    if (s === 'failed' || s === 'cancelled') {
      return (
        <span className="status-badge status-failed" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}>
          <AlertCircle size={14} /> Failed
        </span>
      );
    }
    return (
      <span className="status-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }}>
        <Clock size={14} /> Pending
      </span>
    );
  };

  const getPartyInfo = () => {
    if (!order) return { name: '', phone: '', address: '', method: '', bankAcc: '' };
    const details = order.other_details || {};
    let name = order.customer_name || details.customer_name || details.saler_name || details.seller_name || details.auction_house || '';
    if (!name) {
      if (order.customer_name_obj) name = order.customer_name_obj;
      else if (order.saler_name_obj) name = order.saler_name_obj;
      else if (order.auction_name) name = order.auction_name;
    }
    return {
      name: name || 'N/A',
      phone: details.phone || 'N/A',
      address: details.address || 'N/A',
      method: details.payment_method || 'Cash',
      accountNumber: details.account_number || 'N/A'
    };
  };

  const party = getPartyInfo();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-box invoice-details-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: 900, 
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Modal Top Bar */}
        <div 
          className="modal-header" 
          style={{ 
            padding: '1.25rem 1.75rem', 
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 12, 
                background: 'var(--secondary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--ink)'
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Invoice Details #{order?.order_number || orderId}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                View and manage complete transaction record
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="btn-secondary" 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || loading || !order}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              title="Download PDF"
            >
              <Download size={15} />
              {downloadingPdf ? 'Downloading...' : 'PDF'}
            </button>

            <button 
              className="btn-secondary" 
              onClick={handlePrint}
              disabled={loading || !order}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              title="Print Invoice"
            >
              <Printer size={15} />
              Print
            </button>

            {onEdit && order && (
              <button 
                className="btn-primary" 
                onClick={() => { onClose(); onEdit(order); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}
              >
                <Edit3 size={15} />
                Edit
              </button>
            )}

            <button className="modal-close" onClick={onClose} style={{ marginLeft: '0.25rem' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div 
          className="modal-body print-area" 
          style={{ 
            padding: '1.75rem', 
            overflowY: 'auto', 
            flex: 1, 
            background: 'var(--background)' 
          }}
        >
          {loading && !order ? (
            <div className="table-loader-container" style={{ minHeight: 300 }}>
              <div className="spinner"></div>
              <span>Fetching invoice data...</span>
            </div>
          ) : !order ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)' }}>
              No invoice details available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header Banner */}
              <div 
                style={{ 
                  background: 'var(--card)', 
                  borderRadius: 16, 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.25rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Invoice No.
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', marginTop: '0.2rem' }}>
                    {order.order_number}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Date & Category
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Calendar size={15} style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{order.transaction_date}</span>
                    <span className="badge badge-role" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {order.transaction_catagory || 'Local'}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Transaction Type
                  </span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span 
                      style={{ 
                        display: 'inline-block',
                        padding: '0.3rem 0.75rem', 
                        borderRadius: 8, 
                        fontWeight: 700, 
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        background: order.transaction_type === 'sale' ? 'rgba(34, 197, 94, 0.12)' :
                                    order.transaction_type === 'purchase' ? 'rgba(59, 130, 246, 0.12)' :
                                    order.transaction_type === 'auction' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: order.transaction_type === 'sale' ? '#16a34a' :
                               order.transaction_type === 'purchase' ? '#2563eb' :
                               order.transaction_type === 'auction' ? '#9333ea' : '#d97706'
                      }}
                    >
                      {order.transaction_type}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Payment Status
                  </span>
                  <div style={{ marginTop: '0.25rem' }}>
                    {getStatusBadge(order.payment_status)}
                  </div>
                </div>
              </div>

              {/* Party & Financial Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Party Details Card */}
                <div 
                  style={{ 
                    background: 'var(--card)', 
                    borderRadius: 16, 
                    padding: '1.25rem 1.5rem', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink)', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem' }}>
                    <User size={18} style={{ color: 'var(--primary)' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                      {order.transaction_type === 'purchase' ? 'Seller Details' :
                       order.transaction_type === 'auction' ? 'Auction Details' : 'Customer Details'}
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--muted-foreground)', minWidth: 90 }}>Name:</span>
                      <strong style={{ color: 'var(--ink)' }}>{party.name}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Phone size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span style={{ color: 'var(--muted-foreground)', minWidth: 70 }}>Phone:</span>
                      <span>{party.phone}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <MapPin size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span style={{ color: 'var(--muted-foreground)', minWidth: 70 }}>Address:</span>
                      <span>{party.address}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <CreditCard size={14} style={{ color: 'var(--muted-foreground)' }} />
                      <span style={{ color: 'var(--muted-foreground)', minWidth: 70 }}>Method:</span>
                      <span className="badge" style={{ background: 'var(--secondary)', color: 'var(--ink)' }}>{party.method}</span>
                    </div>
                  </div>
                </div>

                {/* Company Account & Summary Card */}
                <div 
                  style={{ 
                    background: 'var(--card)', 
                    borderRadius: 16, 
                    padding: '1.25rem 1.5rem', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink)', borderBottom: '1px solid var(--border)', paddingBottom: '0.6rem' }}>
                    <Building2 size={18} style={{ color: 'var(--primary)' }} />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Bank Account & Summary</h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--muted-foreground)', minWidth: 120 }}>Bank Account:</span>
                      <strong>{order.company_account_name || 'N/A'}</strong>
                    </div>

                    {order.auction_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Tag size={14} style={{ color: 'var(--muted-foreground)' }} />
                        <span style={{ color: 'var(--muted-foreground)', minWidth: 100 }}>Auction House:</span>
                        <span>{order.auction_name}</span>
                      </div>
                    )}

                    <div 
                      style={{ 
                        marginTop: '0.5rem',
                        padding: '0.85rem 1rem', 
                        background: 'var(--secondary)', 
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>Total Amount:</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ¥{Number(order.total_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div 
                style={{ 
                  background: 'var(--card)', 
                  borderRadius: 16, 
                  padding: '1.5rem', 
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <Car size={18} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                    Invoice Line Items ({order.items?.length || 0})
                  </h4>
                </div>

                {!order.items || order.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                    No items attached to this invoice.
                  </div>
                ) : (
                  <div className="table-container" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Chassis No</th>
                          <th>Year</th>
                          <th>Venue</th>
                          <th>Price / Tax</th>
                          <th>Fees</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => {
                          const feesSum = (
                            (Number(item.recycle_fee) || 0) +
                            (Number(item.listing_fee) || 0) + (Number(item.listing_fee_tax) || 0) +
                            (Number(item.successful_bid) || 0) + (Number(item.successful_bid_tax) || 0) +
                            (Number(item.commission_fee) || 0) + (Number(item.commission_fee_tax) || 0) +
                            (Number(item.transport_fee) || 0) + (Number(item.transport_fee_tax) || 0) +
                            (Number(item.registration_fee) || 0) + (Number(item.registration_fee_tax) || 0) +
                            (Number(item.canceling_fee) || 0)
                          );

                          return (
                            <tr key={item.id || idx}>
                              <td>
                                <div>
                                  <strong style={{ color: 'var(--ink)', fontSize: '0.9rem' }}>
                                    {item.car_company} {item.car_model}
                                  </strong>
                                  {item.notes && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                      {item.notes}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.chassis_number || '-'}</td>
                              <td>{item.year || '-'}</td>
                              <td>{item.venue || '-'}</td>
                              <td>
                                <div>¥{Number(item.vehicle_price || 0).toLocaleString()}</div>
                                {Number(item.vehicle_price_tax) > 0 && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                                    Tax: ¥{Number(item.vehicle_price_tax).toLocaleString()}
                                  </div>
                                )}
                              </td>
                              <td>
                                {feesSum > 0 ? (
                                  <span style={{ fontSize: '0.85rem' }}>¥{feesSum.toLocaleString()}</span>
                                ) : (
                                  <span style={{ color: 'var(--muted-foreground)' }}>-</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>
                                ¥{Number(item.subtotal || 0).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes Section if any */}
              {order.notes && (
                <div 
                  style={{ 
                    background: 'var(--card)', 
                    borderRadius: 16, 
                    padding: '1.25rem 1.5rem', 
                    border: '1px solid var(--border)' 
                  }}
                >
                  <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Notes & Remarks
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          className="modal-actions" 
          style={{ 
            padding: '1rem 1.75rem', 
            background: 'var(--card)', 
            borderTop: '1px solid var(--border)',
            margin: 0
          }}
        >
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;
