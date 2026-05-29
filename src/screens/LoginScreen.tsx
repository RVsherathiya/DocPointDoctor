import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import { useToast } from '../services/ToastContext';
import FullScreenLoader from '../components/FullScreenLoader';
import './LoginScreen.css';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' }
];

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' }
];

export const LoginScreen: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  // Custom language dropdown state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom country dropdown state
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('doctor_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    return saved as 'light' | 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('doctor_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form states
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load saved credentials if remember me was checked previously
  useEffect(() => {
    const savedEmail = localStorage.getItem('doctor_saved_email');
    const savedPhone = localStorage.getItem('doctor_saved_phone');

    if (savedEmail || savedPhone) {
      setRememberMe(true);
      // We leave the inputs empty to prevent automatic pre-filling on load
    }
  }, []);

  const validate = () => {
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setError('');

    if (loginType === 'email') {
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

    if (!password) {
      setPasswordError('validation.password_required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('validation.password_length');
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    const payload: any = { password };
    if (loginType === 'email') {
      payload.email = email.trim().toLowerCase();
    } else {
      payload.phone = `${countryCode}${phone.trim()}`;
    }

    try {
      const response = await api.post('/auth/login', payload);
      const { token, user } = response.data.data;

      if (user.role !== 'doctor') {
        throw new Error(t('doctor.unauthorized_role'));
      }

      if (user.status === 'blocked') {
        throw new Error(t('doctor.blocked_account'));
      }

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('doctor_saved_type', loginType);
        localStorage.setItem('doctor_saved_password', password);
        if (loginType === 'email') {
          localStorage.setItem('doctor_saved_email', email);
          localStorage.removeItem('doctor_saved_phone');
          localStorage.removeItem('doctor_saved_code');
        } else {
          localStorage.setItem('doctor_saved_phone', phone);
          localStorage.setItem('doctor_saved_code', countryCode);
          localStorage.removeItem('doctor_saved_email');
        }
      } else {
        localStorage.removeItem('doctor_saved_type');
        localStorage.removeItem('doctor_saved_email');
        localStorage.removeItem('doctor_saved_phone');
        localStorage.removeItem('doctor_saved_code');
        localStorage.removeItem('doctor_saved_password');
      }

      // Log in and save session
      login(token, user);
      showToast('Logged in successfully!', 'success');

      // Redirect to target screen or default to dashboard
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Doctor Login failed:', err);
      showToast(err.message || t('common.something_went_wrong'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('doctor_language', lang);
    setIsLangOpen(false);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setIsCountryOpen(false);
  };

  return (
    <div className="login-container">
      <FullScreenLoader visible={isLoading} />
      <div className="login-bg-orb-1"></div>
      <div className="login-bg-orb-2"></div>
      
      <div className="login-card">
        {/* Header Controls (Theme, Language) */}
        <div className="login-controls">
          <button 
            type="button" 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <div className="custom-lang-dropdown" ref={dropdownRef}>
            <button 
              type="button" 
              className="lang-dropdown-btn"
              onClick={() => setIsLangOpen(!isLangOpen)}
            >
              <span>{(LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]).flag} {(LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]).name}</span>
              <Globe size={14} className="lang-btn-globe" />
            </button>
            {isLangOpen && (
              <ul className="lang-dropdown-menu">
                {LANGUAGES.map((lang) => (
                  <li 
                    key={lang.code}
                    className={`lang-dropdown-item ${i18n.language === lang.code ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-name">{lang.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="login-header">
          <div className="login-badge">{t('doctor.doctor_portal')}</div>
          <h1 className="login-logo">
            Doc<span>Point</span>
          </h1>
          <p className="login-subtitle">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="response-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Tab Selector */}
          <div className="login-tabs">
            <div
              className={`login-tab ${loginType === 'email' ? 'active' : ''}`}
              onClick={() => {
                setLoginType('email');
                setError('');
              }}
            >
              {t('login.email_tab')}
            </div>
            <div
              className={`login-tab ${loginType === 'phone' ? 'active' : ''}`}
              onClick={() => {
                setLoginType('phone');
                setError('');
              }}
            >
              {t('login.phone_tab')}
            </div>
          </div>

          {/* Email Inputs */}
          {loginType === 'email' ? (
            <div className="form-group">
              <label className="form-label">{t('login.email_label')}</label>
              <input
                type="text"
                className={`form-control ${emailError ? 'error' : ''}`}
                placeholder={t('login.email_placeholder')}
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
            /* Phone Inputs */
            <div className="form-group">
              <label className="form-label">{t('login.phone_label')}</label>
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
                  placeholder={t('login.phone_placeholder')}
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

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">{t('login.password_label')}</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${passwordError ? 'error' : ''}`}
                placeholder={t('login.password_placeholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <span className="error-text">{t(passwordError)}</span>}
          </div>

          {/* Remember Me & Forgot Password Options */}
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRememberMe(checked);
                  if (!checked) {
                    setEmail('');
                    setPhone('');
                    setPassword('');
                    localStorage.removeItem('doctor_saved_type');
                    localStorage.removeItem('doctor_saved_email');
                    localStorage.removeItem('doctor_saved_phone');
                    localStorage.removeItem('doctor_saved_code');
                    localStorage.removeItem('doctor_saved_password');
                  }
                }}
              />
              {t('login.remember_me')}
            </label>
            <span 
              className="forgot-password-link" 
              onClick={() => navigate('/forgot-password')}
            >
              {t('login.forgot_password')}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner"></div> : t('login.sign_in')}
          </button>
        </form>

        {/* Redirect to Register Screen */}
        <div className="login-footer-link">
          Don't have a doctor account? <span onClick={() => navigate('/register')}>Sign Up</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
