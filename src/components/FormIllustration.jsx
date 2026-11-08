import React from 'react';

// Lit, semi-realistic illustrations for form banners (200x140 scenes): soft contact shadows,
// paper with a sheen, metallic coins and glossy highlights. Gradient/filter ids are prefixed
// per variant so several illustrations can share a page.

// Shared building blocks -------------------------------------------------------------------

// Drop shadow + paper sheen definitions for one variant prefix.
const Lighting = ({ id }) => (
  <>
    <filter id={`${id}Shadow`} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor="#0f172a" floodOpacity="0.18" />
    </filter>
    <filter id={`${id}SoftShadow`} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.16" />
    </filter>
    <linearGradient id={`${id}Paper`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffffff" />
      <stop offset="70%" stopColor="#f8fafc" />
      <stop offset="100%" stopColor="#eef2f7" />
    </linearGradient>
    <linearGradient id={`${id}Sheen`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
    </linearGradient>
    <radialGradient id={`${id}Floor`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
      <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
    </radialGradient>
    {/* Gold coin: face, rim and highlight */}
    <radialGradient id={`${id}CoinFace`} cx="38%" cy="32%" r="75%">
      <stop offset="0%" stopColor="#fff7d1" />
      <stop offset="35%" stopColor="#fcd34d" />
      <stop offset="75%" stopColor="#f59e0b" />
      <stop offset="100%" stopColor="#b45309" />
    </radialGradient>
    <linearGradient id={`${id}CoinEdge`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#d97706" />
      <stop offset="100%" stopColor="#92400e" />
    </linearGradient>
  </>
);

// Metallic ¥ coin seen face-on.
const Coin = ({ id, cx, cy, r }) => (
  <g filter={`url(#${id}SoftShadow)`}>
    <circle cx={cx} cy={cy + 1.6} r={r} fill={`url(#${id}CoinEdge)`} />
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id}CoinFace)`} />
    <circle cx={cx} cy={cy} r={r * 0.74} fill="none" stroke="#b45309" strokeOpacity="0.45" strokeWidth="1" />
    <text
      x={cx}
      y={cy + r * 0.36}
      textAnchor="middle"
      fontSize={r * 1.05}
      fontWeight="800"
      fill="#92400e"
      fontFamily="'Plus Jakarta Sans', sans-serif"
    >
      ¥
    </text>
    <ellipse cx={cx - r * 0.35} cy={cy - r * 0.45} rx={r * 0.35} ry={r * 0.18} fill="#ffffff" fillOpacity="0.55" transform={`rotate(-30 ${cx - r * 0.35} ${cy - r * 0.45})`} />
  </g>
);

// Stack of coins seen from the side.
const CoinStack = ({ id, cx, base, count = 3 }) => (
  <g filter={`url(#${id}SoftShadow)`}>
    {Array.from({ length: count }).map((_, i) => {
      const y = base - i * 9;
      return (
        <g key={i}>
          <path d={`M${cx - 18} ${y} v6 a18 6 0 0 0 36 0 v-6`} fill={`url(#${id}CoinEdge)`} />
          <ellipse cx={cx} cy={y} rx="18" ry="6" fill={`url(#${id}CoinFace)`} />
          <ellipse cx={cx} cy={y} rx="11" ry="3.3" fill="none" stroke="#b45309" strokeOpacity="0.4" />
        </g>
      );
    })}
  </g>
);

const Sparkle = ({ x, y, s = 1, fill }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"
    fill={fill}
  />
);

// Scenes ------------------------------------------------------------------------------------

const ExpenseArt = () => {
  const id = 'fiExp';
  return (
    <>
      <defs>
        <Lighting id={id} />
        <linearGradient id={`${id}Card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${id}Chip`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={`${id}Halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="104" cy="70" r="64" fill={`url(#${id}Halo)`} />
      <ellipse cx="104" cy="126" rx="78" ry="7" fill={`url(#${id}Floor)`} />

      {/* Credit card */}
      <g transform="rotate(-14 52 86)" filter={`url(#${id}Shadow)`}>
        <rect x="16" y="62" width="74" height="46" rx="7" fill={`url(#${id}Card)`} />
        <rect x="16" y="62" width="74" height="46" rx="7" fill={`url(#${id}Sheen)`} opacity="0.25" />
        <rect x="24" y="74" width="13" height="10" rx="2" fill={`url(#${id}Chip)`} />
        <path d="M27 74 v10 M34 74 v10 M24 79 h13" stroke="#92400e" strokeOpacity="0.35" strokeWidth="0.7" />
        <rect x="24" y="92" width="34" height="3" rx="1.5" fill="#94a3b8" fillOpacity="0.8" />
        <circle cx="76" cy="96" r="5" fill="#f97316" fillOpacity="0.9" />
        <circle cx="82" cy="96" r="5" fill="#facc15" fillOpacity="0.85" />
      </g>

      {/* Receipt */}
      <g filter={`url(#${id}Shadow)`}>
        <path
          d="M74 14 H136 V118 L130 112 L124 118 L118 112 L112 118 L106 112 L100 118 L94 112 L88 118 L82 112 L74 118 Z"
          fill={`url(#${id}Paper)`}
        />
      </g>
      <rect x="74" y="14" width="62" height="10" fill="#f59e0b" fillOpacity="0.12" />
      <rect x="84" y="28" width="30" height="5" rx="2.5" fill="#d97706" />
      {[42, 51, 60].map((y, i) => (
        <g key={y}>
          <rect x="84" y={y} width={[30, 24, 28][i]} height="3.2" rx="1.6" fill="#cbd5e1" />
          <rect x="118" y={y} width="8" height="3.2" rx="1.6" fill="#cbd5e1" />
        </g>
      ))}
      <line x1="84" y1="73" x2="126" y2="73" stroke="#94a3b8" strokeDasharray="2.5 2.5" />
      <text x="84" y="92" fontSize="14" fontWeight="800" fill="#b45309" fontFamily="'Plus Jakarta Sans', sans-serif">¥</text>
      <rect x="96" y="83" width="30" height="8" rx="4" fill="#fde68a" />
      {/* barcode */}
      {[0, 3, 5, 9, 11, 14, 18, 20, 24, 27, 29, 33, 36].map((x) => (
        <rect key={x} x={86 + x} y="99" width={x % 2 ? 1 : 1.8} height="7" fill="#334155" fillOpacity="0.7" />
      ))}
      <rect x="74" y="14" width="62" height="104" fill={`url(#${id}Sheen)`} opacity="0.35" />

      <CoinStack id={id} cx={160} base={114} count={3} />
      <Coin id={id} cx={176} cy={70} r={11} />
      <Sparkle x={168} y={30} s={0.9} fill="#fbbf24" />
      <Sparkle x={40} y={30} s={0.6} fill="#fcd34d" />
    </>
  );
};

const InvoiceArt = () => {
  const id = 'fiInv';
  return (
    <>
      <defs>
        <Lighting id={id} />
        <linearGradient id={`${id}Head`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <radialGradient id={`${id}Halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}Check`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#d9f99d" />
          <stop offset="100%" stopColor="#65a30d" />
        </radialGradient>
        <filter id={`${id}Ink`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.1" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
      <circle cx="100" cy="70" r="64" fill={`url(#${id}Halo)`} />
      <ellipse cx="100" cy="128" rx="74" ry="7" fill={`url(#${id}Floor)`} />

      {/* Sheet underneath */}
      <rect x="68" y="20" width="76" height="100" rx="6" fill="#ede9fe" transform="rotate(7 106 70)" filter={`url(#${id}SoftShadow)`} />
      {/* Invoice */}
      <g filter={`url(#${id}Shadow)`}>
        <rect x="54" y="14" width="78" height="106" rx="6" fill={`url(#${id}Paper)`} />
      </g>
      <path d="M60 14 H126 a6 6 0 0 1 6 6 V34 H54 V20 a6 6 0 0 1 6 -6 Z" fill={`url(#${id}Head)`} />
      <rect x="62" y="21" width="26" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.9" />
      <rect x="110" y="21" width="14" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.55" />
      {[44, 55, 66].map((y) => (
        <g key={y}>
          <rect x="62" y={y} width="36" height="3.5" rx="1.75" fill="#cbd5e1" />
          <rect x="108" y={y} width="16" height="3.5" rx="1.75" fill="#c4b5fd" />
        </g>
      ))}
      <line x1="62" y1="78" x2="124" y2="78" stroke="#e2e8f0" />
      <rect x="62" y="85" width="22" height="3.5" rx="1.75" fill="#cbd5e1" />
      <rect x="96" y="83" width="28" height="9" rx="4.5" fill={`url(#${id}Head)`} />
      <rect x="54" y="14" width="78" height="106" rx="6" fill={`url(#${id}Sheen)`} opacity="0.3" />

      {/* Hanko stamp impression (slightly worn ink) */}
      <g transform="translate(146 98) rotate(-10)" filter={`url(#${id}Ink)`}>
        <circle r="17" fill="none" stroke="#dc2626" strokeWidth="2.6" />
        <circle r="12.5" fill="none" stroke="#dc2626" strokeWidth="1" />
        <text y="5.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#dc2626" fontFamily="'Noto Sans JP', 'Hiragino Sans', sans-serif">済</text>
      </g>

      {/* Approved badge */}
      <g transform="translate(40 46)" filter={`url(#${id}SoftShadow)`}>
        <circle r="13" fill={`url(#${id}Check)`} />
        <path d="M-5.5 0.5 L-1.5 4.5 L6 -4" stroke="#ffffff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="-4" cy="-6" rx="5" ry="2.5" fill="#ffffff" fillOpacity="0.45" />
      </g>
      <Coin id={id} cx={170} cy={46} r={10} />
      <Sparkle x={160} y={20} s={0.7} fill="#a78bfa" />
    </>
  );
};

const LetterheadArt = () => {
  const id = 'fiLh';
  return (
    <>
      <defs>
        <Lighting id={id} />
        <linearGradient id={`${id}Band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#84cc16" />
        </linearGradient>
        <linearGradient id={`${id}Barrel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="45%" stopColor="#475569" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={`${id}Nib`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`${id}Env`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e7ecef" />
        </linearGradient>
        <radialGradient id={`${id}Halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="70" r="64" fill={`url(#${id}Halo)`} />
      <ellipse cx="100" cy="128" rx="80" ry="7" fill={`url(#${id}Floor)`} />

      {/* Envelope */}
      <g transform="rotate(-10 52 98)" filter={`url(#${id}Shadow)`}>
        <rect x="16" y="78" width="66" height="40" rx="4" fill={`url(#${id}Env)`} />
        <path d="M16 82 L49 103 L82 82" stroke="#cbd5e1" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        <path d="M16 118 L42 98 M82 118 L56 98" stroke="#e2e8f0" strokeWidth="1.2" />
      </g>

      {/* Letter */}
      <g filter={`url(#${id}Shadow)`}>
        <rect x="66" y="10" width="74" height="108" rx="4" fill={`url(#${id}Paper)`} />
      </g>
      <rect x="66" y="10" width="74" height="6" rx="2" fill={`url(#${id}Band)`} />
      <circle cx="80" cy="30" r="7" fill="#ecfccb" stroke="#65a30d" strokeWidth="1.5" />
      <path d="M77 30 l2 2 l4 -4" stroke="#4d7c0f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="92" y="25" width="36" height="4" rx="2" fill="#0f172a" fillOpacity="0.8" />
      <rect x="92" y="32" width="24" height="3" rx="1.5" fill="#94a3b8" />
      {[50, 58, 66, 74, 82].map((y, i) => (
        <rect key={y} x="76" y={y} width={i === 4 ? 28 : 54} height="3" rx="1.5" fill="#cbd5e1" />
      ))}
      {/* Ink signature */}
      <path d="M78 102 C 84 92, 90 108, 96 98 S 106 94, 112 101 S 120 98, 124 96" stroke="#1e3a8a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="66" y="10" width="74" height="108" fill={`url(#${id}Sheen)`} opacity="0.3" />

      {/* Fountain pen */}
      <g transform="rotate(38 160 68)" filter={`url(#${id}Shadow)`}>
        <rect x="154" y="18" width="12" height="66" rx="6" fill={`url(#${id}Barrel)`} />
        <rect x="154" y="38" width="12" height="3.5" fill="#d4af37" />
        <rect x="165" y="20" width="2" height="22" rx="1" fill="#d4af37" />
        <path d="M154 84 L160 104 L166 84 Z" fill={`url(#${id}Nib)`} />
        <line x1="160" y1="88" x2="160" y2="100" stroke="#78350f" strokeWidth="0.9" />
        <rect x="157" y="22" width="2.2" height="56" rx="1.1" fill="#ffffff" fillOpacity="0.28" />
      </g>
      <Sparkle x={40} y={32} s={0.7} fill="#34d399" />
    </>
  );
};

const SettingsArt = () => {
  const id = 'fiSet';
  const gear = (teeth, inner, outer, toothW, toothH) => (
    <>
      {Array.from({ length: teeth }).map((_, i) => (
        <rect key={i} x={-toothW / 2} y={-outer} width={toothW} height={toothH} rx="2.5" transform={`rotate(${(360 / teeth) * i})`} />
      ))}
      <circle r={inner} />
    </>
  );
  return (
    <>
      <defs>
        <Lighting id={id} />
        <linearGradient id={`${id}Steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="35%" stopColor="#a5b4fc" />
          <stop offset="70%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <linearGradient id={`${id}Silver`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={`${id}Shield`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bef264" />
          <stop offset="55%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <radialGradient id={`${id}Halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="70" r="64" fill={`url(#${id}Halo)`} />
      <ellipse cx="104" cy="128" rx="76" ry="7" fill={`url(#${id}Floor)`} />

      {/* Large gear */}
      <g transform="translate(84 64)" fill={`url(#${id}Steel)`} filter={`url(#${id}Shadow)`}>
        {gear(10, 31, 41, 11, 14)}
      </g>
      <circle cx="84" cy="64" r="22" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="84" cy="64" r="11" fill="#eef2ff" stroke="#4338ca" strokeOpacity="0.4" strokeWidth="2" />
      <path d="M62 50 A 28 28 0 0 1 98 40" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Small gear */}
      <g transform="translate(142 32)" fill={`url(#${id}Silver)`} filter={`url(#${id}SoftShadow)`}>
        {gear(8, 14, 20, 7, 9)}
      </g>
      <circle cx="142" cy="32" r="5" fill="#f1f5f9" stroke="#64748b" strokeOpacity="0.5" />

      {/* Shield */}
      <g filter={`url(#${id}Shadow)`}>
        <path d="M140 70 L164 79 V96 C164 111 153 119 140 124 C127 119 116 111 116 96 V79 Z" fill={`url(#${id}Shield)`} />
      </g>
      <path d="M140 74 L160 81.5 V96 C160 108 151 115 140 119.5 Z" fill="#ffffff" fillOpacity="0.16" />
      <path d="M130 97 L137.5 104 L151 89" stroke="#ffffff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Toggle switch */}
      <g filter={`url(#${id}SoftShadow)`}>
        <rect x="24" y="106" width="42" height="20" rx="10" fill="#ecfccb" stroke="#bef264" />
        <circle cx="56" cy="116" r="8" fill="#ffffff" />
        <circle cx="56" cy="116" r="8" fill="none" stroke="#e2e8f0" />
      </g>
      <Sparkle x={34} y={26} s={0.7} fill="#818cf8" />
    </>
  );
};

const ImportArt = () => {
  const id = 'fiImp';
  return (
    <>
      <defs>
        <Lighting id={id} />
        <linearGradient id={`${id}Head`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id={`${id}Arrow`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <radialGradient id={`${id}Bubble`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </radialGradient>
        <radialGradient id={`${id}Halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="70" r="64" fill={`url(#${id}Halo)`} />
      <ellipse cx="96" cy="126" rx="76" ry="7" fill={`url(#${id}Floor)`} />

      {/* Spreadsheet */}
      <g filter={`url(#${id}Shadow)`}>
        <rect x="32" y="32" width="94" height="84" rx="7" fill={`url(#${id}Paper)`} />
      </g>
      <path d="M39 32 H119 a7 7 0 0 1 7 7 V50 H32 V39 a7 7 0 0 1 7 -7 Z" fill={`url(#${id}Head)`} />
      <rect x="40" y="38" width="20" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.85" />
      {[64, 78, 92, 106].map((y) => (
        <line key={y} x1="32" y1={y} x2="126" y2={y} stroke="#e2e8f0" strokeWidth="1.2" />
      ))}
      <line x1="62" y1="50" x2="62" y2="116" stroke="#e2e8f0" strokeWidth="1.2" />
      <line x1="94" y1="50" x2="94" y2="116" stroke="#e2e8f0" strokeWidth="1.2" />
      <rect x="68" y="55" width="20" height="5" rx="2.5" fill="#bbf7d0" />
      <rect x="100" y="69" width="18" height="5" rx="2.5" fill="#bbf7d0" />
      <rect x="38" y="83" width="18" height="5" rx="2.5" fill="#bbf7d0" />
      <rect x="68" y="97" width="20" height="5" rx="2.5" fill="#fecaca" />
      <rect x="32" y="32" width="94" height="84" fill={`url(#${id}Sheen)`} opacity="0.3" />

      {/* Upload bubble */}
      <g filter={`url(#${id}Shadow)`}>
        <circle cx="152" cy="56" r="26" fill={`url(#${id}Bubble)`} />
      </g>
      <circle cx="152" cy="56" r="26" fill="none" stroke="#bae6fd" strokeWidth="1.5" />
      <path d="M152 69 V45 M143 53 L152 44 L161 53" stroke={`url(#${id}Arrow)`} strokeWidth="4.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="143" cy="41" rx="8" ry="3.5" fill="#ffffff" fillOpacity="0.8" transform="rotate(-30 143 41)" />
      <Coin id={id} cx={166} cy={106} r={10} />
      <Sparkle x={26} y={22} s={0.6} fill="#38bdf8" />
    </>
  );
};

const ART = {
  expense: ExpenseArt,
  invoice: InvoiceArt,
  letterhead: LetterheadArt,
  settings: SettingsArt,
  import: ImportArt,
};

const FormIllustration = ({ variant = 'expense', className = '' }) => {
  const Art = ART[variant] || ExpenseArt;
  return (
    <svg
      className={className}
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <Art />
    </svg>
  );
};

export default FormIllustration;
