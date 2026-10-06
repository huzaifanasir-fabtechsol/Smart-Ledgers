import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { TrendingUp, TrendingDown, MoreHorizontal, ArrowUpRight, Eye } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { apiRequest } from '../api';
import { translations } from '../translations';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import YearSelector from './YearSelector';
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

const Dashboard = ({ language = 'en' }) => {
  const t = translations[language];
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    approved_amount: 0,
    pending_amount: 0,
    total_expense: 0,
    total_purchase: 0,
    latest_orders: [],
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

  if (loading) {
    return <div className="loader">Loading...</div>;
  }

  // Seed or dynamic chart data matching design system
  const seedRevExp = [
    { m: 'Jan', rev: 42, exp: 28 }, { m: 'Feb', rev: 51, exp: 32 },
    { m: 'Mar', rev: 48, exp: 35 }, { m: 'Apr', rev: 62, exp: 38 },
    { m: 'May', rev: 71, exp: 41 }, { m: 'Jun', rev: 65, exp: 44 },
    { m: 'Jul', rev: 82, exp: 47 }, { m: 'Aug', rev: 78, exp: 49 },
    { m: 'Sep', rev: 91, exp: 52 }, { m: 'Oct', rev: 88, exp: 55 },
    { m: 'Nov', rev: 96, exp: 58 }, { m: 'Dec', rev: 104, exp: 61 },
  ];

  const chartData = dashboardData.has_chart_data && dashboardData.monthly_chart?.length
    ? dashboardData.monthly_chart.map((item) => ({
        m: item.m,
        month: item.month,
        rev: Number((item.rev / 100000).toFixed(1)),
        exp: Number((item.exp / 100000).toFixed(1)),
        p: Number((Math.max(0, item.profit) / 100000).toFixed(1)),
        rawProfit: item.profit
      }))
    : seedRevExp.map((item) => ({ ...item, p: Math.max(0, item.rev - item.exp) }));

  const netProfit = (dashboardData.approved_amount || 0) - (dashboardData.total_expense || 0);

  return (
    <div className="dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Dashboard Overview</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            {filterYear || filterMonth
              ? `Filtered: ${filterYear ? `${filterYear}` : ''}${filterYear && filterMonth ? ' · ' : ''}${filterMonth ? (language === 'ja' ? `${filterMonth}月` : (MONTHS.find(m => m.value === filterMonth)?.label || `Month ${filterMonth}`)) : ''}`
              : 'Showing all-time overview'}
          </p>
        </div>

        {/* Filters */}
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
      </div>
      
      {/* Stat Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card accent-lime">
          <div className="stat-card-header">
            <h3>Approved Amount</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><MoreHorizontal size={16} /></button>
          </div>
          <div className="stat-card-body">
            <div className="amount">¥{dashboardData.approved_amount?.toLocaleString()}</div>
            <div className="stat-trend">
              <TrendingUp size={12} /> +8.2%
            </div>
          </div>
        </div>

        <div className="stat-card accent-violet">
          <div className="stat-card-header">
            <h3>Pending Amount</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><MoreHorizontal size={16} /></button>
          </div>
          <div className="stat-card-body">
            <div className="amount">¥{dashboardData.pending_amount?.toLocaleString()}</div>
            <div className="stat-trend">
              <TrendingUp size={12} /> +5.4%
            </div>
          </div>
        </div>

        <div className="stat-card accent-white">
          <div className="stat-card-header">
            <h3>Total Expense</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><MoreHorizontal size={16} /></button>
          </div>
          <div className="stat-card-body">
            <div className="amount">¥{dashboardData.total_expense?.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: 'var(--danger)' }}>
              <TrendingDown size={12} /> +3.1%
            </div>
          </div>
        </div>

        <div className="stat-card accent-ink">
          <div className="stat-card-header">
            <h3>Total Purchase</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><MoreHorizontal size={16} /></button>
          </div>
          <div className="stat-card-body">
            <div className="amount">¥{dashboardData.total_purchase?.toLocaleString()}</div>
            <div className="stat-trend">
              <TrendingUp size={12} /> +12.7%
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Area Chart: Revenue vs Expenses */}
        <div className="table-section" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Revenue vs Expenses</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0 0' }}>
                {filterYear ? `${filterYear}` : 'Yearly overview'} · in ¥100,000
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-lime)' }}></span> Revenue</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-violet-soft)' }}></span> Expenses</span>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
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
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lift)' }}/>
                <Area type="monotone" dataKey="rev" name="Revenue" stroke="var(--color-lime)" strokeWidth={2} fill="url(#gRev)"/>
                <Area type="monotone" dataKey="exp" name="Expenses" stroke="var(--color-violet-soft)" strokeWidth={2} fill="url(#gExp)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Monthly Profit */}
        <div className="table-section" style={{ background: 'var(--color-ink)', color: 'white', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Net Profit</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', margin: '0.25rem 0 0 0' }}>Approved Revenue - Expenses</p>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'var(--color-lime)', color: 'var(--color-ink)', fontWeight: 800, padding: '4px 8px', borderRadius: '12px' }}>
              {netProfit >= 0 ? '+Active' : '-Deficit'}
            </span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.25rem', color: netProfit >= 0 ? 'white' : 'var(--danger)' }}>
            ¥{netProfit.toLocaleString()}
          </div>
          <div style={{ height: '160px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <XAxis dataKey="m" stroke="rgba(255, 255, 255, 0.4)" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis hide/>
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ borderRadius: 12, border: 'none', background: 'white', color: 'var(--color-ink)' }}/>
                <Bar dataKey="p" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isSelected = filterMonth ? entry.month === Number(filterMonth) : index === chartData.length - 1;
                    return (
                      <Cell key={index} fill={isSelected ? 'var(--color-lime)' : 'var(--color-violet-soft)'}/>
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
              {!dashboardData.latest_orders || dashboardData.latest_orders.length === 0 ? (
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
                    <td style={{ fontWeight: 600 }}>{order.transaction_type?.[0].toUpperCase() + order.transaction_type?.slice(1)}</td>
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
