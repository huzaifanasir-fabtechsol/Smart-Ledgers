import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Printer, Calendar, User, Briefcase, Mail, Phone, DollarSign } from 'lucide-react';
import { apiRequest } from '../api';
import '../shared.css';
import './EmployeeSalaryReport.css';

const EmployeeSalaryReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = `${currentYearStr}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [viewMode, setViewMode] = useState('year'); // 'year' or 'month'
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [id, viewMode, selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let query = '';
      if (viewMode === 'year') {
        query = `?year=${selectedYear}`;
      } else {
        query = `?month=${selectedMonth}`;
      }
      const response = await apiRequest(`/hr/employees/${id}/salary-report/${query}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch salary report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [y, m] = monthStr.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  const employee = reportData?.employee;
  const adminCompany = reportData?.admin_company;
  const salaries = reportData?.salaries || [];
  const summary = reportData?.summary || {};

  const yearOptions = [];
  const startYr = new Date().getFullYear();
  for (let y = startYr; y >= startYr - 5; y--) {
    yearOptions.push(y.toString());
  }

  return (
    <div className="employee-salary-report-page">
      {/* Action / Control Header (Hidden on Print) */}
      <div className="report-controls-bar no-print">
        <button className="btn-secondary back-btn" onClick={() => navigate('/employees')}>
          <ArrowLeft size={16} /> Back to Employees
        </button>

        <div className="mode-toggle">
          <button
            className={`toggle-tab ${viewMode === 'year' ? 'active' : ''}`}
            onClick={() => setViewMode('year')}
          >
            Yearly Report
          </button>
          <button
            className={`toggle-tab ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Monthly Payslip
          </button>
        </div>

        <div className="filter-controls">
          {viewMode === 'year' ? (
            <div className="select-wrapper">
              <label>Year:</label>
              <select
                className="filter-select-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="select-wrapper">
              <label>Month:</label>
              <input
                type="month"
                className="filter-input-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}

          <button className="btn-primary print-btn" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="report-paper">
        {loading ? (
          <div className="table-loader-container" style={{ padding: '4rem 0' }}>
            <div className="spinner"></div>
            <p>Loading salary report...</p>
          </div>
        ) : !employee ? (
          <div className="table-loader-container" style={{ padding: '4rem 0' }}>
            <p>Employee record not found.</p>
          </div>
        ) : (
          <>
            {/* Header / Company Branding */}
            <div className="report-header">
              <div className="company-info">
                <h2>{adminCompany?.company_name || 'Smart Ledger'}</h2>
                {adminCompany?.company_address && <p>{adminCompany.company_address}</p>}
                {adminCompany?.company_phone && <p>Tel: {adminCompany.company_phone}</p>}
                {adminCompany?.company_email && <p>Email: {adminCompany.company_email}</p>}
              </div>
              <div className="doc-title-badge">
                <h1>{viewMode === 'year' ? 'ANNUAL SALARY REPORT' : 'SALARY PAYSLIP'}</h1>
                <span className="period-tag">
                  {viewMode === 'year' ? `YEAR ${selectedYear}` : formatMonthName(selectedMonth)}
                </span>
              </div>
            </div>

            <hr className="divider" />

            {/* Employee Profile Summary */}
            <div className="employee-info-card">
              <div className="info-item">
                <span className="info-label"><User size={14} /> Employee Name</span>
                <span className="info-value"><strong>{employee.name}</strong></span>
              </div>
              <div className="info-item">
                <span className="info-label"><Briefcase size={14} /> Role</span>
                <span className="info-value"><span className="badge badge-role">{employee.role}</span></span>
              </div>
              <div className="info-item">
                <span className="info-label"><Calendar size={14} /> Status</span>
                <span className="info-value">
                  <span className={`badge ${employee.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                    {employee.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label"><Mail size={14} /> Email</span>
                <span className="info-value">{employee.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Phone size={14} /> Phone</span>
                <span className="info-value">{employee.phone || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><DollarSign size={14} /> Basic Salary</span>
                <span className="info-value"><strong>¥{Number(employee.basic_salary).toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Report Content */}
            {viewMode === 'year' ? (
              /* Yearly View */
              <div className="report-body">
                <h3 className="section-subtitle">Monthly Salary Breakdown — {selectedYear}</h3>

                {salaries.length === 0 ? (
                  <div className="empty-state-card">
                    <Calendar size={36} />
                    <p className="no-records-msg">No salary records found for year {selectedYear}.</p>
                    <button className="btn-secondary" onClick={() => navigate('/salaries')}>Go to Salary Management</button>
                  </div>
                ) : (
                  <>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Salary Month</th>
                          <th>Leaves (Days)</th>
                          <th>Leave Deduction</th>
                          <th>Allowances</th>
                          <th>Other Deductions</th>
                          <th>Net Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaries.map((sal, idx) => (
                          <tr key={sal.id}>
                            <td>{idx + 1}</td>
                            <td><strong>{sal.salary_month}</strong></td>
                            <td>{sal.leaves}</td>
                            <td>¥{Number(sal.leave_deduction).toLocaleString()}</td>
                            <td>¥{Number(sal.allowances).toLocaleString()}</td>
                            <td>¥{Number(sal.other_deductions).toLocaleString()}</td>
                            <td><strong>¥{Number(sal.net_amount).toLocaleString()}</strong></td>
                            <td>
                              <span className={`badge ${sal.status === 'paid' ? 'badge-active' : 'badge-inactive'}`}>
                                {sal.status === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="summary-row">
                          <td colSpan="2"><strong>Total ({summary.total_records} Records)</strong></td>
                          <td><strong>{summary.total_leaves}</strong></td>
                          <td><strong>¥{Number(summary.total_leave_deduction).toLocaleString()}</strong></td>
                          <td><strong>¥{Number(summary.total_allowances).toLocaleString()}</strong></td>
                          <td><strong>¥{Number(summary.total_other_deductions).toLocaleString()}</strong></td>
                          <td><strong className="grand-net">¥{Number(summary.total_net_amount).toLocaleString()}</strong></td>
                          <td>{summary.paid_count} Paid / {summary.unpaid_count} Unpaid</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="yearly-cards-summary">
                      <div className="sum-box">
                        <span className="sum-title">Total Allowances</span>
                        <span className="sum-val text-success">¥{Number(summary.total_allowances).toLocaleString()}</span>
                      </div>
                      <div className="sum-box">
                        <span className="sum-title">Total Deductions</span>
                        <span className="sum-val text-danger">
                          ¥{Number(summary.total_leave_deduction + summary.total_other_deductions).toLocaleString()}
                        </span>
                      </div>
                      <div className="sum-box highlight">
                        <span className="sum-title">Net Total Salary Paid</span>
                        <span className="sum-val">¥{Number(summary.total_net_amount).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Monthly Payslip View */
              <div className="report-body">
                <h3 className="section-subtitle">Payslip Details for {formatMonthName(selectedMonth)}</h3>

                {salaries.length === 0 ? (
                  <div className="empty-state-card">
                    <DollarSign size={36} />
                    <p className="no-records-msg">No salary record found for {formatMonthName(selectedMonth)}.</p>
                    <button className="btn-secondary" onClick={() => navigate('/salaries')}>Create Salary Record</button>
                  </div>
                ) : (
                  salaries.map(sal => (
                    <div key={sal.id} className="payslip-container">
                      <div className="payslip-grid">
                        <div className="payslip-column earnings">
                          <h4 className="payslip-col-header">
                            <span className="col-tag green">Earnings</span>
                          </h4>
                          <div className="payslip-row">
                            <span>Basic Salary</span>
                            <span>¥{Number(employee.basic_salary).toLocaleString()}</span>
                          </div>
                          <div className="payslip-row">
                            <span>Allowances</span>
                            <span className="text-success">+ ¥{Number(sal.allowances).toLocaleString()}</span>
                          </div>
                          <div className="payslip-row total">
                            <span>Gross Earnings</span>
                            <span>¥{(Number(employee.basic_salary) + Number(sal.allowances)).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="payslip-column deductions">
                          <h4 className="payslip-col-header">
                            <span className="col-tag red">Deductions</span>
                          </h4>
                          <div className="payslip-row">
                            <span>Leaves ({sal.leaves} days)</span>
                            <span className="text-danger">- ¥{Number(sal.leave_deduction).toLocaleString()}</span>
                          </div>
                          <div className="payslip-row">
                            <span>Other Deductions</span>
                            <span className="text-danger">- ¥{Number(sal.other_deductions).toLocaleString()}</span>
                          </div>
                          <div className="payslip-row total">
                            <span>Total Deductions</span>
                            <span className="text-danger">- ¥{(Number(sal.leave_deduction) + Number(sal.other_deductions)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="payslip-net-box">
                        <div className="net-title">
                          <span className="net-label">NET PAYABLE AMOUNT</span>
                          <span className={`badge ${sal.status === 'paid' ? 'badge-active' : 'badge-inactive'}`}>
                            {sal.status === 'paid' ? 'PAID' : 'UNPAID'}
                          </span>
                        </div>
                        <div className="net-amount">¥{Number(sal.net_amount).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Signature / Authorization Footer */}
            <div className="report-footer-signatures">
              <div className="sig-line">
                <div className="sig-space"></div>
                <div className="line"></div>
                <p className="sig-title">Employee Signature</p>
                <p className="sig-date">Date: ____________________</p>
              </div>
              <div className="sig-line">
                <div className="sig-space"></div>
                <div className="line"></div>
                <p className="sig-title">Authorized Admin Signature & Stamp</p>
                <p className="sig-date">Date: ____________________</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeSalaryReport;
