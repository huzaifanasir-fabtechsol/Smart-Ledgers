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

export const ContactsTabs = () => (
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
          <Icon size={14} /> {tab.label}
        </NavLink>
      );
    })}
  </div>
);

const ContactsManager = () => {
  const location = useLocation();
  const showSalers = location.pathname.startsWith('/salers');

  return (
    <div className="contacts-manager">
      {showSalers ? (
        <SalerManager key="salers" headerTabs={<ContactsTabs />} />
      ) : (
        <CustomerManager key="customers" headerTabs={<ContactsTabs />} />
      )}
    </div>
  );
};

export default ContactsManager;
