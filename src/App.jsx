import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ExpenseManager from './components/ExpenseManager';
import DataExport from './components/DataExport';
import RevenueManager from './components/RevenueManager';
import CarCategoryManager from './components/CarCategoryManager';
import OrderManager from './components/OrderManager';
import AddOrder from './components/AddOrder';
import Login from './components/Login';
import { translations } from './translations';
import './App.css';

function AppContent() {
  const [language, setLanguage] = useState('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (token, userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const menuItems = [
    { path: '/dashboard', label: t.dashboard, icon: '📊' },
    // { path: '/expenses', label: t.manageExpenses, icon: '💰' },
    // { path: '/revenue', label: t.revenue, icon: '💵' },
    { path: '/orders', label: t.orders, icon: '📦' },
    { path: '/categories', label: t.carCategories, icon: '🚗' },
    // { path: '/export', label: t.dataExport, icon: '📤' }
  ];

  const isActive = (path) => {
    if (path === '/orders' && location.pathname.startsWith('/orders')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h1>{sidebarOpen && t.appTitle}</h1>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {sidebarOpen && <span className="label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          {/* <button className="nav-item" onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}>
            <span className="icon">🌐</span>
            {sidebarOpen && <span className="label">{language === 'en' ? '日本語' : 'English'}</span>}
          </button> */}
          <button className="nav-item" onClick={handleLogout}>
            <span className="icon">🚪</span>
            {sidebarOpen && <span className="label">Logout</span>}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard language={language} />} />
          <Route path="/expenses" element={<ExpenseManager language={language} />} />
          <Route path="/revenue" element={<RevenueManager language={language} />} />
          <Route path="/orders" element={<OrderManager language={language} onAddOrder={() => navigate('/orders/add')} />} />
          <Route path="/orders/add" element={<AddOrder language={language} onSave={() => navigate('/orders')} onCancel={() => navigate('/orders')} />} />
          <Route path="/categories" element={<CarCategoryManager language={language} />} />
          <Route path="/export" element={<DataExport language={language} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
