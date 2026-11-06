import React from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  return (
    <div className="animated-bg-layer" aria-hidden="true">
      {/* Rich Static Luminous Ambient Auras (Fintech Palette) */}
      <div className="ambient-orb orb-lime" />
      <div className="ambient-orb orb-cyan" />
      <div className="ambient-orb orb-purple" />
      <div className="ambient-orb orb-emerald" />

      {/* High-Visibility Static Financial Flow Waves & Horizon Illustration */}
      <svg
        className="bg-illustration-svg"
        viewBox="0 0 1600 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Wave 1: Lime to Emerald */}
          <linearGradient id="visWave1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#D7F24B" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#10B981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.4" />
          </linearGradient>

          {/* Wave 2: Sapphire to Cyan */}
          <linearGradient id="visWave2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
          </linearGradient>

          {/* Wave 3: Amethyst Violet to Rose */}
          <linearGradient id="visWave3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
          </linearGradient>

          {/* Mount Fuji Shading Gradients */}
          <linearGradient id="visFujiBody" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#64748B" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#94A3B8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="visFujiSun" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D7F24B" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
          </linearGradient>

          {/* Financial Depth Grid Gradient */}
          <linearGradient id="visGridLines" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Financial Market Grid Backdrop */}
        <g opacity="0.65">
          <line x1="100" y1="200" x2="1500" y2="200" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
          <line x1="100" y1="350" x2="1500" y2="350" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
          <line x1="100" y1="500" x2="1500" y2="500" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
          <line x1="100" y1="650" x2="1500" y2="650" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
          <line x1="400" y1="100" x2="400" y2="750" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <line x1="800" y1="100" x2="800" y2="750" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <line x1="1200" y1="100" x2="1200" y2="750" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
        </g>

        {/* Prominent Mount Fuji & Japanese Horizon (Upper Right) */}
        <g className="vis-fuji-group">
          {/* Dawn Sun Glow behind peak */}
          <circle cx="1230" cy="140" r="130" fill="url(#visFujiSun)" />

          {/* Mount Fuji Mountain Body */}
          <path
            d="M930 310 L1185 85 L1275 85 L1530 310 Z"
            fill="url(#visFujiBody)"
          />

          {/* Fuji Snow Cap with Realistic Serrated Ridges */}
          <path
            d="M1180 88 L1280 88 L1305 138 L1275 125 L1250 152 L1225 130 L1200 145 L1160 132 Z"
            fill="#FFFFFF"
            fillOpacity="0.85"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />
          {/* Ridge lines */}
          <path d="M1230 88 L1225 210" stroke="#FFFFFF" strokeWidth="1.8" strokeOpacity="0.6" />
          <path d="M1255 90 L1270 220" stroke="#CBD5E1" strokeWidth="1.4" strokeOpacity="0.5" />
          <path d="M1195 145 L1180 250" stroke="#94A3B8" strokeWidth="1.2" strokeOpacity="0.4" />

          {/* Japanese Executive Car Silhouette on the Horizon */}
          <g transform="translate(1250, 195) scale(0.95)" opacity="0.65">
            {/* Ground shadow */}
            <ellipse cx="140" cy="85" rx="135" ry="8" fill="#1E293B" fillOpacity="0.25" />
            {/* Car profile body */}
            <path
              d="M15 76 C 25 76, 35 72, 45 64 C 62 48, 85 28, 125 24 C 175 19, 215 22, 235 34 C 250 43, 260 52, 275 56 C 285 58, 290 64, 290 70 C 290 76, 280 80, 265 80 L 250 80 M 30 80 L 65 80 M 115 80 L 195 80 M 245 80 L 265 80"
              stroke="#475569"
              strokeWidth="2.5"
              fill="rgba(255, 255, 255, 0.45)"
            />
            {/* Front & Rear Wheels */}
            <circle cx="90" cy="78" r="18" fill="#334155" stroke="#CBD5E1" strokeWidth="2.5" />
            <circle cx="90" cy="78" r="7" fill="#D7F24B" />
            <circle cx="225" cy="78" r="18" fill="#334155" stroke="#CBD5E1" strokeWidth="2.5" />
            <circle cx="225" cy="78" r="7" fill="#D7F24B" />
            {/* Window glass */}
            <path d="M95 55 L 128 32 C 160 28, 195 30, 215 42 L 230 55 Z" fill="#94A3B8" fillOpacity="0.35" stroke="#64748B" strokeWidth="1.5" />
            {/* Headlight beam */}
            <path d="M285 64 L 320 66" stroke="#D7F24B" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>

        {/* High-Visibility Static Financial Growth Waves */}
        {/* Wave 1 (Lime & Emerald) */}
        <path
          d="M-50 430 C 220 320, 460 540, 780 420 C 1100 300, 1360 480, 1680 360"
          stroke="url(#visWave1)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Wave 2 (Sapphire & Cyan) */}
        <path
          d="M-50 500 C 240 580, 540 370, 880 480 C 1220 590, 1440 380, 1680 460"
          stroke="url(#visWave2)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Wave 3 (Amethyst Violet & Rose) */}
        <path
          d="M-50 360 C 300 260, 580 450, 920 330 C 1260 210, 1480 370, 1680 290"
          stroke="url(#visWave3)"
          strokeWidth="2.4"
          strokeDasharray="8 6"
          strokeLinecap="round"
        />

        {/* Wave 4 (Accent Gold Baseline) */}
        <path
          d="M-50 580 C 350 510, 650 630, 1020 540 C 1350 460, 1550 560, 1680 520"
          stroke="url(#visWave1)"
          strokeWidth="2"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default AnimatedBackground;
