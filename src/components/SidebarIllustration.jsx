import React from 'react';
import './SidebarIllustration.css';

// Small illustrated glass strip under the sidebar wordmark: a growing ledger chart,
// Mt Fuji under a rising sun, and a yen coin. Hidden when the sidebar is collapsed.
const SidebarIllustration = ({ collapsed = false }) => {
  if (collapsed) return null;

  return (
    <div className="sidebar-illustration-wrap" aria-hidden="true">
      <svg className="sidebar-scene-svg" viewBox="0 0 210 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sbSky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ECFCCB" />
            <stop offset="55%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#EDE9FE" />
          </linearGradient>
          <linearGradient id="sbFuji" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="sbBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A3E635" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="sbLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#65A30D" />
          </linearGradient>
        </defs>

        <rect width="210" height="64" fill="url(#sbSky)" />

        {/* Rising sun and Mt Fuji */}
        <circle cx="150" cy="22" r="11" fill="#FB7185" fillOpacity="0.85" />
        <circle cx="150" cy="22" r="17" fill="#FDA4AF" fillOpacity="0.25" />
        <path d="M100 64 L136 26 L148 26 L190 64 Z" fill="url(#sbFuji)" />
        <path d="M130 33 L136 26 L148 26 L155 33 C150 36 146 32 142 35 C138 32 134 36 130 33 Z" fill="#FFFFFF" />

        {/* Ledger bars with trend line */}
        <rect x="16" y="40" width="10" height="24" rx="3" fill="url(#sbBar)" fillOpacity="0.7" />
        <rect x="31" y="32" width="10" height="32" rx="3" fill="url(#sbBar)" fillOpacity="0.8" />
        <rect x="46" y="24" width="10" height="40" rx="3" fill="url(#sbBar)" fillOpacity="0.9" />
        <rect x="61" y="16" width="10" height="48" rx="3" fill="url(#sbBar)" />
        <path d="M14 36 L36 26 L51 20 L74 8" stroke="url(#sbLine)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="74" cy="8" r="3.2" fill="#65A30D" stroke="#FFFFFF" strokeWidth="1.4" />

        {/* Yen coin */}
        <g transform="translate(188 46)">
          <circle r="10" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
          <text y="4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#B45309" fontFamily="'Plus Jakarta Sans', sans-serif">¥</text>
        </g>

        {/* Sparkles */}
        <path d="M92 12 l1.8 4 l4 1.8 l-4 1.8 l-1.8 4 l-1.8 -4 l-4 -1.8 l4 -1.8 Z" fill="#C4B5FD" />
        <circle cx="196" cy="14" r="2" fill="#7DD3FC" />
      </svg>
    </div>
  );
};

export default SidebarIllustration;
