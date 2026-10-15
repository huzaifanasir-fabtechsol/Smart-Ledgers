import { useEffect, useMemo, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { translations } from "../translations";
import { apiRequest } from "../api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import DateInput from "./DateInput";
import DeleteConfirmModal from "./DeleteConfirmModal";
import YearSelector from "./YearSelector";
import Pagination from "./Pagination";
import ExpenseBulkImport from "./ExpenseBulkImport";
import "./ExpenseManager.css";
const CATEGORY_INITIAL_FORM = {
  name: "",
  description: ""
};
const EXPENSE_INITIAL_FORM = {
  title: "",
  amount: "",
  description: "",
  date: "",
  category: "",
  category_name: "",
  is_cash: false,
  is_highlighted: false,
  apply_tax: false,
  tax_category: "exclusive",
  tax_percent_used: ""
};
const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];
const parseListResponse = (data) => data?.results || data || [];
const getErrorMessage = async (response, fallback) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }
    if (data && typeof data === "object") {
      const [field, value] = Object.entries(data)[0] || [];
      if (Array.isArray(value) && value.length > 0) return `${field}: ${value[0]}`;
      if (typeof value === "string") return `${field}: ${value}`;
    }
  } catch {
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
const ExpenseManager = ({ language = "en" }) => {
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
  const [taxRates, setTaxRates] = useState([]);
  const [isCustomTax, setIsCustomTax] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [companyAccounts, setCompanyAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const displayedTransactions = useMemo(() => {
    if (txTypeFilter === "withdraw") {
      return transactions.filter((t2) => Number(t2.withdraw) > 0);
    }
    if (txTypeFilter === "deposit") {
      return transactions.filter((t2) => Number(t2.deposit) > 0);
    }
    return transactions;
  }, [transactions, txTypeFilter]);
  const withdrawTxCount = useMemo(
    () => transactions.filter((t2) => Number(t2.withdraw) > 0).length,
    [transactions]
  );
  const depositTxCount = useMemo(
    () => transactions.filter((t2) => Number(t2.deposit) > 0).length,
    [transactions]
  );
  const taxSettlement = useMemo(() => {
    const rawAmount = parseFloat(expenseForm.amount);
    if (isNaN(rawAmount) || rawAmount <= 0 || !expenseForm.apply_tax) {
      return null;
    }
    const rate = parseFloat(expenseForm.tax_percent_used);
    if (isNaN(rate) || rate <= 0) {
      return null;
    }
    if (expenseForm.tax_category === "inclusive") {
      const base = parseFloat((rawAmount / (1 + rate / 100)).toFixed(2));
      const tax = parseFloat((rawAmount - base).toFixed(2));
      return {
        mode: "inclusive",
        originalAmount: base,
        taxAmount: tax,
        totalAmount: rawAmount,
        rate
      };
    } else {
      const tax = parseFloat((rawAmount * rate / 100).toFixed(2));
      const total = parseFloat((rawAmount + tax).toFixed(2));
      return {
        mode: "exclusive",
        originalAmount: rawAmount,
        taxAmount: tax,
        totalAmount: total,
        rate
      };
    }
  }, [expenseForm.amount, expenseForm.apply_tax, expenseForm.tax_category, expenseForm.tax_percent_used]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({ name: "", location: "", description: "" });
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [spareParts, setSpareParts] = useState([]);
  const [selectedSparePart, setSelectedSparePart] = useState(null);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [totalCategoryPages, setTotalCategoryPages] = useState(1);
  const [totalExpensePages, setTotalExpensePages] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);
  const [categoryPageSize, setCategoryPageSize] = useState(10);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterCash, setFilterCash] = useState("");
  const [searchText, setSearchText] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [menuType, setMenuType] = useState("");
  const menuRef = useRef(null);
  const titleInputRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const debouncedTitle = useDebounce(expenseForm.title, 1e3);
  useEffect(() => {
    fetchCategories();
    fetchAllCategories();
    fetchCompanyAccounts();
    fetchRestaurants();
    fetchSpareParts();
    fetchTaxRates();
  }, [categoryPage, categoryPageSize]);
  useEffect(() => {
    fetchExpenses();
  }, [expensePage, expensePageSize, filterCategory, filterDate, filterDateFrom, filterDateTo, filterMonth, filterYear, filterCash, searchText]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest(".btn-menu")) {
        setOpenMenuId(null);
      }
      if (titleInputRef.current && !titleInputRef.current.contains(e.target)) {
        setShowTitleSuggestions(false);
      }
    };
    const handleCloseMenu = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleCloseMenu, true);
    window.addEventListener("resize", handleCloseMenu);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleCloseMenu, true);
      window.removeEventListener("resize", handleCloseMenu);
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
      const params = new URLSearchParams({ page: categoryPage, page_size: categoryPageSize, pageSize: categoryPageSize });
      const response = await apiRequest(`/categories/?${params}`);
      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to load categories");
        throw new Error(message);
      }
      const data = await response.json();
      setCategories(data.results || data || []);
      if (data.count) setTotalCategoryPages(Math.ceil(data.count / categoryPageSize));
    } catch (error) {
      toast.error(error.message || "Failed to load categories");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };
  const fetchAllCategories = async () => {
    try {
      const response = await apiRequest("/categories/all/");
      if (!response.ok) throw new Error("Failed to load all categories");
      const data = await response.json();
      setAllCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load all categories");
    }
  };
  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const params = new URLSearchParams({ page: expensePage, page_size: expensePageSize, pageSize: expensePageSize });
      if (filterCategory) params.append("category", filterCategory);
      if (filterDate) params.append("date", filterDate);
      if (filterDateFrom) params.append("date_from", filterDateFrom);
      if (filterDateTo) params.append("date_to", filterDateTo);
      if (filterMonth) params.append("month", filterMonth);
      if (filterYear) params.append("year", filterYear);
      if (filterCash) params.append("is_cash", filterCash);
      if (searchText) params.append("search", searchText);
      const response = await apiRequest(`/expenses/?${params}`);
      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to load expenses");
        throw new Error(message);
      }
      const data = await response.json();
      setExpenses(data.results || data || []);
      if (data.count !== void 0) {
        setTotalExpensePages(Math.max(1, Math.ceil(data.count / expensePageSize)));
      }
    } catch (error) {
      toast.error(error.message || "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  };
  const fetchCompanyAccounts = async () => {
    try {
      const response = await apiRequest("/revenue/company-accounts/");
      if (!response.ok) throw new Error("Failed to load accounts");
      const data = await response.json();
      setCompanyAccounts(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load accounts");
      setCompanyAccounts([]);
    }
  };
  const fetchRestaurants = async () => {
    try {
      const response = await apiRequest("/restaurants/?page_size=1000");
      if (!response.ok) throw new Error("Failed to load restaurants");
      const data = await response.json();
      setRestaurants(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load restaurants");
      setRestaurants([]);
    }
  };
  const fetchSpareParts = async () => {
    try {
      const response = await apiRequest("/spare-parts/?page_size=1000");
      if (!response.ok) throw new Error("Failed to load spare parts");
      const data = await response.json();
      setSpareParts(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load spare parts");
      setSpareParts([]);
    }
  };
  const fetchTaxRates = async () => {
    try {
      const response = await apiRequest("/account/tax-rates/");
      if (!response.ok) return;
      const data = await response.json();
      setTaxRates(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch {
    }
  };
  const fetchTitleSuggestions = async (query) => {
    try {
      const response = await apiRequest(`/expenses/search_titles/?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Failed to search titles");
      const data = await response.json();
      setTitleSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      setTitleSuggestions([]);
    }
  };
  const isFoodCategory = (categoryId) => {
    if (!categoryId) return false;
    const category = allCategories.find((c) => String(c.id) === String(categoryId));
    return Boolean(category?.name && category.name.toLowerCase().includes("food"));
  };
  const isSparePartsCategory = (categoryId) => {
    if (!categoryId) return false;
    const category = allCategories.find((c) => String(c.id) === String(categoryId));
    return Boolean(category?.name && category.name.trim().toUpperCase() === "SPARE PARTS");
  };
  const fetchTransactions = async (accountId) => {
    if (!accountId) return;
    setLoadingTransactions(true);
    try {
      const params = new URLSearchParams({ account_id: accountId });
      if (transactionSearch) params.append("search", transactionSearch);
      if (transactionDate) params.append("date", transactionDate);
      const response = await apiRequest(`/expenses/available_transactions/?${params}`);
      if (!response.ok) throw new Error("Failed to load transactions");
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load transactions");
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
      name: category.name || "",
      description: category.description || ""
    });
    setShowCategoryModal(true);
    setOpenMenuId(null);
  };
  const openCreateExpenseModal = () => {
    setEditingExpense(null);
    setIsCustomTax(false);
    setExpenseForm(EXPENSE_INITIAL_FORM);
    setSelectedTransaction(null);
    setSelectedAccount(null);
    setSelectedRestaurant(null);
    setSelectedSparePart(null);
    setTransactions([]);
    setTxTypeFilter("all");
    setShowExpenseModal(true);
  };
  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    const hasTax = expense.tax_percent_used != null && Number(expense.tax_percent_used) > 0;
    const rateVal = hasTax ? String(expense.tax_percent_used) : "";
    const matchesPreset = hasTax && taxRates.some((tr) => Number(tr.rate) === Number(expense.tax_percent_used));
    setIsCustomTax(hasTax && !matchesPreset);
    const taxCategory = expense.tax_category || "exclusive";
    const displayAmount = hasTax && taxCategory === "inclusive" ? expense.total_amount != null ? String(expense.total_amount) : String(Number(expense.amount || 0) + Number(expense.tax_amount || 0)) : expense.amount != null ? String(expense.amount) : "";
    setExpenseForm({
      title: expense.title || "",
      amount: displayAmount,
      description: expense.description || "",
      date: expense.date || "",
      category: expense.category ? String(expense.category) : "",
      category_name: expense.category_name || "",
      is_cash: Boolean(expense.is_cash),
      is_highlighted: Boolean(expense.is_highlighted),
      apply_tax: hasTax,
      tax_category: taxCategory,
      tax_percent_used: rateVal
    });
    setTxTypeFilter("all");
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
    setMenuType(type);
    setOpenMenuId(id);
  };
  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSavingCategory(true);
    try {
      const endpoint = editingCategory ? `/categories/${editingCategory.id}/` : "/categories/";
      const method = editingCategory ? "PATCH" : "POST";
      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim()
        })
      });
      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to save category");
        throw new Error(message);
      }
      toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
      setShowCategoryModal(false);
      setCategoryForm(CATEGORY_INITIAL_FORM);
      setEditingCategory(null);
      await fetchCategories();
    } catch (error) {
      toast.error(error.message || "Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  };
  const openNewRestaurantModal = () => {
    setRestaurantForm({ name: "", location: "", description: "" });
    setShowRestaurantModal(true);
  };
  const handleSaveRestaurant = async (event) => {
    event.preventDefault();
    if (!restaurantForm.name.trim() || !restaurantForm.location.trim()) {
      toast.error("Restaurant name and location are required");
      return;
    }
    setSavingRestaurant(true);
    try {
      const response = await apiRequest("/restaurants/", {
        method: "POST",
        body: JSON.stringify(restaurantForm)
      });
      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to save restaurant");
        throw new Error(message);
      }
      const newRestaurant = await response.json();
      toast.success("Restaurant added successfully");
      await fetchRestaurants();
      setSelectedRestaurant(newRestaurant);
      setShowRestaurantModal(false);
      setRestaurantForm({ name: "", location: "", description: "" });
    } catch (error) {
      toast.error(error.message || "Failed to save restaurant");
    } finally {
      setSavingRestaurant(false);
    }
  };
  const handleExpenseCategoryChange = (value) => {
    const selectedCategory = allCategories.find((cat) => String(cat.id) === String(value));
    setExpenseForm((prev) => ({
      ...prev,
      category: value,
      category_name: selectedCategory?.name || ""
    }));
    if (!selectedCategory?.name?.toLowerCase().includes("food")) {
      setSelectedRestaurant(null);
    }
    if (selectedCategory?.name?.trim().toUpperCase() !== "SPARE PARTS") {
      setSelectedSparePart(null);
    }
  };
  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!expenseForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!expenseForm.amount) {
      toast.error("Amount is required");
      return;
    }
    if (!expenseForm.date) {
      toast.error("Date is required");
      return;
    }
    if (!expenseForm.category) {
      toast.error("Category is required");
      return;
    }
    setSavingExpense(true);
    try {
      const endpoint = editingExpense ? `/expenses/${editingExpense.id}/` : "/expenses/";
      const method = editingExpense ? "PATCH" : "POST";
      const rawAmount = Number(expenseForm.amount);
      const taxPercent = expenseForm.apply_tax && expenseForm.tax_percent_used !== "" ? Number(expenseForm.tax_percent_used) : null;
      let baseAmount = rawAmount;
      let taxAmount = null;
      const taxCategory = expenseForm.apply_tax ? expenseForm.tax_category || "exclusive" : "exclusive";
      if (taxPercent != null && taxPercent > 0) {
        if (taxCategory === "inclusive") {
          baseAmount = parseFloat((rawAmount / (1 + taxPercent / 100)).toFixed(2));
          taxAmount = parseFloat((rawAmount - baseAmount).toFixed(2));
        } else {
          baseAmount = rawAmount;
          taxAmount = parseFloat((rawAmount * taxPercent / 100).toFixed(2));
        }
      }
      const payload = {
        title: expenseForm.title.trim(),
        amount: baseAmount,
        description: expenseForm.description.trim(),
        date: expenseForm.date,
        category: Number(expenseForm.category),
        category_name: expenseForm.category_name,
        transaction: selectedTransaction ? selectedTransaction.id : null,
        restaurant: selectedRestaurant ? selectedRestaurant.id : null,
        spare_part: selectedSparePart ? selectedSparePart.id : null,
        is_cash: Boolean(expenseForm.is_cash),
        is_highlighted: Boolean(expenseForm.is_highlighted),
        tax_category: taxCategory,
        tax_percent_used: taxPercent,
        tax_amount: taxAmount
      };
      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to save expense");
        throw new Error(message);
      }
      toast.success(editingExpense ? "Expense updated successfully" : "Expense created successfully");
      setShowExpenseModal(false);
      setExpenseForm(EXPENSE_INITIAL_FORM);
      setEditingExpense(null);
      setSelectedTransaction(null);
      setSelectedRestaurant(null);
      setSelectedSparePart(null);
      await fetchExpenses();
    } catch (error) {
      toast.error(error.message || "Failed to save expense");
    } finally {
      setSavingExpense(false);
    }
  };
  const handleToggleHighlight = async (expense) => {
    const next = !expense.is_highlighted;
    setExpenses((prev) => prev.map((e) => e.id === expense.id ? { ...e, is_highlighted: next } : e));
    try {
      const response = await apiRequest(`/expenses/${expense.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_highlighted: next })
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, "Failed to update highlight"));
    } catch (error) {
      setExpenses((prev) => prev.map((e) => e.id === expense.id ? { ...e, is_highlighted: !next } : e));
      toast.error(error.message || "Failed to update highlight");
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
    setFilterCategory("");
    setFilterDate("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMonth("");
    setFilterYear("");
    setFilterCash("");
    setSearchText("");
    setExpensePage(1);
  };
  const handleDeleteCategory = async () => {
    try {
      const response = await apiRequest(`/categories/${showDeleteConfirm.item.id}/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete category");
      toast.success("Category deleted successfully");
      setShowDeleteConfirm(null);
      await fetchCategories();
      await fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete category");
    }
    setOpenMenuId(null);
  };
  const handleDeleteExpense = async () => {
    try {
      const response = await apiRequest(`/expenses/${showDeleteConfirm.item.id}/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete expense");
      toast.success("Expense deleted successfully");
      setShowDeleteConfirm(null);
      await fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
    setOpenMenuId(null);
  };
  const exportExpenseToPDF = async (expense) => {
    try {
      const response = await apiRequest(`/expenses/${expense.id}/generate_receipt/`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense_${expense.title.replace(/[^a-z0-9]/gi, "_")}_${expense.date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };
  const getExportParams = () => {
    const params = new URLSearchParams();
    if (filterDate) params.append("date", filterDate);
    if (filterDateFrom) params.append("date_from", filterDateFrom);
    if (filterDateTo) params.append("date_to", filterDateTo);
    if (filterMonth) params.append("month", filterMonth);
    if (filterYear) params.append("year", filterYear);
    if (filterCash) params.append("is_cash", filterCash);
    if (filterCategory) params.append("category", filterCategory);
    if (searchText) params.append("search", searchText);
    return params;
  };
  const exportToPDF = async () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    try {
      const params = getExportParams();
      const response = await apiRequest(`/expenses/export_pdf/?${params}`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses_${(/* @__PURE__ */ new Date()).getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };
  const exportToXLSX = async () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    try {
      const params = getExportParams();
      const response = await apiRequest(`/expenses/export_xlsx/?${params}`);
      if (!response.ok) throw new Error("Failed to generate Excel file");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses_${(/* @__PURE__ */ new Date()).getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("XLSX exported successfully");
    } catch (error) {
      console.error("XLSX export error:", error);
      toast.error("Failed to export XLSX");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "expense-manager" }, /* @__PURE__ */ React.createElement(ToastContainer, { position: "top-right", autoClose: 3e3 }), /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("h2", null, t.expenses), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn-secondary", onClick: exportToXLSX }, "\u{1F4CA} ", t.exportXlsx || "Export XLSX"), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary", onClick: exportToPDF }, "\u{1F4C4} ", t.exportPdf || "Export PDF"), /* @__PURE__ */ React.createElement(
    ExpenseBulkImport,
    {
      companyAccounts,
      onImported: () => {
        fetchExpenses();
        fetchCategories();
        fetchAllCategories();
      }
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "btn-primary", onClick: openCreateExpenseModal }, t.addExpense))), /* @__PURE__ */ React.createElement("div", { className: "table-section" }, /* @__PURE__ */ React.createElement("div", { className: "filters" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: t.searchPlaceholder || "Search title, description, category...",
      value: searchText,
      onChange: (e) => handleSearchChange(e.target.value),
      className: "filter-input"
    }
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: filterCategory,
      onChange: (e) => handleCategoryFilterChange(e.target.value),
      className: "filter-select"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, t.allCategories),
    allCategories.map((cat) => /* @__PURE__ */ React.createElement("option", { key: cat.id, value: String(cat.id) }, cat.name))
  ), /* @__PURE__ */ React.createElement(
    YearSelector,
    {
      value: filterYear,
      onChange: handleYearFilterChange,
      placeholder: t.allYears || "All Years"
    }
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: filterMonth,
      onChange: (e) => handleMonthFilterChange(e.target.value),
      className: "filter-select"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, t.allMonths || "All Months"),
    MONTHS.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.value, value: m.value }, language === "ja" ? `${m.value}\u6708` : m.label))
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: filterCash,
      onChange: (e) => handleCashFilterChange(e.target.value),
      className: "filter-select"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, t.allPaymentStatus || "All Payments"),
    /* @__PURE__ */ React.createElement("option", { value: "true" }, "\u{1F4B5} ", t.cashOnly || "Cash Only"),
    /* @__PURE__ */ React.createElement("option", { value: "false" }, t.nonCash || "Non-Cash / Bank")
  ), /* @__PURE__ */ React.createElement("div", { className: "filter-date-field", title: t.fromDate || "From Date" }, /* @__PURE__ */ React.createElement("span", { className: "filter-field-label" }, t.fromDate || "From", ":"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: filterDateFrom,
      onChange: (e) => handleDateFromChange(e.target.value),
      className: "filter-input filter-date-picker"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "filter-date-field", title: t.toDate || "To Date" }, /* @__PURE__ */ React.createElement("span", { className: "filter-field-label" }, t.toDate || "To", ":"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: filterDateTo,
      onChange: (e) => handleDateToChange(e.target.value),
      className: "filter-input filter-date-picker"
    }
  )), /* @__PURE__ */ React.createElement("button", { onClick: handleClearFilters, className: "btn-secondary" }, t.clear)), /* @__PURE__ */ React.createElement("div", { className: "table-container" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Sr"), /* @__PURE__ */ React.createElement("th", null, t.date), /* @__PURE__ */ React.createElement("th", null, "Title"), /* @__PURE__ */ React.createElement("th", null, t.category), /* @__PURE__ */ React.createElement("th", null, "Shop"), /* @__PURE__ */ React.createElement("th", null, t.description), /* @__PURE__ */ React.createElement("th", null, "Payment / Transaction"), /* @__PURE__ */ React.createElement("th", { style: { minWidth: "150px" } }, t.amount), /* @__PURE__ */ React.createElement("th", { style: { width: "60px" } }, t.actions))), /* @__PURE__ */ React.createElement("tbody", null, loadingExpenses ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "9" }, /* @__PURE__ */ React.createElement("div", { className: "table-loader-container" }, /* @__PURE__ */ React.createElement("div", { className: "spinner" }), /* @__PURE__ */ React.createElement("span", null, "Loading expenses...")))) : expenses.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "9", style: { textAlign: "center" } }, "No expenses found")) : expenses.map((expense, idx) => /* @__PURE__ */ React.createElement("tr", { key: expense.id, style: expense.is_highlighted ? { background: "#fef9c3" } : void 0 }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleToggleHighlight(expense),
      title: expense.is_highlighted ? "Remove highlight" : "Highlight",
      style: { background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0, marginRight: "0.3rem", color: expense.is_highlighted ? "#eab308" : "var(--muted-foreground)" }
    },
    expense.is_highlighted ? "\u2605" : "\u2606"
  ), (expensePage - 1) * expensePageSize + idx + 1), /* @__PURE__ */ React.createElement("td", null, expense.date), /* @__PURE__ */ React.createElement("td", null, expense.title), /* @__PURE__ */ React.createElement("td", null, expense.category_name || "-"), /* @__PURE__ */ React.createElement("td", null, expense.spare_part ? `${expense.spare_part.name}${expense.spare_part.address ? ` - ${expense.spare_part.address}` : ""}` : "-"), /* @__PURE__ */ React.createElement("td", null, expense.description || "-"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" } }, expense.is_cash && /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "badge-cash",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.2rem 0.5rem",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 700,
        background: "#ecfdf5",
        color: "#059669",
        border: "1px solid #a7f3d0"
      }
    },
    "\u{1F4B5} Cash"
  ), expense.transaction ? /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "transaction-link",
      title: `${expense.transaction.description || ""} \u2022 Deposit: \xA5${Number(expense.transaction.deposit || 0).toLocaleString()} \u2022 Withdraw: \xA5${Number(expense.transaction.withdraw || 0).toLocaleString()}`
    },
    "\u{1F4B3} ",
    Number(expense.transaction.deposit) > 0 && !(Number(expense.transaction.withdraw) > 0) ? `Deposit \xA5${Number(expense.transaction.deposit).toLocaleString()}` : `\xA5${Number(expense.transaction.withdraw || expense.transaction.deposit || 0).toLocaleString()}`
  ) : !expense.is_cash && /* @__PURE__ */ React.createElement("span", { className: "no-transaction" }, "-"))), /* @__PURE__ */ React.createElement("td", { className: "amount-cell", style: { whiteSpace: "nowrap" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: "0.95rem" } }, "\xA5", Number(
    expense.tax_category === "inclusive" && Number(expense.tax_amount || 0) > 0 ? expense.total_amount != null ? expense.total_amount : Number(expense.amount || 0) + Number(expense.tax_amount || 0) : expense.amount
  ).toLocaleString()), expense.tax_percent_used != null && Number(expense.tax_percent_used) > 0 && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        marginTop: "0.2rem",
        fontSize: "0.72rem",
        whiteSpace: "nowrap"
      },
      title: expense.tax_category === "inclusive" ? `Total: \xA5${(Number(expense.amount || 0) + Number(expense.tax_amount || 0)).toLocaleString()} \u2022 Pre-tax: \xA5${Number(expense.amount || 0).toLocaleString()} \u2022 Tax (${Number(expense.tax_percent_used)}%): \xA5${Number(expense.tax_amount || 0).toLocaleString()}` : `Base: \xA5${Number(expense.amount || 0).toLocaleString()} \u2022 Tax (${Number(expense.tax_percent_used)}%): \xA5${Number(expense.tax_amount || 0).toLocaleString()} \u2022 Total: \xA5${(Number(expense.amount || 0) + Number(expense.tax_amount || 0)).toLocaleString()}`
    },
    /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontSize: "0.65rem",
          padding: "0.1rem 0.35rem",
          borderRadius: "4px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          background: expense.tax_category === "inclusive" ? "#e0f2fe" : "#fef3c7",
          color: expense.tax_category === "inclusive" ? "#0369a1" : "#b45309",
          border: `1px solid ${expense.tax_category === "inclusive" ? "#bae6fd" : "#fde68a"}`,
          lineHeight: 1.2
        }
      },
      expense.tax_category === "inclusive" ? t.taxInclusiveShort || "Tax Incl." : t.taxExclusiveShort || "Tax Excl.",
      " ",
      Number(expense.tax_percent_used),
      "%"
    ),
    /* @__PURE__ */ React.createElement("span", { style: { color: "#d97706", fontWeight: 600 } }, "Tax: \xA5", Number(expense.tax_amount || 0).toLocaleString()),
    expense.tax_category === "exclusive" && /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted-foreground)", fontSize: "0.7rem", fontWeight: 500 } }, "(Total: \xA5", (Number(expense.amount || 0) + Number(expense.tax_amount || 0)).toLocaleString(), ")")
  )), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { className: `btn-menu ${openMenuId === expense.id && menuType === "expense" ? "active" : ""}`, onClick: (e) => handleMenuClick(e, expense.id, "expense") }, "\u22EE"))))))), /* @__PURE__ */ React.createElement(
    Pagination,
    {
      currentPage: expensePage,
      totalPages: totalExpensePages,
      onPageChange: setExpensePage,
      pageSize: expensePageSize,
      onPageSizeChange: (newSize) => {
        setExpensePageSize(newSize);
        setExpensePage(1);
      },
      previousLabel: t.previous,
      nextLabel: t.next,
      pageLabel: t.page,
      ofLabel: t.of
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "table-section" }, /* @__PURE__ */ React.createElement("div", { className: "table-header" }, /* @__PURE__ */ React.createElement("h3", null, t.categories), /* @__PURE__ */ React.createElement("button", { className: "btn-primary", onClick: openCreateCategoryModal }, t.addCategory)), /* @__PURE__ */ React.createElement("div", { className: "table-container" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Sr"), /* @__PURE__ */ React.createElement("th", null, "Category"), /* @__PURE__ */ React.createElement("th", null, t.description), /* @__PURE__ */ React.createElement("th", { style: { width: "60px" } }, t.actions))), /* @__PURE__ */ React.createElement("tbody", null, loadingCategories ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "4" }, /* @__PURE__ */ React.createElement("div", { className: "loader" }, "Loading categories..."))) : categories.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "4", style: { textAlign: "center" } }, "No categories found")) : categories.map((category, index) => /* @__PURE__ */ React.createElement("tr", { key: category.id }, /* @__PURE__ */ React.createElement("td", null, (categoryPage - 1) * categoryPageSize + index + 1), /* @__PURE__ */ React.createElement("td", null, category.name), /* @__PURE__ */ React.createElement("td", null, category.description || "-"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { className: "btn-menu", onClick: (e) => handleMenuClick(e, category.id, "category") }, "\u22EE"))))))), /* @__PURE__ */ React.createElement(
    Pagination,
    {
      currentPage: categoryPage,
      totalPages: totalCategoryPages,
      onPageChange: setCategoryPage,
      pageSize: categoryPageSize,
      onPageSizeChange: (newSize) => {
        setCategoryPageSize(newSize);
        setCategoryPage(1);
      },
      previousLabel: t.previous,
      nextLabel: t.next,
      pageLabel: t.page,
      ofLabel: t.of
    }
  )), openMenuId && /* @__PURE__ */ React.createElement("div", { className: "context-menu", ref: menuRef, style: { top: menuPos.top, left: menuPos.left } }, menuType === "category" && (() => {
    const cat = categories.find((c) => c.id === openMenuId);
    return cat ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => openEditCategoryModal(cat) }, "\u270F\uFE0F Edit"), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: () => {
      setShowDeleteConfirm({ type: "category", item: cat, label: `"${cat.name}"`, warning: "This will also delete all expenses linked to this category." });
      setOpenMenuId(null);
    } }, "\u{1F5D1}\uFE0F Delete")) : null;
  })(), menuType === "expense" && (() => {
    const exp = expenses.find((e) => e.id === openMenuId);
    return exp ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => openEditExpenseModal(exp) }, "\u270F\uFE0F Edit"), /* @__PURE__ */ React.createElement("button", { onClick: () => exportExpenseToPDF(exp) }, "\u{1F4C4} Export PDF"), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: () => {
      setShowDeleteConfirm({ type: "expense", item: exp, label: `"${exp.title}"`, warning: "" });
      setOpenMenuId(null);
    } }, "\u{1F5D1}\uFE0F Delete")) : null;
  })()), /* @__PURE__ */ React.createElement(
    DeleteConfirmModal,
    {
      isOpen: !!showDeleteConfirm,
      onClose: () => setShowDeleteConfirm(null),
      onConfirm: showDeleteConfirm?.type === "category" ? handleDeleteCategory : handleDeleteExpense,
      title: showDeleteConfirm?.type === "category" ? "Delete Category" : "Delete Expense",
      message: `Are you sure you want to delete ${showDeleteConfirm?.label}? ${showDeleteConfirm?.warning || "This action cannot be undone."}`
    }
  ), showCategoryModal && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "modal" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" } }, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0 } }, editingCategory ? "Edit Category" : t.addNewCategory), /* @__PURE__ */ React.createElement("button", { className: "modal-close", type: "button", onClick: () => setShowCategoryModal(false) }, "\xD7")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleCategorySubmit }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Category Name"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: t.categoryPlaceholder,
      value: categoryForm.name,
      onChange: (e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value })),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.description), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      placeholder: "Category description",
      value: categoryForm.description,
      onChange: (e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value })),
      rows: "3"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "modal-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: () => setShowCategoryModal(false) }, t.cancel), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn-primary", disabled: savingCategory }, savingCategory ? "Saving..." : editingCategory ? "Update Category" : t.addCategory))))), showExpenseModal && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "modal" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" } }, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0 } }, editingExpense ? "Edit Expense" : t.addNewExpense), /* @__PURE__ */ React.createElement("button", { className: "modal-close", type: "button", onClick: () => setShowExpenseModal(false) }, "\xD7")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleExpenseSubmit }, /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { position: "relative" }, ref: titleInputRef }, /* @__PURE__ */ React.createElement("label", null, "Title"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: expenseForm.title,
      onChange: (e) => {
        setExpenseForm((prev) => ({ ...prev, title: e.target.value }));
        setShowTitleSuggestions(true);
      },
      onFocus: () => setShowTitleSuggestions(true),
      required: true
    }
  ), showTitleSuggestions && titleSuggestions.length > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 1e3,
    boxShadow: "var(--shadow-lift)"
  } }, titleSuggestions.map((title, idx) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: idx,
      onClick: () => {
        setExpenseForm((prev) => ({ ...prev, title }));
        setShowTitleSuggestions(false);
      },
      style: {
        padding: "0.75rem 1rem",
        cursor: "pointer",
        borderBottom: idx < titleSuggestions.length - 1 ? "1px solid var(--border)" : "none",
        transition: "all 0.2s ease",
        fontSize: "0.875rem"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.background = "var(--secondary)";
        e.currentTarget.style.color = "var(--ink)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "inherit";
      }
    },
    title
  )))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.amount), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      value: expenseForm.amount,
      onChange: (e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value })),
      placeholder: t.amountPlaceholder,
      step: "0.01",
      min: "0",
      required: true,
      readOnly: selectedTransaction && selectedTransaction.id,
      style: selectedTransaction && selectedTransaction.id ? { backgroundColor: "#f3f4f6", cursor: "not-allowed" } : {}
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.category), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: expenseForm.category,
      onChange: (e) => handleExpenseCategoryChange(e.target.value),
      required: true
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, t.selectCategory),
    allCategories.map((cat) => /* @__PURE__ */ React.createElement("option", { key: cat.id, value: String(cat.id) }, cat.name))
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.date), /* @__PURE__ */ React.createElement(
    DateInput,
    {
      value: expenseForm.date,
      onChange: (e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value })),
      required: true,
      readOnly: selectedTransaction && selectedTransaction.id,
      style: selectedTransaction && selectedTransaction.id ? { backgroundColor: "#f3f4f6", cursor: "not-allowed" } : {}
    }
  ))), isFoodCategory(expenseForm.category) && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem", flexWrap: "wrap", gap: "0.5rem" } }, /* @__PURE__ */ React.createElement("label", { style: { margin: 0 } }, "Restaurant (Optional)"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: openNewRestaurantModal,
      style: {
        background: "none",
        border: "none",
        color: "var(--primary)",
        fontWeight: 700,
        fontSize: "0.825rem",
        cursor: "pointer",
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        textDecoration: "underline"
      }
    },
    "+ Add Restaurant"
  )), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedRestaurant?.id || "",
      onChange: (e) => {
        if (e.target.value === "__add_new__") {
          openNewRestaurantModal();
          return;
        }
        setSelectedRestaurant(
          restaurants.find((r) => r.id === Number(e.target.value)) || null
        );
      }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select Restaurant"),
    /* @__PURE__ */ React.createElement("option", { value: "__add_new__", style: { fontWeight: 600, color: "var(--primary)" } }, "\u2795 + Add New Restaurant..."),
    restaurants.map((r) => /* @__PURE__ */ React.createElement("option", { key: r.id, value: r.id }, r.name, " - ", r.location))
  )), isSparePartsCategory(expenseForm.category) && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Shop (Optional)"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedSparePart?.id || "",
      onChange: (e) => setSelectedSparePart(
        spareParts.find((p) => p.id === Number(e.target.value)) || null
      )
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select Shop"),
    spareParts.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id }, p.name, p.address ? ` - ${p.address}` : ""))
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.description), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: expenseForm.description,
      onChange: (e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value })),
      placeholder: t.descriptionPlaceholder,
      rows: "3"
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "1rem", padding: "0.85rem 1rem", background: "var(--secondary)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" } }, "\u{1F4B5} ", t.paidInCash || "Paid in Cash"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.75rem", color: "var(--muted-foreground)" } }, "Mark this expense as paid with physical cash")), /* @__PURE__ */ React.createElement("label", { style: { display: "inline-flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: Boolean(expenseForm.is_cash),
      onChange: (e) => setExpenseForm((prev) => ({ ...prev, is_cash: e.target.checked })),
      style: { width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.875rem", fontWeight: 600, color: expenseForm.is_cash ? "#16a34a" : "var(--muted-foreground)" } }, expenseForm.is_cash ? "Cash" : "No"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "1rem", padding: "0.85rem 1rem", background: "var(--secondary)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" } }, "\u2B50 Highlight"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.75rem", color: "var(--muted-foreground)" } }, "Highlight this expense in the list")), /* @__PURE__ */ React.createElement("label", { style: { display: "inline-flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: Boolean(expenseForm.is_highlighted),
      onChange: (e) => setExpenseForm((prev) => ({ ...prev, is_highlighted: e.target.checked })),
      style: { width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.875rem", fontWeight: 600 } }, expenseForm.is_highlighted ? "Yes" : "No"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "1rem", padding: "1rem", background: "var(--secondary)", borderRadius: "12px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: expenseForm.apply_tax ? "1rem" : 0 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" } }, "\u{1F9FE} ", t.applyTax || "Apply Tax"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.75rem", color: "var(--muted-foreground)" } }, "Choose tax-inclusive or tax-exclusive category")), /* @__PURE__ */ React.createElement("label", { style: { display: "inline-flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: Boolean(expenseForm.apply_tax),
      onChange: (e) => {
        const checked = e.target.checked;
        const defaultRate = taxRates.length > 0 ? String(taxRates[0].rate) : "10.00";
        setIsCustomTax(false);
        setExpenseForm((prev) => ({
          ...prev,
          apply_tax: checked,
          tax_category: prev.tax_category || "exclusive",
          tax_percent_used: checked ? defaultRate : ""
        }));
      },
      style: { width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.875rem", fontWeight: 600, color: expenseForm.apply_tax ? "#f59e0b" : "var(--muted-foreground)" } }, expenseForm.apply_tax ? "Yes" : "No"))), expenseForm.apply_tax && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { marginBottom: "0.45rem", display: "block", fontSize: "0.8rem", fontWeight: 600 } }, t.taxCategory || "Tax Category"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setExpenseForm((prev) => ({ ...prev, tax_category: "exclusive" })),
      style: {
        padding: "0.7rem 0.85rem",
        borderRadius: "10px",
        border: `2px solid ${expenseForm.tax_category === "exclusive" ? "var(--primary)" : "var(--border)"}`,
        background: expenseForm.tax_category === "exclusive" ? "color-mix(in srgb, var(--primary) 12%, var(--card))" : "var(--card)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: "0.85rem", color: expenseForm.tax_category === "exclusive" ? "var(--primary)" : "var(--foreground)" } }, "\u{1F3F7}\uFE0F ", t.taxExclusive || "Tax Exclusive"), /* @__PURE__ */ React.createElement("span", { style: {
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      border: `2px solid ${expenseForm.tax_category === "exclusive" ? "var(--primary)" : "var(--muted-foreground)"}`,
      background: expenseForm.tax_category === "exclusive" ? "var(--primary)" : "transparent",
      display: "inline-block"
    } })),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: "0.25rem" } }, "Tax is added on top of entered amount")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setExpenseForm((prev) => ({ ...prev, tax_category: "inclusive" })),
      style: {
        padding: "0.7rem 0.85rem",
        borderRadius: "10px",
        border: `2px solid ${expenseForm.tax_category === "inclusive" ? "var(--primary)" : "var(--border)"}`,
        background: expenseForm.tax_category === "inclusive" ? "color-mix(in srgb, var(--primary) 12%, var(--card))" : "var(--card)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: "0.85rem", color: expenseForm.tax_category === "inclusive" ? "var(--primary)" : "var(--foreground)" } }, "\u{1F9FE} ", t.taxInclusive || "Tax Inclusive"), /* @__PURE__ */ React.createElement("span", { style: {
      width: "14px",
      height: "14px",
      borderRadius: "50%",
      border: `2px solid ${expenseForm.tax_category === "inclusive" ? "var(--primary)" : "var(--muted-foreground)"}`,
      background: expenseForm.tax_category === "inclusive" ? "var(--primary)" : "transparent",
      display: "inline-block"
    } })),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.72rem", color: "var(--muted-foreground)", marginTop: "0.25rem" } }, "Tax is included inside entered amount")
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { flex: "1 1 200px", margin: 0 } }, /* @__PURE__ */ React.createElement("label", { style: { marginBottom: "0.4rem", display: "block", fontSize: "0.8rem", fontWeight: 600 } }, t.taxRate || "Tax Rate"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: isCustomTax ? "__custom__" : expenseForm.tax_percent_used,
      onChange: (e) => {
        if (e.target.value === "__custom__") {
          setIsCustomTax(true);
          setExpenseForm((prev) => ({ ...prev, tax_percent_used: "" }));
        } else {
          setIsCustomTax(false);
          setExpenseForm((prev) => ({ ...prev, tax_percent_used: e.target.value }));
        }
      },
      style: { width: "100%" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "\u2014 Select a rate \u2014"),
    taxRates.map((tr) => /* @__PURE__ */ React.createElement("option", { key: tr.id, value: String(tr.rate) }, tr.name, " (", Number(tr.rate).toFixed(2), "%)")),
    /* @__PURE__ */ React.createElement("option", { value: "__custom__" }, "Custom %")
  )), isCustomTax && /* @__PURE__ */ React.createElement("div", { className: "form-group", style: { flex: "0 0 140px", margin: 0 } }, /* @__PURE__ */ React.createElement("label", { style: { marginBottom: "0.4rem", display: "block", fontSize: "0.8rem", fontWeight: 600 } }, "Custom %"), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      min: "0",
      max: "100",
      placeholder: "10.00",
      value: expenseForm.tax_percent_used,
      style: { paddingRight: "2rem" },
      onChange: (e) => setExpenseForm((prev) => ({ ...prev, tax_percent_used: e.target.value }))
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", right: "10px", color: "var(--muted-foreground)", fontWeight: 600, fontSize: "0.85rem", pointerEvents: "none" } }, "%")))), taxSettlement && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        padding: "0.85rem 1rem",
        background: "var(--card)",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.78rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" } }, "\u{1F9EE} ", t.taxSettlement || "Tax Settlement Breakdown"), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontSize: "0.72rem",
          fontWeight: 700,
          padding: "0.15rem 0.5rem",
          borderRadius: "6px",
          background: taxSettlement.mode === "inclusive" ? "#e0f2fe" : "#fef3c7",
          color: taxSettlement.mode === "inclusive" ? "#0369a1" : "#b45309"
        }
      },
      taxSettlement.mode === "inclusive" ? t.taxInclusiveShort || "Tax Incl." : t.taxExclusiveShort || "Tax Excl.",
      " (",
      taxSettlement.rate,
      "%)"
    )),
    /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", paddingTop: "0.2rem" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.72rem", color: "var(--muted-foreground)" } }, t.originalPreTaxAmount || "Original Amount"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "1rem", fontWeight: 700, color: "var(--foreground)" } }, "\xA5", taxSettlement.originalAmount.toLocaleString(void 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.72rem", color: "var(--muted-foreground)" } }, t.taxAmountLabel || "Tax Amount"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "1rem", fontWeight: 700, color: "#f59e0b" } }, "\xA5", taxSettlement.taxAmount.toLocaleString(void 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.72rem", color: "var(--muted-foreground)" } }, t.totalInclusiveAmount || "Total Amount"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: "1.05rem", fontWeight: 800, color: "var(--primary)" } }, "\xA5", taxSettlement.totalAmount.toLocaleString(void 0, { minimumFractionDigits: 0, maximumFractionDigits: 2 }))))
  ))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1rem" } }, /* @__PURE__ */ React.createElement("h4", { style: { marginBottom: "1rem" } }, "Link Transaction (Optional)"), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Company Account"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedAccount || "",
      onChange: (e) => {
        setSelectedAccount(e.target.value);
        setSelectedTransaction(null);
        if (e.target.value) {
          fetchTransactions(e.target.value);
        } else {
          setTransactions([]);
        }
      }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select Account"),
    companyAccounts.map((acc) => /* @__PURE__ */ React.createElement("option", { key: acc.id, value: acc.id }, acc.bank_name, " - ", acc.account_number))
  )), selectedAccount && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: "1 1 200px", minWidth: "160px", position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search transactions...",
      value: transactionSearch,
      onChange: (e) => setTransactionSearch(e.target.value),
      style: {
        width: "100%",
        height: "42px",
        padding: "0.5rem 1rem 0.5rem 2.5rem",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        fontSize: "0.875rem",
        background: `var(--card) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>') no-repeat 0.85rem center`,
        backgroundColor: "var(--card)",
        color: "var(--foreground)"
      }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { flex: "0 1 170px", minWidth: "140px" } }, /* @__PURE__ */ React.createElement(
    DateInput,
    {
      value: transactionDate,
      onChange: (e) => setTransactionDate(e.target.value),
      style: {
        width: "100%",
        height: "42px",
        padding: "0.5rem 1rem",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        fontSize: "0.875rem",
        background: "var(--card)",
        color: "var(--foreground)"
      }
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn-secondary",
      onClick: () => fetchTransactions(selectedAccount),
      style: {
        height: "42px",
        padding: "0 1.5rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        borderRadius: "12px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0
      }
    },
    "Search"
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "0.4rem", marginTop: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", marginRight: "0.25rem" } }, "Show:"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTxTypeFilter("all"),
      style: {
        fontSize: "0.725rem",
        padding: "0.2rem 0.65rem",
        borderRadius: "16px",
        border: txTypeFilter === "all" ? "1px solid var(--foreground)" : "1px solid var(--border)",
        background: txTypeFilter === "all" ? "var(--foreground)" : "var(--card)",
        color: txTypeFilter === "all" ? "var(--background)" : "var(--foreground)",
        cursor: "pointer",
        fontWeight: 600,
        transition: "all 0.15s ease"
      }
    },
    "All (",
    transactions.length,
    ")"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTxTypeFilter("withdraw"),
      style: {
        fontSize: "0.725rem",
        padding: "0.2rem 0.65rem",
        borderRadius: "16px",
        border: txTypeFilter === "withdraw" ? "1px solid #b91c1c" : "1px solid #fecdd3",
        background: txTypeFilter === "withdraw" ? "#b91c1c" : "#fff1f2",
        color: txTypeFilter === "withdraw" ? "#ffffff" : "#b91c1c",
        cursor: "pointer",
        fontWeight: 600,
        transition: "all 0.15s ease"
      }
    },
    "\u{1F4E4} Withdrawals (",
    withdrawTxCount,
    ")"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTxTypeFilter("deposit"),
      style: {
        fontSize: "0.725rem",
        padding: "0.2rem 0.65rem",
        borderRadius: "16px",
        border: txTypeFilter === "deposit" ? "1px solid #15803d" : "1px solid #a7f3d0",
        background: txTypeFilter === "deposit" ? "#15803d" : "#ecfdf5",
        color: txTypeFilter === "deposit" ? "#ffffff" : "#15803d",
        cursor: "pointer",
        fontWeight: 600,
        transition: "all 0.15s ease"
      }
    },
    "\u{1F4E5} Deposits (",
    depositTxCount,
    ")"
  )), /* @__PURE__ */ React.createElement("div", { style: {
    fontSize: "0.75rem",
    padding: "0.45rem 0.75rem",
    borderRadius: "8px",
    background: "var(--secondary)",
    border: "1px solid var(--border)",
    marginBottom: "0.65rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    color: "var(--foreground)"
  } }, /* @__PURE__ */ React.createElement("span", null, "\u2139\uFE0F"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", { style: { color: "#15803d" } }, language === "ja" ? "\u5165\u91D1 (Deposit)" : "Deposit"), " = ", language === "ja" ? "\u53E3\u5EA7\u3078\u306E\u5165\u91D1" : "Money into account", " \xA0\u2022\xA0 ", /* @__PURE__ */ React.createElement("strong", { style: { color: "#b91c1c" } }, language === "ja" ? "\u51FA\u91D1 (Withdraw)" : "Withdraw"), " = ", language === "ja" ? "\u53E3\u5EA7\u304B\u3089\u306E\u51FA\u91D1" : "Money out of account")), loadingTransactions ? /* @__PURE__ */ React.createElement("div", { style: { padding: "1.5rem", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.875rem" } }, "Loading transactions...") : /* @__PURE__ */ React.createElement("div", { style: { maxHeight: "250px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--card)", padding: "0.35rem" } }, displayedTransactions.map((t2) => {
    const isSelected = selectedTransaction?.id === t2.id;
    const hasDeposit = Number(t2.deposit) > 0;
    const hasWithdraw = Number(t2.withdraw) > 0;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: t2.id,
        onClick: () => {
          setSelectedTransaction(t2);
          const chosenAmount = hasWithdraw ? t2.withdraw : hasDeposit ? t2.deposit : t2.withdraw || t2.deposit || "";
          setExpenseForm((prev) => ({ ...prev, amount: chosenAmount, date: t2.date }));
        },
        style: {
          padding: "0.7rem 0.9rem",
          cursor: "pointer",
          borderBottom: "1px solid var(--border)",
          transition: "all 0.2s ease",
          borderRadius: "10px",
          marginBottom: "4px",
          background: isSelected ? "var(--color-lime)" : "transparent",
          color: isSelected ? "var(--color-ink)" : "inherit",
          border: isSelected ? "1px solid var(--primary)" : "1px solid transparent"
        },
        onMouseEnter: (e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "var(--secondary)";
          }
        },
        onMouseLeave: (e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "transparent";
          }
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.85rem", fontWeight: 600, color: isSelected ? "currentColor" : "var(--foreground)", marginBottom: "0.35rem" } }, "\u{1F4C5} ", t2.date),
      /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" } }, /* @__PURE__ */ React.createElement("div", { style: {
        padding: "0.35rem 0.5rem",
        borderRadius: "6px",
        background: hasDeposit ? isSelected ? "rgba(22, 101, 52, 0.15)" : "#ecfdf5" : isSelected ? "rgba(0,0,0,0.05)" : "var(--secondary)",
        border: hasDeposit ? "1px solid #a7f3d0" : "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.72rem", fontWeight: 600, color: hasDeposit ? "#166534" : "var(--muted-foreground)" } }, "\u{1F4E5} Deposit:"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.78rem", fontWeight: 700, color: hasDeposit ? "#15803d" : "var(--muted-foreground)" } }, hasDeposit ? `+\xA5${Number(t2.deposit).toLocaleString()}` : "\xA50")), /* @__PURE__ */ React.createElement("div", { style: {
        padding: "0.35rem 0.5rem",
        borderRadius: "6px",
        background: hasWithdraw ? isSelected ? "rgba(153, 27, 27, 0.15)" : "#fff1f2" : isSelected ? "rgba(0,0,0,0.05)" : "var(--secondary)",
        border: hasWithdraw ? "1px solid #fecdd3" : "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.72rem", fontWeight: 600, color: hasWithdraw ? "#991b1b" : "var(--muted-foreground)" } }, "\u{1F4E4} Withdraw:"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.78rem", fontWeight: 700, color: hasWithdraw ? "#b91c1c" : "var(--muted-foreground)" } }, hasWithdraw ? `-\xA5${Number(t2.withdraw).toLocaleString()}` : "\xA50")))
    );
  }), displayedTransactions.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.875rem" } }, transactions.length === 0 ? "No transactions found" : "No transactions match the selected filter"))), selectedTransaction && selectedTransaction.id && /* @__PURE__ */ React.createElement("div", { style: { padding: "1rem 1.25rem", background: "var(--color-lime)", color: "var(--color-ink)", borderRadius: "16px", marginTop: "1rem", border: "1px solid var(--color-lime)", boxShadow: "var(--shadow-card)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.25rem" } }, "Selected Transaction"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.8rem" } }, /* @__PURE__ */ React.createElement("div", null, "\u{1F4C5} ", /* @__PURE__ */ React.createElement("strong", null, selectedTransaction.date)), /* @__PURE__ */ React.createElement("div", null, "\u{1F4E5} Deposit: ", /* @__PURE__ */ React.createElement("strong", { style: { color: Number(selectedTransaction.deposit) > 0 ? "#15803d" : "inherit" } }, "\xA5", Number(selectedTransaction.deposit || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", null, "\u{1F4E4} Withdraw: ", /* @__PURE__ */ React.createElement("strong", { style: { color: Number(selectedTransaction.withdraw) > 0 ? "#b91c1c" : "inherit" } }, "\xA5", Number(selectedTransaction.withdraw || 0).toLocaleString()))), Number(selectedTransaction.deposit) > 0 && Number(selectedTransaction.withdraw) > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.75rem", fontWeight: 600 } }, "Apply amount to expense:"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setExpenseForm((prev) => ({ ...prev, amount: selectedTransaction.withdraw })),
      style: {
        fontSize: "0.72rem",
        padding: "0.2rem 0.5rem",
        borderRadius: "6px",
        border: "1px solid #b91c1c",
        background: Number(expenseForm.amount) === Number(selectedTransaction.withdraw) ? "#b91c1c" : "#ffffff",
        color: Number(expenseForm.amount) === Number(selectedTransaction.withdraw) ? "#ffffff" : "#b91c1c",
        cursor: "pointer",
        fontWeight: 600
      }
    },
    "Withdraw (\xA5",
    Number(selectedTransaction.withdraw).toLocaleString(),
    ")"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setExpenseForm((prev) => ({ ...prev, amount: selectedTransaction.deposit })),
      style: {
        fontSize: "0.72rem",
        padding: "0.2rem 0.5rem",
        borderRadius: "6px",
        border: "1px solid #15803d",
        background: Number(expenseForm.amount) === Number(selectedTransaction.deposit) ? "#15803d" : "#ffffff",
        color: Number(expenseForm.amount) === Number(selectedTransaction.deposit) ? "#ffffff" : "#15803d",
        cursor: "pointer",
        fontWeight: 600
      }
    },
    "Deposit (\xA5",
    Number(selectedTransaction.deposit).toLocaleString(),
    ")"
  )), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: () => setSelectedTransaction(null), style: { marginTop: "0.75rem", fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "8px", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" } }, "Remove Transaction"))), /* @__PURE__ */ React.createElement("div", { className: "modal-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: () => setShowExpenseModal(false) }, t.cancel), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn-primary", disabled: savingExpense }, savingExpense ? "Saving..." : editingExpense ? "Update Expense" : t.addExpense))))), showRestaurantModal && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay", style: { zIndex: 3e3 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-box", style: { maxWidth: 480 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("h3", null, "Add New Restaurant"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "modal-close",
      onClick: () => setShowRestaurantModal(false)
    },
    "\xD7"
  )), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSaveRestaurant, className: "modal-form" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Restaurant Name ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "e.g. Tokyo Ramen",
      value: restaurantForm.name,
      onChange: (e) => setRestaurantForm({ ...restaurantForm, name: e.target.value }),
      required: true,
      autoFocus: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Location ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "e.g. Shibuya, Tokyo",
      value: restaurantForm.location,
      onChange: (e) => setRestaurantForm({ ...restaurantForm, location: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Description (Optional)"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "form-input",
      placeholder: "Optional details or notes",
      rows: "2",
      value: restaurantForm.description,
      onChange: (e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "modal-actions" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn-secondary",
      onClick: () => setShowRestaurantModal(false),
      disabled: savingRestaurant
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "btn-primary",
      disabled: savingRestaurant
    },
    savingRestaurant ? "Saving..." : "Save Restaurant"
  ))))));
};
export default ExpenseManager;
