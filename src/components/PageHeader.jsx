import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, Lock, Menu } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './SectionHeader.css';

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
}) => {
  const {
    user,
    companyName,
    hasLockPin,
    lockScreen,
    toggleSidebar,
  } = useUser();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="unified-header-banner">
      {/* Upper Row: Prominent & Larger Elements */}
      <div className="unified-header-upper">
        <div className="unified-upper-left">
          {toggleSidebar && (
            <button
              className="unified-menu-btn"
              onClick={toggleSidebar}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
          )}

          {Icon && (
            <div className="unified-icon-box">
              <Icon size={24} />
            </div>
          )}

          <div className="unified-title-wrap">
            <h1 className="unified-title">{title}</h1>
          </div>

          <div className="unified-company-chip" title={`Organization: ${companyName || 'Smart Ledgers'}`}>
            <Building2 size={15} />
            <span className="unified-company-name">{companyName || 'Smart Ledgers'}</span>
            <span className="unified-company-badge">Active</span>
          </div>
        </div>

        <div className="unified-upper-right">
          <div className="unified-date-pill">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>

          {hasLockPin && lockScreen && (
            <button className="unified-lock-btn" onClick={lockScreen} title="Lock screen now (Ctrl + Q)">
              <Lock size={13} />
              <span>Lock (Ctrl+Q)</span>
            </button>
          )}

          <Link to="/settings" className="unified-user-pill" title="Profile & Organization Settings">
            <div className="unified-avatar">
              {(companyName || user?.username || user?.email || 'A')[0].toUpperCase()}
            </div>
            <span className="unified-user-name">{user?.username || 'Admin'}</span>
          </Link>
        </div>
      </div>

      {/* Lower Row: Somewhat Smaller / Refined Elements */}
      {(subtitle || actions || children) && (
        <div className="unified-header-lower">
          <div className="unified-lower-left">
            {subtitle && <p className="unified-subtitle">{subtitle}</p>}
          </div>

          {(actions || children) && (
            <div className="unified-lower-right">
              {actions}
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
