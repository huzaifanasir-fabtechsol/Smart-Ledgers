import { useState } from 'react';
import { Wallet, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/account/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Left Side: Form */}
        <div className="login-form-side">
          <div className="login-brand">
            <div className="login-logo">
              <Wallet size={20} />
            </div>
            <span className="login-brand-text">Smart Ledger</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <div className="login-header">
              <h1>Welcome back</h1>
              <p>Sign in to manage dealership accounts, expenses, and auctions.</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="login-input-group">
                <label>Username</label>
                <div className="login-input-wrapper">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Password</label>
                <div className="login-input-wrapper">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="login-password-toggle"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <p className="login-footer-text">
            Admin access only · Smart Ledger
          </p>
        </div>

        {/* Right Side: Hero panel */}
        <div className="login-hero-side">
          <div className="login-blob-1"></div>
          <div className="login-blob-2"></div>

          <div className="login-hero-content">
            <p className="login-hero-welcome">Nice to see you again</p>
            <h2 className="login-hero-title">Welcome back</h2>

            {/* Illustration: Dashboard mockup */}
            <div className="login-hero-card">
              <div className="login-hero-card-header">
                <div>
                  <div className="login-hero-card-label">Net Profit</div>
                  <div className="login-hero-card-amount">¥1,350,000</div>
                </div>
                <span className="login-hero-card-badge">+12.4%</span>
              </div>

              {/* Chart SVG */}
              <svg viewBox="0 0 200 60" className="login-hero-card-chart">
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#C7B8FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#C7B8FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,45 C30,35 50,50 80,30 C110,10 140,40 170,20 L200,15 L200,60 L0,60 Z" fill="url(#g1)" />
                <path d="M0,45 C30,35 50,50 80,30 C110,10 140,40 170,20 L200,15" stroke="#6B5BD6" strokeWidth="2" fill="none" />
              </svg>

              <div className="login-hero-card-grid">
                <div className="login-hero-card-grid-item">
                  <div className="login-hero-card-grid-label">Sales</div>
                  <div className="login-hero-card-grid-val">48%</div>
                </div>
                <div className="login-hero-card-grid-item">
                  <div className="login-hero-card-grid-label">Auctions</div>
                  <div className="login-hero-card-grid-val">32%</div>
                </div>
                <div className="login-hero-card-grid-item">
                  <div className="login-hero-card-grid-label">Exports</div>
                  <div className="login-hero-card-grid-val">20%</div>
                </div>
              </div>
            </div>

            <p className="login-hero-tagline">
              Manage dealership accounts, expenses & auctions — all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
