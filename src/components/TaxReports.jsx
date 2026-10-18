import { useState, useEffect, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FileSpreadsheet,
  FileText,
  Calculator,
  Filter,
  RotateCcw,
  Receipt,
  Layers,
  ArrowRight,
  TrendingDown,
  Percent,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { apiRequest, getErrorMessage, downloadExpenseTaxExcel, downloadInvoiceTaxExcel } from '../api';
import Pagination from './Pagination';
import YearSelector from './YearSelector';
import PageHeader from './PageHeader';
import './TaxReports.css';

// 14 Fee and Tax fields for Invoices
const INVOICE_CHECKLIST_FIELDS = [
  { key: 'vehicle_price', label: 'Vehicle Price', type: 'price' },
  { key: 'vehicle_price_tax', label: 'Vehicle Price Tax', type: 'tax' },
  { key: 'recycle_fee', label: 'Recycle Fee', type: 'fee' },
  { key: 'listing_fee', label: 'Listing Fee', type: 'fee' },
  { key: 'listing_fee_tax', label: 'Listing Fee Tax', type: 'tax' },
  { key: 'successful_bid', label: 'Successful Bid', type: 'price' },
  { key: 'successful_bid_tax', label: 'Successful Bid Tax', type: 'tax' },
  { key: 'commission_fee', label: 'Commission Fee', type: 'fee' },
  { key: 'commission_fee_tax', label: 'Commission Fee Tax', type: 'tax' },
  { key: 'transport_fee', label: 'Transport Fee', type: 'fee' },
  { key: 'transport_fee_tax', label: 'Transport Fee Tax', type: 'tax' },
  { key: 'registration_fee', label: 'Registration Fee', type: 'fee' },
  { key: 'registration_fee_tax', label: 'Registration Fee Tax', type: 'tax' },
  { key: 'canceling_fee', label: 'Canceling Fee', type: 'fee' },
];

const TaxReports = () => {
  // Modal for Report Type Selection: Expense or Invoice
  const [showTypeModal, setShowTypeModal] = useState(true);
  const [reportType, setReportType] = useState(null); // null until chosen, then 'expense' or 'invoice'

  // Common UI State
  const [exporting, setExporting] = useState(false);

  // Month Options
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  /* -------------------------------------------------------------
     EXPENSE REPORT STATE & HANDLERS
  ------------------------------------------------------------- */
  const [expenses, setExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);
  const [expenseTotalCount, setExpenseTotalCount] = useState(0);

  const [expenseStats, setExpenseStats] = useState({
    total_original_amount: 0,
    total_tax_paid: 0,
    grand_total_amount: 0,
    total_inclusive_amount: 0,
    inclusive_base_amount: 0,
    inclusive_tax_amount: 0,
    inclusive_count: 0,
    total_exclusive_amount: 0,
    exclusive_base_amount: 0,
    exclusive_tax_amount: 0,
    exclusive_count: 0,
    total_mixed_amount: 0,
    mixed_base_amount: 0,
    mixed_tax_amount: 0,
    mixed_excl_tax_amount: 0,
    mixed_incl_tax_amount: 0,
    mixed_count: 0,
    total_no_tax_amount: 0,
    no_tax_count: 0,
    expense_count: 0,
    tax_rate_breakdown: [],
  });

  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterTaxCategory, setFilterTaxCategory] = useState('');

  /* -------------------------------------------------------------
     INVOICE REPORT STATE & HANDLERS
  ------------------------------------------------------------- */
  // Default to only 'vehicle_price' checked
  const [selectedChecklist, setSelectedChecklist] = useState(['vehicle_price']);

  const [invoiceOrders, setInvoiceOrders] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceCurrentPage, setInvoiceCurrentPage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(10);

  const [invoiceStats, setInvoiceStats] = useState({
    total_orders: 0,
    total_items: 0,
    vehicle_price: 0,
    vehicle_price_tax: 0,
    recycle_fee: 0,
    listing_fee: 0,
    listing_fee_tax: 0,
    successful_bid: 0,
    successful_bid_tax: 0,
    commission_fee: 0,
    commission_fee_tax: 0,
    transport_fee: 0,
    transport_fee_tax: 0,
    registration_fee: 0,
    registration_fee_tax: 0,
    canceling_fee: 0,
  });

  // Invoice Filters
  const [invoiceYear, setInvoiceYear] = useState('');
  const [invoiceMonth, setInvoiceMonth] = useState('');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
  const [invoiceDateTo, setInvoiceDateTo] = useState('');
  const [invoiceType, setInvoiceType] = useState('');
  const [invoiceCategory, setInvoiceCategory] = useState('');
  const [invoicePaymentStatus, setInvoicePaymentStatus] = useState('');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('');

  /* -------------------------------------------------------------
     FETCH CATEGORIES (EXPENSES)
  ------------------------------------------------------------- */
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiRequest('/categories/all/');
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch {
      // fallback
    }
  };

  /* -------------------------------------------------------------
     EXPENSE EFFECTS & FETCHERS
  ------------------------------------------------------------- */
  const buildExpenseFilterParams = () => {
    const params = new URLSearchParams();
    if (filterYear) params.append('year', filterYear);
    if (filterMonth) params.append('month', filterMonth);
    if (filterDateFrom) params.append('date_from', filterDateFrom);
    if (filterDateTo) params.append('date_to', filterDateTo);
    if (filterCategory) params.append('category', filterCategory);
    if (filterPaymentStatus) params.append('payment_status', filterPaymentStatus);
    if (filterTaxCategory) params.append('tax_category', filterTaxCategory);
    return params;
  };

  const fetchExpenseTaxStats = async () => {
    try {
      const params = buildExpenseFilterParams();
      const response = await apiRequest(`/expenses/tax_stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpenseStats(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchExpenses = async () => {
    setExpenseLoading(true);
    try {
      const params = buildExpenseFilterParams();
      params.append('page', expenseCurrentPage);
      params.append('page_size', expensePageSize);
      params.append('pageSize', expensePageSize);

      const response = await apiRequest(`/expenses/?${params.toString()}`);
      if (!response.ok) {
        const msg = await getErrorMessage(response, 'Failed to fetch tax expenses');
        throw new Error(msg);
      }
      const data = await response.json();
      setExpenses(data.results || data || []);
      setExpenseTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      toast.error(err.message || 'Failed to load expense tax records');
      setExpenses([]);
    } finally {
      setExpenseLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === 'expense') {
      fetchExpenses();
      fetchExpenseTaxStats();
    }
  }, [
    reportType,
    expenseCurrentPage,
    expensePageSize,
    filterYear,
    filterMonth,
    filterDateFrom,
    filterDateTo,
    filterCategory,
    filterPaymentStatus,
    filterTaxCategory,
  ]);

  const handleResetExpenseFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCategory('');
    setFilterPaymentStatus('');
    setFilterTaxCategory('');
    setExpenseCurrentPage(1);
    toast.info('Expense filters reset to default');
  };

  const handleExportExpenseExcel = async () => {
    setExporting(true);
    try {
      toast.info('Generating Excel Tax Report...');
      const params = buildExpenseFilterParams();
      await downloadExpenseTaxExcel(`?${params.toString()}`);
      toast.success('Excel Tax Report downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download Excel report');
    } finally {
      setExporting(false);
    }
  };

  /* -------------------------------------------------------------
     INVOICE EFFECTS & FETCHERS
  ------------------------------------------------------------- */
  const buildInvoiceFilterParams = () => {
    const params = new URLSearchParams();
    if (invoiceYear) params.append('year', invoiceYear);
    if (invoiceMonth) params.append('month', invoiceMonth);
    if (invoiceDateFrom) params.append('date_from', invoiceDateFrom);
    if (invoiceDateTo) params.append('date_to', invoiceDateTo);
    if (invoiceType) params.append('transaction_type', invoiceType);
    if (invoiceCategory) params.append('transaction_catagory', invoiceCategory);
    if (invoicePaymentStatus) params.append('payment_status', invoicePaymentStatus);
    if (invoicePaymentMethod) params.append('payment_method', invoicePaymentMethod);
    return params;
  };

  const fetchInvoiceStats = async () => {
    try {
      const params = buildInvoiceFilterParams();
      const response = await apiRequest(`/revenue/orders/tax_stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoiceStats(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchInvoiceOrders = async () => {
    setInvoiceLoading(true);
    try {
      // Pagination is by flattened item row (not by order), so load every matching
      // order and slice the rows client-side.
      const all = [];
      let page = 1;
      while (true) {
        const params = buildInvoiceFilterParams();
        params.append('page', page);
        params.append('page_size', 500);
        params.append('pageSize', 500);

        const response = await apiRequest(`/revenue/orders/?${params.toString()}`);
        if (!response.ok) {
          const msg = await getErrorMessage(response, 'Failed to fetch invoice orders');
          throw new Error(msg);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          all.push(...data);
          break;
        }
        all.push(...(data.results || []));
        if (!data.next || page >= 100) break;
        page += 1;
      }
      setInvoiceOrders(all);
    } catch (err) {
      toast.error(err.message || 'Failed to load invoice records');
      setInvoiceOrders([]);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === 'invoice') {
      fetchInvoiceOrders();
      fetchInvoiceStats();
    }
  }, [
    reportType,
    invoiceYear,
    invoiceMonth,
    invoiceDateFrom,
    invoiceDateTo,
    invoiceType,
    invoiceCategory,
    invoicePaymentStatus,
    invoicePaymentMethod,
  ]);

  // Keep the page in range when filters change the row count
  useEffect(() => {
    setInvoiceCurrentPage(1);
  }, [
    invoiceYear,
    invoiceMonth,
    invoiceDateFrom,
    invoiceDateTo,
    invoiceType,
    invoiceCategory,
    invoicePaymentStatus,
    invoicePaymentMethod,
  ]);

  const handleResetInvoiceFilters = () => {
    setInvoiceYear('');
    setInvoiceMonth('');
    setInvoiceDateFrom('');
    setInvoiceDateTo('');
    setInvoiceType('');
    setInvoiceCategory('');
    setInvoicePaymentStatus('');
    setInvoicePaymentMethod('');
    setInvoiceCurrentPage(1);
    toast.info('Invoice filters reset to default');
  };

  const handleToggleChecklist = (key) => {
    setSelectedChecklist((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleChecklistPreset = (preset) => {
    if (preset === 'default') {
      setSelectedChecklist(['vehicle_price']);
    } else if (preset === 'all') {
      setSelectedChecklist(INVOICE_CHECKLIST_FIELDS.map((f) => f.key));
    } else if (preset === 'taxes') {
      setSelectedChecklist(INVOICE_CHECKLIST_FIELDS.filter((f) => f.type === 'tax').map((f) => f.key));
    } else if (preset === 'fees') {
      setSelectedChecklist(INVOICE_CHECKLIST_FIELDS.filter((f) => f.type === 'fee' || f.type === 'price').map((f) => f.key));
    } else if (preset === 'clear') {
      setSelectedChecklist([]);
    }
  };

  const handleExportInvoiceExcel = async () => {
    setExporting(true);
    try {
      toast.info('Generating Invoice Tax Report...');
      const params = buildInvoiceFilterParams();
      if (selectedChecklist.length > 0) {
        params.append('selected_fields', selectedChecklist.join(','));
      } else {
        params.append('selected_fields', 'vehicle_price');
      }
      await downloadInvoiceTaxExcel(`?${params.toString()}`);
      toast.success('Invoice Tax Report downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download Excel report');
    } finally {
      setExporting(false);
    }
  };

  /* -------------------------------------------------------------
     FLATTEN INVOICE ORDERS FOR TABLE (1 row per order item)
     If an order has 3 items, all 3 are shown in the table.
  ------------------------------------------------------------- */
  const flattenedInvoiceItems = useMemo(() => {
    const list = [];
    invoiceOrders.forEach((order) => {
      const od = order.other_details || {};
      const isCash = !order.company_account && (od.payment_method?.toLowerCase() !== 'bank');
      const paymentMethod = isCash ? 'Cash' : 'Bank';
      const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [null];

      items.forEach((item, itemIdx) => {
        let vehicleText = '-';
        if (item) {
          const parts = [];
          if (item.car_company || item.car_model) {
            parts.push(`${item.car_company || ''} ${item.car_model || ''}`.trim());
          }
          if (item.chassis_number) {
            parts.push(item.chassis_number);
          }
          if (parts.length > 0) {
            vehicleText = parts.join(' - ');
          } else if (item.venue) {
            vehicleText = item.venue;
          } else if (item.notes) {
            vehicleText = item.notes;
          }
        }

        list.push({
          uniqueKey: item ? `${order.id}-${item.id || itemIdx}` : `${order.id}-empty-${itemIdx}`,
          orderId: order.id,
          orderNumber: order.order_number,
          transactionDate: order.transaction_date,
          transactionType: order.transaction_type,
          transactionCategory: order.transaction_catagory,
          paymentStatus: order.payment_status,
          paymentMethod,
          item,
          vehicleText,
          itemIndexInOrder: itemIdx + 1,
          totalItemsInOrder: items.length,
        });
      });
    });
    return list;
  }, [invoiceOrders]);

  /* -------------------------------------------------------------
     HELPERS & FORMATTERS
  ------------------------------------------------------------- */
  const formatNum = (val) => Number(val || 0).toLocaleString();

  const sanitizeCategoryName = (name) => {
    if (!name) return '-';
    const clean = String(name).replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/g, '').replace(/\(\s*\)/g, '').trim();
    return clean || name;
  };

  const handleSelectReport = (type) => {
    setReportType(type);
    setShowTypeModal(false);
  };

  const expenseTotalPages = Math.ceil(expenseTotalCount / expensePageSize) || 1;
  const invoiceTotalRows = flattenedInvoiceItems.length;
  const invoiceTotalPages = Math.ceil(invoiceTotalRows / invoicePageSize) || 1;
  const pagedInvoiceItems = flattenedInvoiceItems.slice(
    (invoiceCurrentPage - 1) * invoicePageSize,
    invoiceCurrentPage * invoicePageSize
  );

  return (
    <div className="tax-reports-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Report Type Selection Modal (Popup) */}
      {showTypeModal && (
        <div className="tax-type-modal-overlay">
          <div className="tax-type-modal">
            <div className="tax-type-modal-header">
              <div>
                <h2>Select Tax Report Type</h2>
                <p>Choose the target accounting module to analyze statutory consumption taxes.</p>
              </div>
              <button
                type="button"
                className="tax-type-modal-close"
                onClick={() => reportType && setShowTypeModal(false)}
                title="Close"
                style={reportType ? undefined : { display: 'none' }}
              >
                ×
              </button>
            </div>

            <div className="tax-type-modal-body">
              {/* Expense Option (Active) */}
              <div
                className={`tax-choice-card ${reportType === 'expense' ? 'active' : ''}`}
                onClick={() => handleSelectReport('expense')}
              >
                <div>
                  <div className="tax-choice-icon-wrap expense">
                    <Receipt size={24} />
                  </div>
                  <div className="tax-choice-title">Expense Tax Report</div>
                  <div className="tax-choice-desc">
                    Comprehensive overview of business expenses, tax-inclusive vs tax-exclusive settlements, and paid consumption tax.
                  </div>
                </div>
                <div className="tax-choice-footer">
                  <span className="tax-choice-status-badge ready">Ready</span>
                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    View Report <ArrowRight size={14} />
                  </span>
                </div>
              </div>

              {/* Invoice Option (Active) */}
              <div
                className={`tax-choice-card ${reportType === 'invoice' ? 'active' : ''}`}
                onClick={() => handleSelectReport('invoice')}
              >
                <div>
                  <div className="tax-choice-icon-wrap invoice">
                    <FileText size={24} />
                  </div>
                  <div className="tax-choice-title">Invoice Tax Report</div>
                  <div className="tax-choice-desc">
                    Consumption tax summary on issued customer invoices with customizable checklist for 14 fee and tax categories.
                  </div>
                </div>
                <div className="tax-choice-footer">
                  <span className="tax-choice-status-badge ready">Ready</span>
                  <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    View Report <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType && (<>
      <PageHeader
        title={reportType === 'invoice' ? 'Invoice Tax Reports' : 'Expense Tax Reports'}
        subtitle={
          reportType === 'invoice'
            ? 'Auditing transaction fee items, breakdown taxes, and customer invoice settlements'
            : 'Auditing pre-tax expenditures, tax-inclusive & exclusive amounts, and paid consumption tax'
        }
        icon={Calculator}
        category="Statutory Tax & Compliance"
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-report-type-switch"
              onClick={() => setShowTypeModal(true)}
              title="Switch between Expense and Invoice Tax Reports"
            >
              <Layers size={16} style={{ color: reportType === 'invoice' ? '#0284c7' : '#2563eb' }} />
              <span>Report: {reportType === 'invoice' ? 'Invoice Tax' : 'Expense Tax'}</span>
              <ChevronDown size={14} />
            </button>

            <button
              type="button"
              className="btn-export-excel"
              onClick={reportType === 'invoice' ? handleExportInvoiceExcel : handleExportExpenseExcel}
              disabled={exporting}
              title="Export filtered records to Excel with bottom totals"
            >
              <FileSpreadsheet size={16} />
              <span>{exporting ? 'Exporting...' : 'Export to Excel (.xlsx)'}</span>
            </button>
          </div>
        }
      />

      {/* =============================================================
          VIEW 1: INVOICE TAX REPORT
      ============================================================= */}
      {reportType === 'invoice' && (
        <>
          {/* Invoice Filters Card */}
          <div className="tax-filter-card">
            <div className="tax-filter-grid">
              {/* Year Filter */}
              <div className="filter-item">
                <label>Year</label>
                <YearSelector
                  selectedYear={invoiceYear}
                  onYearChange={(yearVal) => {
                    setInvoiceYear(yearVal);
                    setInvoiceCurrentPage(1);
                  }}
                  placeholder="All Years"
                />
              </div>

              {/* Month Filter */}
              <div className="filter-item">
                <label>Month</label>
                <select
                  value={invoiceMonth}
                  onChange={(e) => {
                    setInvoiceMonth(e.target.value);
                    setInvoiceCurrentPage(1);
                  }}
                >
                  <option value="">All Months</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div className="filter-item">
                <label>Date From</label>
                <input
                  type="date"
                  value={invoiceDateFrom}
                  onChange={(e) => {
                    setInvoiceDateFrom(e.target.value);
                    setInvoiceCurrentPage(1);
                  }}
                />
              </div>

              {/* Date To */}
              <div className="filter-item">
                <label>Date To</label>
                <input
                  type="date"
                  value={invoiceDateTo}
                  onChange={(e) => {
                    setInvoiceDateTo(e.target.value);
                    setInvoiceCurrentPage(1);
                  }}
                />
              </div>

              {/* Type (transaction_type) */}
              <div className="filter-item">
                <label>Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) => {
                    setInvoiceType(e.target.value);
                    setInvoiceCurrentPage(1);
                  }}
                >
                  <option value="">All Types</option>
                  <option value="purchase">Purchase</option>
                  <option value="sale">Sale</option>
                  <option value="auction">Auction</option>
                  <option value="nagare">Nagare</option>
                </select>
              </div>

              {/* Category (transaction_catagory) */}
              <div className="filter-item">
                <label>Category</label>
                <select
                  value={invoiceCategory}
                  onChange={(e) => {
                    setInvoiceCategory(e.target.value);
                    setInvoiceCurrentPage(1);
                  }}
                >
                  <option value="">All Categories</option>
                  <option value="local">Local</option>
                  <option value="foreign">Foreign</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="filter-item">
                <label>Payment Status</label>
                <select
                  value={invoicePaymentStatus}
                  onChange={(e) => {
                    setInvoicePaymentStatus(e.target.value);
                    setInvoiceCurrentPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="filter-item">
                <label>Payment Method</label>
                <select
                  value={invoicePaymentMethod}
                  onChange={(e) => {
                    setInvoicePaymentMethod(e.target.value);
                    setInvoiceCurrentPage(1);
                  }}
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank / Transfer</option>
                </select>
              </div>

              {/* Reset Actions */}
              <div className="filter-actions">
                <button
                  type="button"
                  className="btn-filter-reset"
                  onClick={handleResetInvoiceFilters}
                  title="Reset all filters"
                >
                  <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Fee & Tax Checklist Card */}
          <div className="invoice-checklist-card">
            <div className="invoice-checklist-header">
              <div className="invoice-checklist-title-area">
                <span className="invoice-checklist-title">
                  Fee & Tax Items Checklist
                </span>
                <span className="invoice-checklist-subtitle">
                  Select fee and tax items to display in total amount cards and data table. Default is Vehicle Price only.
                </span>
              </div>

              <div className="invoice-checklist-actions">
                <button
                  type="button"
                  className={`btn-checklist-preset ${selectedChecklist.length === 1 && selectedChecklist[0] === 'vehicle_price' ? 'active' : ''}`}
                  onClick={() => handleChecklistPreset('default')}
                  title="Show records and card for Vehicle Price only"
                >
                  Default (Vehicle Price)
                </button>
                <button
                  type="button"
                  className={`btn-checklist-preset ${selectedChecklist.length === INVOICE_CHECKLIST_FIELDS.length ? 'active' : ''}`}
                  onClick={() => handleChecklistPreset('all')}
                  title="Select all 14 fee and tax items"
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn-checklist-preset"
                  onClick={() => handleChecklistPreset('taxes')}
                  title="Select only tax fields"
                >
                  Taxes Only
                </button>
                <button
                  type="button"
                  className="btn-checklist-preset"
                  onClick={() => handleChecklistPreset('fees')}
                  title="Select fees and price items"
                >
                  Fees Only
                </button>
                <button
                  type="button"
                  className="btn-checklist-preset clear"
                  onClick={() => handleChecklistPreset('clear')}
                  title="Deselect all checklist items"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="invoice-checklist-grid">
              {INVOICE_CHECKLIST_FIELDS.map((item) => {
                const isChecked = selectedChecklist.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`checklist-item-chip ${isChecked ? 'checked' : ''} ${item.type}`}
                    onClick={() => handleToggleChecklist(item.key)}
                  >
                    {isChecked ? (
                      <CheckSquare size={16} className="chip-icon-checked" />
                    ) : (
                      <Square size={16} className="chip-icon-unchecked" />
                    )}
                    <span className="chip-label">{item.label}</span>
                    <span className={`chip-type-tag ${item.type}`}>
                      {item.type === 'tax' ? 'Tax' : (item.type === 'price' ? 'Price' : 'Fee')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metric Cards - Only show cards for selected checklist items */}
          {selectedChecklist.length === 0 ? (
            <div className="checklist-empty-notice">
              <span>No items selected from the checklist. Check one or more fee / tax items above to see total amount cards.</span>
              <button
                type="button"
                className="btn-checklist-preset active"
                onClick={() => handleChecklistPreset('default')}
              >
                Reset to Default (Vehicle Price)
              </button>
            </div>
          ) : (
            <div className="tax-stats-grid">
              {selectedChecklist.map((fieldKey) => {
                const fieldDef = INVOICE_CHECKLIST_FIELDS.find((f) => f.key === fieldKey);
                if (!fieldDef) return null;
                const amount = Number(invoiceStats[fieldKey] || 0);
                const isTax = fieldDef.type === 'tax';
                const isPrice = fieldDef.type === 'price';
                const cardAccent = isTax ? 'accent-purple' : (isPrice ? 'primary' : 'accent-amber');

                return (
                  <div key={fieldKey} className={`tax-stat-card ${cardAccent}`}>
                    <div className="tax-stat-header">
                      <span className="tax-stat-label">{fieldDef.label}</span>
                      <div className="tax-stat-icon">
                        {isTax ? <Percent size={18} /> : (isPrice ? <TrendingDown size={18} /> : <Receipt size={18} />)}
                      </div>
                    </div>
                    <div className="tax-stat-value">¥{formatNum(amount)}</div>
                    <div className="tax-stat-subtext">
                      <span>{fieldDef.type.toUpperCase()} Item</span>
                      <span>{invoiceStats.total_orders || 0} orders / {invoiceStats.total_items || 0} items</span>
                    </div>
                  </div>
                );
              })}

              {/* Combined Total Card if multiple items are selected */}
              {selectedChecklist.length > 1 && (
                <div className="tax-stat-card accent-green">
                  <div className="tax-stat-header">
                    <span className="tax-stat-label">Selected Items Total</span>
                    <div className="tax-stat-icon">
                      <Sparkles size={18} />
                    </div>
                  </div>
                  <div className="tax-stat-value" style={{ color: '#047857' }}>
                    ¥{formatNum(
                      selectedChecklist.reduce((sum, k) => sum + Number(invoiceStats[k] || 0), 0)
                    )}
                  </div>
                  <div className="tax-stat-subtext">
                    <span>{selectedChecklist.length} Items Selected</span>
                    <span>Aggregate total for checked items</span>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Invoice Items Table Card */}
          <div className="tax-table-card">
            <div className="tax-table-wrapper">
              <table className="tax-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 45, textAlign: 'center' }}>#</th>
                    <th style={{ width: 105 }}>Date</th>
                    <th style={{ width: 120 }}>Order #</th>
                    <th style={{ textAlign: 'center', width: 95 }}>Type</th>
                    <th style={{ textAlign: 'center', width: 95 }}>Category</th>
                    <th style={{ textAlign: 'center', width: 110 }}>Payment Status</th>
                    <th style={{ textAlign: 'center', width: 90 }}>Payment Method</th>
                    {/* Dynamic Headers for Selected Checklist Items */}
                    {selectedChecklist.map((fieldKey) => {
                      const fieldDef = INVOICE_CHECKLIST_FIELDS.find((f) => f.key === fieldKey);
                      return (
                        <th key={fieldKey} style={{ textAlign: 'right', minWidth: 125 }}>
                          {fieldDef ? `${fieldDef.label} (¥)` : fieldKey}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {invoiceLoading ? (
                    <tr>
                      <td
                        colSpan={7 + Math.max(selectedChecklist.length, 1)}
                        style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}
                      >
                        Loading invoice tax records...
                      </td>
                    </tr>
                  ) : flattenedInvoiceItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7 + Math.max(selectedChecklist.length, 1)}
                        style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}
                      >
                        No invoice records found matching the specified filters.
                      </td>
                    </tr>
                  ) : (
                    pagedInvoiceItems.map((row, idx) => {
                      const tType = (row.transactionType || '').toLowerCase();
                      const tCat = (row.transactionCategory || '').toLowerCase();
                      const pStatus = (row.paymentStatus || '').toLowerCase();

                      return (
                        <tr key={row.uniqueKey}>
                          <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                            {(invoiceCurrentPage - 1) * invoicePageSize + idx + 1}
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.transactionDate}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.orderNumber}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`invoice-tag type-${tType || 'default'}`}>
                              {(row.transactionType || '-').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`invoice-tag cat-${tCat || 'default'}`}>
                              {(row.transactionCategory || '-').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`invoice-tag status-${pStatus || 'default'}`}>
                              {(row.paymentStatus || '-').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`method-badge ${row.paymentMethod.toLowerCase() === 'cash' ? 'cash' : 'bank'}`}>
                              {row.paymentMethod}
                            </span>
                          </td>
                          {/* Dynamic Values for Selected Checklist Items */}
                          {selectedChecklist.map((fieldKey) => {
                            const val = row.item ? Number(row.item[fieldKey] || 0) : 0;
                            const isTax = fieldKey.includes('tax');
                            return (
                              <td key={fieldKey} className={`amount ${isTax ? 'tax' : ''}`}>
                                ¥{formatNum(val)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}

                  {/* Summary Totals Row */}
                  {!invoiceLoading && flattenedInvoiceItems.length > 0 && selectedChecklist.length > 0 && (
                    <tr className="tax-table-total-row">
                      <td colSpan={7} style={{ textAlign: 'right', fontWeight: 800 }}>
                        Filtered Total – all pages ({invoiceStats.total_orders || 0} orders / {invoiceStats.total_items || 0} items):
                      </td>
                      {selectedChecklist.map((fieldKey) => {
                        const totalVal = Number(invoiceStats[fieldKey] || 0);
                        const isTax = fieldKey.includes('tax');
                        return (
                          <td key={fieldKey} className={`amount ${isTax ? 'tax' : 'total'}`} style={{ fontWeight: 800 }}>
                            ¥{formatNum(totalVal)}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Invoice Pagination */}
            {invoiceTotalRows > 0 && (
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0' }}>
                <Pagination
                  currentPage={invoiceCurrentPage}
                  totalPages={invoiceTotalPages}
                  onPageChange={setInvoiceCurrentPage}
                  pageSize={invoicePageSize}
                  onPageSizeChange={(newSize) => {
                    setInvoicePageSize(newSize);
                    setInvoiceCurrentPage(1);
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* =============================================================
          VIEW 2: EXPENSE TAX REPORT
      ============================================================= */}
      {reportType === 'expense' && (
        <>
          {/* Expense Filters Card */}
          <div className="tax-filter-card">
            <div className="tax-filter-grid">
              {/* Year Filter */}
              <div className="filter-item">
                <label>Year</label>
                <YearSelector
                  selectedYear={filterYear}
                  onYearChange={(yearVal) => {
                    setFilterYear(yearVal);
                    setExpenseCurrentPage(1);
                  }}
                  placeholder="All Years"
                />
              </div>

              {/* Month Filter */}
              <div className="filter-item">
                <label>Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => {
                    setFilterMonth(e.target.value);
                    setExpenseCurrentPage(1);
                  }}
                >
                  <option value="">All Months</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div className="filter-item">
                <label>Date From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => {
                    setFilterDateFrom(e.target.value);
                    setExpenseCurrentPage(1);
                  }}
                />
              </div>

              {/* Date To */}
              <div className="filter-item">
                <label>Date To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => {
                    setFilterDateTo(e.target.value);
                    setExpenseCurrentPage(1);
                  }}
                />
              </div>

              {/* Category */}
              <div className="filter-item">
                <label>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setExpenseCurrentPage(1);
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {sanitizeCategoryName(c.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Status / Method */}
              <div className="filter-item">
                <label>Payment Method</label>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => {
                    setFilterPaymentStatus(e.target.value);
                    setExpenseCurrentPage(1);
                  }}
                >
                  <option value="">All Payment Types</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank / Transfer</option>
                </select>
              </div>

              {/* Tax Category */}
              <div className="filter-item">
                <label>Tax Category</label>
                <select
                  value={filterTaxCategory}
                  onChange={(e) => {
                    setFilterTaxCategory(e.target.value);
                    setExpenseCurrentPage(1);
                  }}
                >
                  <option value="">All Tax Types</option>
                  <option value="inclusive">Tax Inclusive</option>
                  <option value="exclusive">Tax Exclusive</option>
                  <option value="mixed">Tax Mixed (Multi-Tax)</option>
                  <option value="none">No Tax (0%)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="filter-actions">
                <button
                  type="button"
                  className="btn-filter-reset"
                  onClick={handleResetExpenseFilters}
                  title="Reset all filters"
                >
                  <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Metric Cards Grid */}
          <div className="tax-stats-grid">
            {/* Card 1: Total Expense Without Any Tax (Original Pre-Tax Amount) */}
            <div className="tax-stat-card primary">
              <div className="tax-stat-header">
                <span className="tax-stat-label">Original / Pre-Tax Amount</span>
                <div className="tax-stat-icon">
                  <Calculator size={18} />
                </div>
              </div>
              <div className="tax-stat-value">¥{formatNum(expenseStats.total_original_amount)}</div>
              <div className="tax-stat-subtext">
                <span>Base Expense Total</span>
                <span>{expenseStats.expense_count} expenses</span>
              </div>
            </div>

            {/* Card 2: Total Tax Paid */}
            <div className="tax-stat-card accent-amber">
              <div className="tax-stat-header">
                <span className="tax-stat-label">Total Tax Paid</span>
                <div className="tax-stat-icon">
                  <Percent size={18} />
                </div>
              </div>
              <div className="tax-stat-value" style={{ color: '#b45309' }}>
                ¥{formatNum(expenseStats.total_tax_paid)}
              </div>
              <div className="tax-stat-subtext">
                <span>Total Tax Accounted</span>
                <span>
                  Effective Rate:{' '}
                  {expenseStats.total_original_amount > 0
                    ? ((expenseStats.total_tax_paid / expenseStats.total_original_amount) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>

            {/* Card 3: Grand Total Spent (Original + Tax) */}
            <div className="tax-stat-card accent-green">
              <div className="tax-stat-header">
                <span className="tax-stat-label">Grand Total (With Tax)</span>
                <div className="tax-stat-icon">
                  <Receipt size={18} />
                </div>
              </div>
              <div className="tax-stat-value" style={{ color: '#047857' }}>
                ¥{formatNum(expenseStats.grand_total_amount)}
              </div>
              <div className="tax-stat-subtext">
                <span>Total Payout</span>
                <span>
                  Pre-Tax ¥{formatNum(expenseStats.total_original_amount)} + Tax ¥{formatNum(expenseStats.total_tax_paid)}
                </span>
              </div>
            </div>

            {/* Card 4: Tax Inclusive Amount */}
            <div className="tax-stat-card accent-purple">
              <div className="tax-stat-header">
                <span className="tax-stat-label">Tax-Inclusive Expenses</span>
                <div className="tax-stat-icon">
                  <Layers size={18} />
                </div>
              </div>
              <div className="tax-stat-value">¥{formatNum(expenseStats.total_inclusive_amount)}</div>
              <div className="tax-stat-subtext">
                <span>Tax-Inclusive ({expenseStats.inclusive_count} items)</span>
                <span>
                  Base: ¥{formatNum(expenseStats.inclusive_base_amount)} | Tax: ¥{formatNum(expenseStats.inclusive_tax_amount)}
                </span>
              </div>
            </div>

            {/* Card 5: Tax Exclusive Amount */}
            <div className="tax-stat-card">
              <div className="tax-stat-header">
                <span className="tax-stat-label">Tax-Exclusive Expenses</span>
                <div className="tax-stat-icon">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="tax-stat-value">¥{formatNum(expenseStats.total_exclusive_amount)}</div>
              <div className="tax-stat-subtext">
                <span>Tax-Exclusive ({expenseStats.exclusive_count} items)</span>
                <span>
                  Base: ¥{formatNum(expenseStats.exclusive_base_amount)} | Tax: ¥{formatNum(expenseStats.exclusive_tax_amount)}
                </span>
              </div>
            </div>

            {/* Card 6: Mixed / Multi-Tax Amount */}
            {expenseStats.mixed_count > 0 && (
              <div className="tax-stat-card accent-indigo">
                <div className="tax-stat-header">
                  <span className="tax-stat-label">Mixed (Multi-Tax) Expenses</span>
                  <div className="tax-stat-icon">
                    <Layers size={18} />
                  </div>
                </div>
                <div className="tax-stat-value" style={{ color: '#6366f1' }}>¥{formatNum(expenseStats.total_mixed_amount || 0)}</div>
                <div className="tax-stat-subtext">
                  <span>Mixed Tax ({expenseStats.mixed_count || 0} items)</span>
                  <span>
                    Base: ¥{formatNum(expenseStats.mixed_base_amount || 0)} | Excl: ¥{formatNum(expenseStats.mixed_excl_tax_amount || 0)} | Incl: ¥{formatNum(expenseStats.mixed_incl_tax_amount || 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Card 7: No Tax / Non-Taxable */}
            <div className="tax-stat-card">
              <div className="tax-stat-header">
                <span className="tax-stat-label">Non-Taxable Expenses</span>
                <div className="tax-stat-icon">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="tax-stat-value">¥{formatNum(expenseStats.total_no_tax_amount)}</div>
              <div className="tax-stat-subtext">
                <span>Zero-Tax / Exempt (0%)</span>
                <span>{expenseStats.no_tax_count} expenses without tax</span>
              </div>
            </div>
          </div>

          {/* Tax Rate Distribution Strip */}
          {expenseStats.tax_rate_breakdown && expenseStats.tax_rate_breakdown.length > 0 && (
            <div className="tax-rate-breakdown-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                <Percent size={15} style={{ color: '#0284c7' }} />
                <span>Tax Rate Distribution:</span>
              </div>

              <div className="tax-rate-pills">
                {expenseStats.tax_rate_breakdown.map((item) => (
                  <div key={item.rate} className="tax-rate-pill">
                    <span className="tax-rate-pill-badge">{item.rate > 0 ? `${item.rate}% Rate` : 'No Tax (0%)'}</span>
                    <span style={{ fontWeight: 600 }}>Base: ¥{formatNum(item.base_amount)}</span>
                    {item.rate > 0 && (
                      <span style={{ color: '#b91c1c', fontWeight: 600 }}>Tax: ¥{formatNum(item.tax_amount)}</span>
                    )}
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>({item.count} items)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses Table Card */}
          <div className="tax-table-card">
            <div className="tax-table-wrapper">
              <table className="tax-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 45, textAlign: 'center' }}>#</th>
                    <th style={{ width: 110 }}>Date</th>
                    <th>Title / Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center', width: 90 }}>Payment</th>
                    <th style={{ textAlign: 'center', width: 130 }}>Tax Category</th>
                    <th style={{ textAlign: 'center', width: 85 }}>Tax Rate</th>
                    <th style={{ textAlign: 'right', width: 130 }}>Pre-Tax (¥)</th>
                    <th style={{ textAlign: 'right', width: 120 }}>Tax (¥)</th>
                    <th style={{ textAlign: 'right', width: 130 }}>Total (¥)</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseLoading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        Loading tax expense records...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        No expense records found matching the specified filters.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp, idx) => {
                      const hasTax = exp.tax_percent_used && Number(exp.tax_percent_used) > 0;
                      const amt = Number(exp.amount || 0);
                      const taxAmt =
                        exp.tax_amount !== null && exp.tax_amount !== undefined
                          ? Number(exp.tax_amount)
                          : hasTax
                          ? Math.round((amt * Number(exp.tax_percent_used)) / 100)
                          : 0;
                      const totalAmt = amt + taxAmt;
                      const taxCat = exp.tax_category || 'exclusive';

                      return (
                        <tr key={exp.id}>
                          <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                            {(expenseCurrentPage - 1) * expensePageSize + idx + 1}
                          </td>
                          <td style={{ fontWeight: 600 }}>{exp.date}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{exp.title}</div>
                            {exp.description && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                {exp.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontWeight: 500 }}>{sanitizeCategoryName(exp.category_name)}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`method-badge ${exp.is_cash ? 'cash' : 'bank'}`}>
                              {exp.is_cash ? 'Cash' : 'Bank'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {hasTax ? (
                              taxCat === 'mixed' ? (
                                <span
                                  className="tax-badge mixed"
                                  title={`${exp.number_of_taxes || 2} taxes: ${exp.number_of_exclusive || 0} Exclusive, ${exp.number_of_inclusive_tax || 0} Inclusive`}
                                >
                                  Tax Mixed ({exp.number_of_taxes || (Array.isArray(exp.taxes) ? exp.taxes.length : 2)})
                                </span>
                              ) : taxCat === 'inclusive' ? (
                                <span className="tax-badge inclusive">Tax Inclusive</span>
                              ) : (
                                <span className="tax-badge exclusive">Tax Exclusive</span>
                              )
                            ) : (
                              <span className="tax-badge none">No Tax</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {hasTax ? (
                              Array.isArray(exp.taxes) && exp.taxes.length > 1 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {exp.taxes.map((t, tidx) => (
                                      <span
                                        key={tidx}
                                        style={{
                                          fontSize: '0.68rem',
                                          padding: '1px 4px',
                                          borderRadius: '3px',
                                          background: t.category === 'inclusive' ? '#ecfdf5' : '#eff6ff',
                                          color: t.category === 'inclusive' ? '#047857' : '#1d4ed8',
                                          border: `1px solid ${t.category === 'inclusive' ? '#a7f3d0' : '#bfdbfe'}`,
                                          fontWeight: 700,
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {t.rate}% {t.category === 'inclusive' ? 'inc' : 'exc'}
                                      </span>
                                    ))}
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    Σ {Number(exp.tax_percent_used).toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                `${Number(exp.tax_percent_used).toFixed(1)}%`
                              )
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="amount">¥{formatNum(amt)}</td>
                          <td className="amount tax">
                            <div>¥{formatNum(taxAmt)}</div>
                            {hasTax && (Number(exp.number_of_taxes) > 1 || (Array.isArray(exp.taxes) && exp.taxes.length > 1)) && (
                              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                                {Number(exp.exclusive_tax_amount || 0) > 0 && `Excl: ¥${formatNum(exp.exclusive_tax_amount)}`}
                                {Number(exp.exclusive_tax_amount || 0) > 0 && Number(exp.inclusive_tax_amount || 0) > 0 && ' | '}
                                {Number(exp.inclusive_tax_amount || 0) > 0 && `Incl: ¥${formatNum(exp.inclusive_tax_amount)}`}
                              </div>
                            )}
                          </td>
                          <td className="amount total">¥{formatNum(totalAmt)}</td>
                        </tr>
                      );
                    })
                  )}

                  {/* Summary Totals Row */}
                  {!expenseLoading && expenses.length > 0 && (
                    <tr className="tax-table-total-row">
                      <td colSpan={7} style={{ textAlign: 'right', fontWeight: 800 }}>
                        Filtered Total ({expenseStats.expense_count} records):
                      </td>
                      <td className="amount" style={{ fontWeight: 800 }}>
                        ¥{formatNum(expenseStats.total_original_amount)}
                      </td>
                      <td className="amount tax" style={{ fontWeight: 800 }}>
                        ¥{formatNum(expenseStats.total_tax_paid)}
                      </td>
                      <td className="amount total" style={{ fontWeight: 800 }}>
                        ¥{formatNum(expenseStats.grand_total_amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expense Pagination */}
            {expenseTotalCount > 0 && (
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0' }}>
                <Pagination
                  currentPage={expenseCurrentPage}
                  totalPages={expenseTotalPages}
                  onPageChange={setExpenseCurrentPage}
                  pageSize={expensePageSize}
                  onPageSizeChange={(newSize) => {
                    setExpensePageSize(newSize);
                    setExpenseCurrentPage(1);
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </div>
            )}
          </div>
        </>
      )}
      </>)}
    </div>
  );
};

export default TaxReports;
