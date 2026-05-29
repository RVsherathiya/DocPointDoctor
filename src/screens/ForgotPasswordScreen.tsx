import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, ChevronLeft, Sun, Moon } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../services/ToastContext';
import FullScreenLoader from '../components/FullScreenLoader';
import './LoginScreen.css';

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' }
];

export const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Custom country dropdown state
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('doctor_theme') || 'light';
    return saved as 'light' | 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('doctor_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Click outside to close country dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setIsCountryOpen(false);
  };

  // Form states
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Field validation errors
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validate = () => {
    setEmailError('');
    setPhoneError('');
    setError('');

    if (resetMethod === 'email') {
      if (!email.trim()) {
        setEmailError('validation.email_required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('validation.email_invalid');
        return false;
      }
    } else {
      if (!phone.trim()) {
        setPhoneError('validation.phone_required');
        return false;
      }
      if (!/^\d{7,15}$/.test(phone.trim())) {
        setPhoneError('validation.phone_invalid');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    const payload: any = { type: resetMethod };
    if (resetMethod === 'email') {
      payload.email = email.trim().toLowerCase();
    } else {
      payload.phone = `${countryCode}${phone.trim()}`;
    }

    try {
      const response = await api.post('/auth/forgot-password', payload);
      const data = response.data;

      if (resetMethod === 'email') {
        setIsSubmitted(true);
        setSuccessMsg(t('forgot_password.success_email_desc'));
        showToast(t('forgot_password.success_email_desc'), 'success');
      } else {
        showToast('Verification code sent successfully!', 'success');
        // Phone reset dispatches OTP code.
        // We will redirect to OTP verification screen and pass user info and dev code
        navigate('/verify-otp', {
          state: {
            email: data.email, // backend maps phone to doctor email
            phone: payload.phone,
            devCode: data.devCode,
            otpOnScreen: data.otpOnScreen
          }
        });
      }
    } catch (err: any) {
      console.error('Forgot password request failed:', err);
      showToast(err.message || t('common.something_went_wrong'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <FullScreenLoader visible={isLoading} />
      <div className="login-bg-orb-1"></div>
      <div className="login-bg-orb-2"></div>
      
      <div className="login-card">
        {/* Header Controls */}
        <div className="login-controls">
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="theme-toggle-btn"
            title="Back to login"
            style={{ width: 'auto', padding: '0 8px', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <ChevronLeft size={16} />
            {t('forgot_password.back_to_login')}
          </button>
          
          <button 
            type="button" 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {!isSubmitted ? (
          <>
            <div className="login-header">
              <h1 className="login-logo">
                Doc<span>Point</span>
              </h1>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '8px', color: 'var(--text)' }}>
                {t('forgot_password.title')}
              </h2>
              <p className="login-subtitle" style={{ marginTop: '4px' }}>
                {t('forgot_password.subtitle')}
              </p>
            </div>

            {error && (
              <div className="response-message error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Reset Type Selector */}
              <div className="login-tabs">
                <div
                  className={`login-tab ${resetMethod === 'email' ? 'active' : ''}`}
                  onClick={() => {
                    setResetMethod('email');
                    setError('');
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} />
                    {t('forgot_password.email_tab')}
                  </span>
                </div>
                <div
                  className={`login-tab ${resetMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => {
                    setResetMethod('phone');
                    setError('');
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} />
                    {t('forgot_password.phone_tab')}
                  </span>
                </div>
              </div>

              {/* Email Input */}
              {resetMethod === 'email' ? (
                <div className="form-group">
                  <label className="form-label">{t('forgot_password.email_label')}</label>
                  <input
                    type="text"
                    className={`form-control ${emailError ? 'error' : ''}`}
                    placeholder={t('forgot_password.email_placeholder')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    autoComplete="off"
                  />
                  {emailError && <span className="error-text">{t(emailError)}</span>}
                </div>
              ) : (
                /* Phone Input */
                <div className="form-group">
                  <label className="form-label">{t('forgot_password.phone_label')}</label>
                  <div className="phone-input-row">
                    <div className="custom-country-dropdown" ref={countryDropdownRef}>
                      <button 
                        type="button" 
                        className="country-dropdown-btn"
                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                      >
                        <span>{(COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]).flag} {(COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]).code}</span>
                      </button>
                      {isCountryOpen && (
                        <ul className="country-dropdown-menu">
                          {COUNTRIES.map((c) => (
                            <li 
                              key={c.code}
                              className={`country-dropdown-item ${countryCode === c.code ? 'active' : ''}`}
                              onClick={() => handleCountryChange(c.code)}
                            >
                              <span>{c.flag}</span>
                              <span>{c.code}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="tel"
                      className={`form-control ${phoneError ? 'error' : ''}`}
                      placeholder={t('forgot_password.phone_placeholder')}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        if (phoneError) setPhoneError('');
                      }}
                      style={{ flex: 1 }}
                      autoComplete="off"
                    />
                  </div>
                  {phoneError && <span className="error-text">{t(phoneError)}</span>}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary login-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : resetMethod === 'email' ? (
                  t('forgot_password.send_link')
                ) : (
                  t('forgot_password.send_otp')
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success Screen for Email reset */
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 199, 89, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success-color)',
              margin: '0 auto 20px'
            }}>
              <Mail size={32} />
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              {t('forgot_password.success_email_title')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '28px' }}>
              {successMsg}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/login')}
            >
              {t('forgot_password.back_to_login')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
