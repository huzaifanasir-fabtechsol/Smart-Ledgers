import { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiRequest, getErrorMessage } from '../api';
import DeleteConfirmModal from './DeleteConfirmModal';
import '../shared.css';
import './OrderManager.css';

const SalaryManager = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Employee dropdown
  const [allEmployees, setAllEmployees] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const emptyForm = {
    employee: '',
    salary_month: '',
    leaves: '0',
    leave_deduction: '0',
    allowances: '0',
    other_deductions: '0',
    net_amount: '0',
    status: 'unpaid',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    fetchSalaries();
  }, [currentPage, search, filterEmployee, filterMonth, filterStatus]);

  useEffect(() => {
    fetchAllEmployees();
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

  // Auto-calculate net amount whenever relevant fields change
  useEffect(() => {
    if (!formData.employee) return;
    const emp = allEmployees.find(e => String(e.id) === String(formData.employee));
    const basicSalary = emp ? Number(emp.basic_salary) : 0;
    const leaveDeduction = Number(formData.leave_deduction) || 0;
    const allowances = Number(formData.allowances) || 0;
    const otherDeductions = Number(formData.other_deductions) || 0;
    const net = basicSalary - leaveDeduction - otherDeductions + allowances;
    setFormData(prev => ({ ...prev, net_amount: net.toFixed(2) }));
  }, [formData.employee, formData.leave_deduction, formData.allowances, formData.other_deductions, allEmployees]);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, pageSize });
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
      // silently ignore
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.employee) errors.employee = 'Employee is required';
    if (!formData.salary_month) errors.salary_month = 'Salary month is required';
    if (Number(formData.leaves) < 0) errors.leaves = 'Leaves cannot be negative';
    if (Number(formData.leave_deduction) < 0) errors.leave_deduction = 'Leave deduction cannot be negative';
    if (Number(formData.allowances) < 0) errors.allowances = 'Allowances cannot be negative';
    if (Number(formData.other_deductions) < 0) errors.other_deductions = 'Other deductions cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingSalary(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (sal) => {
    setEditingSalary(sal);
    setFormData({
      employee: String(sal.employee),
      salary_month: sal.salary_month,
      leaves: String(sal.leaves),
      leave_deduction: String(sal.leave_deduction),
      allowances: String(sal.allowances),
      other_deductions: String(sal.other_deductions),
      net_amount: String(sal.net_amount),
      status: sal.status,
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
        ...formData,
        employee: Number(formData.employee),
        leaves: Number(formData.leaves),
        leave_deduction: Number(formData.leave_deduction),
        allowances: Number(formData.allowances),
        other_deductions: Number(formData.other_deductions),
        net_amount: Number(formData.net_amount),
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

  const openMenu = (e, id) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setOpenMenuId(id);
  };

  const handleSearchChange = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const handleFilterEmployeeChange = (e) => { setFilterEmployee(e.target.value); setCurrentPage(1); };
  const handleFilterMonthChange = (e) => { setFilterMonth(e.target.value); setCurrentPage(1); };
  const handleFilterStatusChange = (e) => { setFilterStatus(e.target.value); setCurrentPage(1); };

  const getEmployeeName = (sal) => sal.employee_name || '-';

  return (
    <div className="salary-manager">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="page-header">
        <h2>Salaries</h2>
        <button className="btn-primary" onClick={openCreateModal}>+ Add Salary Record</button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Search employee..."
            value={search}
            onChange={handleSearchChange}
          />
          <select className="filter-select" value={filterEmployee} onChange={handleFilterEmployeeChange}>
            <option value="">All Employees</option>
            {allEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input
            type="month"
            className="filter-input"
            value={filterMonth}
            onChange={handleFilterMonthChange}
            title="Filter by salary month"
          />
          <select className="filter-select" value={filterStatus} onChange={handleFilterStatusChange}>
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
                  <th>Leaves</th>
                  <th>Leave Deduction</th>
                  <th>Allowances</th>
                  <th>Other Deductions</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((sal, idx) => (
                  <tr key={sal.id}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td>
                      <strong>{getEmployeeName(sal)}</strong>
                      {sal.employee_role && <div style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>{sal.employee_role}</div>}
                    </td>
                    <td>{sal.salary_month}</td>
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
                    <td>
                      <button className={`btn-menu ${openMenuId === sal.id ? 'active' : ''}`} onClick={(e) => openMenu(e, sal.id)}>⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹ Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 7) {
                if (currentPage <= 4) page = i + 1;
                else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                else page = currentPage - 3 + i;
              }
              return (
                <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
              );
            })}
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next ›</button>
            <span className="page-info">Page {currentPage} of {totalPages} · {totalCount} total</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {openMenuId && (
        <div ref={menuRef} className="context-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          {(() => {
            const sal = salaries.find(s => s.id === openMenuId);
            return sal ? (
              <>
                <button onClick={() => openEditModal(sal)}>✏️ Edit</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(sal); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSalary ? 'Edit Salary Record' : 'Add Salary Record'}</h3>
              <button className="modal-close" onClick={() => !submitting && setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Employee *</label>
                  <select
                    className={`form-input ${formErrors.employee ? 'input-error' : ''}`}
                    value={formData.employee}
                    onChange={e => setFormData({ ...formData, employee: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {allEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
                    ))}
                  </select>
                  {formErrors.employee && <span className="field-error">{formErrors.employee}</span>}
                  {formData.employee && (() => {
                    const emp = allEmployees.find(e => String(e.id) === String(formData.employee));
                    return emp ? (
                      <small style={{ color: 'var(--ink-2)', marginTop: 4, display: 'block' }}>
                        Basic Salary: ¥{Number(emp.basic_salary).toLocaleString()}
                      </small>
                    ) : null;
                  })()}
                </div>

                <div className="form-group">
                  <label>Salary Month *</label>
                  <input
                    type="month"
                    className={`form-input ${formErrors.salary_month ? 'input-error' : ''}`}
                    value={formData.salary_month}
                    onChange={e => setFormData({ ...formData, salary_month: e.target.value })}
                  />
                  {formErrors.salary_month && <span className="field-error">{formErrors.salary_month}</span>}
                </div>

                <div className="form-group">
                  <label>Leaves (days)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={`form-input ${formErrors.leaves ? 'input-error' : ''}`}
                    value={formData.leaves}
                    onChange={e => setFormData({ ...formData, leaves: e.target.value })}
                  />
                  {formErrors.leaves && <span className="field-error">{formErrors.leaves}</span>}
                </div>

                <div className="form-group">
                  <label>Leave Deduction (¥)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-input ${formErrors.leave_deduction ? 'input-error' : ''}`}
                    value={formData.leave_deduction}
                    onChange={e => setFormData({ ...formData, leave_deduction: e.target.value })}
                  />
                  {formErrors.leave_deduction && <span className="field-error">{formErrors.leave_deduction}</span>}
                </div>

                <div className="form-group">
                  <label>Allowances (¥)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-input ${formErrors.allowances ? 'input-error' : ''}`}
                    value={formData.allowances}
                    onChange={e => setFormData({ ...formData, allowances: e.target.value })}
                  />
                  {formErrors.allowances && <span className="field-error">{formErrors.allowances}</span>}
                </div>

                <div className="form-group">
                  <label>Other Deductions (¥)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-input ${formErrors.other_deductions ? 'input-error' : ''}`}
                    value={formData.other_deductions}
                    onChange={e => setFormData({ ...formData, other_deductions: e.target.value })}
                  />
                  {formErrors.other_deductions && <span className="field-error">{formErrors.other_deductions}</span>}
                </div>

                <div className="form-group">
                  <label>Net Amount (¥) — Auto-calculated</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.net_amount}
                    onChange={e => setFormData({ ...formData, net_amount: e.target.value })}
                    style={{ background: 'var(--surface)', fontWeight: 700 }}
                  />
                  <small style={{ color: 'var(--ink-2)', marginTop: 4, display: 'block' }}>
                    = Basic Salary − Leave Deduction − Other Deductions + Allowances
                  </small>
                </div>

                <div className="form-group">
                  <label>Payment Status</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => !submitting && setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingSalary ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
