import { useState } from 'react';

const DATE_VALUE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const DateInput = ({ value, onChange, ...props }) => {
  const [focused, setFocused] = useState(false);

  const inputType = focused ? 'date' : 'text';
  const displayValue = value || '';

  return (
    <input
      {...props}
      type={inputType}
      value={displayValue}
      placeholder="yyyy-mm-dd"
      inputMode="numeric"
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      onChange={(event) => {
        const nextValue = event.target.value;
        if (!nextValue || DATE_VALUE_REGEX.test(nextValue)) {
          onChange?.(event);
        }
      }}
    />
  );
};

export default DateInput;
