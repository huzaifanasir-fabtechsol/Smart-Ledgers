import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { apiRequest } from '../api';
import '../shared.css';
import './DataExport.css';

const DataExport = ({ language = 'en' }) => {
  const t = translations[language];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('all');
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, reportType, period, startDate, endDate, paymentStatus, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        period: period,
        pageSize: itemsPerPage,
        page: currentPage
      });
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (paymentStatus) params.append('payment_status', paymentStatus);
      if (search) params.append('search', search);

      const response = await apiRequest(`/revenue/orders/reports/?${params}`);
      const result = await response.json();
      
      setData(result.results || []);
      setTotalPages(Math.ceil((result.count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        period: period
      });
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiRequest(`/revenue/orders/financial_report/?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="data-export">
      <div className="table-section">
        <div className="table-header">
          <h3>{t.dataExport}</h3>
          <button className="btn-primary" onClick={handleExport}>{t.exportData}</button>
        </div>

        <div className="filters">
          <select value={reportType} onChange={(e) => { setReportType(e.target.value); setCurrentPage(1); }} className="filter-select">
            <option value="all">{t.allData}</option>
            <option value="sales">{t.sale}</option>
            <option value="purchases">{t.purchase}</option>
            <option value="auctions">{t.auction}</option>
            <option value="expenses">{t.expenses}</option>
            <option value="orders">{t.orders}</option>
            <option value="nagare">Nagare</option>
          </select>

          <select value={period} onChange={(e) => { setPeriod(e.target.value); setCurrentPage(1); }} className="filter-select">
            <option value="all">{t.all}</option>
            <option value="today">{t.today}</option>
            <option value="month">{t.thisMonth}</option>
            <option value="year">{t.thisYear}</option>
            <option value="custom">{t.customRange}</option>
          </select>

          {period === 'custom' && (
            <>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="filter-input" placeholder={t.fromDate} />
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="filter-input" placeholder={t.toDate} />
            </>
          )}

          <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setCurrentPage(1); }} className="filter-select">
            <option value="">{t.allPaymentStatus || 'All Payment Status'}</option>
            <option value="pending">{t.pending || 'Pending'}</option>
            <option value="completed">{t.completed || 'Completed'}</option>
          </select>

          {/* <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder={t.search || 'Search...'} className="filter-input" /> */}

          <button onClick={() => { setReportType('orders'); setPeriod('month'); setStartDate(''); setEndDate(''); setPaymentStatus(''); setSearch(''); setCurrentPage(1); }} className="btn-clear">{t.clear}</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sr</th>
                <th>{t.date}</th>
                <th>{t.type}</th>
                <th>{t.paymentStatus || 'Payment Status'}</th>
                <th>{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center'}}>No data found</td></tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{item.transaction_date}</td>
                    <td>{item.transaction_type?.[0].toUpperCase() + item.transaction_type?.slice(1)}</td>
                    <td>{item.payment_status}</td>
                    <td className="amount-cell">¥{parseFloat(item.total_amount).toLocaleString()}</td>
                  </tr>
                ))
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
    </div>
  );
};

export default DataExport;
