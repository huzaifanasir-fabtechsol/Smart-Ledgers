import { useState, useEffect, useMemo, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FileSpreadsheet,
  FileText,
  Calculator,
  Search,
  Filter,
  RotateCcw,
  Receipt,
  Layers,
  ArrowRight,
  TrendingDown,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { apiRequest, getErrorMessage, downloadExpenseTaxExcel } from '../api';
import Pagination from './Pagination';
import YearSelector from './YearSelector';
import './TaxReports.css';

const TaxReports = () => {
  // Modal for Report Type Selection: Expense or Invoice
  const [showTypeModal, setShowTypeModal] = useState(true);
  const [reportType, setReportType] = useState('expense'); // 'expense' or 'invoice'

  // Data State
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [categories, setCategories] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Statistics Summary State
  const [stats, setStats] = useState({
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
    total_no_tax_amount: 0,
    no_tax_count: 0,
    expense_count: 0,
    tax_rate_breakdown: [],
  });

  // Filters State
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterTaxCategory, setFilterTaxCategory] = useState('');

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

  // Fetch Categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch Expenses & Stats when filters or pagination change
  useEffect(() => {
    if (reportType === 'expense') {
      fetchExpenses();
      fetchTaxStats();
    }
  }, [
    reportType,
    currentPage,
    pageSize,
    filterYear,
    filterMonth,
    filterDateFrom,
    filterDateTo,
    filterCategory,
    filterPaymentStatus,
    filterTaxCategory,
  ]);

  const buildFilterQueryParams = () => {
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

  const fetchTaxStats = async () => {
    try {
      const params = buildFilterQueryParams();
      const response = await apiRequest(`/expenses/tax_stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = buildFilterQueryParams();
      params.append('page', currentPage);
      params.append('page_size', pageSize);
      params.append('pageSize', pageSize);

      const response = await apiRequest(`/expenses/?${params.toString()}`);
      if (!response.ok) {
        const msg = await getErrorMessage(response, 'Failed to fetch tax expenses');
        throw new Error(msg);
      }
      const data = await response.json();
      setExpenses(data.results || data || []);
      setTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      toast.error(err.message || 'Failed to load expense tax records');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCategory('');
    setFilterPaymentStatus('');
    setFilterTaxCategory('');
    setCurrentPage(1);
    toast.info('Filters reset to default');
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      toast.info('Generating Excel Tax Report...');
      const params = buildFilterQueryParams();
      await downloadExpenseTaxExcel(`?${params.toString()}`);
      toast.success('Excel Tax Report downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download Excel report');
    } finally {
      setExporting(false);
    }
  };

  const handleSelectReport = (type) => {
    if (type === 'invoice') {
      toast.info('Invoice Tax Report is currently in development. Opening Expense Tax Report.');
      setReportType('expense');
      setShowTypeModal(false);
      return;
    }
    setReportType('expense');
    setShowTypeModal(false);
  };

  const formatNum = (val) => Number(val || 0).toLocaleString();

  const sanitizeCategoryName = (name) => {
    if (!name) return '-';
    const clean = String(name).replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/g, '').replace(/\(\s*\)/g, '').trim();
    return clean || name;
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

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
                onClick={() => setShowTypeModal(false)}
                title="Close"
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
                    Comprehensive overview of business expenses, tax-inclusive vs tax-exclusive settlement, and total tax paid.
                  </div>
                </div>
                <div className="tax-choice-footer">
                  <span className="tax-choice-status-badge ready">Ready</span>
                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    View Report <ArrowRight size={14} />
                  </span>
                </div>
              </div>

              {/* Invoice Option (Future) */}
              <div
                className="tax-choice-card disabled"
                onClick={() => handleSelectReport('invoice')}
              >
                <div>
                  <div className="tax-choice-icon-wrap invoice">
                    <FileText size={24} />
                  </div>
                  <div className="tax-choice-title">Invoice Tax Report</div>
                  <div className="tax-choice-desc">
                    Consumption tax summary on issued customer invoices and taxable vehicle sales.
                  </div>
                </div>
                <div className="tax-choice-footer">
                  <span className="tax-choice-status-badge soon">Coming Soon</span>
                  <span style={{ color: '#94a3b8' }}>Preview Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <div className="tax-reports-header">
        <div className="tax-header-left">
          <h1>
            <Calculator size={28} style={{ color: '#0284c7' }} />
            Expense Tax Reports
          </h1>
          <p className="tax-header-subtitle">
            Auditing pre-tax expenditures, tax-inclusive & exclusive amounts, and paid consumption tax.
          </p>
        </div>

        <div className="tax-header-actions">
          <button
            type="button"
            className="btn-report-type-switch"
            onClick={() => setShowTypeModal(true)}
            title="Switch between Expense and Invoice Tax Reports"
          >
            <Layers size={16} style={{ color: '#2563eb' }} />
            <span>Report: Expense Tax</span>
            <ChevronDown size={14} />
          </button>

          <button
            type="button"
            className="btn-export-excel"
            onClick={handleExportExcel}
            disabled={exporting}
            title="Export filtered records to Excel with bottom totals"
          >
            <FileSpreadsheet size={16} />
            <span>{exporting ? 'Exporting...' : 'Export to Excel (.xlsx)'}</span>
          </button>
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
          <div className="tax-stat-value">¥{formatNum(stats.total_original_amount)}</div>
          <div className="tax-stat-subtext">
            <span>Base Expense Total</span>
            <span>{stats.expense_count} expenses</span>
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
            ¥{formatNum(stats.total_tax_paid)}
          </div>
          <div className="tax-stat-subtext">
            <span>Total Tax Accounted</span>
            <span>Effective Rate: {stats.total_original_amount > 0 ? ((stats.total_tax_paid / stats.total_original_amount) * 100).toFixed(1) : 0}%</span>
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
            ¥{formatNum(stats.grand_total_amount)}
          </div>
          <div className="tax-stat-subtext">
            <span>Total Payout</span>
            <span>Pre-Tax ¥{formatNum(stats.total_original_amount)} + Tax ¥{formatNum(stats.total_tax_paid)}</span>
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
          <div className="tax-stat-value">¥{formatNum(stats.total_inclusive_amount)}</div>
          <div className="tax-stat-subtext">
            <span>Tax-Inclusive ({stats.inclusive_count} items)</span>
            <span>Base: ¥{formatNum(stats.inclusive_base_amount)} | Tax: ¥{formatNum(stats.inclusive_tax_amount)}</span>
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
          <div className="tax-stat-value">¥{formatNum(stats.total_exclusive_amount)}</div>
          <div className="tax-stat-subtext">
            <span>Tax-Exclusive ({stats.exclusive_count} items)</span>
            <span>Base: ¥{formatNum(stats.exclusive_base_amount)} | Tax: ¥{formatNum(stats.exclusive_tax_amount)}</span>
          </div>
        </div>

        {/* Card 6: No Tax / Non-Taxable */}
        <div className="tax-stat-card">
          <div className="tax-stat-header">
            <span className="tax-stat-label">Non-Taxable Expenses</span>
            <div className="tax-stat-icon">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="tax-stat-value">¥{formatNum(stats.total_no_tax_amount)}</div>
          <div className="tax-stat-subtext">
            <span>Zero-Tax / Exempt (0%)</span>
            <span>{stats.no_tax_count} expenses without tax</span>
          </div>
        </div>
      </div>

      {/* Tax Rate Distribution Strip */}
      {stats.tax_rate_breakdown && stats.tax_rate_breakdown.length > 0 && (
        <div className="tax-rate-breakdown-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
            <Percent size={15} style={{ color: '#0284c7' }} />
            <span>Tax Rate Distribution:</span>
          </div>

          <div className="tax-rate-pills">
            {stats.tax_rate_breakdown.map((item) => (
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

      {/* Filters Card */}
      <div className="tax-filter-card">
        <div className="tax-filter-grid">
          {/* Year Filter */}
          <div className="filter-item">
            <label>Year</label>
            <YearSelector
              value={filterYear}
              onChange={(val) => {
                setFilterYear(val);
                setCurrentPage(1);
              }}
              placeholder="All Years"
            />
          </div>

          {/* Month Filter */}
          <div className="filter-item">
            <label>Month</label>
            <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}>
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
              onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Date To */}
          <div className="filter-item">
            <label>Date To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Category Filter */}
          <div className="filter-item">
            <label>Category</label>
            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{sanitizeCategoryName(c.name)}</option>
              ))}
            </select>
          </div>

          {/* Payment Status / Method */}
          <div className="filter-item">
            <label>Payment Method</label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => { setFilterPaymentStatus(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => { setFilterTaxCategory(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Tax Types</option>
              <option value="inclusive">Tax Inclusive</option>
              <option value="exclusive">Tax Exclusive</option>
              <option value="none">No Tax (0%)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="filter-actions">
            <button
              type="button"
              className="btn-filter-reset"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

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
              {loading ? (
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
                  const taxAmt = exp.tax_amount !== null && exp.tax_amount !== undefined
                    ? Number(exp.tax_amount)
                    : (hasTax ? Math.round(amt * Number(exp.tax_percent_used) / 100) : 0);
                  const totalAmt = amt + taxAmt;
                  const taxCat = exp.tax_category || 'exclusive';

                  return (
                    <tr key={exp.id}>
                      <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                        {(currentPage - 1) * pageSize + idx + 1}
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
                          taxCat === 'inclusive' ? (
                            <span className="tax-badge inclusive">Tax Inclusive</span>
                          ) : (
                            <span className="tax-badge exclusive">Tax Exclusive</span>
                          )
                        ) : (
                          <span className="tax-badge none">No Tax</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {hasTax ? `${Number(exp.tax_percent_used).toFixed(1)}%` : '-'}
                      </td>
                      <td className="amount">
                        ¥{formatNum(amt)}
                      </td>
                      <td className="amount tax">
                        ¥{formatNum(taxAmt)}
                      </td>
                      <td className="amount total">
                        ¥{formatNum(totalAmt)}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Bottom Summary Totals Row */}
              {!loading && expenses.length > 0 && (
                <tr className="tax-table-total-row">
                  <td colSpan={7} style={{ textAlign: 'right', fontWeight: 800 }}>
                    Filtered Total ({stats.expense_count} records):
                  </td>
                  <td className="amount" style={{ fontWeight: 800 }}>
                    ¥{formatNum(stats.total_original_amount)}
                  </td>
                  <td className="amount tax" style={{ fontWeight: 800 }}>
                    ¥{formatNum(stats.total_tax_paid)}
                  </td>
                  <td className="amount total" style={{ fontWeight: 800 }}>
                    ¥{formatNum(stats.grand_total_amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalCount > 0 && (
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e2e8f0' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxReports;
