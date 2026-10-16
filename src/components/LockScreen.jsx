import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api';

// Full-screen blank cover shown after Ctrl+Q. Nothing from the app is visible until the PIN is entered.
const LockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [error]);

  const verify = async (value) => {
    setChecking(true);
    try {
      const response = await apiRequest('/account/lock-pin/', {
        method: 'POST',
        body: JSON.stringify({ pin: value }),
      });
      if (response.ok) {
        onUnlock();
        return;
      }
      setError('Incorrect PIN');
    } catch {
      setError('Could not verify PIN. Check your connection.');
    }
    setPin('');
    setChecking(false);
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    setError('');
    if (value.length === 6) verify(value);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100000, background: '#0b0b0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <form onSubmit={(e) => e.preventDefault()} style={{ textAlign: 'center' }}>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={6}
          value={pin}
          disabled={checking}
          onChange={handleChange}
          onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
          aria-label="Enter 6 digit PIN"
          placeholder="••••••"
          style={{
            width: '11rem', padding: '0.75rem 1rem', fontSize: '1.5rem', letterSpacing: '0.5rem',
            textAlign: 'center', color: '#e5e7eb', background: '#16161d',
            border: `1px solid ${error ? '#ef4444' : '#2a2a35'}`, borderRadius: '10px', outline: 'none',
          }}
        />
        <div style={{ height: '1.25rem', marginTop: '0.75rem', color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>
      </form>
    </div>
  );
};

export default LockScreen;
