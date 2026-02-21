import { useEffect, useMemo, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { apiRequest } from '../api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import DateInput from './DateInput';
import './ExpenseManager.css';

const CATEGORY_INITIAL_FORM = {
  name: '',
  description: '',
};

const EXPENSE_INITIAL_FORM = {
  title: '',
  amount: '',
  description: '',
  date: '',
  category: '',
  category_name: '',
};

const parseListResponse = (data) => data?.results || data || [];

const getErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }
    if (data && typeof data === 'object') {
      const [field, value] = Object.entries(data)[0] || [];
      if (Array.isArray(value) && value.length > 0) return `${field}: ${value[0]}`;
      if (typeof value === 'string') return `${field}: ${value}`;
    }
  } catch {
    // Ignore parse errors and return fallback.
  }
  return fallback;
};

const ExpenseManager = ({ language = 'en' }) => {
  const t = translations[language];

  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categoryForm, setCategoryForm] = useState(CATEGORY_INITIAL_FORM);
  const [expenseForm, setExpenseForm] = useState(EXPENSE_INITIAL_FORM);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [companyAccounts, setCompanyAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [spareParts, setSpareParts] = useState([]);
  const [selectedSparePart, setSelectedSparePart] = useState(null);

  const [categoryPage, setCategoryPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [totalCategoryPages, setTotalCategoryPages] = useState(1);
  const [totalExpensePages, setTotalExpensePages] = useState(1);
  const itemsPerPage = 10;

  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchText, setSearchText] = useState('');

  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [menuType, setMenuType] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchAllCategories();
    fetchCompanyAccounts();
    fetchRestaurants();
    fetchSpareParts();
  }, [categoryPage]);

  useEffect(() => {
    fetchExpenses();
  }, [expensePage, filterCategory, filterDate, searchText]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const params = new URLSearchParams({ page: categoryPage, page_size: itemsPerPage });
      const response = await apiRequest(`/categories/?${params}`);
      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to load categories');
        throw new Error(message);
      }
      const data = await response.json();
      setCategories(data.results || data || []);
      if (data.count) setTotalCategoryPages(Math.ceil(data.count / itemsPerPage));
    } catch (error) {
      toast.error(error.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const response = await apiRequest('/categories/all/');
      if (!response.ok) throw new Error('Failed to load all categories');
      const data = await response.json();
      setAllCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load all categories');
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const params = new URLSearchParams({ page: expensePage, page_size: itemsPerPage });
      if (filterCategory) params.append('category', filterCategory);
      if (filterDate) params.append('date', filterDate);
      if (searchText) params.append('search', searchText);
      
      const response = await apiRequest(`/expenses/?${params}`);
      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to load expenses');
        throw new Error(message);
      }
      const data = await response.json();
      setExpenses(data.results || data || []);
      if (data.count) setTotalExpensePages(Math.ceil(data.count / itemsPerPage));
    } catch (error) {
      toast.error(error.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchCompanyAccounts = async () => {
    try {
      const response = await apiRequest('/revenue/company-accounts/');
      if (!response.ok) throw new Error('Failed to load accounts');
      const data = await response.json();
      setCompanyAccounts(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load accounts');
      setCompanyAccounts([]);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await apiRequest('/restaurants/');
      if (!response.ok) throw new Error('Failed to load restaurants');
      const data = await response.json();
      setRestaurants(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load restaurants');
      setRestaurants([]);
    }
  };

  const fetchSpareParts = async () => {
    try {
      const response = await apiRequest('/spare-parts/?page_size=1000');
      if (!response.ok) throw new Error('Failed to load spare parts');
      const data = await response.json();
      setSpareParts(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load spare parts');
      setSpareParts([]);
    }
  };

  const isFoodCategory = (categoryId) => {
    if (!categoryId) return false;
    const category = allCategories.find((c) => String(c.id) === String(categoryId));
    return Boolean(category?.name && category.name.toLowerCase().includes('food'));
  };

  const isSparePartsCategory = (categoryId) => {
    if (!categoryId) return false;
    const category = allCategories.find((c) => String(c.id) === String(categoryId));
    return Boolean(category?.name && category.name.trim().toUpperCase() === 'SPARE PARTS');
  };

  const fetchTransactions = async (accountId) => {
    if (!accountId) return;
    setLoadingTransactions(true);
    try {
      const params = new URLSearchParams({ account_id: accountId });
      if (transactionSearch) params.append('search', transactionSearch);
      if (transactionDate) params.append('date', transactionDate);
      
      const response = await apiRequest(`/expenses/available_transactions/?${params}`);
      if (!response.ok) throw new Error('Failed to load transactions');
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm(CATEGORY_INITIAL_FORM);
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
    });
    setShowCategoryModal(true);
    setOpenMenuId(null);
  };

  const openCreateExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm(EXPENSE_INITIAL_FORM);
    setSelectedTransaction(null);
    setSelectedAccount(null);
    setSelectedRestaurant(null);
    setSelectedSparePart(null);
    setTransactions([]);
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title || '',
      amount: expense.amount || '',
      description: expense.description || '',
      date: expense.date || '',
      category: expense.category ? String(expense.category) : '',
      category_name: expense.category_name || '',
    });
    if (expense.transaction) {
      setSelectedTransaction(expense.transaction);
      setSelectedAccount(expense.transaction.company_account);
    }
    setSelectedRestaurant(restaurants.find((r) => r.id === Number(expense.restaurant)) || null);
    setSelectedSparePart(expense.spare_part || null);
    setShowExpenseModal(true);
    setOpenMenuId(null);
  };

  const handleMenuClick = (e, id, type) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 80;
    const top = rect.bottom + 5 + menuHeight > window.innerHeight ? rect.top - menuHeight - 5 : rect.bottom + 5;
    setMenuPos({ top, left: rect.right - 120 });
    setMenuType(type);
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSavingCategory(true);
    try {
      const endpoint = editingCategory ? `/categories/${editingCategory.id}/` : '/categories/';
      const method = editingCategory ? 'PATCH' : 'POST';

      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to save category');
        throw new Error(message);
      }

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowCategoryModal(false);
      setCategoryForm(CATEGORY_INITIAL_FORM);
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleExpenseCategoryChange = (value) => {
    const selectedCategory = allCategories.find((cat) => String(cat.id) === String(value));
    setExpenseForm((prev) => ({
      ...prev,
      category: value,
      category_name: selectedCategory?.name || '',
    }));
    if (!selectedCategory?.name?.toLowerCase().includes('food')) {
      setSelectedRestaurant(null);
    }
    if (selectedCategory?.name?.trim().toUpperCase() !== 'SPARE PARTS') {
      setSelectedSparePart(null);
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();

    if (!expenseForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!expenseForm.amount) {
      toast.error('Amount is required');
      return;
    }
    if (!expenseForm.date) {
      toast.error('Date is required');
      return;
    }
    if (!expenseForm.category) {
      toast.error('Category is required');
      return;
    }

    setSavingExpense(true);
    try {
      const endpoint = editingExpense ? `/expenses/${editingExpense.id}/` : '/expenses/';
      const method = editingExpense ? 'PATCH' : 'POST';

      const payload = {
        title: expenseForm.title.trim(),
        amount: Number(expenseForm.amount),
        description: expenseForm.description.trim(),
        date: expenseForm.date,
        category: Number(expenseForm.category),
        category_name: expenseForm.category_name,
        transaction: selectedTransaction ? selectedTransaction.id : null,
        restaurant: selectedRestaurant ? selectedRestaurant.id : null,
        spare_part: selectedSparePart ? selectedSparePart.id : null,
      };

      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to save expense');
        throw new Error(message);
      }

      toast.success(editingExpense ? 'Expense updated successfully' : 'Expense created successfully');
      setShowExpenseModal(false);
      setExpenseForm(EXPENSE_INITIAL_FORM);
      setEditingExpense(null);
      setSelectedTransaction(null);
      setSelectedRestaurant(null);
      setSelectedSparePart(null);
      await fetchExpenses();
    } catch (error) {
      toast.error(error.message || 'Failed to save expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    setExpensePage(1);
  };

  const handleCategoryFilterChange = (value) => {
    setFilterCategory(value);
    setExpensePage(1);
  };

  const handleDateFilterChange = (value) => {
    setFilterDate(value);
    setExpensePage(1);
  };

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterDate('');
    setSearchText('');
    setExpensePage(1);
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This will also delete all expenses linked to this category.`)) {
      return;
    }
    try {
      const response = await apiRequest(`/categories/${category.id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete category');
      toast.success('Category deleted successfully');
      await fetchCategories();
      await fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete category');
    }
    setOpenMenuId(null);
  };

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      return;
    }
    try {
      const response = await apiRequest(`/expenses/${expense.id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete expense');
      toast.success('Expense deleted successfully');
      await fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
    setOpenMenuId(null);
  };

  const exportExpenseToPDF = async (expense) => {
    try {
      const response = await apiRequest(`/expenses/${expense.id}/generate_receipt/`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense_${expense.title.replace(/[^a-z0-9]/gi, '_')}_${expense.date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };
  const exportToPDF = async () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterCategory) params.append('category', filterCategory);
      if (searchText) params.append('search', searchText);
      
      const response = await apiRequest(`/expenses/export_pdf/?${params}`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="expense-manager">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="table-section">
        <div className="table-header">
          <h3>{t.expenses}</h3>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button className="btn-secondary" onClick={exportToPDF}>
              📄 Export PDF
            </button>
            <button className="btn-primary" onClick={openCreateExpenseModal}>
              {t.addExpense}
            </button>
          </div>
        </div>
        <div className="filters">
          <input
            type="text"
            placeholder="Search title, description, category..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="filter-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="">{t.allCategories}</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
          <DateInput
            value={filterDate}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="filter-input"
            id="myDate"
          />
          <button onClick={handleClearFilters} className="btn-secondary">
            {t.clear}
          </button>
        </div>
        <div className="table-container">
          {loadingExpenses ? (
            <div className="loader">Loading expenses...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>{t.date}</th>
                  <th>Title</th>
                  <th>{t.category}</th>
                  <th>Shop</th>
                  <th>{t.description}</th>
                  <th>Transaction</th>
                  <th>{t.amount}</th>
                  <th style={{width: '60px'}}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, idx) => (
                  <tr key={expense.id}>
                    <td>{(expensePage - 1) * itemsPerPage + idx + 1}</td>
                    <td>{expense.date}</td>
                    <td>{expense.title}</td>
                    <td>{expense.category_name || '-'}</td>
                    <td>{expense.spare_part ? `${expense.spare_part.name}${expense.spare_part.location ? ` - ${expense.spare_part.location}` : ''}` : '-'}</td>
                    <td>{expense.description || '-'}</td>
                    <td>
                      {expense.transaction ? (
                        <span className="transaction-link" title={expense.transaction.description}>
                          💳 ¥{Number(expense.transaction.withdraw || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="no-transaction">-</span>
                      )}
                    </td>
                    <td className="amount-cell">¥{Number(expense.amount || 0).toLocaleString()}</td>
                    <td>
                      <button className="btn-menu" onClick={(e) => handleMenuClick(e, expense.id, 'expense')}>⋮</button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center' }}>
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="pagination">
          <button onClick={() => setExpensePage((p) => Math.max(1, p - 1))} disabled={expensePage === 1}>
            {t.previous}
          </button>
          <span>
            {t.page} {expensePage} {t.of} {totalExpensePages}
          </span>
          <button
            onClick={() => setExpensePage((p) => Math.min(totalExpensePages, p + 1))}
            disabled={expensePage === totalExpensePages}
          >
            {t.next}
          </button>
        </div>
      </div>
      <div className="table-section">
        <div className="table-header">
          <h3>{t.categories}</h3>
          <button className="btn-primary" onClick={openCreateCategoryModal}>
            {t.addCategory}
          </button>
        </div>

        <div className="table-container">
          {loadingCategories ? (
            <div className="loader">Loading categories...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Category</th>
                  <th>{t.description}</th>
                  <th style={{width: '60px'}}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{(categoryPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <button className="btn-menu" onClick={(e) => handleMenuClick(e, category.id, 'category')}>⋮</button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="pagination">
          <button onClick={() => setCategoryPage((p) => Math.max(1, p - 1))} disabled={categoryPage === 1}>
            {t.previous}
          </button>
          <span>
            {t.page} {categoryPage} {t.of} {totalCategoryPages}
          </span>
          <button
            onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages, p + 1))}
            disabled={categoryPage === totalCategoryPages}
          >
            {t.next}
          </button>
        </div>
      </div>


      {openMenuId && (
        <div className="menu-dropdown" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          {menuType === 'category' && (
            <>
              <button className="menu-item" onClick={() => openEditCategoryModal(categories.find(c => c.id === openMenuId))}>Edit</button>
              <button className="menu-item" onClick={() => handleDeleteCategory(categories.find(c => c.id === openMenuId))}>Delete</button>
            </>
          )}
          {menuType === 'expense' && (
            <>
              <button className="menu-item" onClick={() => openEditExpenseModal(expenses.find(e => e.id === openMenuId))}>Edit</button>
              <button className="menu-item" onClick={() => exportExpenseToPDF(expenses.find(e => e.id === openMenuId))}>Export PDF</button>
              <button className="menu-item" onClick={() => handleDeleteExpense(expenses.find(e => e.id === openMenuId))}>Delete</button>
            </>
          )}
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : t.addNewCategory}</h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  placeholder={t.categoryPlaceholder}
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.description}</label>
                <textarea
                  placeholder="Category description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCategoryModal(false)}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn-primary" disabled={savingCategory}>
                  {savingCategory ? 'Saving...' : editingCategory ? 'Update Category' : t.addCategory}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingExpense ? 'Edit Expense' : t.addNewExpense}</h3>
            
            <form onSubmit={handleExpenseSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t.amount}</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder={t.amountPlaceholder}
                    step="0.01"
                    min="0"
                    required
                    readOnly={selectedTransaction && selectedTransaction.id}
                    style={selectedTransaction && selectedTransaction.id ? {backgroundColor: '#f3f4f6', cursor: 'not-allowed'} : {}}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t.category}</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => handleExpenseCategoryChange(e.target.value)}
                    required
                  >
                    <option value="">{t.selectCategory}</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.date}</label>
                  <DateInput
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    readOnly={selectedTransaction && selectedTransaction.id}
                    style={selectedTransaction && selectedTransaction.id ? {backgroundColor: '#f3f4f6', cursor: 'not-allowed'} : {}}
                  />
                </div>
              </div>
              
              {isFoodCategory(expenseForm.category) && (
                <div className="form-group">
                  <label>Restaurant (Optional)</label>
                  <select
                    value={selectedRestaurant?.id || ''}
                    onChange={(e) => setSelectedRestaurant(restaurants.find(r => r.id === Number(e.target.value)))}
                  >
                    <option value="">Select Restaurant</option>
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name} - {r.location}</option>
                    ))}
                  </select>
                </div>
              )}

              {isSparePartsCategory(expenseForm.category) && (
                <div className="form-group">
                  <label>Shop</label>
                  <select
                    value={selectedSparePart?.id || ''}
                    onChange={(e) => setSelectedSparePart(spareParts.find((p) => p.id === Number(e.target.value)) || null)}
                    required
                  >
                    <option value="">Select Shop</option>
                    {spareParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.location ? ` - ${p.location}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label>{t.description}</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t.descriptionPlaceholder}
                  rows="3"
                />
              </div>
              
              <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '1rem'}}>
                <h4 style={{marginBottom: '1rem'}}>Link Transaction (Optional)</h4>
                <div className="form-group">
                  <label>Company Account</label>
                  <select
                    value={selectedAccount || ''}
                    onChange={(e) => {
                      setSelectedAccount(e.target.value);
                      setSelectedTransaction(null);
                      if (e.target.value) {
                        fetchTransactions(e.target.value);
                      } else {
                        setTransactions([]);
                      }
                    }}
                  >
                    <option value="">Select Account</option>
                    {companyAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number}</option>
                    ))}
                  </select>
                </div>

                {selectedAccount && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={transactionSearch}
                          onChange={(e) => setTransactionSearch(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <DateInput
                          value={transactionDate}
                          onChange={(e) => setTransactionDate(e.target.value)}
                        />
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => fetchTransactions(selectedAccount)}>Search</button>
                    </div>
                    
                    {loadingTransactions ? (
                      <div>Loading transactions...</div>
                    ) : (
                      <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px'}}>
                        {transactions.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTransaction(t);
                              setExpenseForm(prev => ({ ...prev, amount: t.withdraw, date: t.date }));
                            }}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background 0.2s',
                              background: selectedTransaction?.id === t.id ? '#f0fdf4' : 'white'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = selectedTransaction?.id === t.id ? '#f0fdf4' : '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = selectedTransaction?.id === t.id ? '#f0fdf4' : 'white'}
                          >
                            <div style={{fontWeight: '500'}}>{t.description}</div>
                            <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                              {t.date} - ¥{Number(t.withdraw).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {transactions.length === 0 && (
                          <div style={{padding: '1rem', textAlign: 'center', color: '#9ca3af'}}>No transactions found</div>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {selectedTransaction && selectedTransaction.id && (
                  <div style={{padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginTop: '1rem'}}>
                    <div style={{fontWeight: '500', color: '#166534'}}>Selected Transaction</div>
                    <div style={{fontSize: '0.875rem', color: '#15803d'}}>{selectedTransaction.description} - ¥{Number(selectedTransaction.withdraw).toLocaleString()}</div>
                    <button type="button" className="btn-secondary" onClick={() => setSelectedTransaction(null)} style={{marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}>Remove Transaction</button>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn-primary" disabled={savingExpense}>
                  {savingExpense ? 'Saving...' : editingExpense ? 'Update Expense' : t.addExpense}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
