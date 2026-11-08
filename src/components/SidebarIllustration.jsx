import React from 'react';
import './SidebarIllustration.css';

// Small illustrated glass strip under the sidebar wordmark: a growing ledger chart,
// Mt Fuji under a rising sun, and a gold yen coin, lit with soft shadows and highlights.
// Hidden when the sidebar is collapsed.
const SidebarIllustration = ({ collapsed = false }) => {
  if (collapsed) return null;

  return (
    <div className="sidebar-illustration-wrap" aria-hidden="true">
      <svg className="sidebar-scene-svg" viewBox="0 0 210 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sbSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="55%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#fef9c3" />
          </linearGradient>
          <radialGradient id="sbSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff1f2" />
            <stop offset="45%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </radialGradient>
          <radialGradient id="sbSunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fda4af" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
          </radialGradient>
          {/* Mountain lit from the left */}
          <linearGradient id="sbFujiL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="sbFujiR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="sbSnow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>
          {/* Glossy bar: bright face with a darker side */}
          <linearGradient id="sbBar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d9f99d" />
            <stop offset="55%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </linearGradient>
          <linearGradient id="sbLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <radialGradient id="sbCoin" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#fff7d1" />
            <stop offset="40%" stopColor="#fcd34d" />
            <stop offset="80%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <filter id="sbShadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.22" />
          </filter>
        </defs>

        <rect width="210" height="64" fill="url(#sbSky)" />

        {/* Sun with atmospheric glow */}
        <circle cx="150" cy="22" r="20" fill="url(#sbSunGlow)" />
        <circle cx="150" cy="22" r="10" fill="url(#sbSun)" />

        {/* Mt Fuji: two-tone faces and a snow cap */}
        <path d="M100 64 L136 26 L142 26 L142 64 Z" fill="url(#sbFujiL)" />
        <path d="M142 64 L142 26 L148 26 L190 64 Z" fill="url(#sbFujiR)" />
        <path d="M129 34 L136 26 L148 26 L156 34 C151 37 147 32 142.5 36 C138 32 134 37 129 34 Z" fill="url(#sbSnow)" />

        {/* Ground haze */}
        <rect y="54" width="210" height="10" fill="#ffffff" fillOpacity="0.45" />

        {/* Ledger bars with shadow and top highlight */}
        <g filter="url(#sbShadow)">
          {[[16, 40], [31, 32], [46, 24], [61, 16]].map(([x, y]) => (
            <g key={x}>
              <rect x={x} y={y} width="10" height={64 - y} rx="2.5" fill="url(#sbBar)" />
              <rect x={x + 1.5} y={y + 1.5} width="2.2" height={60 - y} rx="1.1" fill="#ffffff" fillOpacity="0.45" />
            </g>
          ))}
        </g>
        <path d="M14 36 L36 26 L51 20 L74 8" stroke="url(#sbLine)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="74" cy="8" r="3.4" fill="#16a34a" stroke="#ffffff" strokeWidth="1.4" filter="url(#sbShadow)" />

        {/* Gold coin with rim */}
        <g filter="url(#sbShadow)">
          <circle cx="188" cy="47.5" r="10" fill="#92400e" />
          <circle cx="188" cy="46" r="10" fill="url(#sbCoin)" />
          <circle cx="188" cy="46" r="7.2" fill="none" stroke="#b45309" strokeOpacity="0.45" />
          <text x="188" y="50" textAnchor="middle" fontSize="11" fontWeight="800" fill="#92400e" fontFamily="'Plus Jakarta Sans', sans-serif">¥</text>
          <ellipse cx="184.5" cy="41.5" rx="3.5" ry="1.6" fill="#ffffff" fillOpacity="0.6" transform="rotate(-30 184.5 41.5)" />
        </g>

        <path d="M92 12 l1.8 4 l4 1.8 l-4 1.8 l-1.8 4 l-1.8 -4 l-4 -1.8 l4 -1.8 Z" fill="#a78bfa" />
        <circle cx="196" cy="14" r="2" fill="#7dd3fc" />
      </svg>
    </div>
  );
};

export default SidebarIllustration;
