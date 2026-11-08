import React from 'react';
import './BrandLogo.css';

// Text-only wordmark. The collapsed sidebar shows a compact "SL" monogram instead.
const BrandLogo = ({ collapsed = false, title = 'Smart Ledger', subtitle = 'JPN Auto Trade Accounting' }) => {
  if (collapsed) {
    return (
      <div className="brand-logo-container collapsed" title={title}>
        <span className="brand-monogram">
          S<span className="brand-monogram-accent">L</span>
        </span>
      </div>
    );
  }

  return (
    <div className="brand-logo-container" title={title}>
      <div className="brand-logo-text">
        <div className="brand-logo-title">
          <span className="brand-title-smart">Smart</span>
          <span className="brand-title-accent">Ledger</span>
        </div>
        <div className="brand-logo-subtitle">{subtitle}</div>
      </div>
    </div>
  );
};

export default BrandLogo;
