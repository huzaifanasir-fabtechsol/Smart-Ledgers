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
              <Icon size={20} />
            </div>
          )}
          <h1 className="section-title">{title}</h1>
        </div>
        {subtitle && (
          <p className={`section-subtitle ${Icon ? 'with-icon' : ''}`}>
            {subtitle}
          </p>
        )}
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
