import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound, Lock, Eye, EyeOff, Sun, Moon, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../services/ToastContext';
import FullScreenLoader from '../components/FullScreenLoader';
import './LoginScreen.css';

export const OtpVerificationScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  // Extract navigation parameters
  const stateData = location.state as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    devCode?: string;
    otpOnScreen?: boolean;
    isForgotPassword?: boolean;
  } | null;

  // Redirect if no verification parameters are passed
  useEffect(() => {
    if (!stateData || !stateData.email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [stateData, navigate]);

  const email = stateData?.email || '';
  const phone = stateData?.phone || '';
  const name = stateData?.name || '';
  const passwordVal = stateData?.password || '';
  const isForgotPassword = stateData?.isForgotPassword !== false;
  const [devCode, setDevCode] = useState(stateData?.devCode || '');

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

  // OTP form values (6 separate digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // States
  const [stage, setStage] = useState<'otp' | 'reset'>('otp'); // 'otp' for entering code, 'reset' for typing new password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password fields (for stage 'reset')
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Countdown timer for resending OTP
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Handle single digit input change
  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1); // only digits, last character
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setError('');

    // Shifting focus forward
    if (cleanVal !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Keyboard navigation (backspace)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Code paste support
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      setError('');
      inputRefs.current[5]?.focus();
    }
  };

  // Verification step (Stage 1)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      showToast(t('otp.invalid_error'), 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify OTP
      await api.post('/auth/verify-otp', { email, code });
      
      if (isForgotPassword) {
        setStage('reset'); // Show password reset fields
        showToast('OTP verified successfully!', 'success');
      } else {
        // Step 2: Register account
        await api.post('/auth/register', {
          name,
          email,
          phone,
          password: passwordVal,
          role: 'doctor'
        });
        
        showToast(t('otp.register_success'), 'success');
        // Redirect after 3s
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err: any) {
      console.error('OTP Verification / Registration failed:', err);
      showToast(err.message || t('common.something_went_wrong'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP trigger
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      let response;
      if (isForgotPassword) {
        response = await api.post('/auth/forgot-password', {
          type: 'phone',
          phone: phone || email // Backend maps it
        });
      } else {
        response = await api.post('/auth/send-otp', {
          phone,
          email,
          name
        });
      }

      if (response.data?.devCode) {
        setDevCode(response.data.devCode);
      }
      
      showToast(t('otp.resend_success'), 'success');
      setOtpDigits(Array(6).fill(''));
      setTimer(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Resend OTP failed:', err);
      showToast(err.message || t('common.something_went_wrong'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit password reset (Stage 2)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');

    if (!password) {
      setPasswordError('validation.password_required');
      return;
    }
    if (password.length < 6) {
      setPasswordError('validation.password_length');
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('validation.confirm_password_required');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('otp.passwords_dont_match');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password-otp', { email, password });
      showToast(t('otp.password_reset_success'), 'success');
      
      // Auto-redirect to login screen after 2.5s
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err: any) {
      console.error('Password reset failed:', err);
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
        {/* Controls */}
        <div className="login-controls">
          {stage === 'otp' ? (
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="theme-toggle-btn"
              title="Go back"
              style={{ width: 'auto', padding: '0 8px', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div style={{ width: '1px' }}></div>
          )}
          
          <button 
            type="button" 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {stage === 'otp' ? (
          /* Stage 1: OTP Code verification */
          <>
            <div className="login-header">
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(10, 132, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-color)',
                margin: '0 auto 16px'
              }}>
                <KeyRound size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
                {t('otp.title')}
              </h2>
              <p className="login-subtitle" style={{ marginTop: '6px' }}>
                {t('otp.subtitle', { destination: phone || email })}
              </p>
            </div>

            {/* Development OTP Banner */}
            {devCode && (
              <div className="dev-banner">
                <div className="dev-banner-header">⚙️ {t('otp.dev_banner_label')}</div>
                <div>{t('otp.dev_banner_hint')}</div>
                <div className="dev-code-box">{devCode}</div>
              </div>
            )}

            {error && <div className="response-message error">{error}</div>}

            <form onSubmit={handleVerifyOtp}>
              {/* Digit Box Grid */}
              <div className="otp-input-container">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      if (el) inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className={`otp-box ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary login-btn"
                disabled={isLoading || otpDigits.some(d => d === '')}
              >
                {isLoading ? (
                  <div className="spinner"></div>
                ) : isForgotPassword ? (
                  t('otp.verify_btn')
                ) : (
                  t('otp.verify_btn_register')
                )}
              </button>
            </form>

            {/* Resend Link and Countdown Timer */}
            <div className="resend-row">
              {canResend ? (
                <span>
                  {t('otp.resend_text')}
                  <button
                    type="button"
                    className="resend-btn"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    {t('otp.resend_link')}
                  </button>
                </span>
              ) : (
                <span>
                  {t('otp.resend_wait')}
                  <span>{timer}s</span>
                </span>
              )}
            </div>
          </>
        ) : (
          /* Stage 2: Reset password input forms */
          <>
            <div className="login-header">
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 199, 89, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success-color)',
                margin: '0 auto 16px'
              }}>
                <Lock size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
                {t('otp.new_password_label')}
              </h2>
              <p className="login-subtitle" style={{ marginTop: '4px' }}>
                Create a strong, secure new password for your doctor workspace.
              </p>
            </div>

            {error && <div className="response-message error">{error}</div>}

            <form onSubmit={handleResetPassword}>
              {/* New Password */}
              <div className="form-group">
                <label className="form-label">{t('otp.new_password_label')}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${passwordError ? 'error' : ''}`}
                    placeholder={t('otp.new_password_placeholder')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    disabled={isLoading}
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
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">{t('otp.confirm_password_label')}</label>
                <input
                  type="password"
                  className={`form-control ${confirmPasswordError ? 'error' : ''}`}
                  placeholder={t('otp.confirm_password_placeholder')}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  disabled={isLoading}
                />
                {confirmPasswordError && <span className="error-text">{t(confirmPasswordError)}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary login-btn"
                disabled={isLoading}
              >
                {isLoading ? <div className="spinner"></div> : t('otp.reset_btn')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default OtpVerificationScreen;
