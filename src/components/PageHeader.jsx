import React from 'react';
import './SectionHeader.css';

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
}) => {
  return (
    <div className="section-header-banner">
      <div className="section-header-content">
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
