import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiRequest, getErrorMessage } from '../api';
import '../shared.css';
import './OrderManager.css';

const EmployeeManager = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const emptyForm = {
    name: '', email: '', phone: '', role: '', address: '',
    employment_start_month: '', basic_salary: '', status: 'active',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, search, filterRole]);

  useEffect(() => {
    fetchRoles();
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

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, pageSize });
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      const response = await apiRequest(`/hr/employees/?${params}`);
      const data = await response.json();
      setEmployees(data.results || []);
      setTotalCount(data.count || 0);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiRequest('/hr/employees/roles/');
      const data = await response.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.role.trim()) errors.role = 'Role is required';
    if (!formData.employment_start_month) errors.employment_start_month = 'Employment start month is required';
    if (!formData.basic_salary && formData.basic_salary !== 0) {
      errors.basic_salary = 'Basic salary is required';
    } else if (Number(formData.basic_salary) < 0) {
      errors.basic_salary = 'Basic salary cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      address: emp.address || '',
      employment_start_month: emp.employment_start_month,
      basic_salary: emp.basic_salary,
      status: emp.status,
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
      const payload = { ...formData };
      // employment_start_month: backend expects a date — use first day of month if only month given
      if (payload.employment_start_month && payload.employment_start_month.length === 7) {
        payload.employment_start_month = payload.employment_start_month + '-01';
      }
      const response = editingEmployee
        ? await apiRequest(`/hr/employees/${editingEmployee.id}/`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiRequest('/hr/employees/', { method: 'POST', body: JSON.stringify(payload) });

      if (!response.ok) {
        const msg = await getErrorMessage(response);
        throw new Error(msg);
      }
      toast.success(editingEmployee ? 'Employee updated successfully' : 'Employee created successfully');
      setShowModal(false);
      fetchEmployees();
      fetchRoles();
    } catch (err) {
      toast.error(err.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiRequest(`/hr/employees/${id}/`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const msg = await getErrorMessage(response);
        throw new Error(msg);
      }
      toast.success('Employee deleted');
      setShowDeleteConfirm(null);
      fetchEmployees();
      fetchRoles();
    } catch (err) {
      toast.error(err.message || 'Failed to delete employee');
    }
  };

  const handleToggleStatus = async (emp) => {
    try {
      const response = await apiRequest(`/hr/employees/${emp.id}/toggle-status/`, { method: 'PATCH' });
      if (!response.ok) {
        const msg = await getErrorMessage(response);
        throw new Error(msg);
      }
      toast.success(`Employee marked as ${emp.status === 'active' ? 'inactive' : 'active'}`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
    setOpenMenuId(null);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (e) => {
    setFilterRole(e.target.value);
    setCurrentPage(1);
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

  const formatMonthDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="employee-manager">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="page-header">
        <h2>Employees</h2>
        <button className="btn-primary" onClick={openCreateModal}>+ Add Employee</button>
      </div>

      <div className="table-section">
        <div className="filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={handleSearchChange}
          />
          <select className="filter-select" value={filterRole} onChange={handleRoleFilterChange}>
            <option value="">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loader-container">
              <div className="spinner"></div>
              <p>Loading employees...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="table-loader-container">
              <p style={{ color: 'var(--ink-2)' }}>No employees found.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Start Month</th>
                  <th>Basic Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={emp.id}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td><strong>{emp.name}</strong></td>
                    <td>{emp.email}</td>
                    <td>{emp.phone}</td>
                    <td><span className="badge badge-role">{emp.role}</span></td>
                    <td>{formatMonthDisplay(emp.employment_start_month)}</td>
                    <td>¥{Number(emp.basic_salary).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${emp.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className={`btn-menu ${openMenuId === emp.id ? 'active' : ''}`} onClick={(e) => openMenu(e, emp.id)}>⋮</button>
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
            const emp = employees.find(e => e.id === openMenuId);
            return emp ? (
              <>
                <button onClick={() => { setOpenMenuId(null); navigate(`/employees/${emp.id}/salary-report`); }}>
                  📊 Salary Report
                </button>
                <button onClick={() => openEditModal(emp)}>✏️ Edit</button>
                <button onClick={() => handleToggleStatus(emp)}>
                  {emp.status === 'active' ? '🔴 Mark Inactive' : '🟢 Mark Active'}
                </button>
                <button className="danger" onClick={() => { setShowDeleteConfirm(emp); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
              <button className="modal-close" onClick={() => !submitting && setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                  />
                  {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className={`form-input ${formErrors.email ? 'input-error' : ''}`}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="employee@example.com"
                  />
                  {formErrors.email && <span className="field-error">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+81 xxx-xxxx-xxxx"
                  />
                  {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <input
                    type="text"
                    list="roles-datalist"
                    className={`form-input ${formErrors.role ? 'input-error' : ''}`}
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Manager, Driver..."
                  />
                  <datalist id="roles-datalist">
                    {roles.map(r => <option key={r} value={r} />)}
                  </datalist>
                  {formErrors.role && <span className="field-error">{formErrors.role}</span>}
                </div>

                <div className="form-group">
                  <label>Employment Start Month *</label>
                  <input
                    type="month"
                    className={`form-input ${formErrors.employment_start_month ? 'input-error' : ''}`}
                    value={formData.employment_start_month ? formData.employment_start_month.substring(0, 7) : ''}
                    onChange={e => setFormData({ ...formData, employment_start_month: e.target.value })}
                  />
                  {formErrors.employment_start_month && <span className="field-error">{formErrors.employment_start_month}</span>}
                </div>

                <div className="form-group">
                  <label>Basic Salary (¥) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-input ${formErrors.basic_salary ? 'input-error' : ''}`}
                    value={formData.basic_salary}
                    onChange={e => setFormData({ ...formData, basic_salary: e.target.value })}
                    placeholder="0"
                  />
                  {formErrors.basic_salary && <span className="field-error">{formErrors.basic_salary}</span>}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Optional address..."
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => !submitting && setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Employee</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <div style={{ padding: '1rem 1.5rem' }}>
              <p>Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(showDeleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
