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
  ChevronDown,
  Info,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle2
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

  const [customOverrides, setCustomOverrides] = useState({
    health_insurance: false,
    welfare_pension: false,
    employment_insurance: false,
    income_tax: false,
  });

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
    daily_working_hours: '8.0',
    working_days: '20',
    required_working_hours: '160',
    working_hours: '160',
    hourly_wage: '0',
    overtime_hours: '0',
    holiday_overtime_hours: '0',
    midnight_overtime_hours: '0',
    regular_ot_pay: '0',
    holiday_ot_pay: '0',
    midnight_ot_pay: '0',
    calculated_overtime_allowance: '0',
    absence_deduction: '0',
    late_early_deduction: '0',
    calculated_leave_deduction: '0',
    paid_leaves: '0',
    statutory_leaves: '8',
    absence_days: '0',
    late_early_count: '0',
    late_early_hours: '0',
    remarks: '',

    dependents_count: 0,
    employment_insurance_exempt: false,
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

  // Instant Mathematical Recalculation Matching Japan Labor & Payroll Standards
  const recalculateLocally = (state) => {
    const basic = Number(state.basic_salary || 0);
    const commuting = Number(state.commuting_allowance || 0);
    const overtime = Number(state.overtime_allowance || 0);
    const allowances = Number(state.allowances || 0);
    const leaveDed = Number(state.leave_deduction || 0);

    // Attendance & Required Hours Calculation
    const days = Number(state.working_days || 0);
    const dailyHrs = Number(state.daily_working_hours || 8.0);
    const reqHrs = Math.round(days * dailyHrs * 100) / 100;
    const hourlyWage = reqHrs > 0 ? Math.round((basic / reqHrs) * 100) / 100 : 0;

    // Overtime Breakdown: 1.25x Regular, 1.35x Holiday, 0.25x Midnight Premium
    const otHrs = Number(state.overtime_hours || 0);
    const holOtHrs = Number(state.holiday_overtime_hours || 0);
    const midOtHrs = Number(state.midnight_overtime_hours || 0);

    const regOtPay = Math.round(hourlyWage * 1.25 * otHrs);
    const holOtPay = Math.round(hourlyWage * 1.35 * holOtHrs);
    const midOtPay = Math.round(hourlyWage * 0.25 * midOtHrs);
    const calcOtAllowance = regOtPay + holOtPay + midOtPay;

    // Absence & Leave Deductions
    const absDays = Number(state.absence_days || 0);
    const lateHrs = Number(state.late_early_hours || 0);
    const absDed = Math.round(absDays * dailyHrs * hourlyWage);
    const lateDed = Math.round(lateHrs * hourlyWage);
    const calcLeaveDed = absDed + lateDed;

    // Earnings
    const taxablePayment = Math.max(0, basic + overtime + allowances - leaveDed);
    const grossPayment = taxablePayment + commuting;

    // Deductions & Social Insurance
    const health = Number(state.health_insurance || 0);
    const pension = Number(state.welfare_pension || 0);
    const employment = Number(state.employment_insurance || 0);
    const totalSocial = health + pension + employment;

    const taxableBase = Math.max(0, taxablePayment - totalSocial);

    const incomeTax = Number(state.income_tax || 0);
    const residentTax = Number(state.resident_tax || 0);
    const otherDed = Number(state.other_deductions || 0);

    const totalDeductions = totalSocial + incomeTax + residentTax + otherDed;
    const netAmount = grossPayment - totalDeductions;

    return {
      ...state,
      required_working_hours: String(reqHrs),
      hourly_wage: String(hourlyWage),
      regular_ot_pay: String(regOtPay),
      holiday_ot_pay: String(holOtPay),
      midnight_ot_pay: String(midOtPay),
      calculated_overtime_allowance: String(calcOtAllowance),
      absence_deduction: String(absDed),
      late_early_deduction: String(lateDed),
      calculated_leave_deduction: String(calcLeaveDed),
      taxable_payment: String(taxablePayment),
      gross_payment: String(grossPayment),
      total_social_insurance: String(totalSocial),
      taxable_income_base: String(taxableBase),
      total_deductions: String(totalDeductions),
      net_amount: String(netAmount),
    };
  };

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

  // Perform Live Calculation via API (Kyokai Kenpo ~4.99%, Pension 9.15%, Employment 0.60%, & NTA Withholding Tax Brackets)
  const runLiveCalculation = async (currentValues, overrides = customOverrides) => {
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
        daily_working_hours: Number(val.daily_working_hours || 8.0),
        working_days: Number(val.working_days || 20),
        working_hours: Number(val.working_hours || 160),
        overtime_hours: Number(val.overtime_hours || 0),
        holiday_overtime_hours: Number(val.holiday_overtime_hours || 0),
        midnight_overtime_hours: Number(val.midnight_overtime_hours || 0),
        absence_days: Number(val.absence_days || 0),
        late_early_hours: Number(val.late_early_hours || 0),
      };

      if (overrides.health_insurance) payload.custom_health_insurance = Number(val.health_insurance);
      if (overrides.welfare_pension) payload.custom_welfare_pension = Number(val.welfare_pension);
      if (overrides.employment_insurance) payload.custom_employment_insurance = Number(val.employment_insurance);
      if (overrides.income_tax) payload.custom_income_tax = Number(val.income_tax);

      const response = await apiRequest('/hr/salaries/calculate/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => {
          const updated = {
            ...prev,
            taxable_payment: String(result.taxable_payment),
            gross_payment: String(result.gross_payment),
            health_insurance: overrides.health_insurance ? prev.health_insurance : String(result.health_insurance),
            welfare_pension: overrides.welfare_pension ? prev.welfare_pension : String(result.welfare_pension),
            employment_insurance: overrides.employment_insurance ? prev.employment_insurance : String(result.employment_insurance),
            total_social_insurance: String(result.total_social_insurance),
            taxable_income_base: String(result.taxable_income_base),
            income_tax: overrides.income_tax ? prev.income_tax : String(result.income_tax),
            resident_tax: String(result.resident_tax),
            total_deductions: String(result.total_deductions),
            net_amount: String(result.net_amount),
            required_working_hours: String(result.required_working_hours || prev.required_working_hours),
            hourly_wage: String(result.hourly_wage || prev.hourly_wage),
            calculated_overtime_allowance: String(result.calculated_overtime_allowance || prev.calculated_overtime_allowance),
            calculated_leave_deduction: String(result.calculated_leave_deduction || prev.calculated_leave_deduction),
          };
          return recalculateLocally(updated);
        });
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
      const clearedOverrides = {
        health_insurance: false,
        welfare_pension: false,
        employment_insurance: false,
        income_tax: false,
      };
      setCustomOverrides(clearedOverrides);

      const dailyHrs = emp.daily_working_hours != null ? Number(emp.daily_working_hours) : 8.0;
      const days = Number(formData.working_days || 20);
      const reqHours = Math.round(days * dailyHrs * 100) / 100;

      const updated = recalculateLocally({
        ...formData,
        employee: String(empId),
        basic_salary: String(emp.basic_salary || '0'),
        commuting_allowance: String(emp.commuting_allowance || '0'),
        daily_working_hours: String(dailyHrs),
        working_days: String(days),
        required_working_hours: String(reqHours),
        working_hours: String(reqHours),
        dependents_count: emp.dependents_count || 0,
        employment_insurance_exempt: Boolean(emp.employment_insurance_exempt),
      });
      setFormData(updated);
      runLiveCalculation(updated, clearedOverrides);
    } else {
      setFormData(prev => ({ ...prev, employee: '' }));
    }
  };

  const handleFieldChange = (field, value) => {
    let newOverrides = { ...customOverrides };
    let extraState = {};

    if (['health_insurance', 'welfare_pension', 'employment_insurance', 'income_tax'].includes(field)) {
      newOverrides[field] = true;
      setCustomOverrides(newOverrides);
    }

    // Auto-calculate required working hours when working_days or daily_working_hours changes
    if (field === 'working_days' || field === 'daily_working_hours') {
      const days = field === 'working_days' ? Number(value || 0) : Number(formData.working_days || 0);
      const dHours = field === 'daily_working_hours' ? Number(value || 8.0) : Number(formData.daily_working_hours || 8.0);
      const reqHrs = Math.round(days * dHours * 100) / 100;
      extraState.required_working_hours = String(reqHrs);

      if (Number(formData.overtime_hours || 0) === 0) {
        extraState.working_hours = String(reqHrs);
      }
    }

    // If working_hours is updated, auto-calculate overtime if worked > required
    if (field === 'working_hours') {
      const worked = Number(value || 0);
      const req = Number(formData.required_working_hours || (Number(formData.working_days || 20) * Number(formData.daily_working_hours || 8.0)));
      if (worked > req) {
        const ot = Math.max(0, Math.round((worked - req) * 100) / 100);
        extraState.overtime_hours = String(ot);
      }
    }

    // If overtime_hours is updated, reconcile working_hours = req + overtime
    if (field === 'overtime_hours') {
      const ot = Number(value || 0);
      const req = Number(formData.required_working_hours || (Number(formData.working_days || 20) * Number(formData.daily_working_hours || 8.0)));
      extraState.working_hours = String(Math.round((req + ot) * 100) / 100);
    }

    const nextForm = recalculateLocally({ ...formData, ...extraState, [field]: value });
    setFormData(nextForm);

    // Run backend calculation if earnings or taxable base changes
    if (
      [
        'basic_salary', 'commuting_allowance', 'overtime_allowance', 'allowances',
        'leave_deduction', 'health_insurance', 'welfare_pension', 'employment_insurance',
        'working_days', 'daily_working_hours', 'working_hours', 'overtime_hours',
        'holiday_overtime_hours', 'midnight_overtime_hours', 'absence_days', 'late_early_hours'
      ].includes(field)
    ) {
      runLiveCalculation(nextForm, newOverrides);
    }
  };

  const handleApplyOvertimeToEarnings = (amt) => {
    const next = recalculateLocally({ ...formData, overtime_allowance: String(amt) });
    setFormData(next);
    runLiveCalculation(next);
    toast.success(`Applied calculated overtime pay of ¥${Number(amt).toLocaleString()} to Earnings`);
  };

  const handleApplyLeaveDeduction = (amt) => {
    const next = recalculateLocally({ ...formData, leave_deduction: String(amt) });
    setFormData(next);
    runLiveCalculation(next);
    toast.success(`Applied calculated leave deduction of ¥${Number(amt).toLocaleString()} to Deductions`);
  };

  const handleResetSingleOverride = (field) => {
    const updatedOverrides = { ...customOverrides, [field]: false };
    setCustomOverrides(updatedOverrides);
    runLiveCalculation(formData, updatedOverrides);
    toast.info(`Reset ${field.replace(/_/g, ' ')} to standard statutory calculation`);
  };

  const handleResetToAutoCalculate = () => {
    const clearedOverrides = {
      health_insurance: false,
      welfare_pension: false,
      employment_insurance: false,
      income_tax: false,
    };
    setCustomOverrides(clearedOverrides);
    runLiveCalculation(formData, clearedOverrides);
    toast.info('Recalculated with standard Japanese rates');
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
    const emp = allEmployees.find((e) => String(e.id) === String(sal.employee));
    const dailyHrs = String(emp?.daily_working_hours || 8.0);
    const days = Number(sal.working_days || 0);
    const reqHrs = sal.required_working_hours
      ? String(sal.required_working_hours)
      : String(Math.round(days * Number(dailyHrs) * 100) / 100);

    const initialFormData = recalculateLocally({
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

      daily_working_hours: dailyHrs,
      required_working_hours: reqHrs,
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

    setFormData(initialFormData);
    setCustomOverrides({
      health_insurance: false,
      welfare_pension: false,
      employment_insurance: false,
      income_tax: false,
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
        required_working_hours: Number(formData.required_working_hours || 0),
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
          <h2>Salary Management</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', marginTop: 2 }}>
            Manage employee salaries, social insurance, deductions, and payslips
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
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
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
                  <th>Employee</th>
                  <th>Salary Month</th>
                  <th>Payment Date</th>
                  <th>Gross Pay</th>
                  <th>Social Insurance</th>
                  <th>Income Tax</th>
                  <th>Total Deductions</th>
                  <th>Net Pay</th>
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
                  <Eye size={15} /> View Payslip
                </button>
                <button onClick={() => { handleDownloadExcel(sal); setOpenMenuId(null); }}>
                  <FileSpreadsheet size={15} style={{ color: '#16a34a' }} /> Export Excel (.xlsx)
                </button>
                <button onClick={() => { handleDownloadPdf(sal); setOpenMenuId(null); }}>
                  <FileText size={15} style={{ color: '#dc2626' }} /> Export PDF (.pdf)
                </button>
                <button onClick={() => openEditModal(sal)}>
                  <Edit2 size={15} /> Edit
                </button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(sal); setOpenMenuId(null); }}>
                  <Trash2 size={15} /> Delete
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
                <h3>{editingSalary ? 'Edit Salary Record' : 'Create Salary Record'}</h3>
                <span className="live-calc-badge" style={{ marginTop: 4 }}>
                  <Sparkles size={13} /> {calculating ? 'Calculating Taxes...' : 'Auto-Calculation Active'}
                </span>
              </div>
              <button className="modal-close" onClick={() => !submitting && setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Top Overview Grid */}
              <div className="form-grid-3" style={{ background: 'var(--surface-raised, #f8fafc)', padding: '1rem', borderRadius: 8, marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>Employee *</label>
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
                  <label>Salary Month *</label>
                  <input
                    type="month"
                    className={`form-input ${formErrors.salary_month ? 'input-error' : ''}`}
                    value={formData.salary_month}
                    onChange={(e) => handleFieldChange('salary_month', e.target.value)}
                  />
                  {formErrors.salary_month && <span className="field-error">{formErrors.salary_month}</span>}
                </div>

                <div className="form-group">
                  <label>Payment Date</label>
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
                  1. Earnings
                </button>
                <button
                  type="button"
                  className={`salary-form-tab ${activeTab === 'deductions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('deductions')}
                >
                  2. Deductions & Taxes
                </button>
                <button
                  type="button"
                  className={`salary-form-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  3. Attendance
                </button>
              </div>

              {/* Tab 1: Earnings */}
              {activeTab === 'earnings' && (
                <div className="form-tab-pane">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Basic Salary (¥) *</label>
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
                      <label>Commuting Allowance (¥)</label>
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
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Overtime Pay (¥)</label>
                        {Number(formData.calculated_overtime_allowance || 0) > 0 && (
                          <button
                            type="button"
                            className="btn-reset-field"
                            onClick={() => handleApplyOvertimeToEarnings(formData.calculated_overtime_allowance)}
                            title="Apply overtime pay calculated from Attendance hours"
                          >
                            ⚡ Apply ¥{Number(formData.calculated_overtime_allowance).toLocaleString()}
                          </button>
                        )}
                      </div>
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
                      <label>Other Allowances (¥)</label>
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
                      <label>Taxable Payment Total (¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.taxable_payment}
                        readOnly
                        style={{ background: 'var(--surface-sunken, #f1f5f9)', fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Gross Payment Total (¥)</label>
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

              {/* Tab 2: Deductions & Taxes */}
              {activeTab === 'deductions' && (
                <div className="form-tab-pane">
                  {/* Japan Statutory Rules Reference Banner */}
                  <div className="japan-rules-banner">
                    <div className="japan-rules-header">
                      <div className="japan-rules-title">
                        <Info size={16} style={{ color: '#0284c7' }} />
                        <span>Japanese Statutory Social Insurance & Tax Guidelines (2026 Standards)</span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={handleResetToAutoCalculate}
                        title="Recalculate all insurance and withholding taxes based on statutory rates"
                      >
                        <RotateCcw size={13} /> ↺ Reset All to Auto Rates
                      </button>
                    </div>

                    <div className="japan-rules-grid">
                      <div className="japan-rule-item">
                        <div className="japan-rule-name">
                          <span>Health Insurance</span>
                          <span className="japan-rule-rate">4.99%</span>
                        </div>
                        <div className="japan-rule-desc">
                          Kyokai Kenpo Tokyo: 9.98% split equally (4.99% employee / 4.99% employer). Standard Monthly Remuneration brackets.
                        </div>
                      </div>

                      <div className="japan-rule-item">
                        <div className="japan-rule-name">
                          <span>Welfare Pension</span>
                          <span className="japan-rule-rate">9.15%</span>
                        </div>
                        <div className="japan-rule-desc">
                          Welfare Pension: Fixed statutory rate 18.30% split equally (9.15% employee / 9.15% employer). Grade brackets 1–32.
                        </div>
                      </div>

                      <div className="japan-rule-item">
                        <div className="japan-rule-name">
                          <span>Employment Insurance</span>
                          <span className="japan-rule-rate">0.60%</span>
                        </div>
                        <div className="japan-rule-desc">
                          General Business standard: 6/1,000 (0.60% employee share / 9.5/1,000 employer share) applied to gross payment.
                        </div>
                      </div>

                      <div className="japan-rule-item">
                        <div className="japan-rule-name">
                          <span>Withholding Income Tax</span>
                          <span className="japan-rule-rate">NTA Standard</span>
                        </div>
                        <div className="japan-rule-desc">
                          Calculated on (Taxable Pay − Social Insurance) via National Tax Agency Monthly Withholding Tax Table.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deduction Inputs Grid */}
                  <div className="form-grid-3">
                    {/* Health Insurance */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Health Insurance (¥)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="rate-badge">4.99%</span>
                          {customOverrides.health_insurance ? (
                            <span className="override-pill manual">
                              ✏️ Override
                              <button
                                type="button"
                                className="btn-reset-field"
                                onClick={() => handleResetSingleOverride('health_insurance')}
                                title="Reset to statutory calculation"
                              >
                                ↺ Reset
                              </button>
                            </span>
                          ) : (
                            <span className="override-pill auto">⚡ Auto</span>
                          )}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.health_insurance}
                        onChange={(e) => handleFieldChange('health_insurance', e.target.value)}
                      />
                    </div>

                    {/* Welfare Pension */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Welfare Pension (¥)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="rate-badge">9.15%</span>
                          {customOverrides.welfare_pension ? (
                            <span className="override-pill manual">
                              ✏️ Override
                              <button
                                type="button"
                                className="btn-reset-field"
                                onClick={() => handleResetSingleOverride('welfare_pension')}
                                title="Reset to statutory calculation"
                              >
                                ↺ Reset
                              </button>
                            </span>
                          ) : (
                            <span className="override-pill auto">⚡ Auto</span>
                          )}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.welfare_pension}
                        onChange={(e) => handleFieldChange('welfare_pension', e.target.value)}
                      />
                    </div>

                    {/* Employment Insurance */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Employment Insurance (¥)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="rate-badge">0.60%</span>
                          {customOverrides.employment_insurance ? (
                            <span className="override-pill manual">
                              ✏️ Override
                              <button
                                type="button"
                                className="btn-reset-field"
                                onClick={() => handleResetSingleOverride('employment_insurance')}
                                title="Reset to statutory calculation"
                              >
                                ↺ Reset
                              </button>
                            </span>
                          ) : (
                            <span className="override-pill auto">⚡ Auto</span>
                          )}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.employment_insurance}
                        onChange={(e) => handleFieldChange('employment_insurance', e.target.value)}
                      />
                    </div>

                    {/* Total Social Insurance */}
                    <div className="form-group">
                      <label>Total Social Insurance (¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.total_social_insurance}
                        readOnly
                        style={{ background: 'var(--surface-sunken, #f1f5f9)', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Health + Welfare + Employment Insurance</span>
                    </div>

                    {/* Taxable Income Base */}
                    <div className="form-group">
                      <label>Taxable Income Base (¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.taxable_income_base}
                        readOnly
                        style={{ background: 'var(--surface-sunken, #f1f5f9)', fontWeight: 600 }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Taxable Payment − Total Social Insurance</span>
                    </div>

                    {/* Withholding Income Tax */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Income Tax (¥)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="rate-badge">NTA Table</span>
                          {customOverrides.income_tax ? (
                            <span className="override-pill manual">
                              ✏️ Override
                              <button
                                type="button"
                                className="btn-reset-field"
                                onClick={() => handleResetSingleOverride('income_tax')}
                                title="Reset to statutory calculation"
                              >
                                ↺ Reset
                              </button>
                            </span>
                          ) : (
                            <span className="override-pill auto">⚡ Auto</span>
                          )}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.income_tax}
                        onChange={(e) => handleFieldChange('income_tax', e.target.value)}
                      />
                    </div>

                    {/* Resident Tax */}
                    <div className="form-group">
                      <label>Resident Tax (¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.resident_tax}
                        onChange={(e) => handleFieldChange('resident_tax', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Municipal tax notice (Special collection)</span>
                    </div>

                    {/* Leave Deduction */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Leave Deduction (¥)</label>
                        {Number(formData.calculated_leave_deduction || 0) > 0 && (
                          <button
                            type="button"
                            className="btn-reset-field"
                            onClick={() => handleApplyLeaveDeduction(formData.calculated_leave_deduction)}
                            title="Apply attendance-calculated leave deduction"
                          >
                            ⚡ Apply ¥{Number(formData.calculated_leave_deduction).toLocaleString()}
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.leave_deduction}
                        onChange={(e) => handleFieldChange('leave_deduction', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Absence & late/early wage deductions</span>
                    </div>

                    {/* Other Deductions */}
                    <div className="form-group">
                      <label>Other Deductions (¥)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.other_deductions}
                        onChange={(e) => handleFieldChange('other_deductions', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Dormitory, company loan, union fees, etc.</span>
                    </div>

                    {/* Total Deductions Highlight */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Total Deductions (¥)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.total_deductions}
                        readOnly
                        style={{ background: '#fef2f2', color: '#b91c1c', fontWeight: 800, fontSize: '1.05rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Attendance */}
              {activeTab === 'attendance' && (
                <div className="form-tab-pane">
                  {/* Attendance Calculation Summary Metric Cards */}
                  <div className="attendance-summary-cards">
                    <div className="attendance-card-metric highlight">
                      <div className="metric-title">Required Working Hours</div>
                      <div className="metric-value">{formData.required_working_hours || 0} hrs</div>
                      <div className="metric-sub">
                        {formData.working_days || 0} days × {formData.daily_working_hours || 8.0} hrs/day
                      </div>
                    </div>

                    <div className="attendance-card-metric">
                      <div className="metric-title">Hourly Wage Basis</div>
                      <div className="metric-value">
                        ¥{Number(formData.hourly_wage || 0).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/ hr</span>
                      </div>
                      <div className="metric-sub">
                        Basic ¥{Number(formData.basic_salary || 0).toLocaleString()} ÷ {formData.required_working_hours || 1} hrs
                      </div>
                    </div>

                    <div className="attendance-card-metric">
                      <div className="metric-title">Overtime Premium Pay</div>
                      <div className="metric-value" style={{ color: '#2563eb' }}>
                        ¥{Number(formData.calculated_overtime_allowance || 0).toLocaleString()}
                      </div>
                      <div className="metric-sub">
                        1.25× Reg ({formData.overtime_hours || 0}h) + 1.35× Hol ({formData.holiday_overtime_hours || 0}h) + 0.25× Mid ({formData.midnight_overtime_hours || 0}h)
                      </div>
                    </div>

                    <div className="attendance-card-metric">
                      <div className="metric-title">Absence & Leave Deduction</div>
                      <div className="metric-value" style={{ color: '#dc2626' }}>
                        ¥{Number(formData.calculated_leave_deduction || 0).toLocaleString()}
                      </div>
                      <div className="metric-sub">
                        {formData.absence_days || 0}d absence (¥{Number(formData.absence_deduction || 0).toLocaleString()}) + {formData.late_early_hours || 0}h late (¥{Number(formData.late_early_deduction || 0).toLocaleString()})
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Box to Apply Computed Values */}
                  {(Number(formData.calculated_overtime_allowance || 0) > 0 || Number(formData.calculated_leave_deduction || 0) > 0) && (
                    <div className="attendance-calc-action-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155' }}>
                        <Sparkles size={16} style={{ color: '#d97706' }} />
                        <span>Attendance-based calculations available:</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {Number(formData.calculated_overtime_allowance || 0) > 0 && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                            onClick={() => handleApplyOvertimeToEarnings(formData.calculated_overtime_allowance)}
                          >
                            Apply ¥{Number(formData.calculated_overtime_allowance).toLocaleString()} to Overtime Pay
                          </button>
                        )}
                        {Number(formData.calculated_leave_deduction || 0) > 0 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderColor: '#ef4444', color: '#b91c1c' }}
                            onClick={() => handleApplyLeaveDeduction(formData.calculated_leave_deduction)}
                          >
                            Apply ¥{Number(formData.calculated_leave_deduction).toLocaleString()} to Leave Deduction
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attendance Fields Grid */}
                  <div className="form-grid-3" style={{ marginTop: '1.25rem' }}>
                    {/* Working Days */}
                    <div className="form-group">
                      <label>Working Days *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="form-input"
                        value={formData.working_days}
                        onChange={(e) => handleFieldChange('working_days', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Actual scheduled days worked</span>
                    </div>

                    {/* Daily Working Hours */}
                    <div className="form-group">
                      <label>Req. Hours / Day</label>
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.25"
                        className="form-input"
                        value={formData.daily_working_hours}
                        onChange={(e) => handleFieldChange('daily_working_hours', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Contracted standard daily hours (default: 8.0)</span>
                    </div>

                    {/* Total Required Hours */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Required Hours</label>
                        <span className="override-pill auto">⚡ Auto</span>
                      </div>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.required_working_hours}
                        readOnly
                        style={{ background: 'var(--surface-sunken, #f1f5f9)', fontWeight: 700, color: '#0369a1' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Days × Req. Hours/Day</span>
                    </div>

                    {/* Actual Worked Hours */}
                    <div className="form-group">
                      <label>Actual Worked Hours</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.working_hours}
                        onChange={(e) => handleFieldChange('working_hours', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Total hours on clock (Required + Overtime)</span>
                    </div>

                    {/* Regular Overtime */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Regular Overtime (hrs)</label>
                        <span className="rate-badge">1.25×</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.overtime_hours}
                        onChange={(e) => handleFieldChange('overtime_hours', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Over 8h/day or 40h/week</span>
                    </div>

                    {/* Holiday Overtime */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Holiday Overtime (hrs)</label>
                        <span className="rate-badge">1.35×</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.holiday_overtime_hours}
                        onChange={(e) => handleFieldChange('holiday_overtime_hours', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Statutory holiday work</span>
                    </div>

                    {/* Midnight Overtime */}
                    <div className="form-group">
                      <div className="form-label-with-badge">
                        <label style={{ margin: 0 }}>Midnight Overtime (hrs)</label>
                        <span className="rate-badge">+0.25×</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        className="form-input"
                        value={formData.midnight_overtime_hours}
                        onChange={(e) => handleFieldChange('midnight_overtime_hours', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>22:00 – 05:00 late night work</span>
                    </div>

                    {/* Paid Leave */}
                    <div className="form-group">
                      <label>Paid Leave (days)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="form-input"
                        value={formData.paid_leaves}
                        onChange={(e) => handleFieldChange('paid_leaves', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Statutory annual paid leave taken</span>
                    </div>

                    {/* Scheduled Off Days */}
                    <div className="form-group">
                      <label>Scheduled Off Days</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={formData.statutory_leaves}
                        onChange={(e) => handleFieldChange('statutory_leaves', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Weekends and calendar holidays</span>
                    </div>

                    {/* Absence Days */}
                    <div className="form-group">
                      <label>Absence (days)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="form-input"
                        value={formData.absence_days}
                        onChange={(e) => handleFieldChange('absence_days', e.target.value)}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Unpaid absent workdays</span>
                    </div>

                    {/* Late / Early */}
                    <div className="form-group">
                      <label>Late / Early</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Times"
                          className="form-input"
                          value={formData.late_early_count}
                          onChange={(e) => handleFieldChange('late_early_count', e.target.value)}
                          title="Number of occurrences"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="Hours"
                          className="form-input"
                          value={formData.late_early_hours}
                          onChange={(e) => handleFieldChange('late_early_hours', e.target.value)}
                          title="Total hours late or left early"
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Times count & total deductible hours</span>
                    </div>

                    {/* Remarks */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Remarks</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={formData.remarks}
                        onChange={(e) => handleFieldChange('remarks', e.target.value)}
                        placeholder="e.g. Standard 8h shifts, regular overtime included."
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
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Net Take-home Pay</div>
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
