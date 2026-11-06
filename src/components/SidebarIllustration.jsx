import React from 'react';
import './SidebarIllustration.css';

const SidebarIllustration = ({ collapsed = false }) => {
  return (
    <div className={`sidebar-illustration-wrap ${collapsed ? 'collapsed' : ''}`} aria-hidden="true">
      <svg
        className="sidebar-wave-svg"
        viewBox="0 0 260 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sbWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
            <stop offset="40%" stopColor="#D7F24B" stopOpacity="0.45" />
            <stop offset="80%" stopColor="#06B6D4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="sbWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D7F24B" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="sbFillGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D7F24B" stopOpacity="0" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.14" />
          </linearGradient>
        </defs>

        {/* Ambient bottom glow area */}
        <path
          d="M0 120 Q 70 85 140 115 T 260 90 L 260 170 L 0 170 Z"
          fill="url(#sbFillGlow)"
        />

        {/* Flow Wave 1 */}
        <path
          className="sb-wave-line sb-line-1"
          d="M-20 135 C 45 105, 110 145, 180 115 C 220 98, 255 110, 280 100"
          stroke="url(#sbWaveGrad1)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Flow Wave 2 */}
        <path
          className="sb-wave-line sb-line-2"
          d="M-20 150 C 55 125, 125 160, 195 130 C 230 115, 260 125, 280 118"
          stroke="url(#sbWaveGrad2)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Secondary Delicate Wave */}
        <path
          className="sb-wave-line sb-line-3"
          d="M-10 118 C 60 95, 130 130, 200 102 C 235 88, 265 98, 280 92"
          stroke="url(#sbWaveGrad1)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
};

export default SidebarIllustration;

