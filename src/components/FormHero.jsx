import React from 'react';
import { X } from 'lucide-react';
import FormIllustration from './FormIllustration';
import './FormHero.css';

// Illustrated banner shown at the top of add/edit forms and settings-style pages.
// variant: expense | invoice | letterhead | settings | import
const FormHero = ({
  variant = 'expense',
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  onClose,
  closeDisabled = false,
  actions,
  compact = false,
  children,
}) => (
  <div className={`form-hero form-hero-${variant} ${compact ? 'compact' : ''}`}>
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

    <FormIllustration variant={variant} className="form-hero-art" />

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

export default FormHero;
