import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { translateText } from '../translator';
import '../shared.css';
import './RevenueManager.css';

const RevenueManager = ({ language = 'en' }) => {
  const t = translations[language];
  
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2024-01-15', type: 'Sale', carModel: 'Toyota Camry 2020', customerName: 'John Smith', amount: 25000, paymentMethod: 'Bank Transfer' },
    { id: 2, date: '2024-01-14', type: 'Purchase', carModel: 'Honda Civic 2019', customerName: 'Dealer Auto', amount: 18000, paymentMethod: 'Cash' },
    { id: 3, date: '2024-01-13', type: 'Auction', carModel: 'BMW X5 2021', customerName: 'Auto Auction Co.', amount: 42000, paymentMethod: 'Wire Transfer' },
    { id: 4, date: '2024-01-12', type: 'Sale', carModel: 'Ford F-150 2022', customerName: 'Mike Johnson', amount: 35000, paymentMethod: 'Financing' },
    { id: 5, date: '2024-01-11', type: 'Purchase', carModel: 'Tesla Model 3 2021', customerName: 'Private Seller', amount: 38000, paymentMethod: 'Bank Transfer' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [translatedTransactions, setTranslatedTransactions] = useState([]);

  useEffect(() => {
    const translateData = async () => {
      if (language === 'en') {
        setTranslatedTransactions(transactions);
        return;
      }
      const translated = await Promise.all(
        transactions.map(async (t) => ({
          ...t,
          type: await translateText(t.type, language),
          carModel: await translateText(t.carModel, language),
          customerName: await translateText(t.customerName, language),
          paymentMethod: await translateText(t.paymentMethod, language)
        }))
      );
      setTranslatedTransactions(translated);
    };
    translateData();
  }, [language, transactions]);

  const [formData, setFormData] = useState({
    type: 'Sale',
    carModel: '',
    customerName: '',
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    address: '',
    phone: '',
    email: '',
    cardNumber: '',
    bankName: '',
    accountNumber: '',
    vin: '',
    notes: ''
  });

  const itemsPerPage = 10;

  const filteredTransactions = translatedTransactions.filter(t => {
    const matchType = !filterType || t.type === filterType;
    const matchSearch = !searchText || 
      t.carModel.toLowerCase().includes(searchText.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchSearch;
  });

  const start = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(start, start + itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleSearchChange = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleFilterTypeChange = (value) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterType('');
    setSearchText('');
    setCurrentPage(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTransaction = {
      id: transactions.length + 1,
      ...formData,
      amount: parseFloat(formData.amount)
    };
    setTransactions([newTransaction, ...transactions]);
    setShowModal(false);
    setFormData({
      type: 'Sale',
      carModel: '',
      customerName: '',
      amount: '',
      paymentMethod: 'Cash',
      date: new Date().toISOString().split('T')[0],
      address: '',
      phone: '',
      email: '',
      cardNumber: '',
      bankName: '',
      accountNumber: '',
      vin: '',
      notes: ''
    });
  };

  const handlePrintReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="revenue-manager">
      <div className="table-section">
        <div className="table-header">
          <h3>{t.revenueTransactions}</h3>
          <button className="btn-primary" onClick={() => setShowModal(true)}>{t.addTransaction}</button>
        </div>
        
        <div className="filters">
          <input 
            type="text" 
            placeholder={t.searchRevenue}
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="filter-input"
          />
          <select value={filterType} onChange={(e) => handleFilterTypeChange(e.target.value)} className="filter-select">
            <option value="">{t.allTypes}</option>
            <option value="Sale">{t.sale}</option>
            <option value="Purchase">{t.purchase}</option>
            <option value="Auction">{t.auction}</option>
          </select>
          <button onClick={handleClearFilters} className="btn-secondary">Clear</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t.date}</th>
                <th>{t.type}</th>
                <th>{t.carModel}</th>
                <th>{t.customerName}</th>
                <th>{t.amount}</th>
                <th>{t.paymentMethod}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td><span className={`badge badge-${transaction.type.toLowerCase()}`}>{transaction.type}</span></td>
                  <td>{transaction.carModel}</td>
                  <td>{transaction.customerName}</td>
                  <td className="amount-cell">${transaction.amount.toLocaleString()}</td>
                  <td>{transaction.paymentMethod}</td>
                  <td>
                    <button className="btn-small btn-receipt" onClick={() => handlePrintReceipt(transaction)}>{t.receipt}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{t.previous}</button>
          <span>{t.page} {currentPage} {t.of} {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{t.next}</button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>{t.addNewTransaction}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t.type}</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="Sale">{t.sale}</option>
                    <option value="Purchase">{t.purchase}</option>
                    <option value="Auction">{t.auction}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t.date}</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.carModel}</label>
                <input 
                  type="text" 
                  placeholder={t.carModelPlaceholder}
                  value={formData.carModel}
                  onChange={(e) => setFormData({...formData, carModel: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.vin}</label>
                <input 
                  type="text" 
                  placeholder={t.vinPlaceholder}
                  value={formData.vin}
                  onChange={(e) => setFormData({...formData, vin: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>{formData.type === 'Purchase' ? t.sellerName : t.customerName}</label>
                <input 
                  type="text" 
                  placeholder={formData.type === 'Purchase' ? t.sellerNamePlaceholder : t.customerNamePlaceholder}
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t.phone}</label>
                  <input 
                    type="tel" 
                    placeholder={t.phonePlaceholder}
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>{t.email}</label>
                  <input 
                    type="email" 
                    placeholder={t.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.address}</label>
                <textarea 
                  placeholder={t.addressPlaceholder}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t.amount}</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t.paymentMethod}</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="Cash">{t.cash}</option>
                    <option value="Bank Transfer">{t.bankTransfer}</option>
                    <option value="Wire Transfer">{t.wireTransfer}</option>
                    <option value="Financing">{t.financing}</option>
                    <option value="Check">{t.check}</option>
                    <option value="Credit Card">{t.creditCard}</option>
                  </select>
                </div>
              </div>

              {(formData.paymentMethod === 'Bank Transfer' || formData.paymentMethod === 'Wire Transfer') && (
                <div className="form-row">
                  <div className="form-group">
                    <label>{t.bankName}</label>
                    <input 
                      type="text" 
                      placeholder={t.bankNamePlaceholder}
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.accountNumber}</label>
                    <input 
                      type="text" 
                      placeholder={t.accountNumberPlaceholder}
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'Credit Card' && (
                <div className="form-group">
                  <label>{t.cardNumber}</label>
                  <input 
                    type="text" 
                    placeholder={t.cardNumberPlaceholder}
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                    maxLength="19"
                  />
                </div>
              )}

              <div className="form-group">
                <label>{t.notes}</label>
                <textarea 
                  placeholder={t.notesPlaceholder}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn-primary">{t.addTransaction}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceipt && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-content">
              <div className="receipt-header">
                <h2>CAR STORE SHOP</h2>
                <p>123 Auto Street, Car City, CC 12345</p>
                <p>Phone: (555) 123-4567 | Email: info@carstore.com</p>
              </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-title">
                <h3>RECEIPT</h3>
                <p>Transaction #{selectedTransaction.id}</p>
              </div>

              <div className="receipt-info">
                <div className="info-row">
                  <span className="label">{t.date}:</span>
                  <span className="value">{selectedTransaction.date}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.type}:</span>
                  <span className="value">{selectedTransaction.type}</span>
                </div>
                <div className="info-row">
                  <span className="label">{selectedTransaction.type === 'Purchase' ? t.sellerName : t.customerName}:</span>
                  <span className="value">{selectedTransaction.customerName}</span>
                </div>
                {selectedTransaction.phone && (
                  <div className="info-row">
                    <span className="label">{t.phone}:</span>
                    <span className="value">{selectedTransaction.phone}</span>
                  </div>
                )}
                {selectedTransaction.address && (
                  <div className="info-row">
                    <span className="label">{t.address}:</span>
                    <span className="value">{selectedTransaction.address}</span>
                  </div>
                )}
                {selectedTransaction.vin && (
                  <div className="info-row">
                    <span className="label">{t.vin}:</span>
                    <span className="value">{selectedTransaction.vin}</span>
                  </div>
                )}
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-items">
                <table>
                  <thead>
                    <tr>
                      <th>{t.description}</th>
                      <th>{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedTransaction.carModel}</td>
                      <td>${selectedTransaction.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-total">
                <div className="total-row">
                  <span className="label">{t.paymentMethod}:</span>
                  <span className="value">{selectedTransaction.paymentMethod}</span>
                </div>
                <div className="total-row grand-total">
                  <span className="label">{t.totalAmount}:</span>
                  <span className="value">${selectedTransaction.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="receipt-footer">
                <p>Thank you for your business!</p>
                <p className="small-text">This is an official receipt for your transaction</p>
              </div>
            </div>

            <div className="receipt-actions no-print">
              <button className="btn-secondary" onClick={() => setShowReceipt(false)}>{t.close}</button>
              <button className="btn-primary" onClick={printReceipt}>{t.print}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueManager;
