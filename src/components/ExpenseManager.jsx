import { useEffect, useMemo, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { apiRequest } from '../api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import DateInput from './DateInput';
import DeleteConfirmModal from './DeleteConfirmModal';
import YearSelector from './YearSelector';
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
  is_cash: false,
};

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

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

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [companyAccounts, setCompanyAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const displayedTransactions = useMemo(() => {
    if (txTypeFilter === 'withdraw') {
      return transactions.filter((t) => Number(t.withdraw) > 0);
    }
    if (txTypeFilter === 'deposit') {
      return transactions.filter((t) => Number(t.deposit) > 0);
    }
    return transactions;
  }, [transactions, txTypeFilter]);

  const withdrawTxCount = useMemo(
    () => transactions.filter((t) => Number(t.withdraw) > 0).length,
    [transactions]
  );
  const depositTxCount = useMemo(
    () => transactions.filter((t) => Number(t.deposit) > 0).length,
    [transactions]
  );
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({ name: '', location: '', description: '' });
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [spareParts, setSpareParts] = useState([]);
  const [selectedSparePart, setSelectedSparePart] = useState(null);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);

  const [categoryPage, setCategoryPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [totalCategoryPages, setTotalCategoryPages] = useState(1);
  const [totalExpensePages, setTotalExpensePages] = useState(1);
  const itemsPerPage = 10;

  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCash, setFilterCash] = useState('');
  const [searchText, setSearchText] = useState('');

  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [menuType, setMenuType] = useState('');
  const menuRef = useRef(null);
  const titleInputRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const debouncedTitle = useDebounce(expenseForm.title, 1000);

  useEffect(() => {
    fetchCategories();
    fetchAllCategories();
    fetchCompanyAccounts();
    fetchRestaurants();
    fetchSpareParts();
  }, [categoryPage]);

  useEffect(() => {
    fetchExpenses();
  }, [expensePage, filterCategory, filterDate, filterDateFrom, filterDateTo, filterMonth, filterYear, filterCash, searchText]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-menu')) {
        setOpenMenuId(null);
      }
      if (titleInputRef.current && !titleInputRef.current.contains(e.target)) {
        setShowTitleSuggestions(false);
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

  useEffect(() => {
    if (debouncedTitle && debouncedTitle.trim().length > 0) {
      fetchTitleSuggestions(debouncedTitle);
    } else {
      setTitleSuggestions([]);
    }
  }, [debouncedTitle]);

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
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);
      if (filterMonth) params.append('month', filterMonth);
      if (filterYear) params.append('year', filterYear);
      if (filterCash) params.append('is_cash', filterCash);
      if (searchText) params.append('search', searchText);

      const response = await apiRequest(`/expenses/?${params}`);
      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to load expenses');
        throw new Error(message);
      }
      const data = await response.json();
      setExpenses(data.results || data || []);
      if (data.count !== undefined) {
        setTotalExpensePages(Math.max(1, Math.ceil(data.count / itemsPerPage)));
      }
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
      const response = await apiRequest('/restaurants/?page_size=1000');
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

  const fetchTitleSuggestions = async (query) => {
    try {
      const response = await apiRequest(`/expenses/search_titles/?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search titles');
      const data = await response.json();
      setTitleSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      setTitleSuggestions([]);
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
    setTxTypeFilter('all');
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
      is_cash: Boolean(expense.is_cash),
    });
    setTxTypeFilter('all');
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
    if (openMenuId === id) { setOpenMenuId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setMenuType(type);
    setOpenMenuId(id);
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

  const openNewRestaurantModal = () => {
    setRestaurantForm({ name: '', location: '', description: '' });
    setShowRestaurantModal(true);
  };

  const handleSaveRestaurant = async (event) => {
    event.preventDefault();
    if (!restaurantForm.name.trim() || !restaurantForm.location.trim()) {
      toast.error('Restaurant name and location are required');
      return;
    }

    setSavingRestaurant(true);
    try {
      const response = await apiRequest('/restaurants/', {
        method: 'POST',
        body: JSON.stringify(restaurantForm)
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to save restaurant');
        throw new Error(message);
      }

      const newRestaurant = await response.json();
      toast.success('Restaurant added successfully');
      await fetchRestaurants();
      setSelectedRestaurant(newRestaurant);
      setShowRestaurantModal(false);
      setRestaurantForm({ name: '', location: '', description: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to save restaurant');
    } finally {
      setSavingRestaurant(false);
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
        is_cash: Boolean(expenseForm.is_cash),
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

  const handleDateFromChange = (value) => {
    setFilterDateFrom(value);
    setExpensePage(1);
  };

  const handleDateToChange = (value) => {
    setFilterDateTo(value);
    setExpensePage(1);
  };

  const handleMonthFilterChange = (value) => {
    setFilterMonth(value);
    setExpensePage(1);
  };

  const handleYearFilterChange = (value) => {
    setFilterYear(value);
    setExpensePage(1);
  };

  const handleCashFilterChange = (value) => {
    setFilterCash(value);
    setExpensePage(1);
  };

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterDate('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterMonth('');
    setFilterYear('');
    setFilterCash('');
    setSearchText('');
    setExpensePage(1);
  };

  const handleDeleteCategory = async () => {
    try {
      const response = await apiRequest(`/categories/${showDeleteConfirm.item.id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete category');
      toast.success('Category deleted successfully');
      setShowDeleteConfirm(null);
      await fetchCategories();
      await fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete category');
    }
    setOpenMenuId(null);
  };

  const handleDeleteExpense = async () => {
    try {
      const response = await apiRequest(`/expenses/${showDeleteConfirm.item.id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete expense');
      toast.success('Expense deleted successfully');
      setShowDeleteConfirm(null);
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
  const getExportParams = () => {
    const params = new URLSearchParams();
    if (filterDate) params.append('date', filterDate);
    if (filterDateFrom) params.append('date_from', filterDateFrom);
    if (filterDateTo) params.append('date_to', filterDateTo);
    if (filterMonth) params.append('month', filterMonth);
    if (filterYear) params.append('year', filterYear);
    if (filterCash) params.append('is_cash', filterCash);
    if (filterCategory) params.append('category', filterCategory);
    if (searchText) params.append('search', searchText);
    return params;
  };

  const exportToPDF = async () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    try {
      const params = getExportParams();
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

  const exportToXLSX = async () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    try {
      const params = getExportParams();
      const response = await apiRequest(`/expenses/export_xlsx/?${params}`);
      if (!response.ok) throw new Error('Failed to generate Excel file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('XLSX exported successfully');
    } catch (error) {
      console.error('XLSX export error:', error);
      toast.error('Failed to export XLSX');
    }
  };

  return (
    <div className="expense-manager">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="page-header">
        <h2>{t.expenses}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={exportToXLSX}>
            📊 {t.exportXlsx || 'Export XLSX'}
          </button>
          <button className="btn-secondary" onClick={exportToPDF}>
            📄 {t.exportPdf || 'Export PDF'}
          </button>
          <button className="btn-primary" onClick={openCreateExpenseModal}>
            {t.addExpense}
          </button>
        </div>
      </div>

      <div className="table-section">
        <div className="filters">
          <input
            type="text"
            placeholder={t.searchPlaceholder || "Search title, description, category..."}
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
          <YearSelector
            value={filterYear}
            onChange={handleYearFilterChange}
            placeholder={t.allYears || 'All Years'}
          />
          <select
            value={filterMonth}
            onChange={(e) => handleMonthFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="">{t.allMonths || 'All Months'}</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {language === 'ja' ? `${m.value}月` : m.label}
              </option>
            ))}
          </select>
          <select
            value={filterCash}
            onChange={(e) => handleCashFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="">{t.allPaymentStatus || 'All Payments'}</option>
            <option value="true">💵 {t.cashOnly || 'Cash Only'}</option>
            <option value="false">{t.nonCash || 'Non-Cash / Bank'}</option>
          </select>
          <div className="filter-date-field" title={t.fromDate || 'From Date'}>
            <span className="filter-field-label">{t.fromDate || 'From'}:</span>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="filter-input filter-date-picker"
            />
          </div>
          <div className="filter-date-field" title={t.toDate || 'To Date'}>
            <span className="filter-field-label">{t.toDate || 'To'}:</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="filter-input filter-date-picker"
            />
          </div>
          <button onClick={handleClearFilters} className="btn-secondary">
            {t.clear}
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sr</th>
                <th>{t.date}</th>
                <th>Title</th>
                <th>{t.category}</th>
                <th>Shop</th>
                <th>{t.description}</th>
                <th>Payment / Transaction</th>
                <th>{t.amount}</th>
                <th style={{ width: '60px' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loadingExpenses ? (
                <tr>
                  <td colSpan="9">
                    <div className="table-loader-container">
                      <div className="spinner"></div>
                      <span>Loading expenses...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense, idx) => (
                  <tr key={expense.id}>
                    <td>{(expensePage - 1) * itemsPerPage + idx + 1}</td>
                    <td>{expense.date}</td>
                    <td>{expense.title}</td>
                    <td>{expense.category_name || '-'}</td>
                    <td>{expense.spare_part ? `${expense.spare_part.name}${expense.spare_part.address ? ` - ${expense.spare_part.address}` : ''}` : '-'}</td>
                    <td>{expense.description || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                        {expense.is_cash && (
                          <span
                            className="badge-cash"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0'
                            }}
                          >
                            💵 Cash
                          </span>
                        )}
                        {expense.transaction ? (
                          <span
                            className="transaction-link"
                            title={`${expense.transaction.description || ''} • Deposit: ¥${Number(expense.transaction.deposit || 0).toLocaleString()} • Withdraw: ¥${Number(expense.transaction.withdraw || 0).toLocaleString()}`}
                          >
                            💳 {Number(expense.transaction.deposit) > 0 && !(Number(expense.transaction.withdraw) > 0)
                              ? `Deposit ¥${Number(expense.transaction.deposit).toLocaleString()}`
                              : `¥${Number(expense.transaction.withdraw || expense.transaction.deposit || 0).toLocaleString()}`}
                          </span>
                        ) : (
                          !expense.is_cash && <span className="no-transaction">-</span>
                        )}
                      </div>
                    </td>
                    <td className="amount-cell">¥{Number(expense.amount || 0).toLocaleString()}</td>
                    <td>
                      <button className={`btn-menu ${openMenuId === expense.id && menuType === 'expense' ? 'active' : ''}`} onClick={(e) => handleMenuClick(e, expense.id, 'expense')}>⋮</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          <table>
            <thead>
              <tr>
                <th>Sr</th>
                <th>Category</th>
                <th>{t.description}</th>
                <th style={{ width: '60px' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loadingCategories ? (
                <tr>
                  <td colSpan="4">
                    <div className="loader">Loading categories...</div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{(categoryPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <button className="btn-menu" onClick={(e) => handleMenuClick(e, category.id, 'category')}>⋮</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
        <div className="context-menu" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
          {menuType === 'category' && (() => {
            const cat = categories.find(c => c.id === openMenuId);
            return cat ? (
              <>
                <button onClick={() => openEditCategoryModal(cat)}>✏️ Edit</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm({ type: 'category', item: cat, label: `"${cat.name}"`, warning: 'This will also delete all expenses linked to this category.' }); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
          {menuType === 'expense' && (() => {
            const exp = expenses.find(e => e.id === openMenuId);
            return exp ? (
              <>
                <button onClick={() => openEditExpenseModal(exp)}>✏️ Edit</button>
                <button onClick={() => exportExpenseToPDF(exp)}>📄 Export PDF</button>
                <button className="danger" onClick={() => { setShowDeleteConfirm({ type: 'expense', item: exp, label: `"${exp.title}"`, warning: '' }); setOpenMenuId(null); }}>🗑️ Delete</button>
              </>
            ) : null;
          })()}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={showDeleteConfirm?.type === 'category' ? handleDeleteCategory : handleDeleteExpense}
        title={showDeleteConfirm?.type === 'category' ? 'Delete Category' : 'Delete Expense'}
        message={`Are you sure you want to delete ${showDeleteConfirm?.label}? ${showDeleteConfirm?.warning || 'This action cannot be undone.'}`}
      />

      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>{editingCategory ? 'Edit Category' : t.addNewCategory}</h3>
              <button className="modal-close" type="button" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
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
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>{editingExpense ? 'Edit Expense' : t.addNewExpense}</h3>
              <button className="modal-close" type="button" onClick={() => setShowExpenseModal(false)}>×</button>
            </div>

            <form onSubmit={handleExpenseSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ position: 'relative' }} ref={titleInputRef}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={expenseForm.title}
                    onChange={(e) => {
                      setExpenseForm((prev) => ({ ...prev, title: e.target.value }));
                      setShowTitleSuggestions(true);
                    }}
                    onFocus={() => setShowTitleSuggestions(true)}
                    required
                  />
                  {showTitleSuggestions && titleSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: 'var(--shadow-lift)'
                    }}>
                      {titleSuggestions.map((title, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setExpenseForm((prev) => ({ ...prev, title }));
                            setShowTitleSuggestions(false);
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: idx < titleSuggestions.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'all 0.2s ease',
                            fontSize: '0.875rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--secondary)';
                            e.currentTarget.style.color = 'var(--ink)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'inherit';
                          }}
                        >
                          {title}
                        </div>
                      ))}
                    </div>
                  )}
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
                    style={selectedTransaction && selectedTransaction.id ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
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
                    style={selectedTransaction && selectedTransaction.id ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>

              {isFoodCategory(expenseForm.category) && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ margin: 0 }}>Restaurant (Optional)</label>
                    <button
                      type="button"
                      onClick={openNewRestaurantModal}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        textDecoration: 'underline'
                      }}
                    >
                      + Add Restaurant
                    </button>
                  </div>
                  <select
                    value={selectedRestaurant?.id || ''}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        openNewRestaurantModal();
                        return;
                      }
                      setSelectedRestaurant(
                        restaurants.find((r) => r.id === Number(e.target.value)) || null
                      );
                    }}
                  >
                    <option value="">Select Restaurant</option>
                    <option value="__add_new__" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      ➕ + Add New Restaurant...
                    </option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isSparePartsCategory(expenseForm.category) && (
                <div className="form-group">
                  <label>Shop (Optional)</label>
                  <select
                    value={selectedSparePart?.id || ''}
                    onChange={(e) =>
                      setSelectedSparePart(
                        spareParts.find(p => p.id === Number(e.target.value)) || null
                      )
                    }
                  >
                    <option value="">Select Shop</option>
                    {spareParts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.address ? ` - ${p.address}` : ''}
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

              <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'var(--secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>💵 {t.paidInCash || 'Paid in Cash'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mark this expense as paid with physical cash</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(expenseForm.is_cash)}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, is_cash: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: expenseForm.is_cash ? '#16a34a' : 'var(--muted-foreground)' }}>
                    {expenseForm.is_cash ? 'Cash' : 'No'}
                  </span>
                </label>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Link Transaction (Optional)</h4>
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

                    {/* Filter buttons and explanation */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', marginRight: '0.25rem' }}>Show:</span>
                      <button
                        type="button"
                        onClick={() => setTxTypeFilter('all')}
                        style={{
                          fontSize: '0.725rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '16px',
                          border: txTypeFilter === 'all' ? '1px solid var(--foreground)' : '1px solid var(--border)',
                          background: txTypeFilter === 'all' ? 'var(--foreground)' : 'var(--card)',
                          color: txTypeFilter === 'all' ? 'var(--background)' : 'var(--foreground)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        All ({transactions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxTypeFilter('withdraw')}
                        style={{
                          fontSize: '0.725rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '16px',
                          border: txTypeFilter === 'withdraw' ? '1px solid #b91c1c' : '1px solid #fecdd3',
                          background: txTypeFilter === 'withdraw' ? '#b91c1c' : '#fff1f2',
                          color: txTypeFilter === 'withdraw' ? '#ffffff' : '#b91c1c',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        📤 Withdrawals ({withdrawTxCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxTypeFilter('deposit')}
                        style={{
                          fontSize: '0.725rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '16px',
                          border: txTypeFilter === 'deposit' ? '1px solid #15803d' : '1px solid #a7f3d0',
                          background: txTypeFilter === 'deposit' ? '#15803d' : '#ecfdf5',
                          color: txTypeFilter === 'deposit' ? '#ffffff' : '#15803d',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        📥 Deposits ({depositTxCount})
                      </button>
                    </div>

                    <div style={{
                      fontSize: '0.75rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--secondary)',
                      border: '1px solid var(--border)',
                      marginBottom: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: 'var(--foreground)'
                    }}>
                      <span>ℹ️</span>
                      <span>
                        <strong style={{ color: '#15803d' }}>Deposit (入金)</strong> = Money into account &nbsp;•&nbsp; <strong style={{ color: '#b91c1c' }}>Withdraw (出金)</strong> = Money out of account
                      </span>
                    </div>

                    {loadingTransactions ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>Loading transactions...</div>
                    ) : (
                      <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--card)', padding: '0.35rem' }}>
                        {displayedTransactions.map(t => {
                          const isSelected = selectedTransaction?.id === t.id;
                          const hasDeposit = Number(t.deposit) > 0;
                          const hasWithdraw = Number(t.withdraw) > 0;

                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setSelectedTransaction(t);
                                const chosenAmount = hasWithdraw ? t.withdraw : (hasDeposit ? t.deposit : (t.withdraw || t.deposit || ''));
                                setExpenseForm(prev => ({ ...prev, amount: chosenAmount, date: t.date }));
                              }}
                              style={{
                                padding: '0.7rem 0.9rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border)',
                                transition: 'all 0.2s ease',
                                borderRadius: '10px',
                                marginBottom: '4px',
                                background: isSelected ? 'var(--color-lime)' : 'transparent',
                                color: isSelected ? 'var(--color-ink)' : 'inherit',
                                border: isSelected ? '1px solid var(--primary)' : '1px solid transparent'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'var(--secondary)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'currentColor' : 'var(--foreground)', marginBottom: '0.35rem' }}>
                                📅 {t.date}
                              </div>

                              {/* Both Deposit & Withdraw amounts */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div style={{
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  background: hasDeposit ? (isSelected ? 'rgba(22, 101, 52, 0.15)' : '#ecfdf5') : (isSelected ? 'rgba(0,0,0,0.05)' : 'var(--secondary)'),
                                  border: hasDeposit ? '1px solid #a7f3d0' : '1px solid var(--border)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: hasDeposit ? '#166534' : 'var(--muted-foreground)' }}>
                                    📥 Deposit:
                                  </span>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: hasDeposit ? '#15803d' : 'var(--muted-foreground)' }}>
                                    {hasDeposit ? `+¥${Number(t.deposit).toLocaleString()}` : '¥0'}
                                  </span>
                                </div>

                                <div style={{
                                  padding: '0.35rem 0.5rem',
                                  borderRadius: '6px',
                                  background: hasWithdraw ? (isSelected ? 'rgba(153, 27, 27, 0.15)' : '#fff1f2') : (isSelected ? 'rgba(0,0,0,0.05)' : 'var(--secondary)'),
                                  border: hasWithdraw ? '1px solid #fecdd3' : '1px solid var(--border)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: hasWithdraw ? '#991b1b' : 'var(--muted-foreground)' }}>
                                    📤 Withdraw:
                                  </span>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: hasWithdraw ? '#b91c1c' : 'var(--muted-foreground)' }}>
                                    {hasWithdraw ? `-¥${Number(t.withdraw).toLocaleString()}` : '¥0'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {displayedTransactions.length === 0 && (
                          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                            {transactions.length === 0 ? 'No transactions found' : 'No transactions match the selected filter'}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {selectedTransaction && selectedTransaction.id && (
                  <div style={{ padding: '1rem 1.25rem', background: 'var(--color-lime)', color: 'var(--color-ink)', borderRadius: '16px', marginTop: '1rem', border: '1px solid var(--color-lime)', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Selected Transaction</div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                      <div>📅 <strong>{selectedTransaction.date}</strong></div>
                      <div>
                        📥 Deposit: <strong style={{ color: Number(selectedTransaction.deposit) > 0 ? '#15803d' : 'inherit' }}>
                          ¥{Number(selectedTransaction.deposit || 0).toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        📤 Withdraw: <strong style={{ color: Number(selectedTransaction.withdraw) > 0 ? '#b91c1c' : 'inherit' }}>
                          ¥{Number(selectedTransaction.withdraw || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {Number(selectedTransaction.deposit) > 0 && Number(selectedTransaction.withdraw) > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Apply amount to expense:</span>
                        <button
                          type="button"
                          onClick={() => setExpenseForm(prev => ({ ...prev, amount: selectedTransaction.withdraw }))}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #b91c1c',
                            background: Number(expenseForm.amount) === Number(selectedTransaction.withdraw) ? '#b91c1c' : '#ffffff',
                            color: Number(expenseForm.amount) === Number(selectedTransaction.withdraw) ? '#ffffff' : '#b91c1c',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Withdraw (¥{Number(selectedTransaction.withdraw).toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseForm(prev => ({ ...prev, amount: selectedTransaction.deposit }))}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #15803d',
                            background: Number(expenseForm.amount) === Number(selectedTransaction.deposit) ? '#15803d' : '#ffffff',
                            color: Number(expenseForm.amount) === Number(selectedTransaction.deposit) ? '#ffffff' : '#15803d',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Deposit (¥{Number(selectedTransaction.deposit).toLocaleString()})
                        </button>
                      </div>
                    )}

                    <button type="button" className="btn-secondary" onClick={() => setSelectedTransaction(null)} style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Remove Transaction</button>
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

      {/* Add Restaurant Modal */}
      {showRestaurantModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Add New Restaurant</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowRestaurantModal(false)}
              >×</button>
            </div>
            <form onSubmit={handleSaveRestaurant} className="modal-form">
              <div className="form-group">
                <label>Restaurant Name <span style={{ color: 'var(--destructive, #ef4444)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tokyo Ramen"
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Location <span style={{ color: 'var(--destructive, #ef4444)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Shibuya, Tokyo"
                  value={restaurantForm.location}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Optional details or notes"
                  rows="2"
                  value={restaurantForm.description}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRestaurantModal(false)}
                  disabled={savingRestaurant}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingRestaurant}
                >
                  {savingRestaurant ? 'Saving...' : 'Save Restaurant'}
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
