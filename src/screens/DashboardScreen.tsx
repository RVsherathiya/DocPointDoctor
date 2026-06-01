import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../services/ToastContext';
import { useTranslation } from 'react-i18next';
import { 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Globe,
  Clock,
  TrendingUp,
  CheckCircle,
  Users,
  Video,
  MapPin,
  Bell,
  PlusCircle,
  Play,
  CalendarDays,
  DollarSign,
  Activity
} from 'lucide-react';
import './LoginScreen.css';
import './DashboardScreen.css';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' }
];

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();

  // Tab State: 'overview' (Dashboard statistics & widgets) or 'profile' (Verified session profile details)
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');

  // Revenue Chart filter: 'weekly' or 'monthly'
  const [revenueFilter, setRevenueFilter] = useState<'weekly' | 'monthly'>('weekly');

  // Hovered data point for chart tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null);

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('doctor_theme') || 'light';
    return saved as 'light' | 'dark';
  });

  // Custom language dropdown state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('doctor_language', lang);
    setIsLangOpen(false);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('doctor_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogout = () => {
    logout();
    showToast(t('common.logout_success', 'Logged out successfully!'), 'success');
  };

  const handleQuickAction = (actionName: string) => {
    showToast(`Workspace initialized: ${actionName} feature loaded.`, 'info');
  };

  if (!user) return null;

  // Chart data definitions
  const weeklyData = [
    { label: 'Mon', value: 2500, x: 40, y: 110 },
    { label: 'Tue', value: 3500, x: 110, y: 90 },
    { label: 'Wed', value: 3000, x: 180, y: 100 },
    { label: 'Thu', value: 4500, x: 250, y: 70 },
    { label: 'Fri', value: 4000, x: 320, y: 80 },
    { label: 'Sat', value: 5000, x: 390, y: 60 },
    { label: 'Sun', value: 1500, x: 460, y: 130 }
  ];

  const monthlyData = [
    { label: 'Jan', value: 45000, x: 60, y: 92.5 },
    { label: 'Feb', value: 52000, x: 155, y: 82 },
    { label: 'Mar', value: 60000, x: 250, y: 70 },
    { label: 'Apr', value: 68000, x: 345, y: 58 },
    { label: 'May', value: 74500, x: 440, y: 48.25 }
  ];

  const currentChartPoints = revenueFilter === 'weekly' ? weeklyData : monthlyData;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color var(--transition-speed) ease, color var(--transition-speed) ease'
    }}>
      {/* Top Header bar */}
      <header style={{
        height: '70px',
        backgroundColor: 'var(--card-background)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
          Doc<span style={{ color: 'var(--primary-color)' }}>Point</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('doctor.doctor_portal', 'Doctor Portal')}
          </span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Custom Tabs */}
          <nav style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: activeTab === 'overview' ? 'var(--sidebar-active-bg)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--primary-color)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: activeTab === 'profile' ? 'var(--sidebar-active-bg)' : 'transparent',
                color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              My Workspace Profile
            </button>
          </nav>

          <div className="custom-lang-dropdown" ref={dropdownRef}>
            <button 
              type="button" 
              className="lang-dropdown-btn"
              onClick={() => setIsLangOpen(!isLangOpen)}
              style={{ height: '36px', border: '1px solid var(--border)', borderRadius: 'var(--border-radius-sm)' }}
            >
              <span>{(LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]).flag} {(LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]).name}</span>
              <Globe size={14} className="lang-btn-globe" />
            </button>
            {isLangOpen && (
              <ul className="lang-dropdown-menu" style={{ top: 'calc(100% + 4px)', paddingLeft: 0 }}>
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

          <button 
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-light)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--border-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ height: '36px', padding: '0 12px', gap: '6px', fontSize: '0.9rem' }}
          >
            <LogOut size={16} />
            <span>{t('doctor.sign_out', 'Sign Out')}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="dashboard-container" style={{
        flex: 1,
        padding: '32px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        
        {activeTab === 'overview' ? (
          <>
            {/* WELCOME SECTION */}
            <div className="welcome-section">
              <div className="welcome-text">
                <h2>{t('doctor.welcome_back', 'Welcome back, Dr. {{name}}').replace('{{name}}', user.name)}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Here is an overview of today's schedule and clinical activities.
                </p>
              </div>
            </div>

            {/* STATISTICS CARDS */}
            <div className="stats-grid">
              <div className="stat-card today">
                <div className="stat-info">
                  <span className="stat-label">Today Appointments</span>
                  <span className="stat-val">6</span>
                </div>
                <div className="stat-icon-wrapper">
                  <Clock size={22} />
                </div>
              </div>

              <div className="stat-card upcoming">
                <div className="stat-info">
                  <span className="stat-label">Upcoming</span>
                  <span className="stat-val">18</span>
                </div>
                <div className="stat-icon-wrapper">
                  <CalendarDays size={22} />
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-info">
                  <span className="stat-label">Completed Consults</span>
                  <span className="stat-val">124</span>
                </div>
                <div className="stat-icon-wrapper">
                  <CheckCircle size={22} />
                </div>
              </div>

              <div className="stat-card patients">
                <div className="stat-info">
                  <span className="stat-label">Total Patients</span>
                  <span className="stat-val">87</span>
                </div>
                <div className="stat-icon-wrapper">
                  <Users size={22} />
                </div>
              </div>

              <div className="stat-card earnings">
                <div className="stat-info">
                  <span className="stat-label">Monthly Earnings</span>
                  <span className="stat-val">₹74,500</span>
                </div>
                <div className="stat-icon-wrapper">
                  <TrendingUp size={22} />
                </div>
              </div>
            </div>

            {/* LAYOUT GRID: Left widgets (Charts & Table), Right widgets (Notis & Quick actions) */}
            <div className="dashboard-layout-grid">
              {/* Left Column */}
              <div>
                {/* Revenue Chart Widget */}
                <div className="widget-card">
                  <div className="widget-title-area">
                    <h3 className="widget-title">
                      <TrendingUp size={20} style={{ color: 'var(--primary-color)' }} />
                      Revenue Analytics
                    </h3>
                    <div className="chart-toggle-group">
                      <button 
                        className={`chart-toggle-btn ${revenueFilter === 'weekly' ? 'active' : ''}`}
                        onClick={() => setRevenueFilter('weekly')}
                      >
                        Weekly
                      </button>
                      <button 
                        className={`chart-toggle-btn ${revenueFilter === 'monthly' ? 'active' : ''}`}
                        onClick={() => setRevenueFilter('monthly')}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  <div className="svg-chart-container">
                    <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.25"/>
                          <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.00"/>
                        </linearGradient>
                      </defs>

                      {/* Chart Grid Lines */}
                      <line x1="40" y1="40" x2="470" y2="40" stroke="var(--border)" strokeOpacity="0.4" strokeDasharray="3,3" />
                      <line x1="40" y1="85" x2="470" y2="85" stroke="var(--border)" strokeOpacity="0.4" strokeDasharray="3,3" />
                      <line x1="40" y1="130" x2="470" y2="130" stroke="var(--border)" strokeOpacity="0.4" strokeDasharray="3,3" />
                      <line x1="40" y1="160" x2="470" y2="160" stroke="var(--border)" strokeOpacity="0.7" />

                      {/* Area under the line */}
                      <path
                        d={`M ${currentChartPoints[0].x} 160 
                            ${currentChartPoints.map(p => `L ${p.x} ${p.y}`).join(' ')} 
                            L ${currentChartPoints[currentChartPoints.length - 1].x} 160 Z`}
                        fill="url(#chartGlow)"
                      />

                      {/* Line Curve */}
                      <path
                        d={`M ${currentChartPoints[0].x} ${currentChartPoints[0].y} 
                            ${currentChartPoints.map(p => `L ${p.x} ${p.y}`).join(' ')}`}
                        fill="none"
                        stroke="var(--primary-color)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data point dots */}
                      {currentChartPoints.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredPoint?.label === p.label ? "7" : "4.5"}
                          fill="var(--card-background)"
                          stroke="var(--primary-color)"
                          strokeWidth={hoveredPoint?.label === p.label ? "3" : "2"}
                          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                          onMouseEnter={() => {
                            setHoveredPoint({
                              x: p.x,
                              y: p.y,
                              label: p.label,
                              value: `₹${p.value.toLocaleString()}`
                            });
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}

                      {/* X Axis Labels */}
                      {currentChartPoints.map((p, i) => (
                        <text
                          key={i}
                          x={p.x}
                          y="176"
                          textAnchor="middle"
                          fill="var(--text-muted)"
                          fontSize="9.5"
                          fontWeight="600"
                        >
                          {p.label}
                        </text>
                      ))}
                    </svg>

                    {/* Chart tooltip popup */}
                    {hoveredPoint && (
                      <div 
                        className="chart-tooltip" 
                        style={{ 
                          left: `${(hoveredPoint.x / 500) * 100}%`,
                          top: `${(hoveredPoint.y / 180) * 100}%` 
                        }}
                      >
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{hoveredPoint.label} Revenue</div>
                        <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 800, marginTop: '2px' }}>{hoveredPoint.value}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Appointments Table Widget */}
                <div className="appointments-table-card">
                  <div className="widget-title-area" style={{ borderBottom: 'none', marginBottom: '8px' }}>
                    <h3 className="widget-title">
                      <CalendarDays size={20} style={{ color: 'var(--primary-color)' }} />
                      Upcoming Appointments
                    </h3>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Patient Name</th>
                          <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Schedule Time</th>
                          <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cons. Type</th>
                          <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                          <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 8px', fontWeight: 600 }}>Suresh Kumar</td>
                          <td style={{ padding: '16px 8px', fontSize: '0.9rem' }}>Today, 10:30 AM</td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="appt-type-badge video">
                              <Video size={12} />
                              Video Call
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Paid</span>
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                            <button className="consult-btn" onClick={() => handleQuickAction('Video Consultation Room')}>
                              <Play size={12} fill="currentColor" />
                              Start Consult
                            </button>
                          </td>
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 8px', fontWeight: 600 }}>Priya Patel</td>
                          <td style={{ padding: '16px 8px', fontSize: '0.9rem' }}>Today, 11:15 AM</td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="appt-type-badge in-clinic">
                              <MapPin size={12} />
                              In-Clinic
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Paid</span>
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" style={{ height: '32px' }} onClick={() => handleQuickAction('In-Clinic Check-In')}>
                              Check In
                            </button>
                          </td>
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 8px', fontWeight: 600 }}>Amit Sharma</td>
                          <td style={{ padding: '16px 8px', fontSize: '0.9rem' }}>Today, 02:00 PM</td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="appt-type-badge video">
                              <Video size={12} />
                              Video Call
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Pending</span>
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" style={{ height: '32px' }} onClick={() => handleQuickAction('Reschedule Booking')}>
                              Reschedule
                            </button>
                          </td>
                        </tr>

                        <tr style={{ borderBottom: 'none' }}>
                          <td style={{ padding: '16px 8px', fontWeight: 600 }}>Anjali Mehta</td>
                          <td style={{ padding: '16px 8px', fontSize: '0.9rem' }}>Today, 03:30 PM</td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="appt-type-badge in-clinic">
                              <MapPin size={12} />
                              In-Clinic
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Paid</span>
                          </td>
                          <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" style={{ height: '32px' }} onClick={() => handleQuickAction('In-Clinic Check-In')}>
                              Check In
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div>
                {/* Quick Actions Card */}
                <div className="widget-card">
                  <div className="widget-title-area">
                    <h3 className="widget-title">
                      <Activity size={20} style={{ color: 'var(--primary-color)' }} />
                      Quick Actions
                    </h3>
                  </div>
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn" onClick={() => handleQuickAction('New Appointment Scheduler')}>
                      <PlusCircle size={22} />
                      <span>New Booking</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => handleQuickAction('Availability Calendar')}>
                      <CalendarDays size={22} />
                      <span>Set Availability</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => handleQuickAction('Patient Electronic Health Records')}>
                      <Users size={22} />
                      <span>My Patients</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => setActiveTab('profile')}>
                      <UserIcon size={22} />
                      <span>My Profile</span>
                    </button>
                  </div>
                </div>

                {/* Notifications Widget */}
                <div className="widget-card">
                  <div className="widget-title-area">
                    <h3 className="widget-title">
                      <Bell size={20} style={{ color: 'var(--primary-color)' }} />
                      Recent Notifications
                    </h3>
                    <span className="pulsing-dot"></span>
                  </div>

                  <div className="notifications-list">
                    <div className="notification-item">
                      <div className="noti-icon-box booking">
                        <CalendarDays size={18} />
                      </div>
                      <div className="noti-details">
                        <span className="noti-title">Appointment Confirmed</span>
                        <span className="noti-desc">Dr. Suresh Kumar booked a video consultation for today at 10:30 AM.</span>
                        <span className="noti-time">12 mins ago</span>
                      </div>
                    </div>

                    <div className="notification-item">
                      <div className="noti-icon-box payment">
                        <DollarSign size={18} />
                      </div>
                      <div className="noti-details">
                        <span className="noti-title">Consultation Payment</span>
                        <span className="noti-desc">Payment of ₹500 received from patient Priya Patel.</span>
                        <span className="noti-time">45 mins ago</span>
                      </div>
                    </div>

                    <div className="notification-item">
                      <div className="noti-icon-box cancelled">
                        <LogOut size={18} style={{ transform: 'rotate(180deg)' }} />
                      </div>
                      <div className="noti-details">
                        <span className="noti-title">Booking Cancelled</span>
                        <span className="noti-desc">Appointment for Manoj Yadav tomorrow at 04:00 PM has been cancelled.</span>
                        <span className="noti-time">2 hours ago</span>
                      </div>
                    </div>

                    <div className="notification-item">
                      <div className="noti-icon-box booking">
                        <CalendarDays size={18} />
                      </div>
                      <div className="noti-details">
                        <span className="noti-title">New Consultation Booked</span>
                        <span className="noti-desc">Dr. Anjali Mehta booked an in-clinic consultation for today at 03:30 PM.</span>
                        <span className="noti-time">3 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          /* WORKSPACE SESSION DETAILS TAB (Preserving original profile items) */
          <>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
                My Workspace Profile
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Manage your credentials and view connection configurations.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <ShieldCheck size={20} style={{ color: 'var(--primary-color)' }} />
                {t('doctor.session_verified', 'Session Authentication Verified')}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Info Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {user.doctorProfile?.profilePhoto ? (
                        <img 
                          src={user.doctorProfile.profilePhoto} 
                          alt="Profile" 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} 
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserIcon size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('doctor.full_name', 'Full Name')}</div>
                      <div style={{ fontWeight: 600 }}>Dr. {user.name}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)' }}><Mail size={18} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('doctor.email_address', 'Email Address')}</div>
                      <div style={{ fontWeight: 600 }}>{user.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)' }}><Phone size={18} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('doctor.phone_number', 'Phone Number')}</div>
                      <div style={{ fontWeight: 600 }}>{user.phone}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)' }}><Calendar size={18} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('doctor.joined_date', 'Joined Date')}</div>
                      <div style={{ fontWeight: 600 }}>{new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)' }}><ShieldCheck size={18} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('doctor.role_profile', 'Role Profile')}</div>
                      <div style={{ fontWeight: 600 }} className="badge badge-primary">{user.role}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-muted)' }}><ShieldCheck size={18} /></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('doctor.account_status', 'Account Status')}</div>
                      <div style={{ fontWeight: 600 }} className="badge badge-success">{user.status}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--bg-light)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              💡 {t('doctor.security_advisory', 'Security Advisory: Remember to sign out when leaving your medical computer to safeguard patient data.')}
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default DashboardScreen;
