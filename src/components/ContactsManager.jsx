import { NavLink, useLocation } from 'react-router-dom';
import { Users, UserSquare2 } from 'lucide-react';
import CustomerManager from './CustomerManager';
import SalerManager from './SalerManager';
import './ContactsManager.css';

// Customers and salers share one section; the URL (/customers or /salers) picks the tab.
const TABS = [
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/salers', label: 'Salers', icon: UserSquare2 },
];

const ContactsManager = () => {
  const location = useLocation();
  const showSalers = location.pathname.startsWith('/salers');

  return (
    <div className="contacts-manager">
      <div className="contacts-tabs" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              role="tab"
              className={({ isActive }) => `contacts-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} /> {tab.label}
            </NavLink>
          );
        })}
      </div>

      {showSalers ? <SalerManager key="salers" /> : <CustomerManager key="customers" />}
    </div>
  );
};

export default ContactsManager;
