import { useState } from 'react';
import { API_BASE_URL } from '../config';

/**
 * A reusable password-protected delete confirmation modal.
 *
 * Props:
 *   isOpen       – boolean
 *   onClose      – () => void
 *   onConfirm    – () => void  (called only after password verified)
 *   title        – string  (e.g. "Delete Employee")
 *   message      – string  (confirmation message shown to user)
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Confirm Delete', message = 'This action cannot be undone.' }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const storedUser = localStorage.getItem('user');
      const username = storedUser ? JSON.parse(storedUser).username : null;

      if (!username) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/account/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setPassword('');
        setError('');
        onConfirm();
      } else {
        setError('Incorrect password. Deletion rejected.');
      }
    } catch {
      setError('Failed to verify password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3 style={{ color: 'var(--destructive)' }}>🗑️ {title}</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleConfirm}>
          {/* Warning message */}
          <div style={{ padding: '1rem 1.5rem 0' }}>
            <div
              style={{
                background: 'oklch(0.97 0.03 25)',
                border: '1px solid oklch(0.88 0.08 25)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                color: 'oklch(0.45 0.15 25)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              ⚠️ {message}
            </div>

            <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--ink-2)', fontWeight: 500 }}>
              Enter your password to confirm deletion:
            </p>

            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Your account password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoFocus
                disabled={loading}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                  fontSize: '0.8rem',
                  padding: '0.25rem',
                }}
                tabIndex={-1}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            {error && (
              <p style={{
                color: 'var(--destructive)',
                fontSize: '0.8rem',
                margin: '0.5rem 0 0',
                fontWeight: 500,
              }}>
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger"
              disabled={loading || !password.trim()}
            >
              {loading ? 'Verifying...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
