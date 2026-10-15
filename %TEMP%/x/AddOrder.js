import { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserPlus } from "lucide-react";
import { translations } from "../translations";
import { apiRequest, getErrorMessage } from "../api";
import DateInput from "./DateInput";
import "../shared.css";
import "./OrderManager.css";
const AddOrder = ({ language = "en", onSave, onCancel, editingOrder = null }) => {
  const t = translations[language];
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [salers, setSalers] = useState([]);
  const [allSalers, setAllSalers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSaler, setSelectedSaler] = useState(null);
  const [companyAccounts, setCompanyAccounts] = useState([]);
  const [selectedCompanyAccount, setSelectedCompanyAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [auctions, setAuctions] = useState([]);
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [carSearch, setCarSearch] = useState("");
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [useExistingCar, setUseExistingCar] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [partyType, setPartyType] = useState("customer");
  const [partyFormData, setPartyFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bank_name: "",
    account_number: "",
    branch_code: "",
    swift_code: ""
  });
  const [savingParty, setSavingParty] = useState(false);
  const [formData, setFormData] = useState({
    transaction_type: "sale",
    transaction_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    transaction_catagory: "local",
    customer_id: null,
    saler_id: null,
    company_account_id: null,
    auction_id: null,
    customer_name: "",
    saler_name: "",
    seller_name: "",
    phone: "",
    address: "",
    payment_method: "Cash",
    account_number: "",
    auction_house: "",
    payment_status: "pending",
    is_highlighted: false,
    notes: "",
    items: []
  });
  const [currentItem, setCurrentItem] = useState({
    category: "",
    model: "",
    chassis_number: "",
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    venue: "",
    vehicle_price: 0,
    vehicle_price_tax: 0,
    recycle_fee: 0,
    listing_fee: 0,
    listing_fee_tax: 0,
    successful_bid: 0,
    successful_bid_tax: 0,
    commission_fee: 0,
    commission_fee_tax: 0,
    transport_fee: 0,
    transport_fee_tax: 0,
    registration_fee: 0,
    registration_fee_tax: 0,
    canceling_fee: 0,
    notes: ""
  });
  const toNumber = (value) => Number(value) || 0;
  const toRows = (data) => Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  const getFieldSign = (fieldName) => {
    const transactionType = formData.transaction_type;
    if (transactionType === "purchase") {
      return "+";
    }
    if (transactionType === "sale") {
      const positiveFields2 = ["vehicle_price", "vehicle_price_tax", "recycle_fee", "transport_fee", "transport_fee_tax", "registration_fee", "registration_fee_tax", "canceling_fee"];
      return positiveFields2.includes(fieldName) ? "+" : "-";
    }
    if (transactionType === "nagare") {
      const positiveFields2 = ["vehicle_price", "vehicle_price_tax", "recycle_fee", "listing_fee", "listing_fee_tax", "canceling_fee"];
      return positiveFields2.includes(fieldName) ? "+" : "-";
    }
    const positiveFields = ["vehicle_price", "vehicle_price_tax", "recycle_fee", "canceling_fee"];
    return positiveFields.includes(fieldName) ? "+" : "-";
  };
  const getItemTotal = (item) => {
    if (formData.transaction_type === "purchase") {
      return toNumber(item.vehicle_price) + toNumber(item.vehicle_price_tax) + toNumber(item.recycle_fee) + toNumber(item.listing_fee) + toNumber(item.listing_fee_tax) + toNumber(item.successful_bid) + toNumber(item.successful_bid_tax) + toNumber(item.commission_fee) + toNumber(item.commission_fee_tax) + toNumber(item.transport_fee) + toNumber(item.transport_fee_tax) + toNumber(item.registration_fee) + toNumber(item.registration_fee_tax) + toNumber(item.canceling_fee);
    }
    if (formData.transaction_type === "nagare") {
      return toNumber(item.vehicle_price) + toNumber(item.vehicle_price_tax) + toNumber(item.recycle_fee) + toNumber(item.listing_fee) + toNumber(item.listing_fee_tax) + toNumber(item.canceling_fee) - toNumber(item.successful_bid) - toNumber(item.successful_bid_tax) - toNumber(item.commission_fee) - toNumber(item.commission_fee_tax) - toNumber(item.transport_fee) - toNumber(item.transport_fee_tax) - toNumber(item.registration_fee) - toNumber(item.registration_fee_tax);
    }
    if (formData.transaction_type === "sale") {
      return toNumber(item.vehicle_price) + toNumber(item.vehicle_price_tax) + toNumber(item.recycle_fee) + toNumber(item.transport_fee) + toNumber(item.transport_fee_tax) + toNumber(item.registration_fee) + toNumber(item.registration_fee_tax) + toNumber(item.canceling_fee) - toNumber(item.listing_fee) - toNumber(item.listing_fee_tax) - toNumber(item.successful_bid) - toNumber(item.successful_bid_tax) - toNumber(item.commission_fee) - toNumber(item.commission_fee_tax);
    }
    return toNumber(item.vehicle_price) + toNumber(item.vehicle_price_tax) + toNumber(item.recycle_fee) + toNumber(item.canceling_fee) - toNumber(item.listing_fee) - toNumber(item.listing_fee_tax) - toNumber(item.successful_bid) - toNumber(item.successful_bid_tax) - toNumber(item.commission_fee) - toNumber(item.commission_fee_tax) - toNumber(item.transport_fee) - toNumber(item.transport_fee_tax) - toNumber(item.registration_fee) - toNumber(item.registration_fee_tax);
  };
  const normalizeOrderItem = useCallback((item) => {
    const carId = typeof item.car === "object" ? item.car?.id : item.car;
    const matchedCar = (Array.isArray(cars) ? cars : []).find((c) => String(c.id) === String(carId));
    return {
      id: item.id,
      category: item.car_category || item.category || matchedCar?.category?.id || "",
      model: item.car_model || item.model || matchedCar?.category?.model || "",
      car_company: item.car_company || "",
      car_model: item.car_model || "",
      chassis_number: item.chassis_number || item.car?.chassis_number || matchedCar?.chassis_number || "",
      year: item.year || item.car?.year || matchedCar?.year || (/* @__PURE__ */ new Date()).getFullYear(),
      venue: item.venue || "",
      vehicle_price: item.vehicle_price || 0,
      vehicle_price_tax: item.vehicle_price_tax || 0,
      recycle_fee: item.recycle_fee || 0,
      listing_fee: item.listing_fee || 0,
      listing_fee_tax: item.listing_fee_tax || 0,
      successful_bid: item.successful_bid || 0,
      successful_bid_tax: item.successful_bid_tax || 0,
      commission_fee: item.commission_fee || 0,
      commission_fee_tax: item.commission_fee_tax || 0,
      transport_fee: item.transport_fee || 0,
      transport_fee_tax: item.transport_fee_tax || 0,
      registration_fee: item.registration_fee || 0,
      registration_fee_tax: item.registration_fee_tax || 0,
      canceling_fee: item.canceling_fee || 0,
      notes: item.notes || ""
    };
  }, [cars]);
  useEffect(() => {
    fetchCategories();
    fetchCustomers();
    fetchSalers();
    fetchCompanyAccounts();
    fetchAuctions();
    fetchCars();
  }, []);
  useEffect(() => {
    setFilteredCategories(
      categories.filter(
        (cat) => cat.company && cat.company.toLowerCase().includes(categorySearch.toLowerCase()) || cat.model && cat.model.toLowerCase().includes(categorySearch.toLowerCase())
      )
    );
  }, [categorySearch, categories]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".category-dropdown-wrapper")) {
        setShowCategoryDropdown(false);
      }
      if (!e.target.closest(".customer-dropdown-wrapper")) {
        setShowCustomerDropdown(false);
      }
      if (!e.target.closest(".car-dropdown-wrapper")) {
        setShowCarDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  useEffect(() => {
    if (customerSearch) {
      if (formData.transaction_type === "purchase") {
        const filtered = allSalers.filter(
          (s) => s.name.toLowerCase().includes(customerSearch.toLowerCase()) || s.email.toLowerCase().includes(customerSearch.toLowerCase())
        );
        setSalers(filtered);
      } else {
        const filtered = allCustomers.filter(
          (c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase())
        );
        setCustomers(filtered);
      }
    } else {
      setCustomers(allCustomers);
      setSalers(allSalers);
    }
  }, [customerSearch, allCustomers, allSalers, formData.transaction_type]);
  useEffect(() => {
    const selected = companyAccounts.find(
      (account) => String(account.id) === String(formData.company_account_id)
    ) || null;
    setSelectedCompanyAccount(selected);
  }, [companyAccounts, formData.company_account_id]);
  useEffect(() => {
    const selectedParty = formData.transaction_type === "purchase" ? selectedSaler : selectedCustomer;
    if (!selectedParty) return;
    const nextAccount = formData.payment_method === "Bank" ? selectedParty.account_number || "" : "";
    setFormData((prev) => {
      if (prev.account_number === nextAccount) return prev;
      return { ...prev, account_number: nextAccount };
    });
  }, [selectedCustomer, selectedSaler, formData.payment_method, formData.transaction_type]);
  useEffect(() => {
    if (currentItem.category && useExistingCar) {
      const filtered = cars.filter((c) => c.category === currentItem.category);
      setFilteredCars(filtered);
    }
  }, [currentItem.category, cars, useExistingCar]);
  const fetchCategories = async () => {
    try {
      const response = await apiRequest("/revenue/categories/all/");
      const data = await response.json();
      const rows = toRows(data);
      setCategories(rows);
      setFilteredCategories(rows);
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };
  const fetchCustomers = async () => {
    try {
      const response = await apiRequest("/revenue/customers/?pageSize=1000");
      const data = await response.json();
      const rows = toRows(data);
      setAllCustomers(rows);
      setCustomers(rows);
    } catch (error) {
      toast.error("Failed to load customers");
    }
  };
  const fetchSalers = async () => {
    try {
      const response = await apiRequest("/revenue/salers/?pageSize=1000");
      const data = await response.json();
      const rows = toRows(data);
      setAllSalers(rows);
      setSalers(rows);
    } catch (error) {
      toast.error("Failed to load salers");
    }
  };
  const fetchCompanyAccounts = async () => {
    try {
      const response = await apiRequest("/revenue/company-accounts/?pageSize=1000");
      const data = await response.json();
      setCompanyAccounts(toRows(data));
    } catch (error) {
      toast.error("Failed to load company accounts");
    }
  };
  const fetchAuctions = async () => {
    try {
      const response = await apiRequest("/revenue/auctions/?pageSize=1000");
      const data = await response.json();
      setAuctions(toRows(data));
    } catch (error) {
      toast.error("Failed to load auctions");
    }
  };
  const fetchCars = async () => {
    try {
      const response = await apiRequest("/revenue/cars/");
      const data = await response.json();
      setCars(toRows(data));
    } catch (error) {
      toast.error("Failed to load cars");
    }
  };
  const openPartyModal = (type = null) => {
    const resolvedType = type || (formData.transaction_type === "purchase" ? "saler" : "customer");
    setPartyType(resolvedType);
    setPartyFormData({
      name: customerSearch.trim() || "",
      email: "",
      phone: "",
      address: "",
      bank_name: "",
      account_number: "",
      branch_code: "",
      swift_code: ""
    });
    setShowPartyModal(true);
    setShowCustomerDropdown(false);
  };
  const handleSaveParty = async (e) => {
    e.preventDefault();
    setSavingParty(true);
    try {
      const endpoint = partyType === "saler" ? "/revenue/salers/" : "/revenue/customers/";
      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(partyFormData)
      });
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(errorMessage || `Failed to add ${partyType === "saler" ? "seller" : "customer"}`);
      }
      const newParty = await response.json();
      const label = partyType === "saler" ? "Seller" : "Customer";
      toast.success(`${label} added successfully`);
      if (partyType === "saler") {
        await fetchSalers();
        setSelectedSaler(newParty);
        setSelectedCustomer(null);
        setCustomerSearch(newParty.name);
        setFormData((prev) => ({
          ...prev,
          saler_id: newParty.id,
          saler_name: newParty.name,
          seller_name: newParty.name,
          customer_id: null,
          customer_name: "",
          phone: newParty.phone || "",
          address: newParty.address || "",
          account_number: prev.payment_method === "Bank" ? newParty.account_number || "" : prev.account_number || ""
        }));
      } else {
        await fetchCustomers();
        setSelectedCustomer(newParty);
        setSelectedSaler(null);
        setCustomerSearch(newParty.name);
        setFormData((prev) => ({
          ...prev,
          customer_id: newParty.id,
          customer_name: newParty.name,
          saler_id: null,
          saler_name: "",
          seller_name: "",
          phone: newParty.phone || "",
          address: newParty.address || "",
          account_number: prev.payment_method === "Bank" ? newParty.account_number || "" : prev.account_number || ""
        }));
      }
      setShowPartyModal(false);
    } catch (error) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSavingParty(false);
    }
  };
  const loadOrderData = useCallback((order) => {
    setFormData({
      transaction_type: order.transaction_type,
      transaction_date: order.transaction_date,
      transaction_catagory: order.transaction_catagory,
      customer_id: order.customer,
      saler_id: order.saler,
      company_account_id: order.company_account,
      auction_id: order.auction,
      customer_name: order.other_details?.customer_name || "",
      saler_name: order.other_details?.saler_name || "",
      seller_name: order.other_details?.seller_name || "",
      phone: order.other_details?.phone || "",
      address: order.other_details?.address || "",
      payment_method: order.other_details?.payment_method || "Cash",
      account_number: order.other_details?.account_number || "",
      auction_house: order.other_details?.auction_house || "",
      payment_status: order.payment_status,
      is_highlighted: Boolean(order.is_highlighted),
      notes: order.notes || "",
      items: order.items?.map((item) => normalizeOrderItem(item)) || []
    });
    if (order.customer) {
      const customer = allCustomers.find((c) => c.id === order.customer);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
      }
    }
    if (order.saler) {
      const saler = allSalers.find((s) => s.id === order.saler);
      if (saler) {
        setSelectedSaler(saler);
        setCustomerSearch(saler.name);
      }
    }
    if (order.transaction) {
      setSelectedTransaction(order.transaction);
    }
  }, [allCustomers, allSalers, normalizeOrderItem]);
  useEffect(() => {
    if (editingOrder) {
      loadOrderData(editingOrder);
    }
  }, [editingOrder, loadOrderData]);
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
  const addItem = () => {
    const fallbackCarName = (categorySearch || "").trim();
    const resolvedCategory = currentItem.category || fallbackCarName;
    const resolvedModel = currentItem.model || fallbackCarName;
    if (!resolvedCategory) {
      toast.error("Please enter a car name");
      return;
    }
    if (!resolvedModel) {
      toast.error("Model is required");
      return;
    }
    if (!currentItem.chassis_number) {
      toast.error("Chassis number is required");
      return;
    }
    if (editingItemId) {
      setFormData({
        ...formData,
        items: formData.items.map(
          (item) => item.id === editingItemId ? { ...currentItem, category: resolvedCategory, model: resolvedModel, id: editingItemId } : item
        )
      });
      setEditingItemId(null);
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, { ...currentItem, category: resolvedCategory, model: resolvedModel, id: Date.now() }]
      });
    }
    resetCurrentItem();
  };
  const resetCurrentItem = () => {
    setCurrentItem({
      category: "",
      model: "",
      chassis_number: "",
      year: (/* @__PURE__ */ new Date()).getFullYear(),
      venue: "",
      vehicle_price: 0,
      vehicle_price_tax: 0,
      recycle_fee: 0,
      listing_fee: 0,
      listing_fee_tax: 0,
      successful_bid: 0,
      successful_bid_tax: 0,
      commission_fee: 0,
      commission_fee_tax: 0,
      transport_fee: 0,
      transport_fee_tax: 0,
      registration_fee: 0,
      registration_fee_tax: 0,
      canceling_fee: 0,
      notes: ""
    });
    setCategorySearch("");
    setCarSearch("");
    setEditingItemId(null);
  };
  const editItem = (item) => {
    const category = Array.isArray(categories) ? categories.find((c) => String(c.id) === String(item.category)) : null;
    if (category) {
      setCategorySearch(`${category.company} - ${category.model}`);
    } else {
      setCategorySearch(item.category || "");
    }
    setCarSearch(item.model || "");
    setCurrentItem({
      category: item.category,
      model: item.model,
      chassis_number: item.chassis_number,
      year: item.year,
      venue: item.venue || "",
      vehicle_price: item.vehicle_price || 0,
      vehicle_price_tax: item.vehicle_price_tax || 0,
      recycle_fee: item.recycle_fee || 0,
      listing_fee: item.listing_fee || 0,
      listing_fee_tax: item.listing_fee_tax || 0,
      successful_bid: item.successful_bid || 0,
      successful_bid_tax: item.successful_bid_tax || 0,
      commission_fee: item.commission_fee || 0,
      commission_fee_tax: item.commission_fee_tax || 0,
      transport_fee: item.transport_fee || 0,
      transport_fee_tax: item.transport_fee_tax || 0,
      registration_fee: item.registration_fee || 0,
      registration_fee_tax: item.registration_fee_tax || 0,
      canceling_fee: item.canceling_fee || 0,
      notes: item.notes || ""
    });
    setEditingItemId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const removeItem = (id) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== id)
    });
    if (editingItemId === id) {
      resetCurrentItem();
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    if (formData.transaction_type === "sale" && !formData.customer_name) {
      toast.error("Customer name is required for sale transactions");
      return;
    }
    if (formData.transaction_type === "purchase" && !formData.saler_name) {
      toast.error("Saler name is required for purchase transactions");
      return;
    }
    if (formData.transaction_type === "auction" && !formData.auction_id) {
      toast.error("Auction house is required for auction transactions");
      return;
    }
    setLoading(true);
    try {
      const endpoint = editingOrder ? `/revenue/orders/${editingOrder.id}/update_with_items/` : "/revenue/orders/create_with_items/";
      const method = "POST";
      const payload = {
        ...formData,
        transaction: selectedTransaction && selectedTransaction.id ? selectedTransaction.id : null
      };
      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(errorMessage);
      }
      toast.success(editingOrder ? "Order updated successfully" : "Order created successfully");
      setTimeout(() => onSave(), 900);
    } catch (error) {
      toast.error(error.message || (editingOrder ? "Failed to update order" : "Failed to create order"));
    } finally {
      setLoading(false);
    }
  };
  const handleTransactionTypeChange = (transactionType) => {
    setSelectedCustomer(null);
    setSelectedSaler(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setFormData({
      ...formData,
      transaction_type: transactionType,
      customer_id: null,
      saler_id: null,
      customer_name: "",
      saler_name: "",
      seller_name: "",
      phone: "",
      address: "",
      account_number: ""
    });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "order-manager" }, /* @__PURE__ */ React.createElement(ToastContainer, { position: "top-right", autoClose: 3e3 }), /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("h2", null, editingOrder ? "Edit Order" : t.addNewOrder), /* @__PURE__ */ React.createElement("button", { className: "btn-secondary", onClick: onCancel }, t.cancel)), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "order-form" }, /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.type), /* @__PURE__ */ React.createElement("select", { value: formData.transaction_type, onChange: (e) => handleTransactionTypeChange(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "sale" }, t.sale), /* @__PURE__ */ React.createElement("option", { value: "purchase" }, t.purchase), /* @__PURE__ */ React.createElement("option", { value: "nagare" }, t.nagare || "Nagare"))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.date), /* @__PURE__ */ React.createElement(
    DateInput,
    {
      value: formData.transaction_date,
      onChange: (e) => setFormData({ ...formData, transaction_date: e.target.value }),
      readOnly: selectedTransaction && selectedTransaction.id,
      style: selectedTransaction && selectedTransaction.id ? { backgroundColor: "#f3f4f6", cursor: "not-allowed" } : {}
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Category"), /* @__PURE__ */ React.createElement("select", { value: formData.transaction_catagory, onChange: (e) => setFormData({ ...formData, transaction_catagory: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "local" }, "Local"), /* @__PURE__ */ React.createElement("option", { value: "foreign" }, "Foreign")))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Company Bank Account"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: formData.company_account_id || "",
      onChange: (e) => {
        const accountId = e.target.value ? Number(e.target.value) : null;
        setFormData({
          ...formData,
          company_account_id: accountId
        });
        if (accountId) {
          fetchTransactions(accountId);
        } else {
          setTransactions([]);
          setSelectedTransaction(null);
        }
      }
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select Account"),
    companyAccounts.map((a) => /* @__PURE__ */ React.createElement("option", { key: a.id, value: a.id }, a.bank_name, " - ", a.account_number))
  )), selectedCompanyAccount && /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Company Bank Name"), /* @__PURE__ */ React.createElement("input", { type: "text", value: selectedCompanyAccount.bank_name || "", readOnly: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Company Account Number"), /* @__PURE__ */ React.createElement("input", { type: "text", value: selectedCompanyAccount.account_number || "", readOnly: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Account Holder"), /* @__PURE__ */ React.createElement("input", { type: "text", value: selectedCompanyAccount.account_holder || "", readOnly: true }))), selectedCompanyAccount && /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Company Branch Code"), /* @__PURE__ */ React.createElement("input", { type: "text", value: selectedCompanyAccount.branch_code || "", readOnly: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Company SWIFT Code"), /* @__PURE__ */ React.createElement("input", { type: "text", value: selectedCompanyAccount.swift_code || "", readOnly: true }))), formData.company_account_id && !selectedTransaction && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: "1.5rem" } }, /* @__PURE__ */ React.createElement("h4", { style: { marginBottom: "1rem", fontSize: "0.95rem", fontWeight: "700" } }, "Select Transaction (Optional)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: "1 1 220px", minWidth: "180px", position: "relative" } }, /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { style: { flex: "0 1 180px", minWidth: "150px" } }, /* @__PURE__ */ React.createElement(
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
      onClick: () => fetchTransactions(formData.company_account_id),
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
  )), loadingTransactions ? /* @__PURE__ */ React.createElement("div", { className: "loader" }, "Loading transactions...") : /* @__PURE__ */ React.createElement("div", { style: { maxHeight: "220px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--card)", padding: "0.25rem" } }, transactions.map((t2) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: t2.id,
      onClick: () => {
        setSelectedTransaction(t2);
        const totalAmount = formData.items.reduce((sum, item) => sum + getItemTotal(item), 0);
        if (totalAmount === 0) {
          setFormData((prev) => ({ ...prev, transaction_date: t2.date }));
        }
      },
      style: {
        padding: "0.75rem 1rem",
        cursor: "pointer",
        borderBottom: "1px solid var(--border)",
        transition: "all 0.2s ease",
        borderRadius: "8px"
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
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.35rem" } }, "\u{1F4C5} ", t2.date),
    /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.4rem" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "0.3rem 0.5rem", borderRadius: "6px", background: Number(t2.deposit) > 0 ? "#ecfdf5" : "var(--secondary)", border: Number(t2.deposit) > 0 ? "1px solid #a7f3d0" : "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.7rem", fontWeight: 600, color: Number(t2.deposit) > 0 ? "#166534" : "var(--muted-foreground)" } }, "\u{1F4E5} Deposit:"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.75rem", fontWeight: 700, color: Number(t2.deposit) > 0 ? "#15803d" : "var(--muted-foreground)" } }, Number(t2.deposit) > 0 ? `+\xA5${Number(t2.deposit).toLocaleString()}` : "\xA50")), /* @__PURE__ */ React.createElement("div", { style: { padding: "0.3rem 0.5rem", borderRadius: "6px", background: Number(t2.withdraw) > 0 ? "#fff1f2" : "var(--secondary)", border: Number(t2.withdraw) > 0 ? "1px solid #fecdd3" : "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.7rem", fontWeight: 600, color: Number(t2.withdraw) > 0 ? "#991b1b" : "var(--muted-foreground)" } }, "\u{1F4E4} Withdraw:"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.75rem", fontWeight: 700, color: Number(t2.withdraw) > 0 ? "#b91c1c" : "var(--muted-foreground)" } }, Number(t2.withdraw) > 0 ? `-\xA5${Number(t2.withdraw).toLocaleString()}` : "\xA50")))
  )), transactions.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "2rem", textAlign: "center", color: "var(--muted-foreground)", fontSize: "0.875rem" } }, "No transactions found")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: () => setSelectedTransaction({}), style: { marginTop: "1rem", width: "100%" } }, "Skip - Add Order Without Transaction")), selectedTransaction && selectedTransaction.id && /* @__PURE__ */ React.createElement("div", { style: { padding: "1.25rem", background: "var(--color-lime)", color: "var(--color-ink)", borderRadius: "16px", marginBottom: "1.5rem", border: "1px solid var(--color-lime)", boxShadow: "var(--shadow-card)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.25rem" } }, "Selected Transaction"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.8rem" } }, /* @__PURE__ */ React.createElement("div", null, "\u{1F4C5} ", /* @__PURE__ */ React.createElement("strong", null, selectedTransaction.date)), /* @__PURE__ */ React.createElement("div", null, "\u{1F4E5} Deposit: ", /* @__PURE__ */ React.createElement("strong", { style: { color: Number(selectedTransaction.deposit) > 0 ? "#15803d" : "inherit" } }, "\xA5", Number(selectedTransaction.deposit || 0).toLocaleString())), /* @__PURE__ */ React.createElement("div", null, "\u{1F4E4} Withdraw: ", /* @__PURE__ */ React.createElement("strong", { style: { color: Number(selectedTransaction.withdraw) > 0 ? "#b91c1c" : "inherit" } }, "\xA5", Number(selectedTransaction.withdraw || 0).toLocaleString()))), /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: () => setSelectedTransaction(null), style: { marginTop: "0.75rem", fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "8px", background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" } }, "Change Transaction")), /* @__PURE__ */ React.createElement("div", { className: "form-group customer-dropdown-wrapper" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem", flexWrap: "wrap", gap: "0.5rem" } }, /* @__PURE__ */ React.createElement("label", { style: { margin: 0, fontWeight: 600 } }, formData.transaction_type === "purchase" ? "Seller" : "Customer", " ", formData.transaction_type === "nagare" && "(Optional)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "0.75rem", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => openPartyModal(formData.transaction_type === "purchase" ? "saler" : "customer"),
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
    "+ Add ",
    formData.transaction_type === "purchase" ? "Seller" : "Customer"
  ))), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: formData.transaction_type === "purchase" ? "Search sellers..." : "Search customers...",
      value: customerSearch,
      onChange: (e) => setCustomerSearch(e.target.value),
      onFocus: () => setShowCustomerDropdown(true)
    }
  ), showCustomerDropdown && /* @__PURE__ */ React.createElement("div", { className: "category-dropdown-list" }, (formData.transaction_type === "purchase" ? salers : customers).length > 0 ? (formData.transaction_type === "purchase" ? salers : customers).map((c) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: c.id,
      className: "category-option",
      onClick: () => {
        if (formData.transaction_type === "purchase") {
          setSelectedSaler(c);
          setSelectedCustomer(null);
        } else {
          setSelectedCustomer(c);
          setSelectedSaler(null);
        }
        setCustomerSearch(c.name);
        if (formData.transaction_type === "purchase") {
          setFormData({
            ...formData,
            saler_id: c.id,
            saler_name: c.name,
            seller_name: c.name,
            customer_id: null,
            customer_name: "",
            phone: c.phone,
            address: c.address
          });
        } else {
          setFormData({
            ...formData,
            customer_id: c.id,
            customer_name: c.name,
            saler_id: null,
            saler_name: "",
            seller_name: "",
            phone: c.phone,
            address: c.address
          });
        }
        setShowCustomerDropdown(false);
      }
    },
    c.name,
    " - ",
    c.email
  )) : /* @__PURE__ */ React.createElement("div", { className: "category-option disabled" }, formData.transaction_type === "purchase" ? "No sellers found" : "No customers found"), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "category-option",
      onClick: () => openPartyModal(formData.transaction_type === "purchase" ? "saler" : "customer"),
      style: {
        borderTop: "1px solid var(--border)",
        color: "var(--primary)",
        fontWeight: 700,
        background: "var(--secondary)",
        cursor: "pointer",
        padding: "0.65rem 0.85rem"
      }
    },
    "\u2795 Add New ",
    formData.transaction_type === "purchase" ? "Seller" : "Customer"
  ))), formData.transaction_type !== "uction" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, formData.transaction_type === "purchase" ? "Saler Name" : "Customer Name"), /* @__PURE__ */ React.createElement("input", { type: "text", value: formData.transaction_type === "purchase" ? formData.saler_name : formData.customer_name, readOnly: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Phone"), /* @__PURE__ */ React.createElement("input", { type: "tel", value: formData.phone, readOnly: true }))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Address"), /* @__PURE__ */ React.createElement("textarea", { value: formData.address, rows: "2", readOnly: true })), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Payment Status"), /* @__PURE__ */ React.createElement("select", { value: formData.payment_status, onChange: (e) => setFormData({ ...formData, payment_status: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "pending" }, "Pending"), /* @__PURE__ */ React.createElement("option", { value: "completed" }, "Completed"), /* @__PURE__ */ React.createElement("option", { value: "failed" }, "Failed"))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Payment Method"), /* @__PURE__ */ React.createElement("select", { value: formData.payment_method, onChange: (e) => setFormData({ ...formData, payment_method: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "Cash" }, "Cash"), /* @__PURE__ */ React.createElement("option", { value: "Bank" }, "Bank")))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", { style: { display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: Boolean(formData.is_highlighted),
      onChange: (e) => setFormData({ ...formData, is_highlighted: e.target.checked }),
      style: { width: "18px", height: "18px", accentColor: "var(--primary)" }
    }
  ), "\u2B50 Highlight this invoice in the list")), formData.payment_method === "Bank" && (formData.transaction_type === "purchase" ? selectedSaler : selectedCustomer) && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, formData.transaction_type === "purchase" ? "Saler Bank Name" : "Customer Bank Name"), /* @__PURE__ */ React.createElement("input", { type: "text", value: (formData.transaction_type === "purchase" ? selectedSaler?.bank_name : selectedCustomer?.bank_name) || "", readOnly: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, formData.transaction_type === "purchase" ? "Saler Account Number" : "Customer Account Number"), /* @__PURE__ */ React.createElement("input", { type: "text", value: (formData.transaction_type === "purchase" ? selectedSaler?.account_number : selectedCustomer?.account_number) || "", readOnly: true }))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, formData.transaction_type === "purchase" ? "Saler Branch Code" : "Customer Branch Code"), /* @__PURE__ */ React.createElement("input", { type: "text", value: (formData.transaction_type === "purchase" ? selectedSaler?.branch_code : selectedCustomer?.branch_code) || "", readOnly: true })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, formData.transaction_type === "purchase" ? "Saler SWIFT Code" : "Customer SWIFT Code"), /* @__PURE__ */ React.createElement("input", { type: "text", value: (formData.transaction_type === "purchase" ? selectedSaler?.swift_code : selectedCustomer?.swift_code) || "", readOnly: true }))))), formData.transaction_type !== "uction" && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Auction House"), /* @__PURE__ */ React.createElement("select", { value: formData.auction_id || "", onChange: (e) => setFormData({ ...formData, auction_id: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Select Auction"), auctions.map((a) => /* @__PURE__ */ React.createElement("option", { key: a.id, value: a.id }, a.name)))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.notes), /* @__PURE__ */ React.createElement("textarea", { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "items-section" }, /* @__PURE__ */ React.createElement("h4", null, t.vehicleItems), /* @__PURE__ */ React.createElement("div", { className: "item-form" }, /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Car Source"), /* @__PURE__ */ React.createElement("select", { value: useExistingCar, onChange: (e) => {
    setUseExistingCar(e.target.value === "true");
    setCurrentItem({ ...currentItem, category: "", model: "", chassis_number: "", year: (/* @__PURE__ */ new Date()).getFullYear() });
  } }, /* @__PURE__ */ React.createElement("option", { value: "false" }, "Add New Car"), /* @__PURE__ */ React.createElement("option", { value: "true" }, "Select Existing Car")))), useExistingCar ? /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group category-dropdown-wrapper" }, /* @__PURE__ */ React.createElement("label", null, "Select Car Name (Company - Model)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search car names...",
      value: categorySearch,
      onChange: (e) => setCategorySearch(e.target.value),
      onFocus: () => setShowCategoryDropdown(true)
    }
  ), showCategoryDropdown && /* @__PURE__ */ React.createElement("div", { className: "category-dropdown-list" }, filteredCategories.length > 0 ? filteredCategories.map((cat) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: cat.id,
      className: "category-option",
      onClick: () => {
        setCurrentItem({ ...currentItem, category: cat.id, model: cat.model });
        setCategorySearch(`${cat.company} - ${cat.model}`);
        setShowCategoryDropdown(false);
      }
    },
    cat.company,
    " - ",
    cat.model
  )) : /* @__PURE__ */ React.createElement("div", { className: "category-option disabled" }, "No car names found"))), currentItem.category && /* @__PURE__ */ React.createElement("div", { className: "form-group car-dropdown-wrapper" }, /* @__PURE__ */ React.createElement("label", null, "Select Existing Car"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search cars...",
      value: carSearch,
      onChange: (e) => setCarSearch(e.target.value),
      onFocus: () => setShowCarDropdown(true)
    }
  ), showCarDropdown && /* @__PURE__ */ React.createElement("div", { className: "category-dropdown-list" }, filteredCars.filter((c) => c.category_model && c.category_model.toLowerCase().includes(carSearch.toLowerCase())).length > 0 ? filteredCars.filter((c) => c.category_model && c.category_model.toLowerCase().includes(carSearch.toLowerCase())).map((car) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: car.id,
      className: "category-option",
      onClick: () => {
        setCurrentItem({ ...currentItem, model: car.category_model, chassis_number: car.chassis_number, year: car.year });
        setCarSearch(car.category_model);
        setShowCarDropdown(false);
      }
    },
    car.category_model,
    " (",
    car.chassis_number,
    ")"
  )) : /* @__PURE__ */ React.createElement("div", { className: "category-option disabled" }, "No cars found")))) : /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group category-dropdown-wrapper" }, /* @__PURE__ */ React.createElement("label", null, "Car Name (Company - Model)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search car names...",
      value: categorySearch,
      onChange: (e) => setCategorySearch(e.target.value),
      onFocus: () => setShowCategoryDropdown(true)
    }
  ), showCategoryDropdown && /* @__PURE__ */ React.createElement("div", { className: "category-dropdown-list" }, filteredCategories.length > 0 ? filteredCategories.map((cat) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: cat.id,
      className: "category-option",
      onClick: () => {
        setCurrentItem({ ...currentItem, category: cat.id, model: cat.model });
        setCategorySearch(`${cat.company} - ${cat.model}`);
        setShowCategoryDropdown(false);
      }
    },
    cat.company,
    " - ",
    cat.model
  )) : /* @__PURE__ */ React.createElement("div", { className: "category-option disabled" }, "No car names found"))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.model), /* @__PURE__ */ React.createElement("input", { type: "text", value: currentItem.model, onChange: (e) => setCurrentItem({ ...currentItem, model: e.target.value }), readOnly: true }))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.chassisNumber), /* @__PURE__ */ React.createElement("input", { type: "text", value: currentItem.chassis_number, onChange: (e) => setCurrentItem({ ...currentItem, chassis_number: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.year), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.year, onChange: (e) => setCurrentItem({ ...currentItem, year: e.target.value }) })), formData.transaction_type !== "action" && /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.venue), /* @__PURE__ */ React.createElement("input", { type: "text", value: currentItem.venue, onChange: (e) => setCurrentItem({ ...currentItem, venue: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("vehicle_price") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("vehicle_price"), ")"), " ", t.vehiclePrice), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.vehicle_price, onChange: (e) => {
    const val = e.target.value;
    setCurrentItem({ ...currentItem, vehicle_price: val, vehicle_price_tax: (val * 0.1).toFixed(0) });
  } })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("vehicle_price_tax") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("vehicle_price_tax"), ")"), " Vehicle Price Tax"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.vehicle_price_tax, onChange: (e) => setCurrentItem({ ...currentItem, vehicle_price_tax: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("recycle_fee") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("recycle_fee"), ")"), " Recycle Fee"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.recycle_fee, onChange: (e) => setCurrentItem({ ...currentItem, recycle_fee: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("listing_fee") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("listing_fee"), ")"), " Listing Fee"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.listing_fee, onChange: (e) => {
    const val = e.target.value;
    setCurrentItem({ ...currentItem, listing_fee: val, listing_fee_tax: (val * 0.1).toFixed(0) });
  } })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("listing_fee_tax") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("listing_fee_tax"), ")"), " Listing Fee Tax"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.listing_fee_tax, onChange: (e) => setCurrentItem({ ...currentItem, listing_fee_tax: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("successful_bid") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("successful_bid"), ")"), " Successful Bid"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.successful_bid, onChange: (e) => {
    const val = e.target.value;
    setCurrentItem({ ...currentItem, successful_bid: val, successful_bid_tax: (val * 0.1).toFixed(0) });
  } }))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("successful_bid_tax") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("successful_bid_tax"), ")"), " Successful Bid Tax"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.successful_bid_tax, onChange: (e) => setCurrentItem({ ...currentItem, successful_bid_tax: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("commission_fee") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("commission_fee"), ")"), " Commission Fee"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.commission_fee, onChange: (e) => {
    const val = e.target.value;
    setCurrentItem({ ...currentItem, commission_fee: val, commission_fee_tax: (val * 0.1).toFixed(0) });
  } })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("commission_fee_tax") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("commission_fee_tax"), ")"), " Commission Fee Tax"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.commission_fee_tax, onChange: (e) => setCurrentItem({ ...currentItem, commission_fee_tax: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("transport_fee") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("transport_fee"), ")"), " Transport Fee"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.transport_fee, onChange: (e) => {
    const val = e.target.value;
    setCurrentItem({ ...currentItem, transport_fee: val, transport_fee_tax: (val * 0.1).toFixed(0) });
  } })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("transport_fee_tax") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("transport_fee_tax"), ")"), " Transport Fee Tax"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.transport_fee_tax, onChange: (e) => setCurrentItem({ ...currentItem, transport_fee_tax: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("registration_fee") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("registration_fee"), ")"), " Registration Fee"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.registration_fee, onChange: (e) => {
    const val = e.target.value;
    setCurrentItem({ ...currentItem, registration_fee: val, registration_fee_tax: (val * 0.1).toFixed(0) });
  } }))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("registration_fee_tax") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("registration_fee_tax"), ")"), " Registration Fee Tax"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.registration_fee_tax, onChange: (e) => setCurrentItem({ ...currentItem, registration_fee_tax: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("span", { className: getFieldSign("canceling_fee") === "+" ? "sign-positive" : "sign-negative" }, "(", getFieldSign("canceling_fee"), ")"), " Canceling Fee"), /* @__PURE__ */ React.createElement("input", { type: "number", value: currentItem.canceling_fee, onChange: (e) => setCurrentItem({ ...currentItem, canceling_fee: e.target.value }) }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "1rem" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: addItem }, editingItemId ? "Update Item" : t.addItem), editingItemId && /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: resetCurrentItem }, "Cancel Edit"))), /* @__PURE__ */ React.createElement("div", { className: "items-list" }, formData.items.map((item) => {
    const category = Array.isArray(categories) ? categories.find((c) => String(c.id) === String(item.category)) : null;
    const categoryLabel = category ? `${category.company} - ${category.model}` : item.category || "Unknown Category";
    const isEditing = editingItemId === item.id;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: item.id,
        className: "item-card",
        style: {
          cursor: "pointer",
          border: isEditing ? "2px solid var(--color-violet-soft)" : "1px solid var(--border)",
          backgroundColor: isEditing ? "rgba(199, 184, 255, 0.12)" : "var(--card)",
          boxShadow: "var(--shadow-card)"
        },
        onClick: () => editItem(item)
      },
      /* @__PURE__ */ React.createElement("div", { className: "item-info" }, /* @__PURE__ */ React.createElement("strong", null, item.car_company && item.car_model ? `${item.car_company} - ${item.car_model}` : categoryLabel), " - ", item.chassis_number, " (", item.year, ")", /* @__PURE__ */ React.createElement("div", { className: "item-details" }, formData.transaction_type === "auction" ? `Venue: ${item.venue}` : "", " | Total: \xA5", getItemTotal(item).toLocaleString())),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "btn-remove",
          onClick: (e) => {
            e.stopPropagation();
            removeItem(item.id);
          }
        },
        "\u274C"
      )
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "form-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: onCancel, disabled: loading }, t.cancel), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn-primary", disabled: loading }, loading ? "Saving..." : editingOrder ? "Update Order" : t.addOrder))), showPartyModal && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "modal-box", style: { maxWidth: 540 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-header" }, /* @__PURE__ */ React.createElement("h3", null, partyType === "saler" ? "Add New Seller" : "Add New Customer"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "modal-close",
      onClick: () => setShowPartyModal(false)
    },
    "\xD7"
  )), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSaveParty, className: "modal-form", style: { padding: "1.25rem 1.5rem" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "0.5rem", marginBottom: "1.25rem" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: partyType === "customer" ? "btn-primary" : "btn-secondary",
      style: { flex: 1, padding: "0.45rem 1rem", fontSize: "0.875rem" },
      onClick: () => setPartyType("customer")
    },
    "Customer"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: partyType === "saler" ? "btn-primary" : "btn-secondary",
      style: { flex: 1, padding: "0.45rem 1rem", fontSize: "0.875rem" },
      onClick: () => setPartyType("saler")
    },
    "Seller (Saler)"
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Name ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "Full Name",
      value: partyFormData.name,
      onChange: (e) => setPartyFormData({ ...partyFormData, name: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Email ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      className: "form-input",
      placeholder: "email@example.com",
      value: partyFormData.email,
      onChange: (e) => setPartyFormData({ ...partyFormData, email: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Phone ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      className: "form-input",
      placeholder: "Phone number",
      value: partyFormData.phone,
      onChange: (e) => setPartyFormData({ ...partyFormData, phone: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Address ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "form-input",
      placeholder: "Full Address",
      rows: "2",
      value: partyFormData.address,
      onChange: (e) => setPartyFormData({ ...partyFormData, address: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Bank Name ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "Bank Name",
      value: partyFormData.bank_name,
      onChange: (e) => setPartyFormData({ ...partyFormData, bank_name: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Account Number ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "Account Number",
      value: partyFormData.account_number,
      onChange: (e) => setPartyFormData({ ...partyFormData, account_number: e.target.value }),
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "form-row" }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Branch Code ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--destructive, #ef4444)" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "Branch Code",
      value: partyFormData.branch_code,
      onChange: (e) => setPartyFormData({ ...partyFormData, branch_code: e.target.value }),
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "Swift Code (Optional)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      className: "form-input",
      placeholder: "SWIFT / BIC Code",
      value: partyFormData.swift_code,
      onChange: (e) => setPartyFormData({ ...partyFormData, swift_code: e.target.value })
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "modal-actions", style: { marginTop: "1.25rem" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "btn-secondary",
      onClick: () => setShowPartyModal(false),
      disabled: savingParty
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "btn-primary",
      disabled: savingParty
    },
    savingParty ? "Saving..." : `Save ${partyType === "saler" ? "Seller" : "Customer"}`
  ))))));
};
export default AddOrder;
