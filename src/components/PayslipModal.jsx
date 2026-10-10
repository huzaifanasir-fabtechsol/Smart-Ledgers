import { useRef } from 'react';
import { Download, FileSpreadsheet, FileText, Printer, X, Building2, User, Calendar, DollarSign } from 'lucide-react';
import { downloadSalaryExcel, downloadSalaryPdf } from '../api';
import { toast } from 'react-toastify';
import './PayslipModal.css';

const PayslipModal = ({ salary, companyInfo, onClose }) => {
  const componentRef = useRef(null);

  if (!salary) return null;

  const handleDownloadExcel = async () => {
    try {
      toast.info('Downloading Excel Payslip...');
      await downloadSalaryExcel(salary.id, salary.employee_name, salary.salary_month);
      toast.success('Excel Payslip downloaded');
    } catch {
      toast.error('Failed to download Excel payslip');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.info('Downloading PDF Payslip...');
      await downloadSalaryPdf(salary.id, salary.employee_name, salary.salary_month);
      toast.success('PDF Payslip downloaded');
    } catch {
      toast.error('Failed to download PDF payslip');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '-';
    try {
      const [y, m] = monthStr.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr;
  };

  const num = (val) => Number(val || 0).toLocaleString();

  return (
    <div className="payslip-modal-overlay" onClick={onClose}>
      <div className="payslip-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="payslip-modal-header no-print">
          <h3>
            <DollarSign size={20} className="text-primary" />
            Salary Payment Statement
          </h3>
          <div className="payslip-header-actions">
            <button className="btn-secondary" onClick={handleDownloadExcel} title="Export to Excel (.xlsx)">
              <FileSpreadsheet size={16} style={{ color: '#16a34a' }} /> Excel
            </button>
            <button className="btn-secondary" onClick={handleDownloadPdf} title="Export to PDF (.pdf)">
              <FileText size={16} style={{ color: '#dc2626' }} /> PDF
            </button>
            <button className="btn-secondary" onClick={handlePrint} title="Print Statement">
              <Printer size={16} /> Print
            </button>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="payslip-modal-body">
          <div className="kyuyo-sheet" ref={componentRef}>
            {/* Title Section */}
            <div className="kyuyo-title-section">
              <div>
                <h1 className="doc-main-title">Salary Payment Statement</h1>
                <p className="doc-sub-title">Monthly Payroll Breakdown</p>
              </div>
              <div className="kyuyo-company-badge">
                <div className="comp-name">{companyInfo?.company_name || 'ILYAS SONS LLC'}</div>
                {companyInfo?.company_address && <div>{companyInfo.company_address}</div>}
                {companyInfo?.company_phone && <div>Tel: {companyInfo.company_phone}</div>}
              </div>
            </div>

            {/* Meta Information Grid */}
            <div className="kyuyo-meta-grid">
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">Target Period</span>
                <span className="meta-val">{formatMonth(salary.salary_month)}</span>
              </div>
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">Payment Date</span>
                <span className="meta-val">{salary.payment_date ? formatDate(salary.payment_date) : '-'}</span>
              </div>
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">Employee Name</span>
                <span className="meta-val">{salary.employee_name}</span>
              </div>
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">Role / Department</span>
                <span className="meta-val">{salary.employee_role || 'Staff'}</span>
              </div>
            </div>

            {/* Dual Grid: Earnings vs Deductions */}
            <div className="kyuyo-dual-grid">
              {/* Earnings */}
              <div className="kyuyo-col earnings">
                <div className="kyuyo-col-header">
                  <span>Earnings</span>
                  <span>Amount (JPY)</span>
                </div>
                <table className="kyuyo-table">
                  <tbody>
                    <tr>
                      <td>Basic Salary</td>
                      <td className="amount">¥{num(salary.basic_salary)}</td>
                    </tr>
                    <tr>
                      <td>Overtime Pay</td>
                      <td className="amount">¥{num(salary.overtime_allowance)}</td>
                    </tr>
                    <tr>
                      <td>Allowances</td>
                      <td className="amount">¥{num(salary.allowances)}</td>
                    </tr>
                    <tr className="subtotal">
                      <td>Taxable Payment Total</td>
                      <td className="amount">¥{num(salary.taxable_payment)}</td>
                    </tr>
                    <tr>
                      <td>Commuting Allowance</td>
                      <td className="amount">¥{num(salary.commuting_allowance)}</td>
                    </tr>
                    <tr className="total-row">
                      <td>Gross Payment Total</td>
                      <td className="amount">¥{num(salary.gross_payment)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div className="kyuyo-col deductions">
                <div className="kyuyo-col-header">
                  <span>Deductions</span>
                  <span>Amount (JPY)</span>
                </div>
                <table className="kyuyo-table">
                  <tbody>
                    <tr>
                      <td>Health Insurance</td>
                      <td className="amount">¥{num(salary.health_insurance)}</td>
                    </tr>
                    <tr>
                      <td>Welfare Pension</td>
                      <td className="amount">¥{num(salary.welfare_pension)}</td>
                    </tr>
                    <tr>
                      <td>Employment Insurance</td>
                      <td className="amount">¥{num(salary.employment_insurance)}</td>
                    </tr>
                    <tr className="subtotal">
                      <td>Total Social Insurance</td>
                      <td className="amount">¥{num(salary.total_social_insurance)}</td>
                    </tr>
                    <tr>
                      <td>Withholding Income Tax</td>
                      <td className="amount">¥{num(salary.income_tax)}</td>
                    </tr>
                    <tr>
                      <td>Resident Tax</td>
                      <td className="amount">¥{num(salary.resident_tax)}</td>
                    </tr>
                    {Number(salary.leave_deduction) > 0 && (
                      <tr>
                        <td>Leave Deduction</td>
                        <td className="amount">¥{num(salary.leave_deduction)}</td>
                      </tr>
                    )}
                    {Number(salary.other_deductions) > 0 && (
                      <tr>
                        <td>Other Deductions</td>
                        <td className="amount">¥{num(salary.other_deductions)}</td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td>Total Deductions</td>
                      <td className="amount">¥{num(salary.total_deductions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div className="kyuyo-net-banner">
              <div className="net-lbl">
                <span>Net Payout</span>
                <span className={`badge ${salary.status === 'paid' ? 'badge-active' : 'badge-inactive'}`} style={{ marginLeft: 12 }}>
                  {salary.status === 'paid' ? 'PAID' : 'UNPAID'}
                </span>
              </div>
              <div className="net-val">¥{num(salary.net_amount)}</div>
            </div>

            {/* Attendance & Time Tracking Grid */}
            <div className="kyuyo-attendance-card">
              <div className="kyuyo-attendance-header">Attendance & Working Hours</div>
              <div className="kyuyo-attendance-grid">
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Working Days</div>
                  <div className="att-val">{salary.working_days || 0} days</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Working Hours</div>
                  <div className="att-val">{salary.working_hours || 0} hrs</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Regular Overtime</div>
                  <div className="att-val">{salary.overtime_hours || 0} hrs</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Holiday Overtime</div>
                  <div className="att-val">{salary.holiday_overtime_hours || 0} hrs</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Midnight Overtime</div>
                  <div className="att-val">{salary.midnight_overtime_hours || 0} hrs</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Paid Leave</div>
                  <div className="att-val">{salary.paid_leaves || 0} days</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Scheduled Off Days</div>
                  <div className="att-val">{salary.statutory_leaves || 0} days</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Absence</div>
                  <div className="att-val">{salary.absence_days || 0} days</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">Late / Early</div>
                  <div className="att-val">{salary.late_early_count || 0} times ({salary.late_early_hours || 0}h)</div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {salary.remarks && (
              <div className="kyuyo-remarks-box">
                <div className="rmk-lbl">Remarks</div>
                <div className="rmk-val">{salary.remarks}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipModal;

