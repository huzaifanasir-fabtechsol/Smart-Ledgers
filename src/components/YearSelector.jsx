import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import './YearSelector.css';

const YearSelector = ({
  value = '',
  onChange,
  placeholder = 'All Years',
  className = '',
  style = {},
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value ? String(value) : '');

  const currentYear = new Date().getFullYear();
  const getInitialDecade = (val) => {
    const parsed = parseInt(val, 10);
    const yr = !isNaN(parsed) && parsed > 0 ? parsed : currentYear;
    return Math.floor(yr / 10) * 10;
  };

  const [decadeStart, setDecadeStart] = useState(() => getInitialDecade(value));
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize when the value prop changes externally (e.g. clear filters)
  useEffect(() => {
    const strVal = value ? String(value) : '';
    setDisplayValue(strVal);
    if (strVal && /^\d{4}$/.test(strVal)) {
      setDecadeStart(Math.floor(parseInt(strVal, 10) / 10) * 10);
    }
  }, [value]);

  // Handle click outside to close dropdown and validate partial entry
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If user typed an incomplete year (not 4 digits), revert to current value prop
        if (displayValue && !/^\d{4}$/.test(displayValue)) {
          setDisplayValue(value ? String(value) : '');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [displayValue, value]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    // Allow digits only, capped at 4 characters
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setDisplayValue(digits);

    if (digits.length === 4) {
      onChange?.(digits);
      const parsed = parseInt(digits, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setDecadeStart(Math.floor(parsed / 10) * 10);
      }
    } else if (digits === '') {
      onChange?.('');
    }
  };

  const handleInputBlur = () => {
    // If user leaves the field with incomplete digits (1, 2, or 3 digits), revert
    if (displayValue && !/^\d{4}$/.test(displayValue)) {
      setDisplayValue(value ? String(value) : '');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (/^\d{4}$/.test(displayValue)) {
        onChange?.(displayValue);
        setIsOpen(false);
      } else if (displayValue === '') {
        onChange?.('');
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectYear = (yr) => {
    const str = String(yr);
    setDisplayValue(str);
    onChange?.(str);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setDisplayValue('');
    onChange?.('');
  };

  const handlePrevDecade = (e) => {
    e.stopPropagation();
    setDecadeStart((prev) => prev - 10);
  };

  const handleNextDecade = (e) => {
    e.stopPropagation();
    setDecadeStart((prev) => prev + 10);
  };

  // Generate 12 years (decade + 2 years) for a symmetrical 3x4 grid
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  return (
    <div className={`year-selector ${className}`} ref={containerRef} style={style}>
      <div
        className="year-selector-box"
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        <span
          className="year-selector-icon"
          title="Toggle Year Picker"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
        >
          <Calendar size={15} />
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          className="year-selector-input"
          value={displayValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
        {displayValue ? (
          <button
            type="button"
            className="year-selector-clear"
            onClick={handleClear}
            title="Clear year"
          >
            <X size={14} />
          </button>
        ) : null}
        <button
          type="button"
          className="year-selector-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          title="Select Year"
        >
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {isOpen && (
        <div className="year-selector-popup">
          <div className="year-popup-header">
            <button
              type="button"
              className="year-popup-nav"
              onClick={handlePrevDecade}
              title="Previous decade"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="year-popup-decade">
              {decadeStart} - {decadeStart + 11}
            </span>
            <button
              type="button"
              className="year-popup-nav"
              onClick={handleNextDecade}
              title="Next decade"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="year-popup-grid">
            {years.map((yr) => {
              const isSelected = String(yr) === String(displayValue);
              return (
                <button
                  type="button"
                  key={yr}
                  className={`year-popup-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectYear(yr)}
                >
                  {yr}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="year-popup-all"
            onClick={() => {
              setDisplayValue('');
              onChange?.('');
              setIsOpen(false);
            }}
          >
            {placeholder}
          </button>
        </div>
      )}
    </div>
  );
};

export default YearSelector;
