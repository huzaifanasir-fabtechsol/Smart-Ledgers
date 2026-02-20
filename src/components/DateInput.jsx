import { useEffect, useState } from 'react';

const DATE_VALUE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const formatPartialDate = (rawValue) => {
  const digits = String(rawValue || '')
    .replace(/\D/g, '')
    .slice(0, 8);

  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const DateInput = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const emitChange = (nextValue) => {
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    });
  };

  return (
    <input
      {...props}
      type="text"
      value={displayValue}
      placeholder="yyyy-mm-dd"
      inputMode="numeric"
      maxLength={10}
      onChange={(event) => {
        const nextValue = formatPartialDate(event.target.value);
        setDisplayValue(nextValue);
        if (!nextValue || DATE_VALUE_REGEX.test(nextValue)) {
          emitChange(nextValue);
        }
      }}
      onBlur={(event) => {
        const normalized = formatPartialDate(displayValue);
        const finalValue = DATE_VALUE_REGEX.test(normalized) ? normalized : '';
        setDisplayValue(finalValue);
        emitChange(finalValue);
        props.onBlur?.(event);
      }}
    />
  );
};

export default DateInput;
