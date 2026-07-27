import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  UserSquare2,
  Gavel,
  Car,
  Wallet,
  ArrowLeftRight,
  UtensilsCrossed,
  Store,
  Landmark,
  Download,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  BadgeDollarSign
} from 'lucide-react';
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
import RestaurantManager from './components/RestaurantManager';
import SparePartManager from './components/SparePartManager';
import TransactionManager from './components/TransactionManager';
import EmployeeManager from './components/EmployeeManager';
import SalaryManager from './components/SalaryManager';
import EmployeeSalaryReport from './components/EmployeeSalaryReport';
import Login from './components/Login';
import ProfileSettings from './components/ProfileSettings';
import GoogleTranslateInitializer from './components/GoogleTranslateInitializer';
import { translations } from './translations';
import './notranslate.css';
import './google-translate.css';
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

  // Close sidebar on path change on mobile/tablet
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

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
    { path: '/dashboard', label: t.dashboard, icon: LayoutDashboard },
    { path: '/expenses', label: t.manageExpenses, icon: Receipt },
    { path: '/orders', label: t.orders, icon: FileText },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/salers', label: 'Salers', icon: UserSquare2 },
    { path: '/auctions', label: 'Auctions', icon: Gavel },
    { path: '/categories', label: t.carCategories, icon: Car },
    { path: '/cars', label: 'Collection', icon: Wallet },
    { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { path: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
    { path: '/spare-parts', label: 'Shops', icon: Store },
    { path: '/company-accounts', label: 'Accounts', icon: Landmark },
    { path: '/employees', label: 'Employees', icon: BriefcaseBusiness },
    { path: '/salaries', label: 'Salaries', icon: BadgeDollarSign },
    { path: '/export', label: t.dataExport, icon: Download },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path) => {
    if (path === '/orders' && location.pathname.startsWith('/orders')) {
      return true;
    }
    if (path === '/employees' && location.pathname.startsWith('/employees')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      <GoogleTranslateInitializer />
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <div className="login-logo" style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }}>
                <Wallet size={16} />
              </div>
              <h1 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.appTitle}
              </h1>
            </div>
          ) : (
            <div className="login-logo" style={{ width: '32px', height: '32px', borderRadius: '8px', margin: '0 auto' }}>
              <Wallet size={16} />
            </div>
          )}
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: sidebarOpen ? '0.5rem' : '0' }}>
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                title={item.label}
              >
                <span className="icon">
                  <Icon size={18} />
                </span>
                {sidebarOpen && <span className="label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div
            id="google_translate_element"
            className="google-translate-wrapper"
            style={{ padding: '0.5rem 0.25rem', width: '100%', display: sidebarOpen ? 'block' : 'none' }}
          />
          <button className="nav-item" onClick={handleLogout} title="Logout">
            <span className="icon">
              <LogOut size={18} />
            </span>
            {sidebarOpen && <span className="label">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-topbar">
          <button className="menu-toggle-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard language={language} />} />
          <Route path="/expenses" element={<ExpenseManager language={language} />} />
          <Route path="/revenue" element={<RevenueManager language={language} />} />
          <Route
            path="/orders"
            element={
              <OrderManager 
                language={language} 
                onAddOrder={() => navigate('/orders/add')} 
                onEditOrder={(order) => navigate('/orders/edit', { state: { order } })}
              />
            }
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
          <Route
            path="/orders/edit"
            element={
              <AddOrder
                language={language}
                editingOrder={location.state?.order}
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
          <Route path="/transactions" element={<TransactionManager />} />
          <Route path="/restaurants" element={<RestaurantManager />} />
          <Route path="/spare-parts" element={<SparePartManager />} />
          <Route path="/company-accounts" element={<CompanyAccountManager />} />
          <Route path="/employees" element={<EmployeeManager />} />
          <Route path="/employees/:id/salary-report" element={<EmployeeSalaryReport />} />
          <Route path="/salaries" element={<SalaryManager />} />
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
