import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { TrendingUp, TrendingDown, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { apiRequest } from '../api';
import { translations } from '../translations';
import './Dashboard.css';

const Dashboard = ({ language = 'en' }) => {
  const t = translations[language];
  const [dashboardData, setDashboardData] = useState({
    approved_amount: 0,
    pending_amount: 0,
    total_expense: 0,
    total_purchase: 0,
    latest_orders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/revenue/orders/dashboard/');
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

  // Seed chart data matching design system
  const revExp = [
    { m: 'Jan', rev: 42, exp: 28 }, { m: 'Feb', rev: 51, exp: 32 },
    { m: 'Mar', rev: 48, exp: 35 }, { m: 'Apr', rev: 62, exp: 38 },
    { m: 'May', rev: 71, exp: 41 }, { m: 'Jun', rev: 65, exp: 44 },
    { m: 'Jul', rev: 82, exp: 47 }, { m: 'Aug', rev: 78, exp: 49 },
    { m: 'Sep', rev: 91, exp: 52 }, { m: 'Oct', rev: 88, exp: 55 },
    { m: 'Nov', rev: 96, exp: 58 }, { m: 'Dec', rev: 104, exp: 61 },
  ];

  const profitData = [
    { m: 'Jun', p: 21 }, { m: 'Jul', p: 35 }, { m: 'Aug', p: 29 },
    { m: 'Sep', p: 39 }, { m: 'Oct', p: 33 }, { m: 'Nov', p: 38 }, { m: 'Dec', p: 43 },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
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
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0 0' }}>Last 12 months · in ¥100,000</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-lime)' }}></span> Revenue</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-violet-soft)' }}></span> Expenses</span>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revExp} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Monthly Profit</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', margin: '0.25rem 0 0 0' }}>Net of taxes & fees</p>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'var(--color-lime)', color: 'var(--color-ink)', fontWeight: 800, padding: '4px 8px', borderRadius: '12px' }}>+24%</span>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '1.25rem' }}>¥1,350,000</div>
          <div style={{ height: '160px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <XAxis dataKey="m" stroke="rgba(255, 255, 255, 0.4)" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis hide/>
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ borderRadius: 12, border: 'none', background: 'white', color: 'var(--color-ink)' }}/>
                <Bar dataKey="p" radius={[6, 6, 0, 0]}>
                  {profitData.map((entry, index) => (
                    <Cell key={index} fill={index === profitData.length - 1 ? 'var(--color-lime)' : 'var(--color-violet-soft)'}/>
                  ))}
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
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
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
              </tr>
            </thead>
            <tbody>
              {dashboardData.latest_orders?.map((order, idx) => (
                <tr key={idx}>
                  <td>{order.transaction_date}</td>
                  <td style={{ fontWeight: 600 }}>{order.transaction_type?.[0].toUpperCase() + order.transaction_type?.slice(1)}</td>
                  <td>
                    <span className={`status-badge status-${order.payment_status?.toLowerCase()}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="amount-cell">¥{order.total_amount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
