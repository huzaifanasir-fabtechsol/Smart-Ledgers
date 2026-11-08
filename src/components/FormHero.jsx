import React from 'react';
import { X } from 'lucide-react';
import FormIllustration from './FormIllustration';
import './FormHero.css';

// Each drawn illustration has a matching colour tone.
const VARIANT_TONE = {
  expense: 'amber',
  invoice: 'violet',
  letterhead: 'emerald',
  settings: 'indigo',
  import: 'green',
};

// Stacked-card illustration built around a lucide icon, for forms without a drawn scene.
const IconArt = ({ icon }) => {
  const ArtIcon = icon;
  return (
    <div className="form-hero-badge" aria-hidden="true">
      <span className="fhb-glow" />
      <span className="fhb-ring" />
      <span className="fhb-card fhb-card-back" />
      <span className="fhb-card fhb-card-mid" />
      <span className="fhb-card fhb-card-front">
        <ArtIcon size={34} strokeWidth={2} />
        <span className="fhb-lines">
          <span />
          <span />
        </span>
      </span>
      <span className="fhb-coin">¥</span>
      <svg className="fhb-spark" viewBox="0 0 20 20">
        <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" />
      </svg>
      <span className="fhb-dot" />
    </div>
  );
};

// Illustrated banner shown at the top of add/edit forms and settings-style pages.
//   variant: a drawn scene (expense | invoice | letterhead | settings | import)
//   artIcon: a lucide icon to illustrate instead of a drawn scene
//   tone:    amber | violet | emerald | indigo | green | sky | rose | teal | slate
const FormHero = ({
  variant,
  artIcon,
  tone,
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  onClose,
  closeDisabled = false,
  actions,
  compact = false,
  children,
}) => {
  const resolvedTone = tone || VARIANT_TONE[variant] || 'slate';
  return (
    <div className={`form-hero tone-${resolvedTone} ${compact ? 'compact' : ''}`}>
      <div className="form-hero-text">
        {(eyebrow || Icon) && (
          <span className="form-hero-eyebrow">
            {Icon && <Icon size={13} strokeWidth={2.5} />}
            {eyebrow}
          </span>
        )}
        <h3 className="form-hero-title">{title}</h3>
        {subtitle && <p className="form-hero-sub">{subtitle}</p>}
        {children}
        {actions && <div className="form-hero-actions">{actions}</div>}
      </div>

      {artIcon
        ? <IconArt icon={artIcon} />
        : <FormIllustration variant={variant || 'expense'} className="form-hero-art" />}

      {onClose && (
        <button
          type="button"
          className="form-hero-close"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Close"
          title="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default FormHero;
