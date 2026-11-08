import React from 'react';

// Flat pastel illustrations used in form banners. Each one is a 200x140 scene.
// Gradient ids are prefixed per variant so several can sit on one page.

const ExpenseArt = () => (
  <>
    <defs>
      <linearGradient id="fiExpCard" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDBA74" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="fiExpCoin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
    <circle cx="104" cy="72" r="58" fill="#FEF3C7" />
    {/* Card behind the receipt */}
    <g transform="rotate(-14 52 86)">
      <rect x="18" y="62" width="70" height="44" rx="8" fill="url(#fiExpCard)" />
      <rect x="18" y="72" width="70" height="8" fill="#92400E" fillOpacity="0.35" />
      <rect x="26" y="88" width="16" height="10" rx="2" fill="#FEF3C7" />
    </g>
    {/* Receipt with zigzag edge */}
    <path
      d="M74 16 H134 V118 L128 112 L122 118 L116 112 L110 118 L104 112 L98 118 L92 112 L86 118 L80 112 L74 118 Z"
      fill="#FFFFFF"
      stroke="#FCD34D"
      strokeWidth="1.5"
    />
    <rect x="84" y="28" width="28" height="5" rx="2.5" fill="#F59E0B" />
    <rect x="84" y="42" width="40" height="3.5" rx="1.75" fill="#E2E8F0" />
    <rect x="84" y="51" width="32" height="3.5" rx="1.75" fill="#E2E8F0" />
    <rect x="84" y="60" width="36" height="3.5" rx="1.75" fill="#E2E8F0" />
    <line x1="84" y1="74" x2="124" y2="74" stroke="#CBD5E1" strokeDasharray="3 3" />
    <text x="84" y="94" fontSize="15" fontWeight="800" fill="#B45309" fontFamily="'Plus Jakarta Sans', sans-serif">¥</text>
    <rect x="98" y="84" width="26" height="8" rx="4" fill="#FDE68A" />
    {/* Coin stack */}
    <g>
      <ellipse cx="160" cy="114" rx="18" ry="6" fill="#F59E0B" />
      <rect x="142" y="104" width="36" height="10" fill="#FBBF24" />
      <ellipse cx="160" cy="104" rx="18" ry="6" fill="url(#fiExpCoin)" />
      <rect x="142" y="94" width="36" height="10" fill="#FBBF24" />
      <ellipse cx="160" cy="94" rx="18" ry="6" fill="url(#fiExpCoin)" />
      <ellipse cx="160" cy="94" rx="10" ry="3" fill="none" stroke="#D97706" strokeOpacity="0.5" />
    </g>
    <path d="M170 30 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" fill="#FDBA74" />
    <circle cx="40" cy="30" r="4" fill="#FDE68A" />
  </>
);

const InvoiceArt = () => (
  <>
    <defs>
      <linearGradient id="fiInvHead" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="72" r="58" fill="#EDE9FE" />
    {/* Back sheet */}
    <rect x="70" y="20" width="76" height="98" rx="8" fill="#DDD6FE" transform="rotate(8 108 69)" />
    {/* Invoice sheet */}
    <rect x="56" y="16" width="76" height="104" rx="8" fill="#FFFFFF" stroke="#C4B5FD" strokeWidth="1.5" />
    <rect x="56" y="16" width="76" height="20" rx="8" fill="url(#fiInvHead)" />
    <rect x="56" y="28" width="76" height="8" fill="url(#fiInvHead)" />
    <rect x="64" y="23" width="26" height="5" rx="2.5" fill="#FFFFFF" fillOpacity="0.85" />
    {[46, 58, 70].map((y) => (
      <g key={y}>
        <rect x="64" y={y} width="34" height="4" rx="2" fill="#E2E8F0" />
        <rect x="108" y={y} width="16" height="4" rx="2" fill="#C4B5FD" />
      </g>
    ))}
    <line x1="64" y1="84" x2="124" y2="84" stroke="#E2E8F0" />
    <rect x="96" y="92" width="28" height="10" rx="5" fill="#8B5CF6" />
    {/* Hanko seal */}
    <g transform="translate(150 96)">
      <circle r="17" fill="#FFFFFF" stroke="#E11D48" strokeWidth="2.5" />
      <circle r="12.5" fill="none" stroke="#E11D48" strokeWidth="1" strokeOpacity="0.6" />
      <text y="5.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#E11D48" fontFamily="'Noto Sans JP', 'Hiragino Sans', sans-serif">済</text>
    </g>
    {/* Check badge */}
    <g transform="translate(40 44)">
      <circle r="13" fill="#A3E635" />
      <path d="M-5.5 0.5 L-1.5 4.5 L6 -4" stroke="#1A2E05" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <path d="M168 34 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" fill="#C4B5FD" />
  </>
);

