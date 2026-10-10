import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Calendar,
  User,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { apiRequest, downloadSalaryExcel, downloadSalaryPdf } from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../shared.css';
import './EmployeeSalaryReport.css';
import './PayslipModal.css';

const EmployeeSalaryReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = `${currentYearStr}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const [viewMode, setViewMode] = useState('month'); // 'month' (default for Japanese payslips) or 'year'
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

  const handleDownloadExcel = async (sal) => {
    try {
      toast.info('Downloading Excel Payslip...');
      await downloadSalaryExcel(sal.id, sal.employee_name || employee?.name, sal.salary_month);
      toast.success('Excel Payslip downloaded');
    } catch {
      toast.error('Failed to download Excel payslip');
    }
  };

  const handleDownloadPdf = async (sal) => {
    try {
      toast.info('Downloading PDF Payslip...');
      await downloadSalaryPdf(sal.id, sal.employee_name || employee?.name, sal.salary_month);
      toast.success('PDF Payslip downloaded');
    } catch {
      toast.error('Failed to download PDF payslip');
    }
  };

  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [y, m] = monthStr.split('-');
      return `${y}年 ${parseInt(m)}月 給与支払明細書`;
    } catch {
      return monthStr;
    }
  };

  const num = (val) => Number(val || 0).toLocaleString();

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
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Action / Control Header (Hidden on Print) */}
      <div className="report-controls-bar no-print">
        <button className="btn-secondary back-btn" onClick={() => navigate('/employees')}>
          <ArrowLeft size={16} /> Back to Employees
        </button>

        <div className="mode-toggle">
          <button
            className={`toggle-tab ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            給与支払明細書 (Monthly Payslip)
          </button>
          <button
            className={`toggle-tab ${viewMode === 'year' ? 'active' : ''}`}
            onClick={() => setViewMode('year')}
          >
            年間集計表 (Annual Report)
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
                  <option key={y} value={y}>{y}年</option>
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
            <Printer size={16} /> Print Statement
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
                <h2>{adminCompany?.company_name || 'ILYAS SONS合同会社'}</h2>
                {adminCompany?.company_address && <p>{adminCompany.company_address}</p>}
                {adminCompany?.company_phone && <p>Tel: {adminCompany.company_phone}</p>}
                {adminCompany?.company_email && <p>Email: {adminCompany.company_email}</p>}
              </div>
              <div className="doc-title-badge">
                <h1>{viewMode === 'year' ? 'ANNUAL SALARY SUMMARY' : '給与支払明細書'}</h1>
                <span className="period-tag">
                  {viewMode === 'year' ? `${selectedYear}年度` : formatMonthName(selectedMonth)}
                </span>
              </div>
            </div>

            <hr className="divider" />

            {/* Employee Profile Summary */}
            <div className="employee-info-card">
              <div className="info-item">
                <span className="info-label"><User size={14} /> 氏名 (Employee Name)</span>
                <span className="info-value"><strong>{employee.name} 様</strong></span>
              </div>
              <div className="info-item">
                <span className="info-label"><Briefcase size={14} /> 役職・所属 (Role)</span>
                <span className="info-value"><span className="badge badge-role">{employee.role}</span></span>
              </div>
              <div className="info-item">
                <span className="info-label"><Calendar size={14} /> 状態 (Status)</span>
                <span className="info-value">
                  <span className={`badge ${employee.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                    {employee.status === 'active' ? 'Active (在籍)' : 'Inactive (退職)'}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label"><Mail size={14} /> Email</span>
                <span className="info-value">{employee.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><Phone size={14} /> 連絡先 (Phone)</span>
                <span className="info-value">{employee.phone || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"><DollarSign size={14} /> 基本給 (Basic Salary)</span>
                <span className="info-value"><strong>¥{num(employee.basic_salary)}</strong></span>
              </div>
            </div>

            {/* Monthly Payslip View (給与支払明細書 Standard Japanese Layout) */}
            {viewMode === 'month' ? (
              <div className="report-body">
                {salaries.length === 0 ? (
                  <div className="empty-state-card">
                    <DollarSign size={36} />
                    <p className="no-records-msg">No salary record found for {selectedMonth}.</p>
                    <button className="btn-secondary" onClick={() => navigate('/salaries')}>Create Salary Record</button>
                  </div>
                ) : (
                  salaries.map(sal => (
                    <div key={sal.id} className="kyuyo-sheet" style={{ marginTop: '1rem', border: '1px solid #e2e8f0' }}>
                      {/* Top Action Buttons (no-print) */}
                      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <button className="btn-secondary" onClick={() => handleDownloadExcel(sal)}>
                          <FileSpreadsheet size={15} style={{ color: '#16a34a' }} /> Download Excel (.xlsx)
                        </button>
                        <button className="btn-secondary" onClick={() => handleDownloadPdf(sal)}>
                          <FileText size={15} style={{ color: '#dc2626' }} /> Download PDF (.pdf)
                        </button>
                      </div>

                      {/* Meta Details */}
                      <div className="kyuyo-meta-grid">
                        <div className="kyuyo-meta-item">
                          <span className="meta-lbl">支給対象年月 (Target Period)</span>
                          <span className="meta-val">{sal.salary_month}</span>
                        </div>
                        <div className="kyuyo-meta-item">
                          <span className="meta-lbl">支給日 (Payment Date)</span>
                          <span className="meta-val">{sal.payment_date || '-'}</span>
                        </div>
                        <div className="kyuyo-meta-item">
                          <span className="meta-lbl">氏名 (Employee Name)</span>
                          <span className="meta-val">{sal.employee_name || employee.name} 様</span>
                        </div>
                        <div className="kyuyo-meta-item">
                          <span className="meta-lbl">支払状況 (Status)</span>
                          <span className="meta-val">
                            <span className={`badge ${sal.status === 'paid' ? 'badge-active' : 'badge-inactive'}`}>
                              {sal.status === 'paid' ? 'PAID (支給済)' : 'UNPAID (未支給)'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Dual Grid: Earnings vs Deductions */}
                      <div className="kyuyo-dual-grid">
                        {/* 支給 (Earnings) */}
                        <div className="kyuyo-col earnings">
                          <div className="kyuyo-col-header">
                            <span>支給項目 (Earnings)</span>
                            <span>金額 (JPY)</span>
                          </div>
                          <table className="kyuyo-table">
                            <tbody>
                              <tr>
                                <td>基本給 (Base Salary)</td>
                                <td className="amount">¥{num(sal.basic_salary)}</td>
                              </tr>
                              <tr>
                                <td>残業手当 (Overtime Pay)</td>
                                <td className="amount">¥{num(sal.overtime_allowance)}</td>
                              </tr>
                              <tr>
                                <td>その他手当 (Allowances)</td>
                                <td className="amount">¥{num(sal.allowances)}</td>
                              </tr>
                              <tr className="subtotal">
                                <td>課税支給額 (Taxable Payment Total)</td>
                                <td className="amount">¥{num(sal.taxable_payment)}</td>
                              </tr>
                              <tr>
                                <td>非課税通勤費 (Commuting Allowance)</td>
                                <td className="amount">¥{num(sal.commuting_allowance)}</td>
                              </tr>
                              <tr className="total-row">
                                <td>支給額合計 (Gross Payment Total)</td>
                                <td className="amount">¥{num(sal.gross_payment)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* 控除 (Deductions) */}
                        <div className="kyuyo-col deductions">
                          <div className="kyuyo-col-header">
                            <span>控除項目 (Deductions)</span>
                            <span>金額 (JPY)</span>
                          </div>
                          <table className="kyuyo-table">
                            <tbody>
                              <tr>
                                <td>健康保険料 (Health Insurance)</td>
                                <td className="amount">¥{num(sal.health_insurance)}</td>
                              </tr>
                              <tr>
                                <td>厚生年金 (Welfare Pension)</td>
                                <td className="amount">¥{num(sal.welfare_pension)}</td>
                              </tr>
                              <tr>
                                <td>雇用保険 (Employment Insurance)</td>
                                <td className="amount">¥{num(sal.employment_insurance)}</td>
                              </tr>
                              <tr className="subtotal">
                                <td>社会保険計 (Total Social Insurance)</td>
                                <td className="amount">¥{num(sal.total_social_insurance)}</td>
                              </tr>
                              <tr>
                                <td>所得税 (Withholding Income Tax)</td>
                                <td className="amount">¥{num(sal.income_tax)}</td>
                              </tr>
                              <tr>
                                <td>住民税 (Resident Tax)</td>
                                <td className="amount">¥{num(sal.resident_tax)}</td>
                              </tr>
                              {Number(sal.leave_deduction) > 0 && (
                                <tr>
                                  <td>欠勤控除 (Leave Deduction)</td>
                                  <td className="amount">¥{num(sal.leave_deduction)}</td>
                                </tr>
                              )}
                              {Number(sal.other_deductions) > 0 && (
                                <tr>
                                  <td>その他控除 (Other Deductions)</td>
                                  <td className="amount">¥{num(sal.other_deductions)}</td>
                                </tr>
                              )}
                              <tr className="total-row">
                                <td>控除額合計 (Total Deductions)</td>
                                <td className="amount">¥{num(sal.total_deductions)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Net Take-home Pay Banner */}
                      <div className="kyuyo-net-banner">
                        <div className="net-lbl">差引支給額 (Net Take-home Pay)</div>
                        <div className="net-val">¥{num(sal.net_amount)}</div>
                      </div>

                      {/* Attendance Tracking Grid */}
                      <div className="kyuyo-attendance-card">
                        <div className="kyuyo-attendance-header">勤怠情報 (Attendance & Working Hours)</div>
                        <div className="kyuyo-attendance-grid">
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">勤務日数 (Days)</div>
                            <div className="att-val">{sal.working_days || 0} 日</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">勤務時間数 (Hours)</div>
                            <div className="att-val">{sal.working_hours || 0} h</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">普通時間外 (OT)</div>
                            <div className="att-val">{sal.overtime_hours || 0} h</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">休日時間外 (Holiday OT)</div>
                            <div className="att-val">{sal.holiday_overtime_hours || 0} h</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">深夜時間外 (Midnight OT)</div>
                            <div className="att-val">{sal.midnight_overtime_hours || 0} h</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">有給日数 (Paid Leave)</div>
                            <div className="att-val">{sal.paid_leaves || 0} 日</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">公休日数 (Off Days)</div>
                            <div className="att-val">{sal.statutory_leaves || 0} 日</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">欠勤日数 (Absence)</div>
                            <div className="att-val">{sal.absence_days || 0} 日</div>
                          </div>
                          <div className="kyuyo-att-item">
                            <div className="att-lbl">遅刻・早退 (Late/Early)</div>
                            <div className="att-val">{sal.late_early_count || 0} 回 ({sal.late_early_hours || 0}h)</div>
                          </div>
                        </div>
                      </div>

                      {/* Remarks */}
                      {sal.remarks && (
                        <div className="kyuyo-remarks-box">
                          <div className="rmk-lbl">備考 (Remarks)</div>
                          <div className="rmk-val">{sal.remarks}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Yearly View (Annual Summary) */
              <div className="report-body">
                <h3 className="section-subtitle">年間給与集計表 — {selectedYear}年度 (Annual Breakdown)</h3>

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
                          <th>支給月</th>
                          <th>総支給額 (Gross)</th>
                          <th>社保計 (Social Ins)</th>
                          <th>所得税 (Tax)</th>
                          <th>住民税 (Resident)</th>
                          <th>控除計 (Deduct)</th>
                          <th>差引支給額 (Net Pay)</th>
                          <th>Status</th>
                          <th className="no-print">Export</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaries.map((sal, idx) => (
                          <tr key={sal.id}>
                            <td>{idx + 1}</td>
                            <td><strong>{sal.salary_month}</strong></td>
                            <td>¥{num(sal.gross_payment)}</td>
                            <td style={{ color: '#b91c1c' }}>-¥{num(sal.total_social_insurance)}</td>
                            <td style={{ color: '#b91c1c' }}>-¥{num(sal.income_tax)}</td>
                            <td>-¥{num(sal.resident_tax)}</td>
                            <td style={{ color: '#b91c1c', fontWeight: 600 }}>-¥{num(sal.total_deductions)}</td>
                            <td><strong className="grand-net">¥{num(sal.net_amount)}</strong></td>
                            <td>
                              <span className={`badge ${sal.status === 'paid' ? 'badge-active' : 'badge-inactive'}`}>
                                {sal.status === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="no-print">
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                                  onClick={() => handleDownloadExcel(sal)}
                                  title="Export Excel"
                                >
                                  Excel
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                                  onClick={() => handleDownloadPdf(sal)}
                                  title="Export PDF"
                                >
                                  PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="summary-row">
                          <td colSpan="2"><strong>年間合計 (Total {summary.total_records}件)</strong></td>
                          <td><strong>¥{num(summary.total_gross_payment)}</strong></td>
                          <td style={{ color: '#b91c1c' }}><strong>-¥{num(summary.total_social_insurance)}</strong></td>
                          <td style={{ color: '#b91c1c' }}><strong>-¥{num(summary.total_income_tax)}</strong></td>
                          <td><strong>-¥{num(summary.total_resident_tax)}</strong></td>
                          <td style={{ color: '#b91c1c' }}><strong>-¥{num(summary.total_deductions)}</strong></td>
                          <td><strong className="grand-net" style={{ fontSize: '1.1rem' }}>¥{num(summary.total_net_amount)}</strong></td>
                          <td>{summary.paid_count} Paid / {summary.unpaid_count} Unpaid</td>
                          <td className="no-print"></td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="yearly-cards-summary">
                      <div className="sum-box">
                        <span className="sum-title">年間支給額合計 (Gross)</span>
                        <span className="sum-val text-success">¥{num(summary.total_gross_payment)}</span>
                      </div>
                      <div className="sum-box">
                        <span className="sum-title">年間社会保険料合計 (Social Ins)</span>
                        <span className="sum-val text-danger">¥{num(summary.total_social_insurance)}</span>
                      </div>
                      <div className="sum-box">
                        <span className="sum-title">年間源泉所得税合計 (Income Tax)</span>
                        <span className="sum-val text-danger">¥{num(summary.total_income_tax)}</span>
                      </div>
                      <div className="sum-box highlight">
                        <span className="sum-title">年間差引支給総額 (Net Payout)</span>
                        <span className="sum-val">¥{num(summary.total_net_amount)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Signature / Authorization Footer */}
            <div className="report-footer-signatures">
              <div className="sig-line">
                <div className="sig-space"></div>
                <div className="line"></div>
                <p className="sig-title">Employee Signature (受領印)</p>
                <p className="sig-date">Date: ____________________</p>
              </div>
              <div className="sig-line">
                <div className="sig-space"></div>
                <div className="line"></div>
                <p className="sig-title">Authorized Admin Signature & Stamp (会社捺印)</p>
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
