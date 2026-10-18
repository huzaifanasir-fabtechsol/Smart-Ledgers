import React from 'react';
import './SectionHeader.css';

const formatValue = (value, isCurrency, formatter) => {
  if (formatter && typeof formatter === 'function') {
    return formatter(value);
  }
  if (value === null || value === undefined) {
    return '0';
  }
  const num = Number(value);
  if (isNaN(num)) {
    return value;
  }
  const formatted = num.toLocaleString();
  return isCurrency ? `¥${formatted}` : formatted;
};

const StatCards = ({ items = [], loading = false }) => {
  if (loading) {
    return (
      <div className="stats-cards-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-skeleton-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '60%' }}>
              <div className="stat-skeleton-line" style={{ height: '12px', width: '70%' }}></div>
              <div className="stat-skeleton-line" style={{ height: '24px', width: '90%' }}></div>
              <div className="stat-skeleton-line" style={{ height: '10px', width: '50%' }}></div>
            </div>
            <div className="stat-skeleton-line" style={{ width: '44px', height: '44px', borderRadius: '12px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="stats-cards-grid">
      {items.map((stat, idx) => {
        const Icon = stat.icon;
        const colorClass = stat.color ? `stat-icon-${stat.color}` : 'stat-icon-blue';
        return (
          <div key={idx} className="stat-card-item">
            <div className="stat-card-content">
              <span className="stat-card-label">{stat.label}</span>
              <span className="stat-card-value">
                {formatValue(stat.value, stat.isCurrency, stat.formatter)}
              </span>
              {stat.subtext && <span className="stat-card-subtext">{stat.subtext}</span>}
            </div>
            {Icon && (
              <div className={`stat-icon-wrapper ${colorClass}`}>
                <Icon size={20} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
