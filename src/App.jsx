import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ExpenseManager from './components/ExpenseManager';
import DataExport from './components/DataExport';
import RevenueManager from './components/RevenueManager';
import CarCategoryManager from './components/CarCategoryManager';
import OrderManager from './components/OrderManager';
import AddOrder from './components/AddOrder';
import CustomerManager from './components/CustomerManager';
import SalerManager from './components/SalerManager';
import CompanyAccountManager from './components/CompanyAccountManager';
import AuctionManager from './components/AuctionManager';
import CarManager from './components/CarManager';
import Login from './components/Login';
import ProfileSettings from './components/ProfileSettings';
import { translations } from './translations';
import './App.css';

function SidebarIcon({ name }) {
  const baseProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'sidebar-icon-svg',
    'aria-hidden': 'true',
  };

  const icons = {
    dashboard: (
      <svg {...baseProps}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="11" width="7" height="10" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    expenses: (
      <svg {...baseProps}>
        <path d="M8 3h8" />
        <path d="M9 3v3" />
        <path d="M15 3v3" />
        <path d="M6 6h12a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2z" />
        <path d="M8 11h8" />
      </svg>
    ),
    orders: (
      <svg {...baseProps}>
        <path d="M3 7h14l4 4v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        <path d="M3 7l2-4h10l2 4" />
        <path d="M9 13h6" />
      </svg>
    ),
    // categories: (
    //   <svg {...baseProps}>
    //     <path d="M5 9l7-6 7 6" />
    //     <path d="M4 10h16" />
    //     <path d="M7 10v10M12 10v10M17 10v10" />
    //     <path d="M5 20h14" />
    //   </svg>
    // ),
    categories: (
      <svg {...baseProps}>
        <path d="M3 14h18l-1.5-4a3 3 0 0 0-2.8-2H7.3a3 3 0 0 0-2.8 2L3 14z" />

        {/* Cabin / windows */}
        <path d="M8 8l2.5-3h3L16 8" />

        {/* Front bumper line */}
        <path d="M3 14v3a2 2 0 0 0 2 2h1" />

        {/* Rear bumper line */}
        <path d="M21 14v3a2 2 0 0 1-2 2h-1" />

        {/* Wheels */}
        <circle cx="8" cy="18" r="2.5" />
        <circle cx="16" cy="18" r="2.5" />

        {/* Subtle detail line (door separation) */}
        <path d="M12 8v6" />
      </svg>
    ),
    export: (
      <svg {...baseProps}>
        <path d="M12 3v12" />
        <path d="M8 11l4 4 4-4" />
        <path d="M4 21h16" />
      </svg>
    ),
    profile: (
      <svg {...baseProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
    logout: (
      <svg {...baseProps}>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M17 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3" />
      </svg>
    ),
  };

  return icons[name] || null;
}

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

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const menuItems = [
    { path: '/dashboard', label: t.dashboard, icon: 'dashboard' },
    { path: '/expenses', label: t.manageExpenses, icon: 'expenses' },
    { path: '/orders', label: t.orders, icon: 'orders' },
    { path: '/categories', label: t.carCategories, icon: 'categories' },
    { path: '/customers', label: 'Customers', icon: 'profile' },
    { path: '/salers', label: 'Salers', icon: 'profile' },
    { path: '/cars', label: 'Collection', icon: 'categories' },
    { path: '/auctions', label: 'Auctions', icon: 'orders' },
    { path: '/company-accounts', label: 'Accounts', icon: 'expenses' },
    { path: '/export', label: t.dataExport, icon: 'export' },
    { path: '/profile', label: 'Profile', icon: 'profile' },
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
            {sidebarOpen ? '<' : '>'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="icon">
                <SidebarIcon name={item.icon} />
              </span>
              {sidebarOpen && <span className="label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          {/* <button className="nav-item" onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}>
            <span className="icon"><SidebarIcon name="language" /></span>
            {sidebarOpen && <span className="label">{language === 'en' ? 'Japanese' : 'English'}</span>}
          </button> */}
          <button className="nav-item" onClick={handleLogout}>
            <span className="icon">
              <SidebarIcon name="logout" />
            </span>
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
          <Route
            path="/orders"
            element={<OrderManager language={language} onAddOrder={() => navigate('/orders/add')} />}
          />
          <Route
            path="/orders/add"
            element={
              <AddOrder
                language={language}
                onSave={() => navigate('/orders')}
                onCancel={() => navigate('/orders')}
              />
            }
          />
          <Route path="/categories" element={<CarCategoryManager language={language} />} />
          <Route path="/customers" element={<CustomerManager />} />
          <Route path="/salers" element={<SalerManager />} />
          <Route path="/cars" element={<CarManager />} />
          <Route path="/auctions" element={<AuctionManager />} />
          <Route path="/company-accounts" element={<CompanyAccountManager />} />
          <Route path="/export" element={<DataExport language={language} />} />
          <Route path="/profile" element={<ProfileSettings onUserUpdate={handleUserUpdate} />} />
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
