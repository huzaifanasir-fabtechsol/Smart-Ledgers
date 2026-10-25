import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calculator,
  FileText,
  Receipt,
  Percent,
  Sparkles,
  Layers,
  Car,
} from 'lucide-react';
import { apiRequest, getErrorMessage } from '../api';
import PageHeader from './PageHeader';
import { INVOICE_CHECKLIST_FIELDS } from './taxReportFields';

const formatNum = (val) => Number(val || 0).toLocaleString();
// Sign before the yen mark, so a deduction reads -¥12,100 rather than ¥-12,100.
const formatYen = (val) => `${Number(val) < 0 ? '-' : ''}¥${formatNum(Math.abs(Number(val || 0)))}`;

const sanitizeCategoryName = (name) => {
  if (!name) return '-';
  const clean = String(name).replace(/[぀-ヿ㐀-䶿一-鿿]+/g, '').replace(/\(\s*\)/g, '').trim();
  return clean || name;
};

const DetailField = ({ label, children }) => (
  <div className="tax-detail-field">
    <span className="tax-detail-field-label">{label}</span>
    <div className="tax-detail-field-value">{children || '-'}</div>
  </div>
);

/* -------------------------------------------------------------
   EXPENSE DETAIL
------------------------------------------------------------- */
const ExpenseDetail = ({ expense }) => {
  const hasTax = expense.tax_percent_used && Number(expense.tax_percent_used) > 0;
  const amt = Number(expense.amount || 0);
  const taxAmt =
    expense.tax_amount !== null && expense.tax_amount !== undefined
      ? Number(expense.tax_amount)
      : hasTax
      ? Math.round((amt * Number(expense.tax_percent_used)) / 100)
      : 0;
  const totalAmt = amt + taxAmt;
  const taxCat = hasTax ? expense.tax_category || 'exclusive' : 'none';
  const taxes = Array.isArray(expense.taxes) && expense.taxes.length > 0
    ? expense.taxes
    : hasTax
    ? [{ name: '', rate: expense.tax_percent_used, category: taxCat, amount: taxAmt }]
    : [];

  return (
    <>
      <div className="tax-stats-grid">
        <div className="tax-stat-card primary">
          <div className="tax-stat-header">
            <span className="tax-stat-label">Pre-Tax Amount</span>
            <div className="tax-stat-icon"><Calculator size={18} /></div>
          </div>
          <div className="tax-stat-value">¥{formatNum(amt)}</div>
          <div className="tax-stat-subtext"><span>Base expense</span></div>
        </div>
        <div className="tax-stat-card accent-amber">
          <div className="tax-stat-header">
            <span className="tax-stat-label">Tax</span>
            <div className="tax-stat-icon"><Percent size={18} /></div>
          </div>
          <div className="tax-stat-value" style={{ color: '#b45309' }}>¥{formatNum(taxAmt)}</div>
          <div className="tax-stat-subtext">
            <span>{hasTax ? `${Number(expense.tax_percent_used).toFixed(1)}% total rate` : 'No tax'}</span>
            {hasTax && taxCat === 'mixed' && (
              <span>Excl: ¥{formatNum(expense.exclusive_tax_amount)} | Incl: ¥{formatNum(expense.inclusive_tax_amount)}</span>
            )}
          </div>
        </div>
        <div className="tax-stat-card accent-green">
          <div className="tax-stat-header">
            <span className="tax-stat-label">Total (With Tax)</span>
            <div className="tax-stat-icon"><Receipt size={18} /></div>
          </div>
          <div className="tax-stat-value" style={{ color: '#047857' }}>¥{formatNum(totalAmt)}</div>
          <div className="tax-stat-subtext"><span>Pre-Tax ¥{formatNum(amt)} + Tax ¥{formatNum(taxAmt)}</span></div>
        </div>
      </div>

      <div className="tax-detail-card">
        <div className="tax-detail-card-title">Expense Information</div>
        <div className="tax-detail-grid">
          <DetailField label="Date">{expense.date}</DetailField>
          <DetailField label="Category">{sanitizeCategoryName(expense.category_name)}</DetailField>
          <DetailField label="Payment">
            <span className={`method-badge ${expense.is_cash ? 'cash' : 'bank'}`}>
              {expense.is_cash ? 'Cash' : 'Bank'}
            </span>
          </DetailField>
          <DetailField label="Tax Category">
            {taxCat === 'mixed' ? (
              <span className="tax-badge mixed">Tax Mixed ({expense.number_of_taxes || taxes.length})</span>
            ) : taxCat === 'inclusive' ? (
              <span className="tax-badge inclusive">Tax Inclusive</span>
            ) : taxCat === 'exclusive' ? (
              <span className="tax-badge exclusive">Tax Exclusive</span>
            ) : (
              <span className="tax-badge none">No Tax</span>
            )}
          </DetailField>
          {expense.restaurant_name && <DetailField label="Restaurant">{expense.restaurant_name}</DetailField>}
          {expense.spare_part_name && <DetailField label="Spare Part">{expense.spare_part_name}</DetailField>}
          {expense.transaction && (
            <DetailField label="Linked Transaction">
              #{expense.transaction.id ?? expense.transaction}
              {expense.transaction.description ? ` ${expense.transaction.description}` : ''}
            </DetailField>
          )}
        </div>
        {expense.description && (
          <div className="tax-detail-notes">
            <span className="tax-detail-field-label">Description</span>
            <p>{expense.description}</p>
          </div>
        )}
      </div>

      <div className="tax-table-card">
        <div className="tax-detail-card-title tax-detail-table-title">
          <Percent size={16} /> Tax Breakdown
        </div>
        <div className="tax-table-wrapper" style={{ minHeight: 0 }}>
          <table className="tax-data-table">
            <thead>
              <tr>
                <th style={{ width: 45, textAlign: 'center' }}>#</th>
                <th>Tax Name</th>
                <th style={{ textAlign: 'center' }}>Type</th>
                <th style={{ textAlign: 'center' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Tax Amount (¥)</th>
              </tr>
            </thead>
            <tbody>
              {taxes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No tax applied to this expense.
                  </td>
                </tr>
              ) : (
                taxes.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{t.name || 'Consumption Tax'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`tax-badge ${t.category === 'inclusive' ? 'inclusive' : 'exclusive'}`}>
                        {t.category === 'inclusive' ? 'Inclusive' : 'Exclusive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{Number(t.rate || 0).toFixed(1)}%</td>
                    <td className="amount tax">¥{formatNum(t.amount)}</td>
                  </tr>
                ))
              )}
              {taxes.length > 0 && (
                <tr className="tax-table-total-row">
                  <td colSpan={4} style={{ textAlign: 'right' }}>Total Tax:</td>
                  <td className="amount tax">¥{formatNum(taxAmt)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------------------
   INVOICE (ORDER) DETAIL
------------------------------------------------------------- */
const getPartyName = (order) => {
  const details = order.other_details || {};
  return (
    order.customer_name || details.customer_name || details.saler_name || details.seller_name ||
    details.auction_house || order.customer_name_obj || order.saler_name_obj || order.auction_name || '-'
  );
};

const describeItem = (item) => {
  const name = `${item.car_company || ''} ${item.car_model || ''}`.trim();
  return name || item.venue || item.notes || '-';
};

const InvoiceDetail = ({ order, selectedChecklist }) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const od = order.other_details || {};
  const isCash = !order.company_account && (od.payment_method?.toLowerCase() !== 'bank');
  const fieldTotal = (key) => items.reduce((sum, item) => sum + Number(item[key] || 0), 0);
  const selectedTotal = selectedChecklist.reduce((sum, key) => sum + fieldTotal(key), 0);
  const tType = (order.transaction_type || '').toLowerCase();
  const tCat = (order.transaction_catagory || '').toLowerCase();
  const pStatus = (order.payment_status || '').toLowerCase();

  return (
    <>
      <div className="tax-stats-grid">
        <div className="tax-stat-card primary">
          <div className="tax-stat-header">
            <span className="tax-stat-label">Total Items</span>
            <div className="tax-stat-icon"><Layers size={18} /></div>
          </div>
          <div className="tax-stat-value">{items.length}</div>
          <div className="tax-stat-subtext"><span>Line items in this order</span></div>
        </div>
        <div className="tax-stat-card accent-purple">
          <div className="tax-stat-header">
            <span className="tax-stat-label">Selected Checklist Total</span>
            <div className="tax-stat-icon"><Sparkles size={18} /></div>
          </div>
          <div className="tax-stat-value">¥{formatNum(selectedTotal)}</div>
          <div className="tax-stat-subtext"><span>{selectedChecklist.length} checklist items selected</span></div>
        </div>
        <div className="tax-stat-card accent-green">
          <div className="tax-stat-header">
            <span className="tax-stat-label">Order Total Amount</span>
            <div className="tax-stat-icon"><Receipt size={18} /></div>
          </div>
          <div className="tax-stat-value" style={{ color: Number(order.total_amount) < 0 ? '#b91c1c' : '#047857' }}>{formatYen(order.total_amount)}</div>
          <div className="tax-stat-subtext"><span>All items, fees and taxes</span></div>
        </div>
      </div>

      <div className="tax-detail-card">
        <div className="tax-detail-card-title">Invoice Information</div>
        <div className="tax-detail-grid">
          <DetailField label="Date">{order.transaction_date}</DetailField>
          <DetailField label="Type">
            <span className={`invoice-tag type-${tType || 'default'}`}>{(order.transaction_type || '-').toUpperCase()}</span>
          </DetailField>
          <DetailField label="Category">
            <span className={`invoice-tag cat-${tCat || 'default'}`}>{(order.transaction_catagory || '-').toUpperCase()}</span>
          </DetailField>
          <DetailField label="Payment Status">
            <span className={`invoice-tag status-${pStatus || 'default'}`}>{(order.payment_status || '-').toUpperCase()}</span>
          </DetailField>
          <DetailField label="Payment Method">
            <span className={`method-badge ${isCash ? 'cash' : 'bank'}`}>{isCash ? 'Cash' : 'Bank'}</span>
          </DetailField>
          <DetailField label={tType === 'purchase' ? 'Seller' : tType === 'auction' ? 'Auction / Party' : 'Customer'}>
            {getPartyName(order)}
          </DetailField>
          {order.company_account_name && <DetailField label="Bank Account">{order.company_account_name}</DetailField>}
          {order.auction_name && <DetailField label="Auction House">{order.auction_name}</DetailField>}
        </div>
        {order.notes && (
          <div className="tax-detail-notes">
            <span className="tax-detail-field-label">Notes</span>
            <p>{order.notes}</p>
          </div>
        )}
      </div>

      <div className="tax-table-card">
        <div className="tax-detail-card-title tax-detail-table-title">
          <Car size={16} /> Line Items ({items.length})
        </div>
        <div className="tax-table-wrapper" style={{ minHeight: 0 }}>
          <table className="tax-data-table">
            <thead>
              <tr>
                <th style={{ width: 45, textAlign: 'center' }}>#</th>
                <th>Vehicle / Item</th>
                <th>Chassis No</th>
                <th style={{ textAlign: 'center' }}>Year</th>
                <th>Venue</th>
                <th style={{ textAlign: 'right' }}>Subtotal (¥)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No items attached to this invoice.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{describeItem(item)}</div>
                      {item.notes && describeItem(item) !== item.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{item.notes}</div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.chassis_number || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{item.year || '-'}</td>
                    <td>{item.venue || '-'}</td>
                    <td className={`amount total ${Number(item.subtotal) < 0 ? 'negative' : ''}`}>{formatYen(item.subtotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {items.length > 0 && (
        <div className="tax-table-card">
          <div className="tax-detail-card-title tax-detail-table-title">
            <Percent size={16} /> Fee & Tax Breakdown
            <span className="tax-detail-hint">Highlighted rows are selected in the checklist</span>
          </div>
          <div className="tax-table-wrapper" style={{ minHeight: 0 }}>
            <table className="tax-data-table tax-breakdown-table">
              <thead>
                <tr>
                  <th>Fee / Tax Item</th>
                  {items.map((item, idx) => (
                    <th key={item.id || idx} style={{ textAlign: 'right' }} title={describeItem(item)}>
                      #{idx + 1} {describeItem(item)}
                    </th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Order Total (¥)</th>
                </tr>
              </thead>
              <tbody>
                {INVOICE_CHECKLIST_FIELDS.map((field) => {
                  const total = fieldTotal(field.key);
                  const isTax = field.type === 'tax';
                  const isSelected = selectedChecklist.includes(field.key);
                  return (
                    <tr
                      key={field.key}
                      className={`${isSelected ? 'is-selected' : ''} ${total === 0 ? 'is-zero' : ''}`}
                    >
                      <td style={{ fontWeight: 600 }}>
                        {field.label}
                        <span className={`chip-type-tag ${field.type}`} style={{ marginLeft: 6 }}>
                          {isTax ? 'Tax' : field.type === 'price' ? 'Price' : 'Fee'}
                        </span>
                      </td>
                      {items.map((item, idx) => (
                        <td key={item.id || idx} className={`amount ${isTax ? 'tax' : ''}`}>
                          ¥{formatNum(item[field.key])}
                        </td>
                      ))}
                      <td className={`amount ${isTax ? 'tax' : 'total'}`}>¥{formatNum(total)}</td>
                    </tr>
                  );
                })}
                {selectedChecklist.length > 0 && (
                  <tr className="tax-table-total-row">
                    <td>Selected Items Total</td>
                    {items.map((item, idx) => (
                      <td key={item.id || idx} className="amount">
                        ¥{formatNum(selectedChecklist.reduce((sum, key) => sum + Number(item[key] || 0), 0))}
                      </td>
                    ))}
                    <td className="amount total">¥{formatNum(selectedTotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

/* -------------------------------------------------------------
   PAGE WRAPPER
------------------------------------------------------------- */
const TaxReportDetail = ({ kind, id, initialRecord = null, selectedChecklist = [], onBack }) => {
  const isInvoice = kind === 'invoice';
  const [record, setRecord] = useState(initialRecord);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const url = isInvoice ? `/revenue/orders/${id}/` : `/expenses/${id}/`;
        const response = await apiRequest(url);
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to load ${isInvoice ? 'invoice' : 'expense'} details`));
        }
        const data = await response.json();
        if (!cancelled) setRecord(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isInvoice, id]);

  const title = isInvoice
    ? `Invoice ${record?.order_number || `#${id}`}`
    : record?.title || `Expense #${id}`;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={isInvoice ? 'Invoice details with per-item fee and tax breakdown' : 'Expense details with tax breakdown'}
        icon={isInvoice ? FileText : Receipt}
        actions={
          <button type="button" className="btn-report-type-switch" onClick={onBack} title="Back to the tax report list">
            <ArrowLeft size={16} />
            <span>Back to {isInvoice ? 'Invoice' : 'Expense'} Tax Report</span>
          </button>
        }
      />

      {!record && loading ? (
        <div className="tax-detail-card tax-detail-status">Loading details...</div>
      ) : !record ? (
        <div className="tax-detail-card tax-detail-status">{error || 'Record not found.'}</div>
      ) : isInvoice ? (
        <InvoiceDetail order={record} selectedChecklist={selectedChecklist} />
      ) : (
        <ExpenseDetail expense={record} />
      )}
    </>
  );
};

export default TaxReportDetail;