const LetterheadArt = () => (
  <>
    <defs>
      <linearGradient id="fiLhBand" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#84CC16" />
      </linearGradient>
      <linearGradient id="fiLhPen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="72" r="58" fill="#D1FAE5" />
    {/* Envelope */}
    <g transform="rotate(-10 52 96)">
      <rect x="18" y="76" width="64" height="40" rx="5" fill="#FFFFFF" stroke="#A7F3D0" strokeWidth="1.5" />
      <path d="M18 80 L50 100 L82 80" stroke="#6EE7B7" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
    </g>
    {/* Letter sheet */}
    <rect x="66" y="12" width="74" height="104" rx="7" fill="#FFFFFF" stroke="#A7F3D0" strokeWidth="1.5" />
    <rect x="66" y="12" width="74" height="7" rx="3.5" fill="url(#fiLhBand)" />
    <circle cx="80" cy="32" r="7" fill="#ECFCCB" stroke="#65A30D" strokeWidth="1.5" />
    <rect x="92" y="27" width="34" height="4" rx="2" fill="#0F172A" fillOpacity="0.75" />
    <rect x="92" y="34" width="24" height="3" rx="1.5" fill="#94A3B8" />
    {[52, 61, 70, 79].map((y, i) => (
      <rect key={y} x="76" y={y} width={i === 3 ? 30 : 54} height="3.5" rx="1.75" fill="#E2E8F0" />
    ))}
    <path d="M80 100 C 86 92, 92 106, 98 98 S 108 96, 112 100" stroke="#059669" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    {/* Fountain pen */}
    <g transform="rotate(38 158 70)">
      <rect x="152" y="24" width="12" height="62" rx="6" fill="url(#fiLhPen)" />
      <rect x="152" y="40" width="12" height="4" fill="#A3E635" />
      <path d="M152 86 L158 104 L164 86 Z" fill="#FCD34D" />
      <line x1="158" y1="90" x2="158" y2="100" stroke="#92400E" strokeWidth="1" />
    </g>
    <path d="M40 30 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" fill="#6EE7B7" />
  </>
);

const SettingsArt = () => (
  <>
    <defs>
      <linearGradient id="fiSetGear" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="fiSetShield" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A3E635" />
        <stop offset="100%" stopColor="#22C55E" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="72" r="58" fill="#E0E7FF" />
    {/* Big gear */}
    <g transform="translate(86 64)">
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="-6" y="-42" width="12" height="16" rx="3" fill="url(#fiSetGear)" transform={`rotate(${i * 45})`} />
      ))}
      <circle r="31" fill="url(#fiSetGear)" />
      <circle r="13" fill="#E0E7FF" />
    </g>
    {/* Small gear */}
    <g transform="translate(142 34)">
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x="-4" y="-21" width="8" height="10" rx="2" fill="#C7D2FE" transform={`rotate(${i * 60})`} />
      ))}
      <circle r="15" fill="#C7D2FE" />
      <circle r="6" fill="#EEF2FF" />
    </g>
    {/* Shield */}
    <path d="M140 72 L162 80 V96 C162 110 152 118 140 122 C128 118 118 110 118 96 V80 Z" fill="url(#fiSetShield)" stroke="#FFFFFF" strokeWidth="2.5" />
    <path d="M131 97 L138 104 L150 90" stroke="#FFFFFF" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {/* Toggle pill */}
    <rect x="26" y="108" width="40" height="20" rx="10" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="1.5" />
    <circle cx="56" cy="118" r="7" fill="#84CC16" />
    <path d="M36 24 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" fill="#A5B4FC" />
  </>
);

const ImportArt = () => (
  <>
    <defs>
      <linearGradient id="fiImpArrow" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#22C55E" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="72" r="58" fill="#DCFCE7" />
    {/* Spreadsheet */}
    <rect x="34" y="34" width="92" height="80" rx="8" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="1.5" />
    <rect x="34" y="34" width="92" height="16" rx="8" fill="#16A34A" />
    <rect x="34" y="42" width="92" height="8" fill="#16A34A" />
    {[62, 76, 90, 104].map((y) => (
      <line key={y} x1="34" y1={y} x2="126" y2={y} stroke="#DCFCE7" strokeWidth="1.5" />
    ))}
    <line x1="64" y1="50" x2="64" y2="114" stroke="#DCFCE7" strokeWidth="1.5" />
    <line x1="96" y1="50" x2="96" y2="114" stroke="#DCFCE7" strokeWidth="1.5" />
    <rect x="70" y="66" width="20" height="6" rx="3" fill="#BBF7D0" />
    <rect x="102" y="80" width="18" height="6" rx="3" fill="#BBF7D0" />
    <rect x="40" y="94" width="18" height="6" rx="3" fill="#BBF7D0" />
    {/* Upload bubble */}
    <g transform="translate(150 56)">
      <circle r="26" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="2" />
      <path d="M0 13 V-10 M-9 -2 L0 -11 L9 -2" stroke="url(#fiImpArrow)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <path d="M160 102 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 Z" fill="#86EFAC" />
    <circle cx="30" cy="24" r="4" fill="#7DD3FC" />
  </>
);

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
