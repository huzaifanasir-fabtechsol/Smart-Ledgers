import { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const AddOrder = ({ language = 'en', onSave, onCancel, editingOrder = null }) => {
  const t = translations[language];
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [salers, setSalers] = useState([]);
  const [allSalers, setAllSalers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSaler, setSelectedSaler] = useState(null);
  const [companyAccounts, setCompanyAccounts] = useState([]);
  const [selectedCompanyAccount, setSelectedCompanyAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [auctions, setAuctions] = useState([]);
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [carSearch, setCarSearch] = useState('');
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [useExistingCar, setUseExistingCar] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const [formData, setFormData] = useState({
    transaction_type: 'sale',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_catagory: 'local',
    customer_id: null,
    saler_id: null,
    company_account_id: null,
    auction_id: null,
    customer_name: '',
    saler_name: '',
    seller_name: '',
    phone: '',
    address: '',
    payment_method: 'Cash',
    account_number: '',
    auction_house: '',
    payment_status: 'pending',
    notes: '',
    items: []
  });

  const [currentItem, setCurrentItem] = useState({
    category: '',
    model: '',
    chassis_number: '',
    year: new Date().getFullYear(),
    venue: '',
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
    notes: ''
  });

  const getItemTotal = (item) => (
    Number(item.vehicle_price || 0) +
    Number(item.vehicle_price_tax || 0) +
    Number(item.recycle_fee || 0) +
    Number(item.listing_fee || 0) +
    Number(item.listing_fee_tax || 0) +
    Number(item.successful_bid || 0) +
    Number(item.successful_bid_tax || 0) +
    Number(item.commission_fee || 0) +
    Number(item.commission_fee_tax || 0) +
    Number(item.transport_fee || 0) +
    Number(item.transport_fee_tax || 0) +
    Number(item.registration_fee || 0) +
    Number(item.registration_fee_tax || 0) +
    Number(item.canceling_fee || 0)
  );

  const normalizeOrderItem = useCallback((item) => {
    const carId = typeof item.car === 'object' ? item.car?.id : item.car;
    const matchedCar = cars.find((c) => String(c.id) === String(carId));

    return {
      id: item.id,
      category: item.category || item.car_category || item.car?.category || matchedCar?.category || '',
      model: item.model || item.car?.model || matchedCar?.model || '',
      chassis_number: item.chassis_number || item.car?.chassis_number || matchedCar?.chassis_number || '',
      year: item.year || item.car?.year || matchedCar?.year || new Date().getFullYear(),
      venue: item.venue || '',
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
      notes: item.notes || ''
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
      categories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
    );
  }, [categorySearch, categories]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.category-dropdown-wrapper')) {
        setShowCategoryDropdown(false);
      }
      if (!e.target.closest('.customer-dropdown-wrapper')) {
        setShowCustomerDropdown(false);
      }
      if (!e.target.closest('.car-dropdown-wrapper')) {
        setShowCarDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (customerSearch) {
      if (formData.transaction_type === 'purchase') {
        const filtered = allSalers.filter(s =>
          s.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          s.email.toLowerCase().includes(customerSearch.toLowerCase())
        );
        setSalers(filtered);
      } else {
        const filtered = allCustomers.filter(c =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(customerSearch.toLowerCase())
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
    const selectedParty = formData.transaction_type === 'purchase' ? selectedSaler : selectedCustomer;
    if (!selectedParty) return;
    const nextAccount = formData.payment_method === 'Bank' ? (selectedParty.account_number || '') : '';
    setFormData((prev) => {
      if (prev.account_number === nextAccount) return prev;
      return { ...prev, account_number: nextAccount };
    });
  }, [selectedCustomer, selectedSaler, formData.payment_method, formData.transaction_type]);

  useEffect(() => {
    if (currentItem.category && useExistingCar) {
      const filtered = cars.filter(c => c.category === currentItem.category);
      setFilteredCars(filtered);
    }
  }, [currentItem.category, cars, useExistingCar]);

  const fetchCategories = async () => {
    try {
      const response = await apiRequest('/revenue/categories/all/');
      const data = await response.json();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiRequest('/revenue/customers/');
      const data = await response.json();
      const rows = data.results || data;
      setAllCustomers(rows);
      setCustomers(rows);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const fetchSalers = async () => {
    try {
      const response = await apiRequest('/revenue/salers/');
      const data = await response.json();
      const rows = data.results || data;
      setAllSalers(rows);
      setSalers(rows);
    } catch (error) {
      toast.error('Failed to load salers');
    }
  };

  const fetchCompanyAccounts = async () => {
    try {
      const response = await apiRequest('/revenue/company-accounts/');
      const data = await response.json();
      setCompanyAccounts(data.results || data);
    } catch (error) {
      toast.error('Failed to load company accounts');
    }
  };

  const fetchAuctions = async () => {
    try {
      const response = await apiRequest('/revenue/auctions/');
      const data = await response.json();
      setAuctions(data.results || data);
    } catch (error) {
      toast.error('Failed to load auctions');
    }
  };

  const fetchCars = async () => {
    try {
      const response = await apiRequest('/revenue/cars/');
      const data = await response.json();
      setCars(data);
    } catch (error) {
      toast.error('Failed to load cars');
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
      customer_name: order.other_details?.customer_name || '',
      saler_name: order.other_details?.saler_name || '',
      seller_name: order.other_details?.seller_name || '',
      phone: order.other_details?.phone || '',
      address: order.other_details?.address || '',
      payment_method: order.other_details?.payment_method || 'Cash',
      account_number: order.other_details?.account_number || '',
      auction_house: order.other_details?.auction_house || '',
      payment_status: order.payment_status,
      notes: order.notes || '',
      items: order.items?.map((item) => normalizeOrderItem(item)) || []
    });
    
    if (order.customer) {
      const customer = allCustomers.find(c => c.id === order.customer);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
      }
    }
    
    if (order.saler) {
      const saler = allSalers.find(s => s.id === order.saler);
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

  const addItem = () => {
    if (!currentItem.category) {
      toast.error('Please select a car name');
      return;
    }
    if (!currentItem.model) {
      toast.error('Model is required');
      return;
    }
    if (!currentItem.chassis_number) {
      toast.error('Chassis number is required');
      return;
    }
    
    if (editingItemId) {
      // Update existing item
      setFormData({
        ...formData,
        items: formData.items.map(item => 
          item.id === editingItemId ? { ...currentItem, id: editingItemId } : item
        )
      });
      setEditingItemId(null);
    } else {
      // Add new item
      setFormData({
        ...formData,
        items: [...formData.items, { ...currentItem, id: Date.now() }]
      });
    }
    
    resetCurrentItem();
  };

  const resetCurrentItem = () => {
    setCurrentItem({
      category: '',
      model: '',
      chassis_number: '',
      year: new Date().getFullYear(),
      venue: '',
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
      notes: ''
    });
    setCategorySearch('');
    setCarSearch('');
    setEditingItemId(null);
  };

  const editItem = (item) => {
    const category = categories.find(c => String(c.id) === String(item.category));
    if (category) {
      setCategorySearch(`${category.company} - ${category.name}`);
    }
    setCarSearch(item.model || '');
    setCurrentItem({
      category: item.category,
      model: item.model,
      chassis_number: item.chassis_number,
      year: item.year,
      venue: item.venue || '',
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
      notes: item.notes || ''
    });
    setEditingItemId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = (id) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    });
    if (editingItemId === id) {
      resetCurrentItem();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (formData.transaction_type === 'sale' && !formData.customer_name) {
      toast.error('Customer name is required for sale transactions');
      return;
    }

    if (formData.transaction_type === 'purchase' && !formData.saler_name) {
      toast.error('Saler name is required for purchase transactions');
      return;
    }

    if (formData.transaction_type === 'auction' && !formData.auction_id) {
      toast.error('Auction house is required for auction transactions');
      return;
    }

    setLoading(true);
    try {
      const endpoint = editingOrder 
        ? `/revenue/orders/${editingOrder.id}/update_with_items/` 
        : '/revenue/orders/create_with_items/';
      const method = 'POST';
      
      const payload = {
        ...formData,
        transaction: selectedTransaction && selectedTransaction.id ? selectedTransaction.id : null
      };
      
      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Order operation failed');
      }
      toast.success(editingOrder ? 'Order updated successfully' : 'Order created successfully');
      setTimeout(() => onSave(), 900);
    } catch (error) {
      toast.error(editingOrder ? 'Failed to update order' : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionTypeChange = (transactionType) => {
    setSelectedCustomer(null);
    setSelectedSaler(null);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setFormData({
      ...formData,
      transaction_type: transactionType,
      customer_id: null,
      saler_id: null,
      customer_name: '',
      saler_name: '',
      seller_name: '',
      phone: '',
      address: '',
      account_number: ''
    });
  };

  return (
    <div className="order-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>{editingOrder ? 'Edit Order' : t.addNewOrder}</h2>
        <button className="btn-secondary" onClick={onCancel}>{t.cancel}</button>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-row">
          <div className="form-group">
            <label>{t.type}</label>
            <select value={formData.transaction_type} onChange={(e) => handleTransactionTypeChange(e.target.value)}>
              <option value="sale">{t.sale}</option>
              <option value="purchase">{t.purchase}</option>
              {/* <option value="auction">{t.auction}</option> */}
            </select>
          </div>
          <div className="form-group">
            <label>{t.date}</label>
            <input 
              type="date" 
              value={formData.transaction_date} 
              onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} 
              readOnly={selectedTransaction && selectedTransaction.id}
              style={selectedTransaction && selectedTransaction.id ? {backgroundColor: '#f3f4f6', cursor: 'not-allowed'} : {}}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={formData.transaction_catagory} onChange={(e) => setFormData({...formData, transaction_catagory: e.target.value})}>
              <option value="local">Local</option>
              <option value="foreign">Foreign</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Company Bank Account</label>
          <select
            value={formData.company_account_id || ''}
            onChange={(e) => {
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
            }}
          >
            <option value="">Select Account</option>
            {companyAccounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} - {a.account_number}</option>)}
          </select>
        </div>

        {selectedCompanyAccount && (
          <div className="form-row">
            <div className="form-group">
              <label>Company Bank Name</label>
              <input type="text" value={selectedCompanyAccount.bank_name || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Company Account Number</label>
              <input type="text" value={selectedCompanyAccount.account_number || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Account Holder</label>
              <input type="text" value={selectedCompanyAccount.account_holder || ''} readOnly />
            </div>
          </div>
        )}

        {selectedCompanyAccount && (
          <div className="form-row">
            <div className="form-group">
              <label>Company Branch Code</label>
              <input type="text" value={selectedCompanyAccount.branch_code || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Company SWIFT Code</label>
              <input type="text" value={selectedCompanyAccount.swift_code || ''} readOnly />
            </div>
          </div>
        )}

        {formData.company_account_id && !selectedTransaction && (
          <div style={{marginBottom: '1.5rem'}}>
            <h4 style={{marginBottom: '1rem'}}>Select Transaction (Optional)</h4>
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
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                />
              </div>
              <button type="button" className="btn-secondary" onClick={() => fetchTransactions(formData.company_account_id)}>Search</button>
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
                      const totalAmount = formData.items.reduce((sum, item) => sum + getItemTotal(item), 0);
                      if (totalAmount === 0) {
                        setFormData(prev => ({ ...prev, transaction_date: t.date }));
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
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
            <button type="button" className="btn-secondary" onClick={() => setSelectedTransaction({})} style={{marginTop: '1rem', width: '100%'}}>Skip - Add Order Without Transaction</button>
          </div>
        )}

        {selectedTransaction && selectedTransaction.id && (
          <div style={{padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '1rem'}}>
            <div style={{fontWeight: '500', color: '#166534'}}>Selected Transaction</div>
            <div style={{fontSize: '0.875rem', color: '#15803d'}}>{selectedTransaction.description} - ¥{Number(selectedTransaction.withdraw).toLocaleString()}</div>
            <button type="button" className="btn-secondary" onClick={() => setSelectedTransaction(null)} style={{marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}>Change Transaction</button>
          </div>
        )}

        <div className="form-group customer-dropdown-wrapper">
          <label>{formData.transaction_type === 'purchase' ? 'Saler' : 'Customer'}</label>
          <input
            type="text"
            placeholder={formData.transaction_type === 'purchase' ? 'Search salers...' : 'Search customers...'}
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            onFocus={() => setShowCustomerDropdown(true)}
          />
          {showCustomerDropdown && (
            <div className="category-dropdown-list">
              {(formData.transaction_type === 'purchase' ? salers : customers).length > 0 ? (
                (formData.transaction_type === 'purchase' ? salers : customers).map(c => (
                  <div
                    key={c.id}
                    className="category-option"
                    onClick={() => {
                      if (formData.transaction_type === 'purchase') {
                        setSelectedSaler(c);
                        setSelectedCustomer(null);
                      } else {
                        setSelectedCustomer(c);
                        setSelectedSaler(null);
                      }
                      setCustomerSearch(c.name);
                      if (formData.transaction_type === 'purchase') {
                        setFormData({
                          ...formData,
                          saler_id: c.id,
                          saler_name: c.name,
                          seller_name: c.name,
                          customer_id: null,
                          customer_name: '',
                          phone: c.phone,
                          address: c.address
                        });
                      } else {
                        setFormData({
                          ...formData,
                          customer_id: c.id,
                          customer_name: c.name,
                          saler_id: null,
                          saler_name: '',
                          seller_name: '',
                          phone: c.phone,
                          address: c.address
                        });
                      }
                      setShowCustomerDropdown(false);
                    }}
                  >
                    {c.name} - {c.email}
                  </div>
                ))
              ) : (
                <div className="category-option disabled">
                  {formData.transaction_type === 'purchase' ? 'No salers found' : 'No customers found'}
                </div>
              )}
            </div>
          )}
        </div>

        {formData.transaction_type !== 'uction' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{formData.transaction_type === 'purchase' ? 'Saler Name' : 'Customer Name'}</label>
                <input type="text" value={formData.transaction_type === 'purchase' ? formData.saler_name : formData.customer_name} readOnly />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={formData.phone} readOnly />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea value={formData.address} rows="2" readOnly />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payment Status</label>
                <select value={formData.payment_status} onChange={(e) => setFormData({...formData, payment_status: e.target.value})}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
            </div>

            {formData.payment_method === 'Bank' && (formData.transaction_type === 'purchase' ? selectedSaler : selectedCustomer) && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>{formData.transaction_type === 'purchase' ? 'Saler Bank Name' : 'Customer Bank Name'}</label>
                    <input type="text" value={(formData.transaction_type === 'purchase' ? selectedSaler?.bank_name : selectedCustomer?.bank_name) || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label>{formData.transaction_type === 'purchase' ? 'Saler Account Number' : 'Customer Account Number'}</label>
                    <input type="text" value={(formData.transaction_type === 'purchase' ? selectedSaler?.account_number : selectedCustomer?.account_number) || ''} readOnly />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{formData.transaction_type === 'purchase' ? 'Saler Branch Code' : 'Customer Branch Code'}</label>
                    <input type="text" value={(formData.transaction_type === 'purchase' ? selectedSaler?.branch_code : selectedCustomer?.branch_code) || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label>{formData.transaction_type === 'purchase' ? 'Saler SWIFT Code' : 'Customer SWIFT Code'}</label>
                    <input type="text" value={(formData.transaction_type === 'purchase' ? selectedSaler?.swift_code : selectedCustomer?.swift_code) || ''} readOnly />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {formData.transaction_type !== 'uction' && (
          <div className="form-group">
            <label>Auction House</label>
            <select value={formData.auction_id || ''} onChange={(e) => setFormData({...formData, auction_id: e.target.value})} required>
              <option value="">Select Auction</option>
              {auctions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>{t.notes}</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </div>

        <div className="items-section">
          <h4>{t.vehicleItems}</h4>
          
          <div className="item-form">
            <div className="form-row">
              <div className="form-group">
                <label>Car Source</label>
                <select value={useExistingCar} onChange={(e) => { setUseExistingCar(e.target.value === 'true'); setCurrentItem({...currentItem, category: '', model: '', chassis_number: '', year: new Date().getFullYear()}); }}>
                  <option value="false">Add New Car</option>
                  <option value="true">Select Existing Car</option>
                </select>
              </div>
            </div>

            {useExistingCar ? (
              <div className="form-row">
                <div className="form-group category-dropdown-wrapper">
                  <label>Select Car Name (Company - Model)</label>
                  <input 
                    type="text" 
                    placeholder="Search car names..." 
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                  />
                  {showCategoryDropdown && (
                    <div className="category-dropdown-list">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map(cat => (
                          <div
                            key={cat.id}
                            className="category-option"
                            onClick={() => {
                              setCurrentItem({...currentItem, category: cat.id});
                              setCategorySearch(`${cat.company} - ${cat.name}`);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            {cat.company} - {cat.name}
                          </div>
                        ))
                      ) : (
                        <div className="category-option disabled">No car names found</div>
                      )}
                    </div>
                  )}
                </div>
                {currentItem.category && (
                  <div className="form-group car-dropdown-wrapper">
                    <label>Select Existing Car</label>
                    <input 
                      type="text" 
                      placeholder="Search cars..." 
                      value={carSearch}
                      onChange={(e) => setCarSearch(e.target.value)}
                      onFocus={() => setShowCarDropdown(true)}
                    />
                    {showCarDropdown && (
                      <div className="category-dropdown-list">
                        {filteredCars.filter(c => c.model.toLowerCase().includes(carSearch.toLowerCase())).length > 0 ? (
                          filteredCars.filter(c => c.model.toLowerCase().includes(carSearch.toLowerCase())).map(car => (
                            <div
                              key={car.id}
                              className="category-option"
                              onClick={() => {
                                setCurrentItem({...currentItem, model: car.model, chassis_number: car.chassis_number, year: car.year});
                                setCarSearch(car.model);
                                setShowCarDropdown(false);
                              }}
                            >
                              {car.model} ({car.chassis_number})
                            </div>
                          ))
                        ) : (
                          <div className="category-option disabled">No cars found</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="form-row">
                <div className="form-group category-dropdown-wrapper">
                  <label>Car Name (Company - Model)</label>
                  <input 
                    type="text" 
                    placeholder="Search car names..." 
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                  />
                  {showCategoryDropdown && (
                    <div className="category-dropdown-list">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map(cat => (
                          <div
                            key={cat.id}
                            className="category-option"
                            onClick={() => {
                              setCurrentItem({...currentItem, category: cat.id});
                              setCategorySearch(`${cat.company} - ${cat.name}`);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            {cat.company} - {cat.name}
                          </div>
                        ))
                      ) : (
                        <div className="category-option disabled">No car names found</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>{t.model}</label>
                  <input type="text" value={currentItem.model} onChange={(e) => setCurrentItem({...currentItem, model: e.target.value})} />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>{t.chassisNumber}</label>
                <input type="text" value={currentItem.chassis_number} onChange={(e) => setCurrentItem({...currentItem, chassis_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t.year}</label>
                <input type="number" value={currentItem.year} onChange={(e) => setCurrentItem({...currentItem, year: e.target.value})} />
              </div>
              {formData.transaction_type !== 'action' && (
                <div className="form-group">
                  <label>{t.venue}</label>
                  <input type="text" value={currentItem.venue} onChange={(e) => setCurrentItem({...currentItem, venue: e.target.value})} />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.vehiclePrice}</label>
                <input type="number" value={currentItem.vehicle_price} onChange={(e) => {
                  const val = e.target.value;
                  setCurrentItem({...currentItem, vehicle_price: val, vehicle_price_tax: (val * 0.1).toFixed(0)});
                }} />
              </div>
              <div className="form-group">
                <label>Vehicle Price Tax</label>
                <input type="number" value={currentItem.vehicle_price_tax} onChange={(e) => setCurrentItem({...currentItem, vehicle_price_tax: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Recycle Fee</label>
                <input type="number" value={currentItem.recycle_fee} onChange={(e) => setCurrentItem({...currentItem, recycle_fee: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Listing Fee</label>
                <input type="number" value={currentItem.listing_fee} onChange={(e) => {
                  const val = e.target.value;
                  setCurrentItem({...currentItem, listing_fee: val, listing_fee_tax: (val * 0.1).toFixed(0)});
                }} />
              </div>
              <div className="form-group">
                <label>Listing Fee Tax</label>
                <input type="number" value={currentItem.listing_fee_tax} onChange={(e) => setCurrentItem({...currentItem, listing_fee_tax: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Successful Bid</label>
                <input type="number" value={currentItem.successful_bid} onChange={(e) => {
                  const val = e.target.value;
                  setCurrentItem({...currentItem, successful_bid: val, successful_bid_tax: (val * 0.1).toFixed(0)});
                }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Successful Bid Tax</label>
                <input type="number" value={currentItem.successful_bid_tax} onChange={(e) => setCurrentItem({...currentItem, successful_bid_tax: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Commission Fee</label>
                <input type="number" value={currentItem.commission_fee} onChange={(e) => {
                  const val = e.target.value;
                  setCurrentItem({...currentItem, commission_fee: val, commission_fee_tax: (val * 0.1).toFixed(0)});
                }} />
              </div>
              <div className="form-group">
                <label>Commission Fee Tax</label>
                <input type="number" value={currentItem.commission_fee_tax} onChange={(e) => setCurrentItem({...currentItem, commission_fee_tax: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Transport Fee</label>
                <input type="number" value={currentItem.transport_fee} onChange={(e) => {
                  const val = e.target.value;
                  setCurrentItem({...currentItem, transport_fee: val, transport_fee_tax: (val * 0.1).toFixed(0)});
                }} />
              </div>
              <div className="form-group">
                <label>Transport Fee Tax</label>
                <input type="number" value={currentItem.transport_fee_tax} onChange={(e) => setCurrentItem({...currentItem, transport_fee_tax: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Registration Fee</label>
                <input type="number" value={currentItem.registration_fee} onChange={(e) => {
                  const val = e.target.value;
                  setCurrentItem({...currentItem, registration_fee: val, registration_fee_tax: (val * 0.1).toFixed(0)});
                }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Registration Fee Tax</label>
                <input type="number" value={currentItem.registration_fee_tax} onChange={(e) => setCurrentItem({...currentItem, registration_fee_tax: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Canceling Fee</label>
                <input type="number" value={currentItem.canceling_fee} onChange={(e) => setCurrentItem({...currentItem, canceling_fee: e.target.value})} />
              </div>
            </div>

            <div style={{display: 'flex', gap: '1rem'}}>
              <button type="button" className="btn-secondary" onClick={addItem}>
                {editingItemId ? 'Update Item' : t.addItem}
              </button>
              {editingItemId && (
                <button type="button" className="btn-secondary" onClick={resetCurrentItem}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className="items-list">
            {formData.items.map((item) => {
              const category = categories.find(c => c.id === item.category);
              const isEditing = editingItemId === item.id;
              return (
                <div 
                  key={item.id} 
                  className="item-card" 
                  style={{
                    cursor: 'pointer',
                    border: isEditing ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isEditing ? '#eff6ff' : 'white'
                  }}
                  onClick={() => editItem(item)}
                >
                  <div className="item-info">
                    <strong>{category?.company} - {category?.name} ({item.model})</strong> - {item.chassis_number} ({item.year})
                    <div className="item-details">
                      {formData.transaction_type === 'auction' ? `Venue: ${item.venue}` : ''} | Total: ¥{getItemTotal(item).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-remove" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                  >❌</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>{t.cancel}</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : editingOrder ? 'Update Order' : t.addOrder}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddOrder;
