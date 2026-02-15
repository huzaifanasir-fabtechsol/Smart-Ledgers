import { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { apiRequest } from '../api';
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

  const [categoryPage, setCategoryPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const itemsPerPage = 10;

  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await apiRequest('/categories/');
      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to load categories');
        throw new Error(message);
      }
      const data = await response.json();
      const list = parseListResponse(data);
      setCategories(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const response = await apiRequest('/expenses/');
      if (!response.ok) {
        const message = await getErrorMessage(response, 'Failed to load expenses');
        throw new Error(message);
      }
      const data = await response.json();
      const list = parseListResponse(data);
      setExpenses(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(error.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseCategoryName = expense.category_name || '';
      const categoryMatch = !filterCategory || String(expense.category) === String(filterCategory);
      const dateMatch = !filterDate || expense.date === filterDate;
      const searchMatch =
        !searchText ||
        expenseCategoryName.toLowerCase().includes(searchText.toLowerCase()) ||
        (expense.description || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (expense.title || '').toLowerCase().includes(searchText.toLowerCase());

      return categoryMatch && dateMatch && searchMatch;
    });
  }, [expenses, filterCategory, filterDate, searchText]);

  const paginatedCategories = useMemo(() => {
    const start = (categoryPage - 1) * itemsPerPage;
    return categories.slice(start, start + itemsPerPage);
  }, [categories, categoryPage]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * itemsPerPage;
    return filteredExpenses.slice(start, start + itemsPerPage);
  }, [filteredExpenses, expensePage]);

  const totalCategoryPages = Math.max(1, Math.ceil(categories.length / itemsPerPage));
  const totalExpensePages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));

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
  };

  const openCreateExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm(EXPENSE_INITIAL_FORM);
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
    setShowExpenseModal(true);
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
    const selectedCategory = categories.find((cat) => String(cat.id) === String(value));
    setExpenseForm((prev) => ({
      ...prev,
      category: value,
      category_name: selectedCategory?.name || '',
    }));
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

  return (
    <div className="expense-manager">
      <ToastContainer position="top-right" autoClose={3000} />

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
                  <th>{t.id}</th>
                  <th>{t.categoryName}</th>
                  <th>{t.description}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <button className="btn-small btn-edit" onClick={() => openEditCategoryModal(category)}>
                        {t.edit}
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedCategories.length === 0 && (
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

      <div className="table-section">
        <div className="table-header">
          <h3>{t.expenses}</h3>
          <button className="btn-primary" onClick={openCreateExpenseModal}>
            {t.addExpense}
          </button>
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
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="filter-input"
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
                  <th>{t.date}</th>
                  <th>Title</th>
                  <th>{t.category}</th>
                  <th>{t.description}</th>
                  <th>{t.amount}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>
                    <td>{expense.title}</td>
                    <td>{expense.category_name || '-'}</td>
                    <td>{expense.description || '-'}</td>
                    <td className="amount-cell">${Number(expense.amount || 0).toLocaleString()}</td>
                    <td>
                      <button className="btn-small btn-edit" onClick={() => openEditExpenseModal(expense)}>
                        {t.edit}
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedExpenses.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>
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

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : t.addNewCategory}</h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label>{t.categoryName}</label>
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
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.date}</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t.description}</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t.descriptionPlaceholder}
                  rows="3"
                />
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
