import React from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  return (
    <div className="animated-bg-layer" aria-hidden="true">
      {/* Ambient Floating Luminous Orbs */}
      <div className="ambient-orb orb-lime" />
      <div className="ambient-orb orb-cyan" />
      <div className="ambient-orb orb-purple" />

      {/* SVG Financial Flow Waves & Horizon Illustration */}
      <svg
        className="bg-illustration-svg"
        viewBox="0 0 1600 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="finWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#D7F24B" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="finWaveGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.12" />
            <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="fujiGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.18" />
            <stop offset="35%" stopColor="#CBD5E1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle Mt. Fuji / Japanese Horizon Silhouette (upper right backdrop) */}
        <g className="fuji-illustration">
          {/* Distant mountain silhouette */}
          <path
            d="M950 260 L1180 90 L1260 90 L1490 260 L950 260 Z"
            fill="url(#fujiGrad)"
          />
          {/* Snow cap highlight */}
          <path
            d="M1175 92 L1265 92 L1285 130 L1260 120 L1240 142 L1215 124 L1195 136 L1160 125 Z"
            fill="#FFFFFF"
            fillOpacity="0.35"
          />
          {/* Subtle peak ridge line */}
          <path
            d="M1220 90 L1215 180 M1240 92 L1255 190"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeOpacity="0.25"
          />
        </g>

        {/* Animated Primary Financial Wave 1 */}
        <path
          className="animated-flow-path path-primary"
          d="M-50 420 C 250 340, 480 540, 800 430 C 1120 320, 1380 490, 1680 380"
          stroke="url(#finWaveGrad1)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Animated Secondary Harmonic Wave 2 */}
        <path
          className="animated-flow-path path-secondary"
          d="M-50 490 C 220 560, 520 380, 850 480 C 1180 580, 1420 390, 1680 470"
          stroke="url(#finWaveGrad2)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Tertiary subtle contour line */}
        <path
          className="animated-flow-path path-tertiary"
          d="M-50 360 C 320 280, 600 460, 920 350 C 1240 240, 1460 380, 1680 310"
          stroke="url(#finWaveGrad1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
      </svg>
    </div>
  );
};

export default AnimatedBackground;

