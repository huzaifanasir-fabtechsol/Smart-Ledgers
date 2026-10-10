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
      return `${y}年 ${parseInt(m)}月`;
    } catch {
      return monthStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${y}年 ${parseInt(m)}月 ${parseInt(d)}日`;
    } catch {
      return dateStr;
    }
  };

  const num = (val) => Number(val || 0).toLocaleString();

  return (
    <div className="payslip-modal-overlay" onClick={onClose}>
      <div className="payslip-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="payslip-modal-header no-print">
          <h3>
            <DollarSign size={20} className="text-primary" />
            給与支払明細書 (Salary Payment Statement)
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
                <h1 className="doc-main-title">給与支払明細書</h1>
                <p className="doc-sub-title">SALARY PAYMENT STATEMENT</p>
              </div>
              <div className="kyuyo-company-badge">
                <div className="comp-name">{companyInfo?.company_name || 'ILYAS SONS合同会社'}</div>
                {companyInfo?.company_address && <div>{companyInfo.company_address}</div>}
                {companyInfo?.company_phone && <div>TEL: {companyInfo.company_phone}</div>}
              </div>
            </div>

            {/* Meta Information Grid */}
            <div className="kyuyo-meta-grid">
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">支給対象年月 (Target Period)</span>
                <span className="meta-val">{formatMonth(salary.salary_month)}</span>
              </div>
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">支給日 (Payment Date)</span>
                <span className="meta-val">{salary.payment_date ? formatDate(salary.payment_date) : '-'}</span>
              </div>
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">氏名 (Employee Name)</span>
                <span className="meta-val">{salary.employee_name} 様</span>
              </div>
              <div className="kyuyo-meta-item">
                <span className="meta-lbl">役職・所属 (Role / Dept)</span>
                <span className="meta-val">{salary.employee_role || '一般'}</span>
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
                      <td className="amount">¥{num(salary.basic_salary)}</td>
                    </tr>
                    <tr>
                      <td>残業手当 (Overtime Pay)</td>
                      <td className="amount">¥{num(salary.overtime_allowance)}</td>
                    </tr>
                    <tr>
                      <td>その他手当 (Allowances)</td>
                      <td className="amount">¥{num(salary.allowances)}</td>
                    </tr>
                    <tr className="subtotal">
                      <td>課税支給額 (Taxable Payment Total)</td>
                      <td className="amount">¥{num(salary.taxable_payment)}</td>
                    </tr>
                    <tr>
                      <td>非課税通勤費 (Commuting Allowance)</td>
                      <td className="amount">¥{num(salary.commuting_allowance)}</td>
                    </tr>
                    <tr className="total-row">
                      <td>支給額合計 (Gross Payment Total)</td>
                      <td className="amount">¥{num(salary.gross_payment)}</td>
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
                      <td className="amount">¥{num(salary.health_insurance)}</td>
                    </tr>
                    <tr>
                      <td>厚生年金 (Welfare Pension)</td>
                      <td className="amount">¥{num(salary.welfare_pension)}</td>
                    </tr>
                    <tr>
                      <td>雇用保険 (Employment Insurance)</td>
                      <td className="amount">¥{num(salary.employment_insurance)}</td>
                    </tr>
                    <tr className="subtotal">
                      <td>社会保険計 (Total Social Insurance)</td>
                      <td className="amount">¥{num(salary.total_social_insurance)}</td>
                    </tr>
                    <tr>
                      <td>所得税 (Withholding Income Tax)</td>
                      <td className="amount">¥{num(salary.income_tax)}</td>
                    </tr>
                    <tr>
                      <td>住民税 (Resident Tax)</td>
                      <td className="amount">¥{num(salary.resident_tax)}</td>
                    </tr>
                    {Number(salary.leave_deduction) > 0 && (
                      <tr>
                        <td>欠勤控除 (Leave Deduction)</td>
                        <td className="amount">¥{num(salary.leave_deduction)}</td>
                      </tr>
                    )}
                    {Number(salary.other_deductions) > 0 && (
                      <tr>
                        <td>その他控除 (Other Deductions)</td>
                        <td className="amount">¥{num(salary.other_deductions)}</td>
                      </tr>
                    )}
                    <tr className="total-row">
                      <td>控除額合計 (Total Deductions)</td>
                      <td className="amount">¥{num(salary.total_deductions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Payout Banner (差引支給額) */}
            <div className="kyuyo-net-banner">
              <div className="net-lbl">
                <span>差引支給額 (Net Payout)</span>
                <span className={`badge ${salary.status === 'paid' ? 'badge-active' : 'badge-inactive'}`} style={{ marginLeft: 12 }}>
                  {salary.status === 'paid' ? '支給済 (PAID)' : '未支給 (UNPAID)'}
                </span>
              </div>
              <div className="net-val">¥{num(salary.net_amount)}</div>
            </div>

            {/* Attendance & Time Tracking Grid (勤怠) */}
            <div className="kyuyo-attendance-card">
              <div className="kyuyo-attendance-header">勤怠情報 (Attendance & Working Hours)</div>
              <div className="kyuyo-attendance-grid">
                <div className="kyuyo-att-item">
                  <div className="att-lbl">勤務日数 (Days)</div>
                  <div className="att-val">{salary.working_days || 0} 日</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">勤務時間数 (Hours)</div>
                  <div className="att-val">{salary.working_hours || 0} h</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">普通時間外 (OT)</div>
                  <div className="att-val">{salary.overtime_hours || 0} h</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">休日時間外 (Holiday OT)</div>
                  <div className="att-val">{salary.holiday_overtime_hours || 0} h</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">深夜時間外 (Midnight OT)</div>
                  <div className="att-val">{salary.midnight_overtime_hours || 0} h</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">有給日数 (Paid Leave)</div>
                  <div className="att-val">{salary.paid_leaves || 0} 日</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">公休日数 (Off Days)</div>
                  <div className="att-val">{salary.statutory_leaves || 0} 日</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">欠勤日数 (Absence)</div>
                  <div className="att-val">{salary.absence_days || 0} 日</div>
                </div>
                <div className="kyuyo-att-item">
                  <div className="att-lbl">遅刻・早退 (Late/Early)</div>
                  <div className="att-val">{salary.late_early_count || 0} 回 ({salary.late_early_hours || 0}h)</div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {salary.remarks && (
              <div className="kyuyo-remarks-box">
                <div className="rmk-lbl">備考 (Remarks)</div>
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
