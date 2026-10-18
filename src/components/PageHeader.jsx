import React from 'react';
import { Building2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './SectionHeader.css';

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  category,
  companyName: propCompanyName,
  actions,
  children,
}) => {
  const { companyName: contextCompanyName } = useUser();
  const displayCompany = propCompanyName || contextCompanyName || 'Smart Ledgers';

  return (
    <div className="section-header-banner">
      <div className="section-header-content">
        <div className="section-header-meta">
          {category && <span className="section-category-pill">{category}</span>}
          <span className="section-company-chip" title={`Company Profile: ${displayCompany}`}>
            <Building2 size={13} />
            <span>{displayCompany}</span>
          </span>
        </div>

        <div className="section-title-row">
          {Icon && (
            <div className="section-icon-box">
              <Icon size={24} />
            </div>
          )}
          <div>
            <h1 className="section-title">{title}</h1>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        </div>
      </div>

      {(actions || children) && (
        <div className="section-header-actions">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
