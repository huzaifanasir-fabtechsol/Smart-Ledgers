import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { translations } from '../translations';
import { apiRequest } from '../api';
import '../shared.css';
import './OrderManager.css';

const AddOrder = ({ language = 'en', onSave, onCancel }) => {
  const t = translations[language];
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
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
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiRequest('/revenue/categories/');
      const data = await response.json();
      setCategories(data.results || data);
      setFilteredCategories(data.results || data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };
  
  const [formData, setFormData] = useState({
    transaction_type: 'sale',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_catagory: 'local',
    customer_name: '',
    seller_name: '',
    phone: '',
    address: '',
    payment_method: '',
    account_number: '',
    auction_house: '',
    payment_status: 'pending',
    notes: '',
    items: []
  });

  const [currentItem, setCurrentItem] = useState({
    category: '',
    name: '',
    model: '',
    chassis_number: '',
    year: new Date().getFullYear(),
    venue: '',
    year_type: '',
    vehicle_price: 0,
    consumption_tax: 0,
    recycling_fee: 0,
    automobile_tax: 0,
    auction_fee: 0,
    bid_fee: 0,
    bid_fee_tax: 0,
    notes: ''
  });

  const addItem = () => {
    if (!currentItem.category) {
      toast.error('Please select a category');
      return;
    }
    if (!currentItem.name || !currentItem.model) {
      toast.error('Name and Model are required');
      return;
    }
    if (!currentItem.chassis_number) {
      toast.error('Chassis number is required');
      return;
    }
    if (!currentItem.vehicle_price) {
      toast.error('Vehicle price is required');
      return;
    }
    setFormData({
      ...formData,
      items: [...formData.items, { ...currentItem, id: Date.now() }]
    });
    setCurrentItem({
      category: '',
      name: '',
      model: '',
      chassis_number: '',
      year: new Date().getFullYear(),
      venue: '',
      year_type: '',
      vehicle_price: 0,
      consumption_tax: 0,
      recycling_fee: 0,
      automobile_tax: 0,
      auction_fee: 0,
      bid_fee: 0,
      bid_fee_tax: 0,
      notes: ''
    });
    setCategorySearch('');
  };

  const removeItem = (id) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name && !formData.seller_name && !formData.auction_house) return;
    if (formData.items.length === 0) return;

    setLoading(true);
    try {
      await apiRequest('/revenue/orders/create_with_items/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      toast.success('Order created successfully');
      onSave();
    } catch (error) {
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-manager">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-header">
        <h2>{t.addNewOrder}</h2>
        <button className="btn-secondary" onClick={onCancel}>{t.cancel}</button>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-row">
          <div className="form-group">
            <label>{t.type}</label>
            <select value={formData.transaction_type} onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}>
              <option value="sale">{t.sale}</option>
              <option value="purchase">{t.purchase}</option>
              <option value="auction">{t.auction}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t.date}</label>
            <input type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} />
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
          <label>{formData.transaction_type === 'purchase' ? 'Seller Name' : formData.transaction_type === 'auction' ? 'Auction House' : 'Customer Name'}</label>
          <input 
            type="text" 
            value={formData.transaction_type === 'purchase' ? formData.seller_name : formData.transaction_type === 'auction' ? formData.auction_house : formData.customer_name}
            onChange={(e) => {
              if (formData.transaction_type === 'purchase') {
                setFormData({...formData, seller_name: e.target.value});
              } else if (formData.transaction_type === 'auction') {
                setFormData({...formData, auction_house: e.target.value});
              } else {
                setFormData({...formData, customer_name: e.target.value});
              }
            }}
            required 
          />
        </div>

        {formData.transaction_type !== 'auction' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Payment Status</label>
                <select value={formData.payment_status} onChange={(e) => setFormData({...formData, payment_status: e.target.value})}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows="2" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payment Method</label>
                <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}>
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
            </div>

            {(formData.payment_method === 'Bank Transfer' || formData.payment_method === 'Wire Transfer') && (
              <div className="form-group">
                <label>Account Number</label>
                <input type="text" placeholder="Enter account number" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} />
              </div>
            )}

            {formData.payment_method === 'Check' && (
              <div className="form-group">
                <label>Check Number</label>
                <input type="text" placeholder="Enter check number" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} />
              </div>
            )}

            {formData.payment_method === 'Credit Card' && (
              <div className="form-group">
                <label>Card Number</label>
                <input type="text" placeholder="Enter card number" value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} maxLength="19" />
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label>{t.notes}</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </div>

        <div className="items-section">
          <h4>{t.vehicleItems}</h4>
          
          <div className="item-form">
            <div className="form-row">
              <div className="form-group category-dropdown-wrapper">
                <label>{t.category}</label>
                <input 
                  type="text" 
                  placeholder="Search categories..." 
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  onFocus={() => setShowCategoryDropdown(true)}
                  className="category-search"
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
                            setCategorySearch(cat.name);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {cat.name}
                        </div>
                      ))
                    ) : (
                      <div className="category-option disabled">No categories found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>{t.name}</label>
                <input type="text" value={currentItem.name} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t.model}</label>
                <input type="text" value={currentItem.model} onChange={(e) => setCurrentItem({...currentItem, model: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.chassisNumber}</label>
                <input type="text" value={currentItem.chassis_number} onChange={(e) => setCurrentItem({...currentItem, chassis_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label>{t.year}</label>
                <input type="number" value={currentItem.year} onChange={(e) => setCurrentItem({...currentItem, year: e.target.value})} />
              </div>
              {formData.transaction_type === 'auction' && (
                <div className="form-group">
                  <label>{t.venue}</label>
                  <input type="text" value={currentItem.venue} onChange={(e) => setCurrentItem({...currentItem, venue: e.target.value})} />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.vehiclePrice}</label>
                <input type="number" value={currentItem.vehicle_price} onChange={(e) => setCurrentItem({...currentItem, vehicle_price: e.target.value})} />
              </div>
              {formData.transaction_type === 'auction' ? (
                <>
                  <div className="form-group">
                    <label>Auction Fee</label>
                    <input type="number" value={currentItem.auction_fee} onChange={(e) => setCurrentItem({...currentItem, auction_fee: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Consumption Tax</label>
                    <input type="number" value={currentItem.consumption_tax} onChange={(e) => setCurrentItem({...currentItem, consumption_tax: e.target.value})} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Consumption Tax</label>
                    <input type="number" value={currentItem.consumption_tax} onChange={(e) => setCurrentItem({...currentItem, consumption_tax: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Automobile Tax</label>
                    <input type="number" value={currentItem.automobile_tax} onChange={(e) => setCurrentItem({...currentItem, automobile_tax: e.target.value})} />
                  </div>
                </>
              )}
            </div>

            {formData.transaction_type === 'auction' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Recycling Fee</label>
                  <input type="number" value={currentItem.recycling_fee} onChange={(e) => setCurrentItem({...currentItem, recycling_fee: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Bid Fee</label>
                  <input type="number" value={currentItem.bid_fee} onChange={(e) => setCurrentItem({...currentItem, bid_fee: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Bid Fee Tax</label>
                  <input type="number" value={currentItem.bid_fee_tax} onChange={(e) => setCurrentItem({...currentItem, bid_fee_tax: e.target.value})} />
                </div>
              </div>
            )}

            <button type="button" className="btn-secondary" onClick={addItem}>{t.addItem}</button>
          </div>

          <div className="items-list">
            {formData.items.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-info">
                  <strong>{item.name} {item.model}</strong> - {item.chassis_number} ({item.year})
                  <div className="item-details">
                    {formData.transaction_type === 'auction' ? `Venue: ${item.venue}` : ''} | Price: ${Number(item.vehicle_price).toLocaleString()}
                  </div>
                </div>
                <button type="button" className="btn-remove" onClick={() => removeItem(item.id)}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>{t.cancel}</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : t.addOrder}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddOrder;
