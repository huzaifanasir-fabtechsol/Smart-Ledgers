import { useState, useEffect } from 'react';
import { translations } from '../translations';
import { translateText } from '../translator';
import './DataExport.css';

const DataExport = ({ language = 'en' }) => {
  const t = translations[language];

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

  const [filterType, setFilterType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [translatedExpenses, setTranslatedExpenses] = useState([]);

  useEffect(() => {
    const translateData = async () => {
      if (language === 'en') {
        setTranslatedExpenses(expenses);
        return;
      }
      const translated = await Promise.all(
        expenses.map(async (exp) => ({
          ...exp,
          category: await translateText(exp.category, language),
          description: await translateText(exp.description, language)
        }))
      );
      setTranslatedExpenses(translated);
    };
    translateData();
  }, [language]);

  const itemsPerPage = 10;

  const filteredExpenses = translatedExpenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const today = new Date();
    
    if (filterType === 'thisMonth') {
      return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
    } else if (filterType === 'thisYear') {
      return expenseDate.getFullYear() === today.getFullYear();
    } else if (filterType === 'custom' && fromDate && toDate) {
      return expenseDate >= new Date(fromDate) && expenseDate <= new Date(toDate);
    }
    return true;
  });

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(start, end);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Category', 'Description', 'Amount'],
      ...filteredExpenses.map(e => [e.date, e.category, e.description, e.amount])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="data-export">
      <h2>{t.dataExport}</h2>
      
      <div className="export-section">
        <div className="filter-options">
          <label>
            <input type="radio" value="all" checked={filterType === 'all'} onChange={(e) => setFilterType(e.target.value)} />
            {t.allData}
          </label>
          <label>
            <input type="radio" value="thisMonth" checked={filterType === 'thisMonth'} onChange={(e) => setFilterType(e.target.value)} />
            {t.thisMonth}
          </label>
          <label>
            <input type="radio" value="thisYear" checked={filterType === 'thisYear'} onChange={(e) => setFilterType(e.target.value)} />
            {t.thisYear}
          </label>
          <label>
            <input type="radio" value="custom" checked={filterType === 'custom'} onChange={(e) => setFilterType(e.target.value)} />
            {t.customRange}
          </label>
        </div>

        {filterType === 'custom' && (
          <div className="date-range">
            <div className="date-input">
              <label>{t.fromDate}</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="date-input">
              <label>{t.toDate}</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        )}

        <button className="btn-export" onClick={handleExport}>{t.exportData}</button>
      </div>

      <div className="table-section">
        <h3>{t.expenses} ({filteredExpenses.length} {t.items})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t.date}</th>
                <th>{t.category}</th>
                <th>{t.description}</th>
                <th>{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.date}</td>
                  <td>{expense.category}</td>
                  <td>{expense.description}</td>
                  <td className="amount-cell">{expense.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t.previous}</button>
          <span>{t.page} {page} {t.of} {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t.next}</button>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
