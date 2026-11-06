import React from 'react';
import './BrandLogo.css';

const BrandLogo = ({ collapsed = false, title = 'Smart Ledger', subtitle = 'Auto Trade Accounting' }) => {
  return (
    <div className={`brand-logo-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-logo-badge" title={title}>
        <svg
          className="brand-car-svg"
          viewBox="0 0 44 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="carLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E5FA5B" />
              <stop offset="60%" stopColor="#84CC16" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
              <stop offset="60%" stopColor="#84CC16" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#E5FA5B" stopOpacity="0.9" />
            </linearGradient>
            <filter id="carGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Aerodynamic Speed Trails */}
          <path
            d="M3 18.5 Q 8 18 13 18.5"
            stroke="url(#trailGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="speed-trail trail-1"
          />
          <path
            d="M5 22.5 Q 9 22 13 22.5"
            stroke="url(#trailGrad)"
            strokeWidth="1.3"
            strokeLinecap="round"
            className="speed-trail trail-2"
          />

          {/* Sleek Japanese Coupe Silhouette Body */}
          <path
            d="M8 20.5 C9.5 20.5 11 19.5 12.5 17 C14.5 13.5 17.5 9.5 22 8.5 C27.5 7.2 31.5 8.2 34 11.5 C35.8 14 37 16 39.5 16.5 C41 16.8 42 17.5 42 19.2 C42 20.8 40.5 21.8 39 21.8 L37.5 21.8"
            stroke="url(#carLimeGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#carGlow)"
            className="car-roofline"
          />

          {/* Lower Aerodynamic Ground Effects & Wheel Arches */}
          <path
            d="M9 22.2 L13.5 22.2 C14 20.2 15.8 18.8 18 18.8 C20.2 18.8 22 20.2 22.5 22.2 L28 22.2 C28.5 20.2 30.3 18.8 32.5 18.8 C34.7 18.8 36.5 20.2 37 22.2 L39 22.2"
            stroke="url(#carLimeGrad)"
            strokeWidth="1.9"
            strokeLinecap="round"
          />

          {/* Wheels with Glowing Alloy Hubs */}
          <circle cx="18" cy="22" r="2.8" fill="#12151B" stroke="url(#carLimeGrad)" strokeWidth="1.7" />
          <circle cx="18" cy="22" r="1.1" fill="#E5FA5B" className="wheel-hub" />

          <circle cx="32.5" cy="22" r="2.8" fill="#12151B" stroke="url(#carLimeGrad)" strokeWidth="1.7" />
          <circle cx="32.5" cy="22" r="1.1" fill="#E5FA5B" className="wheel-hub" />

          {/* Aerodynamic Windshield & Side Window */}
          <path
            d="M17.5 16 L21.5 10.8 C25 9.8 28.5 10.2 31 12.5 L33.2 16 Z"
            stroke="url(#carLimeGrad)"
            strokeWidth="1.2"
            fill="rgba(229, 250, 91, 0.12)"
          />

          {/* Headlight Flare */}
          <path
            d="M40.5 18 L43 18.5"
            stroke="#E5FA5B"
            strokeWidth="2"
            strokeLinecap="round"
            className="headlight-flare"
          />
        </svg>
      </div>

      {!collapsed && (
        <div className="brand-logo-text">
          <div className="brand-logo-title">
            <span>Smart</span>
            <span className="brand-title-accent">Ledger</span>
          </div>
          <div className="brand-logo-subtitle">{subtitle}</div>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;

