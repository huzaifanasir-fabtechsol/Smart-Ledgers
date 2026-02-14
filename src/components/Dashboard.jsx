import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Approved Amount</h3>
          <div className="amount">${dashboardData.approved_amount?.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Amount</h3>
          <div className="amount">${dashboardData.pending_amount?.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Total Expense</h3>
          <div className="amount">${dashboardData.total_expense?.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <h3>Total Purchase</h3>
          <div className="amount">${dashboardData.total_purchase?.toLocaleString()}</div>
        </div>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h3>Latest Orders</h3>
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
                  <td>{order.transaction_type?.[0].toUpperCase() + order.transaction_type?.slice(1)}</td>
                  <td><span className={`status-badge status-${order.payment_status}`}>{order.payment_status}</span></td>
                  <td>${order.total_amount?.toLocaleString()}</td>
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
