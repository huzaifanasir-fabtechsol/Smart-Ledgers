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
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#D7F24B" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="sbWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D7F24B" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="sbFillGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D7F24B" stopOpacity="0" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {/* Ambient bottom glow area */}
        <path
          d="M0 115 Q 70 80 140 110 T 260 85 L 260 170 L 0 170 Z"
          fill="url(#sbFillGlow)"
        />

        {/* High-Visibility Static Flow Wave 1 */}
        <path
          d="M-20 130 C 45 98, 110 140, 180 108 C 220 90, 255 105, 280 95"
          stroke="url(#sbWaveGrad1)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* High-Visibility Static Flow Wave 2 */}
        <path
          d="M-20 148 C 55 118, 125 155, 195 125 C 230 108, 260 120, 280 112"
          stroke="url(#sbWaveGrad2)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Secondary Delicate Wave */}
        <path
          d="M-10 112 C 60 88, 130 125, 200 95 C 235 80, 265 92, 280 85"
          stroke="url(#sbWaveGrad1)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="5 5"
        />
      </svg>
    </div>
  );
};

export default SidebarIllustration;
