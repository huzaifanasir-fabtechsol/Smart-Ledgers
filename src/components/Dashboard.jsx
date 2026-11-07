import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowUpRight, Eye, LayoutDashboard, TrendingUp, Clock, FileCheck2, Percent, TrendingDown, Coins, Receipt, Car, Tag } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { apiRequest } from '../api';
import { translations } from '../translations';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import YearSelector from './YearSelector';
import PageHeader from './PageHeader';
import './Dashboard.css';

const MONTHS = [
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


const renderTypeBadge = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'sale') {
    return (
      <span className="tx-chip tx-sale">
        <Tag size={12} />
        <span>Sale</span>
      </span>
    );
  }
  if (t === 'purchase') {
    return (
      <span className="tx-chip tx-purchase">
        <Car size={12} />
        <span>Purchase</span>
      </span>
    );
  }
  if (t === 'auction') {
    return (
      <span className="tx-chip tx-auction">
        <Receipt size={12} />
        <span>Auction</span>
      </span>
    );
  }
  return (
    <span className="tx-chip tx-default">
      <span>{type ? type[0].toUpperCase() + type.slice(1) : '-'}</span>
    </span>
  );
};

const Dashboard = ({ language = 'en' }) => {
  const t = translations[language];
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    approved_amount: 0,
    pending_amount: 0,
    total_expense: 0,
    total_purchase: 0,
    expense_tax: 0,
    expense_total_with_tax: 0,
    expense_count: 0,
    invoice_total: 0,
    invoice_tax: 0,
    invoice_count: 0,
    net_profit: 0,
    latest_orders: [],
    latest_expenses: [],
    monthly_chart: [],
    has_chart_data: false
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [filterYear, filterMonth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append('year', filterYear);
      if (filterMonth) params.append('month', filterMonth);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiRequest(`/revenue/orders/dashboard/${queryString}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const emptyMonthly = [
    { m: 'Jan', month: 1, rev: 0, exp: 0, profit: 0 },
    { m: 'Feb', month: 2, rev: 0, exp: 0, profit: 0 },
    { m: 'Mar', month: 3, rev: 0, exp: 0, profit: 0 },
    { m: 'Apr', month: 4, rev: 0, exp: 0, profit: 0 },
    { m: 'May', month: 5, rev: 0, exp: 0, profit: 0 },
    { m: 'Jun', month: 6, rev: 0, exp: 0, profit: 0 },
    { m: 'Jul', month: 7, rev: 0, exp: 0, profit: 0 },
    { m: 'Aug', month: 8, rev: 0, exp: 0, profit: 0 },
    { m: 'Sep', month: 9, rev: 0, exp: 0, profit: 0 },
    { m: 'Oct', month: 10, rev: 0, exp: 0, profit: 0 },
    { m: 'Nov', month: 11, rev: 0, exp: 0, profit: 0 },
    { m: 'Dec', month: 12, rev: 0, exp: 0, profit: 0 },
  ];

  const hasChartData = Boolean(
    dashboardData.has_chart_data ||
    dashboardData.monthly_chart?.some(item => (Number(item.rev) || 0) > 0 || (Number(item.exp) || 0) > 0)
  );

  const sourceMonthly = dashboardData.monthly_chart?.length
    ? dashboardData.monthly_chart
    : emptyMonthly;

  const chartData = sourceMonthly.map((item) => {
    const rawRev = Number(item.rev || 0);
    const rawExp = Number(item.exp || 0);
    const rawProfit = item.profit !== undefined ? Number(item.profit) : (rawRev - rawExp);
    return {
      m: item.m,
      month: item.month,
      rev: Number((rawRev / 100000).toFixed(1)),
      exp: Number((rawExp / 100000).toFixed(1)),
      p: Number((rawProfit / 100000).toFixed(1)),
      rawProfit,
      rawRev,
      rawExp
    };
  });

  const netProfit = dashboardData.net_profit || 0;

  const formatAmount = (val) => {
    if (val === null || val === undefined) return '0';
    return typeof val === 'number' ? val.toLocaleString() : Number(val || 0).toLocaleString();
  };

  const renderAmount = (val) => {
    const formatted = `¥${formatAmount(val)}`;
    const isCompact = formatted.length >= 12;
    return (
      <div
        className={`amount ${isCompact ? 'amount-compact' : ''}`}
        title={formatted}
      >
        {formatted}
      </div>
    );
  };

  const statCards = [
    {
      title: 'Approved Amount',
      accent: 'emerald',
      value: dashboardData.approved_amount,
      note: 'Completed sales invoices',
      icon: TrendingUp,
      badge: 'Completed',
      trend: '+12.4%',
      trendType: 'positive'
    },
    {
      title: 'Pending Amount',
      accent: 'amber',
      value: dashboardData.pending_amount,
      note: 'Awaiting customer payment',
      icon: Clock,
      badge: 'Unsettled',
      trend: 'Pending review',
      trendType: 'warning'
    },
    {
      title: 'Total Invoices',
      accent: 'blue',
      value: dashboardData.invoice_total,
      note: `${dashboardData.invoice_count} issued transactions`,
      icon: FileCheck2,
      badge: `${dashboardData.invoice_count} Invoices`,
      trend: 'Active ledger',
      trendType: 'neutral'
    },
    {
      title: 'Tax on Invoices',
      accent: 'violet',
      value: dashboardData.invoice_tax,
      note: '10% JCT consumption tax',
      icon: Percent,
      badge: 'Output Tax',
      trend: 'Liability',
      trendType: 'neutral'
    },
    {
      title: 'Total Expense (excl. tax)',
      accent: 'rose',
      value: dashboardData.total_expense,
      note: `${dashboardData.expense_count} operational expenses`,
      icon: TrendingDown,
      badge: 'Outflows',
      trend: '-5.2% costs',
      trendType: 'neutral'
    },
    {
      title: 'Tax Paid on Expenses',
      accent: 'purple',
      value: dashboardData.expense_tax,
      note: 'Input tax credit deductible',
      icon: Coins,
      badge: 'Tax Credit',
      trend: 'Deductible',
      trendType: 'positive'
    },
    {
      title: 'Total Expense (incl. tax)',
      accent: 'coral',
      value: dashboardData.expense_total_with_tax,
      note: 'Gross operational disbursements',
      icon: Receipt,
      badge: 'Disbursed',
      trend: 'Total cost',
      trendType: 'neutral'
    },
    {
      title: 'Total Purchase',
      accent: 'dark-emerald',
      value: dashboardData.total_purchase,
      note: 'Vehicle auction & stock purchases',
      icon: Car,
      badge: 'Inventory Lots',
      trend: '+5.8% stock',
      trendType: 'positive'
    },
  ];

  return (
    <div className="dashboard">
      <PageHeader
        title="Executive Dashboard"
        subtitle={
          filterYear || filterMonth
            ? `Filtered: ${filterYear ? `${filterYear}` : ''}${filterYear && filterMonth ? ' · ' : ''}${filterMonth ? (language === 'ja' ? `${filterMonth}月` : (MONTHS.find(m => m.value === filterMonth)?.label || `Month ${filterMonth}`)) : ''}`
            : 'Unified overview of revenue, operations, cash flow, and enterprise performance'
        }
        icon={LayoutDashboard}
        category="Executive Analytics"
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <YearSelector
              value={filterYear}
              onChange={(val) => setFilterYear(val)}
              placeholder={t.allYears || 'All Years'}
            />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="filter-select"
              style={{ minWidth: '130px' }}
            >
              <option value="">{t.allMonths || 'All Months'}</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {language === 'ja' ? `${m.value}月` : m.label}
                </option>
              ))}
            </select>
            {(filterYear || filterMonth) && (
              <button
                onClick={() => { setFilterYear(''); setFilterMonth(''); }}
                className="btn-secondary"
                style={{ padding: '0.65rem 1rem' }}
              >
                {t.clear || 'Clear'}
              </button>
            )}
          </div>
        }
      />

      {/* Stat Cards Grid */}
      <div className="stats-grid">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="stat-card stat-skeleton-card"
              style={{
                minHeight: '142px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                borderColor: 'rgba(226, 232, 240, 0.8)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '65%' }}>
                <div className="stat-skeleton-line" style={{ height: '12px', width: '70%' }}></div>
                <div className="stat-skeleton-line" style={{ height: '28px', width: '90%' }}></div>
                <div className="stat-skeleton-line" style={{ height: '11px', width: '50%' }}></div>
              </div>
              <div
                className="stat-skeleton-line"
                style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0 }}
              ></div>
            </div>
          ))
        ) : (
          statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={`stat-card accent-${card.accent}`}>
                <div className="stat-card-header">
                  <div className="stat-header-meta">
                    <h3 title={card.title}>{card.title}</h3>
                    {card.badge && <span className="stat-card-badge">{card.badge}</span>}
                  </div>
                  {Icon && (
                    <div className="stat-card-icon-box">
                      <Icon size={18} />
                    </div>
                  )}
                </div>
                <div className="stat-card-body">
                  {renderAmount(card.value)}
                </div>
                <div className="stat-card-footer">
                  <div className="stat-card-note">{card.note}</div>
                  {card.trend && (
                    <span className={`stat-trend-chip ${card.trendType || 'neutral'}`}>
                      {card.trend}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recharts Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Area Chart: Revenue vs Expenses */}
        <div className="table-section" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Revenue vs Expenses</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0 0' }}>
                {filterYear ? `${filterYear}` : 'Yearly overview'} · in ¥100,000 · expenses excl. tax, incl. purchases
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-lime)' }}></span> Revenue</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-violet-soft)' }}></span> Expenses</span>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                <div className="stat-skeleton-line" style={{ height: '180px', width: '100%', borderRadius: '14px' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                  {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((m) => (
                    <div key={m} className="stat-skeleton-line" style={{ height: '10px', width: '30px' }}></div>
                  ))}
                </div>
              </div>
            ) : !hasChartData ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', gap: '0.5rem', background: 'var(--surface-subtle, rgba(0,0,0,0.02))', borderRadius: '12px' }}>
                <TrendingUp size={30} style={{ opacity: 0.25 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>No transaction data for this period</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Add invoices or expenses to see revenue & expense trends</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-lime)" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="var(--color-lime)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-violet-soft)" stopOpacity={0.5}/>
                      <stop offset="100%" stopColor="var(--color-violet-soft)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false}/>
                  <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}/>
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lift)' }}
                    formatter={(val, name, item) => {
                      const raw = name === 'Revenue' ? item?.payload?.rawRev : item?.payload?.rawExp;
                      return [`¥${Number(raw ?? (val * 100000)).toLocaleString()}`, name];
                    }}
                  />
                  <Area type="monotone" dataKey="rev" name="Revenue" stroke="var(--color-lime)" strokeWidth={2} fill="url(#gRev)"/>
                  <Area type="monotone" dataKey="exp" name="Expenses" stroke="var(--color-violet-soft)" strokeWidth={2} fill="url(#gExp)"/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Monthly Profit */}
        <div className="table-section" style={{ background: 'var(--color-ink)', color: 'white', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Net Profit</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', margin: '0.25rem 0 0 0' }}>Approved Revenue - Purchases - Expenses (excl. tax)</p>
            </div>
            {loading ? (
              <div className="stat-skeleton-line-dark" style={{ width: '56px', height: '22px', borderRadius: '12px' }}></div>
            ) : (
              <span style={{ fontSize: '0.75rem', background: 'var(--color-lime)', color: 'var(--color-ink)', fontWeight: 800, padding: '4px 8px', borderRadius: '12px' }}>
                {netProfit >= 0 ? 'Active' : '-Deficit'}
              </span>
            )}
          </div>
          {loading ? (
            <div className="stat-skeleton-line-dark" style={{ width: '220px', height: '36px', marginBottom: '1.25rem' }}></div>
          ) : (
            <div style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.25rem', color: netProfit >= 0 ? 'white' : 'var(--danger)' }}>
              ¥{netProfit.toLocaleString()}
            </div>
          )}
          <div style={{ height: '160px', width: '100%' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 8px' }}>
                {[45, 30, 60, 75, 50, 85, 65, 80, 55, 70, 60, 95].map((h, idx) => (
                  <div
                    key={idx}
                    className="stat-skeleton-line-dark"
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: '4px 4px 0 0',
                    }}
                  ></div>
                ))}
              </div>
            ) : !hasChartData ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.45)', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px' }}>
                <Coins size={26} style={{ opacity: 0.25 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>No profit activity recorded</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Net profit breakdown will appear as transactions are completed</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="m" stroke="rgba(255, 255, 255, 0.4)" fontSize={10} tickLine={false} axisLine={false}/>
                  <YAxis hide/>
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                    contentStyle={{ borderRadius: 12, border: 'none', background: 'white', color: 'var(--color-ink)' }}
                    formatter={(value, name, item) => [`¥${Number(item?.payload?.rawProfit || 0).toLocaleString()}`, 'Net Profit']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="p" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const isSelected = filterMonth ? entry.month === Number(filterMonth) : index === chartData.length - 1;
                      const isDeficit = entry.rawProfit < 0;
                      return (
                        <Cell 
                          key={index} 
                          fill={isDeficit ? '#f43f5e' : (isSelected ? 'var(--color-lime)' : 'var(--color-violet-soft)')}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Latest Invoices Table */}
      <div className="table-section">
        <div className="table-header">
          <h3>Latest Invoices</h3>
          <button
            onClick={() => navigate('/inovice')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}
          >
            View all <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th style={{ width: 60 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading latest invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : !dashboardData.latest_orders || dashboardData.latest_orders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                    No invoices found for the selected period
                  </td>
                </tr>
              ) : (
                dashboardData.latest_orders.map((order, idx) => (
                  <tr
                    key={order.id || idx}
                    onClick={() => { setSelectedInvoice(order); setShowViewModal(true); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{order.transaction_date}</td>
                    <td>{renderTypeBadge(order.transaction_type)}</td>
                    <td>
                      <span className={`status-badge status-${order.payment_status?.toLowerCase()}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="amount-cell">¥{order.total_amount?.toLocaleString()}</td>
                    <td>
                      <button
                        className="btn-menu"
                        onClick={(e) => { e.stopPropagation(); setSelectedInvoice(order); setShowViewModal(true); }}
                        title="View Invoice Details"
                        style={{ padding: '4px 8px' }}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest Expenses Table */}
      <div className="table-section" style={{ marginTop: '2rem' }}>
        <div className="table-header">
          <h3>Latest Expenses</h3>
          <button
            onClick={() => navigate('/expenses')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}
          >
            View all <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Amount (excl. tax)</th>
                <th style={{ textAlign: 'right' }}>Tax</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading latest expenses...</span>
                    </div>
                  </td>
                </tr>
              ) : !dashboardData.latest_expenses || dashboardData.latest_expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                    No expenses found for the selected period
                  </td>
                </tr>
              ) : (
                dashboardData.latest_expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>
                    <td style={{ fontWeight: 600 }}>{expense.title}</td>
                    <td>{expense.category_name || '-'}</td>
                    <td>{expense.is_cash ? 'Cash' : 'Bank'}</td>
                    <td className="amount-cell" style={{ textAlign: 'right' }}>¥{formatAmount(expense.amount)}</td>
                    <td className="amount-cell" style={{ textAlign: 'right' }}>{expense.tax_amount > 0 ? `¥${formatAmount(expense.tax_amount)}` : '-'}</td>
                    <td className="amount-cell" style={{ textAlign: 'right', fontWeight: 700 }}>¥{formatAmount(expense.total_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedInvoice(null); }}
        orderId={selectedInvoice?.id}
        initialOrder={selectedInvoice}
        onEdit={(order) => navigate('/inovice/edit', { state: { order } })}
      />
    </div>
  );
};

export default Dashboard;
