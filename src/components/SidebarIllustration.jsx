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
      >
        <defs>
          <linearGradient id="sbCarBodyGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#D7F24B" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="sbFujiGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#D7F24B" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="sbEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D7F24B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <radialGradient id="sbHeadlightBeam" cx="95%" cy="60%" r="65%">
            <stop offset="0%" stopColor="#D7F24B" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="sbGlowGround" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Ground Glow */}
        <ellipse cx="140" cy="150" rx="100" ry="16" fill="url(#sbGlowGround)" />

        {/* Mt Fuji Silhouette Peak */}
        <path
          d="M100 135 L145 65 L165 65 L210 135 Z"
          fill="url(#sbFujiGrad)"
        />
        {/* Snow Cap on Fuji */}
        <path
          d="M136 78 L145 65 L165 65 L174 78 C168 81, 162 76, 155 79 C148 76, 142 81, 136 78 Z"
          fill="rgba(255, 255, 255, 0.45)"
        />

        {/* Iconic Speedometer Gauge Arc (Finance & Speed) */}
        <path
          d="M35 130 A 42 42 0 0 1 105 130"
          stroke="url(#sbCarBodyGrad)"
          strokeWidth="2.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx="70" cy="130" r="3" fill="#D7F24B" />

        {/* Iconic Japanese Seal Badge: 車 (Automobile) */}
        <g transform="translate(18, 55)">
          <circle cx="18" cy="18" r="16" fill="rgba(15, 23, 42, 0.7)" stroke="url(#sbEmblemGrad)" strokeWidth="1.8" />
          <circle cx="18" cy="18" r="13" fill="none" stroke="rgba(215, 242, 75, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
          {/* Kanji: 車 (Automotive) */}
          <text
            x="18"
            y="23.5"
            textAnchor="middle"
            fill="#D7F24B"
            fontSize="13"
            fontWeight="900"
            fontFamily="'Noto Sans JP', 'Hiragino Sans', sans-serif"
          >
            車
          </text>
        </g>

        {/* Headlight Projection Beam */}
        <path
          d="M210 128 L255 115 L258 142 L210 138 Z"
          fill="url(#sbHeadlightBeam)"
        />

        {/* Iconic Japanese Luxury Sports Sedan Silhouette */}
        <g transform="translate(58, 88)">
          {/* Car Body Shell */}
          <path
            d="M 12 40
               C 18 36, 28 32, 42 30
               C 56 20, 78 12, 102 12
               C 122 12, 136 20, 146 30
               C 156 31, 164 34, 168 38
               C 170 41, 168 45, 162 47
               L 150 47
               C 148 42, 142 38, 134 38
               C 126 38, 120 42, 118 47
               L 52 47
               C 50 42, 44 38, 36 38
               C 28 38, 22 42, 20 47
               L 8 47
               C 5 47, 4 44, 7 42
               Z"
            fill="url(#sbCarBodyGrad)"
          />

          {/* Cabin Windshield & Glass */}
          <path
            d="M 52 28
               C 62 18, 80 15, 100 15
               C 118 15, 128 20, 136 28
               Z"
            fill="#0F172A"
            opacity="0.8"
          />

          {/* Pillar Divider */}
          <line x1="94" y1="15" x2="94" y2="28" stroke="rgba(215, 242, 75, 0.6)" strokeWidth="1.5" />

          {/* LED Headlight Beam Stripe */}
          <path
            d="M 160 38 L 168 39 L 165 41 Z"
            fill="#FFFFFF"
            boxShadow="0 0 8px #FFFFFF"
          />

          {/* Front Wheel & Rim */}
          <circle cx="134" cy="46" r="8.5" fill="#0F172A" stroke="url(#sbEmblemGrad)" strokeWidth="2.2" />
          <circle cx="134" cy="46" r="4.5" fill="#D7F24B" />

          {/* Rear Wheel & Rim */}
          <circle cx="36" cy="46" r="8.5" fill="#0F172A" stroke="url(#sbEmblemGrad)" strokeWidth="2.2" />
          <circle cx="36" cy="46" r="4.5" fill="#D7F24B" />
        </g>

        {/* High-Tech Road Base Strip */}
        <line x1="15" y1="140" x2="245" y2="140" stroke="rgba(16, 185, 129, 0.45)" strokeWidth="1.5" />
        <line x1="30" y1="143" x2="230" y2="143" stroke="rgba(215, 242, 75, 0.35)" strokeWidth="1" strokeDasharray="8 6" />
      </svg>
    </div>
  );
};

export default SidebarIllustration;
