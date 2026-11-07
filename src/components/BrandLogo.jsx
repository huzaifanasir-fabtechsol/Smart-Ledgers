import React from 'react';
import './BrandLogo.css';

const BrandLogo = ({ collapsed = false, title = 'Smart Ledger', subtitle = 'JPN Auto Trade Accounting' }) => {
  return (
    <div className={`brand-logo-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-logo-badge" title={title}>
        {/* High-Fidelity Realistic Japanese Luxury Sports Car Render */}
        <svg
          className="brand-car-svg realistic-car"
          viewBox="0 0 64 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic Silver-Chrome Body Gradient */}
            <linearGradient id="realBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#E2E8F0" />
              <stop offset="55%" stopColor="#94A3B8" />
              <stop offset="75%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Roofline Specular Highlight */}
            <linearGradient id="realRoofSpec" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.4" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="80%" stopColor="#D7F24B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
            </linearGradient>

            {/* Tinted Glass Gradient with Specular Reflection */}
            <linearGradient id="realGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#0F172A" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#1E293B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
            </linearGradient>

            {/* Alloy Machined Rim Gradient */}
            <radialGradient id="realRimGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="30%" stopColor="#94A3B8" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>

            {/* Tire Rubber Gradient */}
            <radialGradient id="realTireGrad" cx="50%" cy="50%" r="50%">
              <stop offset="65%" stopColor="#1E293B" />
              <stop offset="85%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Headlight Projector Flare */}
            <linearGradient id="realHeadlightGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#E2F952" />
              <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>

            {/* Ground Shadow */}
            <radialGradient id="realShadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#020617" stopOpacity="0.65" />
              <stop offset="65%" stopColor="#020617" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Realistic Ground Contact Shadow */}
          <ellipse cx="32" cy="30" rx="30" ry="3" fill="url(#realShadowGrad)" />

          {/* Underbody Rocker Panel (Dark Charcoal) */}
          <path
            d="M8 26.5 L14 26.5 C15 24 17.5 22.5 20.5 22.5 C23.5 22.5 26 24 27 26.5 L40 26.5 C41 24 43.5 22.5 46.5 22.5 C49.5 22.5 52 24 53 26.5 L57 26.5 C59 26.5 60 25.5 60 24 L59 22 L7 22 L6.5 24.5 C6.5 25.8 7 26.5 8 26.5 Z"
            fill="#0F172A"
          />

          {/* Main Realistic Metallic Car Body Shell */}
          <path
            d="M6 22 
               C 5 21, 5 19, 6.5 18 
               C 7.5 17.2, 9.5 16.5, 12 16 
               C 15.5 15.2, 17.5 14.5, 20 12.5 
               C 23.5 9.8, 28 6.5, 34 5.8 
               C 42 4.8, 48 5.6, 51.5 9 
               C 54 11.5, 55.5 13.5, 58.5 14.5 
               C 61 15.3, 62 16.5, 62 18.5 
               C 62 20.8, 60.5 22, 59 22 
               L 53.5 22 
               C 52.8 19.5, 50 18, 46.5 18 
               C 43 18, 40.2 19.5, 39.5 22 
               L 27.5 22 
               C 26.8 19.5, 24 18, 20.5 18 
               C 17 18, 14.2 19.5, 13.5 22 
               Z"
            fill="url(#realBodyGrad)"
            stroke="#94A3B8"
            strokeWidth="0.6"
          />

          {/* Body Sculpt / Shoulder Character Crease */}
          <path
            d="M10 16.5 C 16 16, 26 15, 38 14.5 C 48 14, 56 15, 60.5 17"
            stroke="#FFFFFF"
            strokeWidth="0.8"
            strokeOpacity="0.85"
            strokeLinecap="round"
          />
          <path
            d="M10 17.2 C 16 16.8, 26 15.8, 38 15.3 C 48 14.8, 56 15.8, 60 17.6"
            stroke="#334155"
            strokeWidth="0.5"
            strokeOpacity="0.6"
          />

          {/* Curved Realistic Glass Canopy (Windshield, Side Windows, Rear Quarter) */}
          <path
            d="M21 12 C 24 9.5, 28 7.2, 34 6.6 C 41 5.8, 46 6.5, 49.5 9.5 C 52 11.5, 53.5 13.5, 54.5 14.5 L 21.5 14.5 Z"
            fill="url(#realGlassGrad)"
            stroke="#334155"
            strokeWidth="0.7"
          />

          {/* Realistic Window B-Pillar Divider */}
          <path d="M35 6.8 L 35 14.5" stroke="#0F172A" strokeWidth="1.6" />
          <path d="M35.2 6.8 L 35.2 14.5" stroke="#CBD5E1" strokeWidth="0.4" strokeOpacity="0.5" />

          {/* Glass Diagonal Sun Reflection Streak */}
          <path
            d="M26 13.5 L 31 8 L 33 8 L 28 13.5 Z"
            fill="#FFFFFF"
            fillOpacity="0.45"
          />
          <path
            d="M38 13.5 L 44 8.5 L 46 8.5 L 40 13.5 Z"
            fill="#FFFFFF"
            fillOpacity="0.3"
          />

          {/* Aerodynamic Side Mirror */}
          <path
            d="M33 13.2 C 32 13, 31 13.5, 31 14.2 C 31 14.8, 32.5 15, 33.5 14.8 Z"
            fill="#0F172A"
            stroke="#CBD5E1"
            strokeWidth="0.4"
          />
          <circle cx="32" cy="14" r="0.5" fill="#D7F24B" />

          {/* Door Handle with Chrome Accent */}
          <rect x="37" y="16.5" width="3.5" height="0.8" rx="0.4" fill="#E2E8F0" stroke="#475569" strokeWidth="0.3" />

          {/* Front Bumper Intake & Fog Lamp Area */}
          <path d="M59 19.5 L 61 20 L 60.5 21.5 L 58.5 21 Z" fill="#0F172A" />

          {/* High-Intensity Projector Headlamp Optics */}
          <path
            d="M57.5 15.5 C 59.5 16, 61 17, 61.5 18 L 57.5 17.5 Z"
            fill="#FFFFFF"
          />
          <circle cx="58.5" cy="16.8" r="0.9" fill="#38BDF8" />
          {/* Luminous Forward Beam Flare */}
          <path
            d="M60.5 17 L 64 16 L 64 18.5 Z"
            fill="url(#realHeadlightGrad)"
            opacity="0.85"
          />

          {/* Rear LED Tail Lamp Strip */}
          <path d="M6 18.5 C 6 18, 6.5 17.5, 7.5 17.5 L 8 18.5 Z" fill="#EF4444" />

          {/* Roofline Specular Accent Stroke */}
          <path
            d="M17 14 C 23.5 9.8, 28 6.5, 34 5.8 C 42 4.8, 48 5.6, 51.5 9"
            stroke="url(#realRoofSpec)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* ============ FRONT REALISTIC 3D ALLOY WHEEL ============ */}
          {/* Tire */}
          <circle cx="46.5" cy="22.5" r="5.5" fill="url(#realTireGrad)" stroke="#334155" strokeWidth="0.6" />
          {/* Rim Machined Outer Lip */}
          <circle cx="46.5" cy="22.5" r="4.2" fill="#1E293B" stroke="#CBD5E1" strokeWidth="0.7" />
          {/* Drilled Brake Disc */}
          <circle cx="46.5" cy="22.5" r="3.2" fill="#64748B" stroke="#94A3B8" strokeWidth="0.3" />
          {/* Sports Brake Caliper in Lime Green */}
          <path d="M48.5 20.8 C 49 21.3, 49 22.5, 48.5 23 L 47.8 22.5 Z" fill="#D7F24B" />
          {/* 5 Realistic Split Alloy Spokes */}
          <circle cx="46.5" cy="22.5" r="1.3" fill="url(#realRimGrad)" stroke="#FFFFFF" strokeWidth="0.4" />
          <line x1="46.5" y1="18.8" x2="46.5" y2="26.2" stroke="#E2E8F0" strokeWidth="0.8" />
          <line x1="43.2" y1="20.5" x2="49.8" y2="24.5" stroke="#E2E8F0" strokeWidth="0.8" />
          <line x1="43.2" y1="24.5" x2="49.8" y2="20.5" stroke="#E2E8F0" strokeWidth="0.8" />
          {/* Wheel Center Cap */}
          <circle cx="46.5" cy="22.5" r="0.7" fill="#0F172A" stroke="#D7F24B" strokeWidth="0.3" />

          {/* ============ REAR REALISTIC 3D ALLOY WHEEL ============ */}
          {/* Tire */}
          <circle cx="20.5" cy="22.5" r="5.5" fill="url(#realTireGrad)" stroke="#334155" strokeWidth="0.6" />
          {/* Rim Machined Outer Lip */}
          <circle cx="20.5" cy="22.5" r="4.2" fill="#1E293B" stroke="#CBD5E1" strokeWidth="0.7" />
          {/* Drilled Brake Disc */}
          <circle cx="20.5" cy="22.5" r="3.2" fill="#64748B" stroke="#94A3B8" strokeWidth="0.3" />
          {/* Sports Brake Caliper in Lime Green */}
          <path d="M22.5 20.8 C 23 21.3, 23 22.5, 22.5 23 L 21.8 22.5 Z" fill="#D7F24B" />
          {/* 5 Realistic Split Alloy Spokes */}
          <circle cx="20.5" cy="22.5" r="1.3" fill="url(#realRimGrad)" stroke="#FFFFFF" strokeWidth="0.4" />
          <line x1="20.5" y1="18.8" x2="20.5" y2="26.2" stroke="#E2E8F0" strokeWidth="0.8" />
          <line x1="17.2" y1="20.5" x2="23.8" y2="24.5" stroke="#E2E8F0" strokeWidth="0.8" />
          <line x1="17.2" y1="24.5" x2="23.8" y2="20.5" stroke="#E2E8F0" strokeWidth="0.8" />
          {/* Wheel Center Cap */}
          <circle cx="20.5" cy="22.5" r="0.7" fill="#0F172A" stroke="#D7F24B" strokeWidth="0.3" />
        </svg>
      </div>

      {!collapsed && (
        <div className="brand-logo-text">
          <div className="brand-logo-title">
            <span className="brand-title-smart">Smart</span>
            <span className="brand-title-accent">Ledger</span>
          </div>
          <div className="brand-logo-subtitle">{subtitle}</div>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
