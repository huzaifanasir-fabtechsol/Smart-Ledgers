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
  companyName: propCompanyName,
}) => {
  const {
    user,
    companyName: ctxCompanyName,
    hasLockPin,
    lockScreen,
    toggleSidebar,
  } = useUser();

  const effectiveCompanyName = propCompanyName || ctxCompanyName || 'Smart Ledgers';

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

          {/* Swapped: Highlight Company Name as the main title */}
          <div className="unified-title-wrap">
            <div className="unified-company-heading">
              <Building2 size={20} className="unified-company-icon" />
              <h1 className="unified-title">{effectiveCompanyName}</h1>
              <span className="unified-company-badge">Active</span>
            </div>
          </div>

          {/* Swapped: Section Name as smaller refined section chip */}
          <div className="unified-section-chip" title={`Current Section: ${title}`}>
            <span className="unified-section-dot"></span>
            <span className="unified-section-name">{title}</span>
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
