import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { translateText } from '../translator';
import './ExpenseManager.css';

const ExpenseManager = ({ language = 'en' }) => {
  const t = translations[language];
  const [categories] = useState([
    { id: 1, name: 'Food' },
    { id: 2, name: 'Transport' },
    { id: 3, name: 'Shopping' },
    { id: 4, name: 'Entertainment' },
    { id: 5, name: 'Bills' },
    { id: 6, name: 'Health' },
    { id: 7, name: 'Education' },
    { id: 8, name: 'Utilities' },
    { id: 9, name: 'Insurance' },
    { id: 10, name: 'Travel' },
    { id: 11, name: 'Gifts' },
    { id: 12, name: 'Personal Care' }
  ]);

  const [expenses] = useState([
    { id: 1, date: '2024-01-15', category: 'Food', description: 'Lunch at restaurant', amount: '$25.50' },
    { id: 2, date: '2024-01-15', category: 'Transport', description: 'Uber ride', amount: '$15.00' },
    { id: 3, date: '2024-01-14', category: 'Shopping', description: 'Groceries', amount: '$85.30' },
    { id: 4, date: '2024-01-14', category: 'Entertainment', description: 'Movie tickets', amount: '$30.00' },
    { id: 5, date: '2024-01-13', category: 'Food', description: 'Coffee', amount: '$5.50' },
    { id: 6, date: '2024-01-13', category: 'Bills', description: 'Internet bill', amount: '$60.00' },
    { id: 7, date: '2024-01-12', category: 'Transport', description: 'Gas', amount: '$45.00' },
    { id: 8, date: '2024-01-12', category: 'Food', description: 'Dinner', amount: '$42.80' },
    { id: 9, date: '2024-01-11', category: 'Shopping', description: 'Clothes', amount: '$120.00' },
    { id: 10, date: '2024-01-11', category: 'Health', description: 'Pharmacy', amount: '$35.20' },
    { id: 11, date: '2024-01-10', category: 'Food', description: 'Breakfast', amount: '$12.50' },
    { id: 12, date: '2024-01-10', category: 'Entertainment', description: 'Concert', amount: '$75.00' },
    { id: 13, date: '2024-01-09', category: 'Transport', description: 'Taxi', amount: '$18.50' },
    { id: 14, date: '2024-01-09', category: 'Food', description: 'Pizza delivery', amount: '$28.90' },
    { id: 15, date: '2024-01-08', category: 'Bills', description: 'Phone bill', amount: '$50.00' },
    { id: 16, date: '2024-01-08', category: 'Shopping', description: 'Books', amount: '$45.60' },
    { id: 17, date: '2024-01-07', category: 'Food', description: 'Lunch', amount: '$18.30' },
    { id: 18, date: '2024-01-07', category: 'Transport', description: 'Bus pass', amount: '$25.00' },
    { id: 19, date: '2024-01-06', category: 'Entertainment', description: 'Streaming', amount: '$15.99' },
    { id: 20, date: '2024-01-06', category: 'Food', description: 'Dinner with friends', amount: '$65.00' }
  ]);

  const [categoryPage, setCategoryPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [translatedCategories, setTranslatedCategories] = useState([]);
  const [translatedExpenses, setTranslatedExpenses] = useState([]);

  useEffect(() => {
    const translateData = async () => {
      if (language === 'en') {
        setTranslatedCategories(categories);
        setTranslatedExpenses(expenses);
        return;
      }
      const cats = await Promise.all(
        categories.map(async (cat) => ({ ...cat, name: await translateText(cat.name, language) }))
      );
      const exps = await Promise.all(
        expenses.map(async (exp) => ({
          ...exp,
          category: await translateText(exp.category, language),
          description: await translateText(exp.description, language)
        }))
      );
      setTranslatedCategories(cats);
      setTranslatedExpenses(exps);
    };
    translateData();
  }, [language]);

  const itemsPerPage = 10;
  const categoryStart = (categoryPage - 1) * itemsPerPage;
  const categoryEnd = categoryStart + itemsPerPage;
  const paginatedCategories = translatedCategories.slice(categoryStart, categoryEnd);
  const totalCategoryPages = Math.ceil(translatedCategories.length / itemsPerPage);

  const filteredExpenses = translatedExpenses.filter(expense => {
    const matchCategory = !filterCategory || expense.category === filterCategory;
    const matchDate = !filterDate || expense.date === filterDate;
    const matchSearch = !searchText || 
      expense.description.toLowerCase().includes(searchText.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchDate && matchSearch;
  });

  const expenseStart = (expensePage - 1) * itemsPerPage;
  const expenseEnd = expenseStart + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(expenseStart, expenseEnd);
  const totalExpensePages = Math.ceil(filteredExpenses.length / itemsPerPage);

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
      <div className="table-section">
        <div className="table-header">
          <h3>{t.categories}</h3>
          <button className="btn-primary" onClick={() => setShowCategoryModal(true)}>{t.addCategory}</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t.id}</th>
                <th>{t.categoryName}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>
                    <button className="btn-small btn-edit">{t.edit}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button onClick={() => setCategoryPage(p => Math.max(1, p - 1))} disabled={categoryPage === 1}>{t.previous}</button>
          <span>{t.page} {categoryPage} {t.of} {totalCategoryPages}</span>
          <button onClick={() => setCategoryPage(p => Math.min(totalCategoryPages, p + 1))} disabled={categoryPage === totalCategoryPages}>{t.next}</button>
        </div>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h3>{t.expenses}</h3>
          <button className="btn-primary" onClick={() => setShowExpenseModal(true)}>{t.addExpense}</button>
        </div>
        <div className="filters">
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="filter-input"
          />
          <select value={filterCategory} onChange={(e) => handleCategoryFilterChange(e.target.value)} className="filter-select">
            <option value="">{t.allCategories}</option>
            {translatedCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="filter-input"
          />
          <button onClick={handleClearFilters} className="btn-secondary">Clear</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t.date}</th>
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
                  <td>{expense.category}</td>
                  <td>{expense.description}</td>
                  <td className="amount-cell">{expense.amount}</td>
                  <td>
                    <button className="btn-small btn-edit">{t.edit}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button onClick={() => setExpensePage(p => Math.max(1, p - 1))} disabled={expensePage === 1}>{t.previous}</button>
          <span>{t.page} {expensePage} {t.of} {totalExpensePages}</span>
          <button onClick={() => setExpensePage(p => Math.min(totalExpensePages, p + 1))} disabled={expensePage === totalExpensePages}>{t.next}</button>
        </div>
      </div>

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.addNewCategory}</h3>
            <form>
              <div className="form-group">
                <label>{t.categoryName}</label>
                <input type="text" placeholder={t.categoryPlaceholder} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCategoryModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn-primary">{t.addCategory}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.addNewExpense}</h3>
            <form>
              <div className="form-group">
                <label>{t.category}</label>
                <select>
                  <option value="">{t.selectCategory}</option>
                  {translatedCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t.description}</label>
                <input type="text" placeholder={t.descriptionPlaceholder} />
              </div>
              <div className="form-group">
                <label>{t.amount}</label>
                <input type="number" placeholder={t.amountPlaceholder} step="0.01" />
              </div>
              <div className="form-group">
                <label>{t.date}</label>
                <input type="date" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(false)}>{t.cancel}</button>
                <button type="submit" className="btn-primary">{t.addExpense}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
