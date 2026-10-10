import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FileSpreadsheet,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Calculator,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { apiRequest, getErrorMessage, downloadSalaryExcel, downloadSalaryPdf } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import Pagination from './Pagination';
import PayslipModal from './PayslipModal';
import '../shared.css';
import './OrderManager.css';
import './PayslipModal.css';

const SalaryManager = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dropdown options & company details
  const [allEmployees, setAllEmployees] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  // Modals & Menu
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('earnings'); // 'earnings', 'deductions', 'attendance'
  const [editingSalary, setEditingSalary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const defaultMonthStr = new Date().toISOString().substring(0, 7);

  const emptyForm = {
    employee: '',
    salary_month: defaultMonthStr,
    payment_date: '',
    status: 'unpaid',

    // Earnings
    basic_salary: '0',
    commuting_allowance: '0',
    overtime_allowance: '0',
    allowances: '0',
    taxable_payment: '0',
    gross_payment: '0',

    // Deductions
    health_insurance: '0',
    welfare_pension: '0',
    employment_insurance: '0',
    total_social_insurance: '0',
    taxable_income_base: '0',
    income_tax: '0',
    resident_tax: '0',
    leave_deduction: '0',
    other_deductions: '0',
    total_deductions: '0',

    // Net
    net_amount: '0',

    // Attendance
    working_days: '20',
    working_hours: '160',
    overtime_hours: '0',
    holiday_overtime_hours: '0',
    midnight_overtime_hours: '0',
    paid_leaves: '0',
    statutory_leaves: '8',
    absence_days: '0',
    late_early_count: '0',
    late_early_hours: '0',
    remarks: '',

    // Custom overrides flags / manual edits
    dependents_count: 0,
    employment_insurance_exempt: false,
    manual_tax_override: false,
  };

  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    fetchSalaries();
  }, [currentPage, search, filterEmployee, filterMonth, filterStatus, pageSize]);

  useEffect(() => {
    fetchAllEmployees();
    fetchCompanyProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    const handleCloseMenu = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
    };
  }, []);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, pageSize, page_size: pageSize });
      if (search) params.append('search', search);
      if (filterEmployee) params.append('employee', filterEmployee);
      if (filterMonth) params.append('salary_month', filterMonth);
      if (filterStatus) params.append('status', filterStatus);
      const response = await apiRequest(`/hr/salaries/?${params}`);
      const data = await response.json();
      setSalaries(data.results || []);
      setTotalCount(data.count || 0);
    } catch {
      toast.error('Failed to load salary records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await apiRequest('/hr/employees/all/');
      const data = await response.json();
      setAllEmployees(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await apiRequest('/account/profile/');
      if (response.ok) {
        const data = await response.json();
        setCompanyInfo(data);
      }
    } catch {
      // ignore
    }
  };

  // Perform Live Calculation via API
  const runLiveCalculation = async (currentValues) => {
    const val = currentValues || formData;
    if (!val.employee) return;

    setCalculating(true);
    try {
      const payload = {
        employee_id: Number(val.employee),
        basic_salary: Number(val.basic_salary || 0),
        commuting_allowance: Number(val.commuting_allowance || 0),
        overtime_allowance: Number(val.overtime_allowance || 0),
        allowances: Number(val.allowances || 0),
        leave_deduction: Number(val.leave_deduction || 0),
        resident_tax: Number(val.resident_tax || 0),
        other_deductions: Number(val.other_deductions || 0),
        dependents_count: Number(val.dependents_count || 0),
        employment_insurance_exempt: Boolean(val.employment_insurance_exempt),
      };

      // If user has custom overrides
      if (val.manual_tax_override) {
        payload.custom_health_insurance = Number(val.health_insurance);
        payload.custom_welfare_pension = Number(val.welfare_pension);
        payload.custom_employment_insurance = Number(val.employment_insurance);
        payload.custom_income_tax = Number(val.income_tax);
      }

      const response = await apiRequest('/hr/salaries/calculate/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          taxable_payment: String(result.taxable_payment),
          gross_payment: String(result.gross_payment),
          health_insurance: String(result.health_insurance),
          welfare_pension: String(result.welfare_pension),
          employment_insurance: String(result.employment_insurance),
          total_social_insurance: String(result.total_social_insurance),
          taxable_income_base: String(result.taxable_income_base),
          income_tax: String(result.income_tax),
          resident_tax: String(result.resident_tax),
          total_deductions: String(result.total_deductions),
          net_amount: String(result.net_amount),
        }));
      }
    } catch {
      // ignore
    } finally {
      setCalculating(false);
    }
  };

  const handleEmployeeChange = (empId) => {
    const emp = allEmployees.find(e => String(e.id) === String(empId));
    if (emp) {
      const updated = {
        ...formData,
        employee: String(empId),
        basic_salary: String(emp.basic_salary || '0'),
        commuting_allowance: String(emp.commuting_allowance || '0'),
        dependents_count: emp.dependents_count || 0,
        employment_insurance_exempt: Boolean(emp.employment_insurance_exempt),
      };
      setFormData(updated);
      runLiveCalculation(updated);
    } else {
      setFormData(prev => ({ ...prev, employee: '' }));
    }
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Auto recalculate on relevant field changes
    const calcTriggerFields = [
      'basic_salary', 'commuting_allowance', 'overtime_allowance', 'allowances',
      'leave_deduction', 'resident_tax', 'other_deductions'
    ];
    if (calcTriggerFields.includes(field)) {
      runLiveCalculation(updated);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employee) errors.employee = 'Employee is required';
    if (!formData.salary_month) errors.salary_month = 'Salary month is required';
    if (Number(formData.basic_salary) < 0) errors.basic_salary = 'Basic salary cannot be negative';
    if (Number(formData.working_days) < 0) errors.working_days = 'Working days cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingSalary(null);
    setActiveTab('earnings');
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (sal) => {
    setEditingSalary(sal);
    setActiveTab('earnings');
    setFormData({
      employee: String(sal.employee),
      salary_month: sal.salary_month || '',
      payment_date: sal.payment_date || '',
      status: sal.status || 'unpaid',

      basic_salary: String(sal.basic_salary || '0'),
      commuting_allowance: String(sal.commuting_allowance || '0'),
      overtime_allowance: String(sal.overtime_allowance || '0'),
      allowances: String(sal.allowances || '0'),
      taxable_payment: String(sal.taxable_payment || '0'),
      gross_payment: String(sal.gross_payment || '0'),

      health_insurance: String(sal.health_insurance || '0'),
      welfare_pension: String(sal.welfare_pension || '0'),
      employment_insurance: String(sal.employment_insurance || '0'),
      total_social_insurance: String(sal.total_social_insurance || '0'),
      taxable_income_base: String(sal.taxable_income_base || '0'),
      income_tax: String(sal.income_tax || '0'),
      resident_tax: String(sal.resident_tax || '0'),
      leave_deduction: String(sal.leave_deduction || '0'),
      other_deductions: String(sal.other_deductions || '0'),
      total_deductions: String(sal.total_deductions || '0'),

      net_amount: String(sal.net_amount || '0'),

      working_days: String(sal.working_days || '0'),
      working_hours: String(sal.working_hours || '0'),
      overtime_hours: String(sal.overtime_hours || '0'),
      holiday_overtime_hours: String(sal.holiday_overtime_hours || '0'),
      midnight_overtime_hours: String(sal.midnight_overtime_hours || '0'),
      paid_leaves: String(sal.paid_leaves || '0'),
      statutory_leaves: String(sal.statutory_leaves || '0'),
      absence_days: String(sal.absence_days || '0'),
      late_early_count: String(sal.late_early_count || '0'),
      late_early_hours: String(sal.late_early_hours || '0'),
      remarks: sal.remarks || '',

      dependents_count: 0,
      employment_insurance_exempt: false,
      manual_tax_override: true,
    });
    setFormErrors({});
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        employee: Number(formData.employee),
        salary_month: formData.salary_month,
        payment_date: formData.payment_date || null,
        status: formData.status,

        basic_salary: Number(formData.basic_salary),
        commuting_allowance: Number(formData.commuting_allowance),
        overtime_allowance: Number(formData.overtime_allowance),
        allowances: Number(formData.allowances),
        taxable_payment: Number(formData.taxable_payment),
        gross_payment: Number(formData.gross_payment),

        health_insurance: Number(formData.health_insurance),
        welfare_pension: Number(formData.welfare_pension),
        employment_insurance: Number(formData.employment_insurance),
        total_social_insurance: Number(formData.total_social_insurance),
        taxable_income_base: Number(formData.taxable_income_base),
        income_tax: Number(formData.income_tax),
        resident_tax: Number(formData.resident_tax),
        leave_deduction: Number(formData.leave_deduction),
        other_deductions: Number(formData.other_deductions),
        total_deductions: Number(formData.total_deductions),

        net_amount: Number(formData.net_amount),

        working_days: Number(formData.working_days || 0),
        working_hours: Number(formData.working_hours || 0),
        overtime_hours: Number(formData.overtime_hours || 0),
        holiday_overtime_hours: Number(formData.holiday_overtime_hours || 0),
        midnight_overtime_hours: Number(formData.midnight_overtime_hours || 0),
        paid_leaves: Number(formData.paid_leaves || 0),
        statutory_leaves: Number(formData.statutory_leaves || 0),
        absence_days: Number(formData.absence_days || 0),
        late_early_count: Number(formData.late_early_count || 0),
        late_early_hours: Number(formData.late_early_hours || 0),
        remarks: formData.remarks || '',
      };

      const response = editingSalary
        ? await apiRequest(`/hr/salaries/${editingSalary.id}/`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiRequest('/hr/salaries/', { method: 'POST', body: JSON.stringify(payload) });

      if (!response.ok) {
        const msg = await getErrorMessage(response);
        throw new Error(msg);
      }
      toast.success(editingSalary ? 'Salary record updated' : 'Salary record created');
      setShowModal(false);
      fetchSalaries();
    } catch (err) {
      toast.error(err.message || 'Failed to save salary record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiRequest(`/hr/salaries/${showDeleteConfirm.id}/`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const msg = await getErrorMessage(response);
        throw new Error(msg);
      }
      toast.success('Salary record deleted');
      setShowDeleteConfirm(null);
      fetchSalaries();
    } catch (err) {
      toast.error(err.message || 'Failed to delete salary record');
    }
  };

  const handleDownloadExcel = async (sal) => {
    try {
      toast.info(`Downloading Excel Payslip for ${sal.employee_name}...`);
      await downloadSalaryExcel(sal.id, sal.employee_name, sal.salary_month);
      toast.success('Excel Payslip downloaded');
    } catch {
      toast.error('Failed to download Excel file');
    }
  };

  const handleDownloadPdf = async (sal) => {
    try {
      toast.info(`Downloading PDF Payslip for ${sal.employee_name}...`);
      await downloadSalaryPdf(sal.id, sal.employee_name, sal.salary_month);
      toast.success('PDF Payslip downloaded');
    } catch {
      toast.error('Failed to download PDF file');
    }
  };

  const openMenu = (e, id) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setOpenMenuId(id);
  };

  const num = (v) => Number(v || 0).toLocaleString();

  return (
    <div className="salary-manager">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="page-header">
        <div>
          <h2>給与管理 (Salary Management)</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', marginTop: 2 }}>
            Japanese Salary Slip (給与支払明細書) with Kyokai Kenpo, Pension & NTA Withholding Tax
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Add Salary Record
        </button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Search employee or role..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <select
            className="filter-select"
            value={filterEmployee}
            onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Employees</option>
            {allEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
          </select>
          <input
            type="month"
            className="filter-input"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
            title="Filter by salary month"
          />
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Status</option>
            <option value="paid">Paid (支給済)</option>
            <option value="unpaid">Unpaid (未支給)</option>
          </select>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loader-container">
              <div className="spinner"></div>
              <p>Loading salary records...</p>
            </div>
          ) : salaries.length === 0 ? (
            <div className="table-loader-container">
              <p style={{ color: 'var(--ink-2)' }}>No salary records found.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee (氏名)</th>
                  <th>Salary Month (支給月)</th>
                  <th>Payment Date (支給日)</th>
                  <th>Gross Pay (支給合計)</th>
                  <th>Social Ins (社保計)</th>
                  <th>Tax (所得税)</th>
                  <th>Total Deduct (控除計)</th>
                  <th>Net Pay (差引支給額)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((sal, idx) => (
                  <tr key={sal.id}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td>
                      <strong>{sal.employee_name || '-'}</strong>
                      {sal.employee_role && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>{sal.employee_role}</div>
                      )}
                    </td>
                    <td><strong>{sal.salary_month}</strong></td>
                    <td>{sal.payment_date || '-'}</td>
                    <td>¥{num(sal.gross_payment)}</td>
                    <td style={{ color: '#b91c1c' }}>-¥{num(sal.total_social_insurance)}</td>
                    <td style={{ color: '#b91c1c' }}>-¥{num(sal.income_tax)}</td>
                    <td style={{ color: '#b91c1c', fontWeight: 600 }}>-¥{num(sal.total_deductions)}</td>
                    <td>
                      <strong style={{ color: '#047857', fontSize: '1.05rem' }}>
                        ¥{num(sal.net_amount)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${sal.status === 'paid' ? 'badge-active' : 'badge-inactive'}`}>
                        {sal.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn-menu ${openMenuId === sal.id ? 'active' : ''}`}
                        onClick={(e) => openMenu(e, sal.id)}
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

      {/* Action Context Menu */}
      {openMenuId && (
        <div ref={menuRef} className="context-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          {(() => {
            const sal = salaries.find(s => s.id === openMenuId);
            return sal ? (
              <>
                <button onClick={() => { setViewingPayslip(sal); setOpenMenuId(null); }}>
                  <Eye size={15} /> 👁️ View Slip (明細書)
                </button>
                <button onClick={() => { handleDownloadExcel(sal); setOpenMenuId(null); }}>
                  <FileSpreadsheet size={15} style={{ color: '#16a34a' }} /> 📗 Export Excel (.xlsx)
                </button>
                <button onClick={() => { handleDownloadPdf(sal); setOpenMenuId(null); }}>
                  <FileText size={15} style={{ color: '#dc2626' }} /> 📕 Export PDF (.pdf)
                </button>
                <button onClick={() => openEditModal(sal)}>
                  <Edit2 size={15} /> ✏️ Edit
                </button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(sal); setOpenMenuId(null); }}>
                  <Trash2 size={15} /> 🗑️ Delete
                </button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 840 }}>
            <div className="modal-header">
              <div>
                <h3>{editingSalary ? 'Edit Japanese Salary Record' : 'Create Salary Record (給与計算・明細作成)'}</h3>
                <span className="live-calc-badge" style={{ marginTop: 4 }}>
                  <Sparkles size={13} /> {calculating ? 'Calculating Taxes...' : 'Live Japanese Payroll Engine Active'}
                </span>
              </div>
              <button className="modal-close" onClick={() => !submitting && setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Top Overview Grid */}
              <div className="form-grid-3" style={{ background: 'var(--surface-raised, #f8fafc)', padding: '1rem', borderRadius: 8, marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>Employee (氏名) *</label>
                  <select
                    className={`form-input ${formErrors.employee ? 'input-error' : ''}`}
                    value={formData.employee}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                  >
                    <option value="">Select Employee</option>
                    {allEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
                    ))}
                  </select>
                  {formErrors.employee && <span className="field-error">{formErrors.employee}</span>}
                </div>

                <div className="form-group">
                  <label>Salary Month (支給対象月) *</label>
                  <input
                    type="month"
                    className={`form-input ${formErrors.salary_month ? 'input-error' : ''}`}
                    value={formData.salary_month}
                    onChange={(e) => handleFieldChange('salary_month', e.target.value)}
                  />
                  {formErrors.salary_month && <span className="field-error">{formErrors.salary_month}</span>}
                </div>

                <div className="form-group">
                  <label>Payment Date (支給日)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.payment_date}
                    onChange={(e) => handleFieldChange('payment_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Navigation Tabs for Form Sections */}
              <div className="salary-form-tabs">
                <button
                  type="button"
                  className={`salary-form-tab ${activeTab === 'earnings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('earnings')}
                >
                  1. 支給項目 (Earnings)
                </button>
                <button
                  type="button"
                  className={`salary-form-tab ${activeTab === 'deductions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('deductions')}
                >
                  2. 控除・社保・税金 (Deductions & Taxes)
                </button>
                <button
                  type="button"
                  className={`salary-form-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  3. 勤怠情報 (Attendance)
                </button>
              </div>

              {/* Tab 1: 支給項目 (Earnings) */}
              {activeTab === 'earnings' && (
                <div className="form-tab-pane">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>基本給 (Basic Salary ¥) *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.basic_salary}
                        onChange={(e) => handleFieldChange('basic_salary', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>非課税通勤費 (Non-taxable Commuting ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.commuting_allowance}
                        onChange={(e) => handleFieldChange('commuting_allowance', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>残業手当 (Overtime Pay ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.overtime_allowance}
                        onChange={(e) => handleFieldChange('overtime_allowance', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>その他手当 (Other Allowances ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.allowances}
                        onChange={(e) => handleFieldChange('allowances', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>課税支給額 (Taxable Payment Total ¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.taxable_payment}
                        readOnly
                        style={{ background: 'var(--surface-sunken, #f1f5f9)', fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group">
                      <label>支給額合計 (Gross Payment Total ¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.gross_payment}
                        readOnly
                        style={{ background: '#ecfdf5', color: '#047857', fontWeight: 800 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 控除・社保・税金 (Deductions & Taxes) */}
              {activeTab === 'deductions' && (
                <div className="form-tab-pane">
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>健康保険料 (Health Insurance ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.health_insurance}
                        onChange={(e) => handleFieldChange('health_insurance', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>厚生年金 (Welfare Pension ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.welfare_pension}
                        onChange={(e) => handleFieldChange('welfare_pension', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>雇用保険 (Employment Insurance ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.employment_insurance}
                        onChange={(e) => handleFieldChange('employment_insurance', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>社会保険計 (Total Social Ins ¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.total_social_insurance}
                        readOnly
                        style={{ background: 'var(--surface-sunken, #f1f5f9)', fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group">
                      <label>課税対象額 (Taxable Base ¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.taxable_income_base}
                        readOnly
                        style={{ background: 'var(--surface-sunken, #f1f5f9)' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>所得税 (Withholding Tax ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.income_tax}
                        onChange={(e) => handleFieldChange('income_tax', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>住民税 (Resident Tax ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.resident_tax}
                        onChange={(e) => handleFieldChange('resident_tax', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>欠勤控除 (Leave Deduction ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.leave_deduction}
                        onChange={(e) => handleFieldChange('leave_deduction', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>その他控除 (Other Deductions ¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.other_deductions}
                        onChange={(e) => handleFieldChange('other_deductions', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>控除額合計 (Total Deductions ¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.total_deductions}
                        readOnly
                        style={{ background: '#fef2f2', color: '#b91c1c', fontWeight: 800 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: 勤怠情報 (Attendance) */}
              {activeTab === 'attendance' && (
                <div className="form-tab-pane">
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>勤務日数 (Working Days)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="form-input"
                        value={formData.working_days}
                        onChange={(e) => handleFieldChange('working_days', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>勤務時間数 (Working Hours)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.working_hours}
                        onChange={(e) => handleFieldChange('working_hours', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>普通時間外 (Regular Overtime h)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.overtime_hours}
                        onChange={(e) => handleFieldChange('overtime_hours', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>休日時間外 (Holiday Overtime h)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.holiday_overtime_hours}
                        onChange={(e) => handleFieldChange('holiday_overtime_hours', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>深夜時間外 (Midnight Overtime h)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.midnight_overtime_hours}
                        onChange={(e) => handleFieldChange('midnight_overtime_hours', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>有給日数 (Paid Leave Days)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="form-input"
                        value={formData.paid_leaves}
                        onChange={(e) => handleFieldChange('paid_leaves', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>公休日数 (Scheduled Days Off)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.statutory_leaves}
                        onChange={(e) => handleFieldChange('statutory_leaves', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>欠勤日数 (Absence Days)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="form-input"
                        value={formData.absence_days}
                        onChange={(e) => handleFieldChange('absence_days', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>遅刻・早退 (Count / Hours)</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Times"
                          className="form-input"
                          value={formData.late_early_count}
                          onChange={(e) => handleFieldChange('late_early_count', e.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="Hours"
                          className="form-input"
                          value={formData.late_early_hours}
                          onChange={(e) => handleFieldChange('late_early_hours', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>備考 (Remarks / Note)</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={formData.remarks}
                        onChange={(e) => handleFieldChange('remarks', e.target.value)}
                        placeholder="e.g. February 2026 Salary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Take-home Pay Highlight Box */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.25rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>差引支給額 (Net Take-home Pay)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                    ¥{num(formData.net_amount)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>Payment Status:</label>
                  <select
                    className="form-input"
                    style={{ width: 120, background: '#334155', color: '#fff', border: '1px solid #475569' }}
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => !submitting && setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingSalary ? 'Update Salary Record' : 'Create Salary Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Payslip Modal */}
      {viewingPayslip && (
        <PayslipModal
          salary={viewingPayslip}
          companyInfo={companyInfo}
          onClose={() => setViewingPayslip(null)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Salary Record"
        message={`Delete salary record for ${showDeleteConfirm?.employee_name} (${showDeleteConfirm?.salary_month})? This action cannot be undone.`}
      />
    </div>
  );
};

export default SalaryManager;
