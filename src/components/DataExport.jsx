import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { apiRequest } from '../api';
import Pagination from './Pagination';
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
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = pageSize;

  useEffect(() => {
    fetchData();
  }, [currentPage, reportType, period, startDate, endDate, paymentStatus, search, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        period: period,
        pageSize: pageSize,
        page_size: pageSize,
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
                <tr>
                  <td colSpan="5">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>{t.loading || 'Loading...'}</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--muted-foreground)' }}>
                    {t.noDataFound || 'No data found'}
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td>{item.transaction_date || item.date || '-'}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {item.transaction_type || item.type || '-'}
                    </td>
                    <td>
                      <span className={`status-badge status-${(item.payment_status || 'completed').toLowerCase()}`}>
                        {item.payment_status || 'Completed'}
                      </span>
                    </td>
                    <td className="amount-cell">
                      ¥{item.total_amount !== undefined ? Number(item.total_amount).toLocaleString() : item.amount !== undefined ? Number(item.amount).toLocaleString() : '0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default DataExport;
