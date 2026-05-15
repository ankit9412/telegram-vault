import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Cloud, Smartphone, Key, Lock, CheckCircle } from 'lucide-react';

const AdminSetup = () => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await api.get('/telegram/status');
      if (res.data.connected) {
        setIsConnected(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/telegram/send-otp', { phoneNumber });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/telegram/verify-otp', { phoneCode: otp });
      if (res.data.requires2FA) {
        setStep(3);
      } else {
        setIsConnected(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    }
    setLoading(false);
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/telegram/verify-2fa', { password });
      setIsConnected(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify 2FA');
    }
    setLoading(false);
  };

  if (isConnected) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <div className="hero-icon-wrap" style={{ color: 'var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
             <CheckCircle size={48} />
          </div>
          <h2 className="card-title">System Ready</h2>
          <p className="text-muted mb-6">The Global Master Telegram account is connected. Users can now upload files!</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '28rem' }}>
        <div className="flex justify-center mb-6">
          <div className="hero-icon-wrap" style={{ padding: '1.25rem', marginBottom: 0 }}>
            <Cloud size={48} />
          </div>
        </div>
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Master Account Setup</h2>
        <p className="text-center text-muted mb-6">Link the master Telegram account to act as cloud storage for all users.</p>
        
        {error && <div className="alert-error">{error}</div>}
        
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group mb-6">
              <label className="form-label">
                <Smartphone size={16} /> Phone Number
              </label>
              <input 
                type="text" 
                placeholder="+1234567890"
                required
                className="form-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted mt-2">Include country code, e.g. +1 for US</p>
            </div>
            <button disabled={loading} type="submit" className="btn btn-primary w-full">
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group mb-6">
              <label className="form-label">
                <Key size={16} /> Telegram OTP
              </label>
              <input 
                type="text" 
                placeholder="12345"
                required
                className="form-input form-input-large"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <p className="text-xs text-muted mt-2 text-center">Check your Telegram app for the code</p>
            </div>
            <button disabled={loading} type="submit" className="btn btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleVerify2FA}>
            <div className="form-group mb-6">
              <label className="form-label">
                <Lock size={16} /> 2FA Password
              </label>
              <input 
                type="password" 
                required
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted mt-2 text-center">Your Telegram two-step verification password</p>
            </div>
            <button disabled={loading} type="submit" className="btn btn-primary w-full">
              {loading ? 'Verifying...' : 'Connect'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;
