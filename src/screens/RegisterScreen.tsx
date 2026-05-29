import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Eye, EyeOff, Globe } from 'lucide-react';
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

export const RegisterScreen: React.FC = () => {
  const navigate = useNavigate();
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

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('doctor_language', lang);
    setIsLangOpen(false);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setIsCountryOpen(false);
  };

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

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Field validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');

  const validate = () => {
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    setError('');

    // Name check
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('validation.name_required');
      return false;
    }
    if (trimmedName.length < 3) {
      setNameError('validation.name_min_length');
      return false;
    }
    if (trimmedName.length > 50) {
      setNameError('validation.name_max_length');
      return false;
    }

    // Email check
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('validation.email_required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('validation.email_invalid');
      return false;
    }

    // Phone check
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setPhoneError('validation.phone_required');
      return false;
    }
    if (!/^\d{7,15}$/.test(trimmedPhone)) {
      setPhoneError('validation.phone_invalid');
      return false;
    }

    // Password check
    if (!password) {
      setPasswordError('validation.password_required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('validation.password_length');
      return false;
    }

    // Confirm password check
    if (!confirmPassword) {
      setConfirmPasswordError('validation.confirm_password_required');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('validation.passwords_dont_match');
      return false;
    }

    // Agree terms
    if (!agreeTerms) {
      setTermsError('validation.terms_required');
      return false;
    }

    return true;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError('');

    const fullPhone = `${countryCode}${phone.trim()}`;

    try {
      // Step 1: Request OTP
      const response = await api.post('/auth/send-otp', {
        phone: fullPhone,
        email: email.trim().toLowerCase(),
        name: name.trim(),
      });

      const data = response.data;
      showToast('Verification code sent successfully!', 'success');
      
      // Step 2: Navigate to OTP Verification Screen passing data
      navigate('/verify-otp', {
        state: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          password: password,
          devCode: data.devCode,
          otpOnScreen: data.otpOnScreen,
          isForgotPassword: false
        }
      });
    } catch (err: any) {
      console.error('Registration OTP dispatch failed:', err);
      const msg = err.message || t('common.something_went_wrong');
      
      // Map API errors to field errors if matches
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      } else if (msg.toLowerCase().includes('phone')) {
        setPhoneError(msg);
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <FullScreenLoader visible={isLoading} />
      <div className="login-bg-orb-1"></div>
      <div className="login-bg-orb-2"></div>
      
      <div className="login-card" style={{ maxWidth: '480px', padding: '32px 28px' }}>
        {/* Header Controls */}
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

        <div className="login-header" style={{ marginBottom: '24px' }}>
          <div className="login-badge">{t('doctor.doctor_portal')}</div>
          <h1 className="login-logo">
            Doc<span>Point</span>
          </h1>
          <p className="login-subtitle">{t('register.subtitle')}</p>
        </div>

        {error && (
          <div className="response-message error">
            {error}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">{t('register.name_label')}</label>
            <input
              type="text"
              className={`form-control ${nameError ? 'error' : ''}`}
              placeholder={t('register.name_placeholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              disabled={isLoading}
              autoComplete="off"
            />
            {nameError && <span className="error-text">{t(nameError)}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">{t('register.email_label')}</label>
            <input
              type="text"
              className={`form-control ${emailError ? 'error' : ''}`}
              placeholder={t('register.email_placeholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              disabled={isLoading}
              autoComplete="off"
            />
            {emailError && <span className="error-text">{t(emailError)}</span>}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">{t('register.phone_label')}</label>
            <div className="phone-input-row">
              <div className="custom-country-dropdown" ref={countryDropdownRef}>
                <button 
                  type="button" 
                  className="country-dropdown-btn"
                  onClick={() => !isLoading && setIsCountryOpen(!isCountryOpen)}
                  disabled={isLoading}
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
                placeholder={t('register.phone_placeholder')}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ''));
                  if (phoneError) setPhoneError('');
                }}
                disabled={isLoading}
                style={{ flex: 1 }}
                autoComplete="off"
              />
            </div>
            {phoneError && <span className="error-text">{t(phoneError)}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">{t('register.password_label')}</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${passwordError ? 'error' : ''}`}
                placeholder={t('register.password_placeholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && <span className="error-text">{t(passwordError)}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">{t('register.confirm_password_label')}</label>
            <input
              type="password"
              className={`form-control ${confirmPasswordError ? 'error' : ''}`}
              placeholder={t('register.confirm_password_placeholder')}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {confirmPasswordError && <span className="error-text">{t(confirmPasswordError)}</span>}
          </div>

          {/* Terms checkbox */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="remember-me" style={{ alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (termsError) setTermsError('');
                }}
                disabled={isLoading}
                style={{ marginTop: '3px' }}
              />
              <span style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{t('register.terms_agree')}</span>
            </label>
            {termsError && <span className="error-text">{t(termsError)}</span>}
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? <div className="spinner"></div> : t('register.sign_up')}
          </button>
        </form>

        {/* Back to sign in redirect */}
        <div className="login-footer-link">
          {t('register.already_have_account')}
          <span onClick={() => navigate('/login')}>{t('register.sign_in')}</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
