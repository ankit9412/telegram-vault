import { Link } from 'react-router-dom';
import { Shield, Lock, Cloud, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="page-container">
      <div className="hero">
        <div className="hero-icon-wrap">
          <Shield size={64} />
        </div>
        <h1 className="hero-title">
          Secure Telegram Cloud Vault
        </h1>
        <p className="hero-subtitle">
          Store your files and notes with military-grade AES-256-GCM encryption. 
          Everything is securely saved on your own private Telegram cloud.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-large">
            Get Started
            <Zap size={20} />
          </Link>
          <Link to="/login" className="btn btn-outline btn-large">
            Log In
          </Link>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <Lock size={40} className="feature-icon" />
            <h3 className="feature-title">End-to-End Encrypted</h3>
            <p className="text-muted">All data is encrypted client-side or securely in-memory before it ever touches Telegram servers.</p>
          </div>
          <div className="feature-card">
            <Cloud size={40} className="feature-icon" />
            <h3 className="feature-title">Unlimited Storage</h3>
            <p className="text-muted">Leverage Telegram's generous cloud storage limitations for your personal encrypted vault.</p>
          </div>
          <div className="feature-card">
            <Shield size={40} className="feature-icon" />
            <h3 className="feature-title">Private & Secure</h3>
            <p className="text-muted">No third parties can view your files. Your keys, your data. Total privacy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
