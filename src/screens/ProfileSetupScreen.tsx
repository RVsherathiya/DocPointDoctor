import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Briefcase, Building, ChevronRight, ChevronLeft, Upload, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../services/ToastContext';
import FullScreenLoader from '../components/FullScreenLoader';
import api from '../services/api';
import './LoginScreen.css';

export const ProfileSetupScreen: React.FC = () => {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [profilePhoto, setProfilePhoto] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');

  const [specialization, setSpecialization] = useState('');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [isSpecOpen, setIsSpecOpen] = useState(false);

  const getCategoryName = (name: string) => {
    const cleanKey = name.toLowerCase().replace(/\s+/g, '_');
    const translationPath = `categories.list.${cleanKey}`;
    const translated = t(translationPath);
    if (translated === translationPath) {
      return name;
    }
    return translated;
  };
  const specDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data?.status === 'success') {
          setCategoriesList(response.data.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories for doctor setup dropdown:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (specDropdownRef.current && !specDropdownRef.current.contains(event.target as Node)) {
        setIsSpecOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [videoActive, setVideoActive] = useState(true);
  const [videoFee, setVideoFee] = useState('500');
  const [clinicActive, setClinicActive] = useState(true);
  const [clinicFee, setClinicFee] = useState('700');
  const [chatActive, setChatActive] = useState(true);
  const [chatFee, setChatFee] = useState('300');

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (currentStep: number) => {
    // Build ordered list of checks for each step
    // Returns the FIRST failing field so errors surface one at a time
    const checks: Array<{ key: string; message: string; fail: boolean }> = [];

    if (currentStep === 1) {
      checks.push({ key: 'profilePhoto', message: 'profile.photo_required',      fail: !profilePhoto });
      checks.push({ key: 'gender',       message: 'profile.gender_required',     fail: !gender });
      checks.push({ key: 'dob',          message: 'profile.dob_required',        fail: !dob });
      checks.push({ key: 'address',      message: 'profile.address_required',    fail: !address.trim() });
    } else if (currentStep === 2) {
      checks.push({ key: 'specialization', message: 'profile.specialization_required', fail: !specialization.trim() });
      checks.push({ key: 'experience',     message: 'profile.experience_required',     fail: !experience });
      checks.push({ key: 'experience',     message: 'profile.experience_invalid',      fail: !!experience && Number(experience) < 0 });
      checks.push({ key: 'qualification',  message: 'profile.qualification_required',  fail: !qualification.trim() });
      checks.push({ key: 'licenseNumber',  message: 'profile.license_required',        fail: !licenseNumber.trim() });
    } else if (currentStep === 3) {
      checks.push({ key: 'clinicName',      message: 'profile.clinic_name_required',    fail: !clinicName.trim() });
      checks.push({ key: 'clinicAddress',   message: 'profile.clinic_address_required', fail: !clinicAddress.trim() });
      checks.push({ key: 'consultationTypes', message: 'profile.types_required',        fail: !videoActive && !clinicActive && !chatActive });
      checks.push({ key: 'videoFee',        message: 'profile.fee_required_for_active', fail: videoActive && !videoFee.trim() });
      checks.push({ key: 'videoFee',        message: 'profile.fee_invalid_for_active',  fail: videoActive && !!videoFee.trim() && Number(videoFee) < 0 });
      checks.push({ key: 'clinicFee',       message: 'profile.fee_required_for_active', fail: clinicActive && !clinicFee.trim() });
      checks.push({ key: 'clinicFee',       message: 'profile.fee_invalid_for_active',  fail: clinicActive && !!clinicFee.trim() && Number(clinicFee) < 0 });
      checks.push({ key: 'chatFee',         message: 'profile.fee_required_for_active', fail: chatActive && !chatFee.trim() });
      checks.push({ key: 'chatFee',         message: 'profile.fee_invalid_for_active',  fail: chatActive && !!chatFee.trim() && Number(chatFee) < 0 });
    }

    // Find the first failing check
    const firstFail = checks.find(c => c.fail);
    if (firstFail) {
      setErrors({ [firstFail.key]: firstFail.message });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setErrors({});           // clear errors before entering next step
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrors({});             // clear errors when going back
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);

    const primaryFee = videoActive ? Number(videoFee) : (clinicActive ? Number(clinicFee) : (chatActive ? Number(chatFee) : 0));

    const payload = {
      profilePhoto,
      gender,
      dob,
      address: address.trim(),
      specialization: specialization.trim(),
      experience: Number(experience),
      qualification: qualification.trim(),
      licenseNumber: licenseNumber.trim(),
      clinicName: clinicName.trim(),
      clinicAddress: clinicAddress.trim(),
      consultationFee: primaryFee,
      consultationTypes: {
        video: { active: videoActive, fee: videoActive ? Number(videoFee) : 0 },
        clinic: { active: clinicActive, fee: clinicActive ? Number(clinicFee) : 0 },
        chat: { active: chatActive, fee: chatActive ? Number(chatFee) : 0 }
      }
    };

    try {
      const response = await api.post('/auth/complete-profile', payload);
      const updatedUser = response.data.data.user;
      
      updateUser(updatedUser);
      showToast('Profile completed successfully!', 'success');
      navigate('/verification');
    } catch (err: any) {
      console.error('Complete profile failed:', err);
      showToast(err.message || 'Failed to complete profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast(t('common.logout_success', 'Logged out successfully!'), 'success');
    navigate('/login');
  };

  return (
    <div className="login-container">
      <FullScreenLoader visible={isLoading} />
      <div className="login-bg-orb-1"></div>
      <div className="login-bg-orb-2"></div>

      <div className="login-card" style={{ maxWidth: '540px', padding: '36px 28px' }}>
        
        {/* Logout Control in Header */}
        <div className="login-controls">
          <div className="step-indicator" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            Step {step} of 3
          </div>
          <button 
            type="button" 
            onClick={handleLogout} 
            className="theme-toggle-btn"
            title="Log Out"
            style={{ width: 'auto', padding: '0 10px', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
          >
            <LogOut size={14} />
            {t('common.logout', 'Logout')}
          </button>
        </div>

        <div className="login-header" style={{ marginBottom: '24px' }}>
          <div className="login-badge">{t('profile.setup_title', 'Doctor Profile Setup')}</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '8px', color: 'var(--text)' }}>
            {step === 1 && t('profile.personal_details', 'Personal Details')}
            {step === 2 && t('profile.professional_details', 'Professional Details')}
            {step === 3 && t('profile.clinic_details', 'Clinic & Consultation')}
          </h2>
          <p className="login-subtitle" style={{ marginTop: '4px' }}>
            {step === 1 && t('profile.personal_desc', 'Please upload a clean headshot and provide your primary details.')}
            {step === 2 && t('profile.professional_desc', 'Enter your medical specialization and licensing credentials.')}
            {step === 3 && t('profile.clinic_desc', 'State your main practice clinic name, location, and consulting fee.')}
          </p>
        </div>

        {/* Multi-step Navigation Header Icons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: step >= 1 ? 1 : 0.4 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', 
              backgroundColor: step === 1 ? 'var(--primary-color)' : 'rgba(10, 132, 255, 0.1)', 
              color: step === 1 ? '#fff' : 'var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              <User size={18} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', color: 'var(--text)' }}>{t('profile.step_personal', 'Personal')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: step >= 2 ? 1 : 0.4 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', 
              backgroundColor: step === 2 ? 'var(--primary-color)' : 'rgba(10, 132, 255, 0.1)', 
              color: step === 2 ? '#fff' : 'var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              <Briefcase size={18} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', color: 'var(--text)' }}>{t('profile.step_professional', 'Professional')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: step >= 3 ? 1 : 0.4 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', 
              backgroundColor: step === 3 ? 'var(--primary-color)' : 'rgba(10, 132, 255, 0.1)', 
              color: step === 3 ? '#fff' : 'var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              <Building size={18} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', color: 'var(--text)' }}>{t('profile.step_clinic', 'Practice')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Photo Upload Circle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Profile preview" 
                      style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} 
                    />
                  ) : (
                    <div style={{
                      width: '100px', height: '100px', borderRadius: '50%', 
                      backgroundColor: 'var(--bg-light)', border: '2px dashed var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                    }}>
                      <Upload size={32} />
                    </div>
                  )}
                  <label htmlFor="photo-upload" style={{
                    position: 'absolute', bottom: '0', right: '0', 
                    backgroundColor: 'var(--primary-color)', color: '#fff', 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '2px solid var(--card-background)', boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Upload size={14} />
                  </label>
                  <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                    style={{ display: 'none' }} 
                  />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('profile.upload_hint', 'Upload Profile Photo (Max 2MB)')}</span>
                {errors.profilePhoto && <span className="error-text">{t(errors.profilePhoto)}</span>}
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">{t('profile.gender_label', 'Gender')}</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGender(g);
                        if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                      style={{
                        flex: 1, height: '44px', borderRadius: 'var(--border-radius-md)',
                        border: '1px solid ' + (gender === g ? 'var(--primary-color)' : 'var(--border)'),
                        backgroundColor: gender === g ? 'rgba(10, 132, 255, 0.08)' : 'var(--card-background)',
                        color: gender === g ? 'var(--primary-color)' : 'var(--text)',
                        fontWeight: 600, fontSize: '0.9rem'
                      }}
                    >
                      {t('profile.gender_' + g, g.charAt(0).toUpperCase() + g.slice(1))}
                    </button>
                  ))}
                </div>
                {errors.gender && <span className="error-text">{t(errors.gender)}</span>}
              </div>

              {/* DOB */}
              <div className="form-group">
                <label className="form-label">{t('profile.dob_label', 'Date of Birth')}</label>
                <input
                  type="date"
                  className={`form-control ${errors.dob ? 'error' : ''}`}
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                  }}
                />
                {errors.dob && <span className="error-text">{t(errors.dob)}</span>}
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label">{t('profile.address_label', 'Residential Address')}</label>
                <textarea
                  className={`form-control ${errors.address ? 'error' : ''}`}
                  placeholder={t('profile.address_placeholder', 'Enter your full residential address')}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                  }}
                  style={{ height: '80px', padding: '12px 16px', resize: 'none' }}
                />
                {errors.address && <span className="error-text">{t(errors.address)}</span>}
              </div>
            </div>
          )}

          {/* STEP 2: Professional Info */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Specialization */}
              <div className="form-group">
                <label className="form-label">{t('profile.specialization_label', 'Medical Specialization')}</label>
                <div className={`custom-select-dropdown ${isSpecOpen ? 'open' : ''}`} ref={specDropdownRef}>
                  <button
                    type="button"
                    className="select-dropdown-btn"
                    onClick={() => !isLoading && setIsSpecOpen(!isSpecOpen)}
                    disabled={isLoading}
                  >
                     <span>
                       {specialization ? getCategoryName(specialization) : t('profile.select_specialization_placeholder', 'Select Specialization')}
                     </span>
                    <ChevronDown size={18} className="chevron-icon" />
                  </button>
                  {isSpecOpen && (
                    <ul className="select-dropdown-menu">
                      <li
                        className={`select-dropdown-item ${specialization === '' ? 'active' : ''}`}
                        onClick={() => {
                          setSpecialization('');
                          setIsSpecOpen(false);
                          if (errors.specialization) setErrors(prev => ({ ...prev, specialization: '' }));
                        }}
                      >
                        <span>{t('profile.select_specialization_placeholder', 'Select Specialization')}</span>
                      </li>
                      {categoriesList.map((cat: any) => (
                        <li
                          key={cat._id}
                          className={`select-dropdown-item ${specialization === cat.name ? 'active' : ''}`}
                          onClick={() => {
                            setSpecialization(cat.name);
                            setIsSpecOpen(false);
                            if (errors.specialization) setErrors(prev => ({ ...prev, specialization: '' }));
                          }}
                        >
                          <span>{getCategoryName(cat.name)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.specialization && <span className="error-text">{t(errors.specialization)}</span>}
              </div>

              {/* Experience */}
              <div className="form-group">
                <label className="form-label">{t('profile.experience_label', 'Years of Experience')}</label>
                <input
                  type="number"
                  min="0"
                  className={`form-control ${errors.experience ? 'error' : ''}`}
                  placeholder={t('profile.experience_placeholder', 'e.g. 8')}
                  value={experience}
                  onChange={(e) => {
                    setExperience(e.target.value);
                    if (errors.experience) setErrors(prev => ({ ...prev, experience: '' }));
                  }}
                />
                {errors.experience && <span className="error-text">{t(errors.experience)}</span>}
              </div>

              {/* Qualification */}
              <div className="form-group">
                <label className="form-label">{t('profile.qualification_label', 'Medical Qualification')}</label>
                <input
                  type="text"
                  className={`form-control ${errors.qualification ? 'error' : ''}`}
                  placeholder={t('profile.qualification_placeholder', 'e.g. MBBS, MD')}
                  value={qualification}
                  onChange={(e) => {
                    setQualification(e.target.value);
                    if (errors.qualification) setErrors(prev => ({ ...prev, qualification: '' }));
                  }}
                  autoComplete="off"
                />
                {errors.qualification && <span className="error-text">{t(errors.qualification)}</span>}
              </div>

              {/* License Number */}
              <div className="form-group">
                <label className="form-label">{t('profile.license_label', 'Medical Registration/License Number')}</label>
                <input
                  type="text"
                  className={`form-control ${errors.licenseNumber ? 'error' : ''}`}
                  placeholder={t('profile.license_placeholder', 'e.g. REG-1092834')}
                  value={licenseNumber}
                  onChange={(e) => {
                    setLicenseNumber(e.target.value);
                    if (errors.licenseNumber) setErrors(prev => ({ ...prev, licenseNumber: '' }));
                  }}
                  autoComplete="off"
                />
                {errors.licenseNumber && <span className="error-text">{t(errors.licenseNumber)}</span>}
              </div>
            </div>
          )}

          {/* STEP 3: Clinic Details */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Clinic Name */}
              <div className="form-group">
                <label className="form-label">{t('profile.clinic_name_label', 'Clinic/Hospital Name')}</label>
                <input
                  type="text"
                  className={`form-control ${errors.clinicName ? 'error' : ''}`}
                  placeholder={t('profile.clinic_name_placeholder', 'e.g. Hope Wellness Clinic')}
                  value={clinicName}
                  onChange={(e) => {
                    setClinicName(e.target.value);
                    if (errors.clinicName) setErrors(prev => ({ ...prev, clinicName: '' }));
                  }}
                  autoComplete="off"
                />
                {errors.clinicName && <span className="error-text">{t(errors.clinicName)}</span>}
              </div>

              {/* Clinic Address */}
              <div className="form-group">
                <label className="form-label">{t('profile.clinic_address_label', 'Clinic Address')}</label>
                <textarea
                  className={`form-control ${errors.clinicAddress ? 'error' : ''}`}
                  placeholder={t('profile.clinic_address_placeholder', 'Enter the full address of your clinic/hospital')}
                  value={clinicAddress}
                  onChange={(e) => {
                    setClinicAddress(e.target.value);
                    if (errors.clinicAddress) setErrors(prev => ({ ...prev, clinicAddress: '' }));
                  }}
                  style={{ height: '80px', padding: '12px 16px', resize: 'none' }}
                />
                {errors.clinicAddress && <span className="error-text">{t(errors.clinicAddress)}</span>}
              </div>

              {/* Consultation Types */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                  {t('profile.consultation_types_label', 'Consultation Types')}
                </label>
                
                {errors.consultationTypes && (
                  <span className="error-text" style={{ display: 'block', marginBottom: '12px' }}>
                    {t(errors.consultationTypes)}
                  </span>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Video Consultation */}
                  <div style={{
                    border: '1px solid ' + (videoActive ? 'var(--primary-color)' : 'var(--border)'),
                    borderRadius: 'var(--border-radius-md)',
                    padding: '16px',
                    backgroundColor: videoActive ? 'rgba(10, 132, 255, 0.04)' : 'var(--card-background)',
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={videoActive}
                        onChange={(e) => {
                          setVideoActive(e.target.checked);
                          if (errors.consultationTypes) setErrors(prev => ({ ...prev, consultationTypes: '' }));
                          if (errors.videoFee) setErrors(prev => ({ ...prev, videoFee: '' }));
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                      />
                      <span>{t('profile.video_consultation', 'Video Consultation')}</span>
                    </label>
                    
                    {videoActive && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '2px' }}>
                          {t('profile.video_fee_label', 'Video Fee')}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            className={`form-control ${errors.videoFee ? 'error' : ''}`}
                            placeholder="e.g. 500"
                            value={videoFee}
                            onChange={(e) => {
                              setVideoFee(e.target.value);
                              if (errors.videoFee) setErrors(prev => ({ ...prev, videoFee: '' }));
                            }}
                            style={{ paddingLeft: '28px' }}
                          />
                        </div>
                        {errors.videoFee && <span className="error-text" style={{ fontSize: '0.75rem' }}>{t(errors.videoFee)}</span>}
                      </div>
                    )}
                  </div>

                  {/* Clinic Visit */}
                  <div style={{
                    border: '1px solid ' + (clinicActive ? 'var(--primary-color)' : 'var(--border)'),
                    borderRadius: 'var(--border-radius-md)',
                    padding: '16px',
                    backgroundColor: clinicActive ? 'rgba(10, 132, 255, 0.04)' : 'var(--card-background)',
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={clinicActive}
                        onChange={(e) => {
                          setClinicActive(e.target.checked);
                          if (errors.consultationTypes) setErrors(prev => ({ ...prev, consultationTypes: '' }));
                          if (errors.clinicFee) setErrors(prev => ({ ...prev, clinicFee: '' }));
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                      />
                      <span>{t('profile.clinic_visit', 'Clinic Visit')}</span>
                    </label>

                    {clinicActive && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '2px' }}>
                          {t('profile.clinic_fee_label', 'Clinic Fee')}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            className={`form-control ${errors.clinicFee ? 'error' : ''}`}
                            placeholder="e.g. 700"
                            value={clinicFee}
                            onChange={(e) => {
                              setClinicFee(e.target.value);
                              if (errors.clinicFee) setErrors(prev => ({ ...prev, clinicFee: '' }));
                            }}
                            style={{ paddingLeft: '28px' }}
                          />
                        </div>
                        {errors.clinicFee && <span className="error-text" style={{ fontSize: '0.75rem' }}>{t(errors.clinicFee)}</span>}
                      </div>
                    )}
                  </div>

                  {/* Chat Consultation */}
                  <div style={{
                    border: '1px solid ' + (chatActive ? 'var(--primary-color)' : 'var(--border)'),
                    borderRadius: 'var(--border-radius-md)',
                    padding: '16px',
                    backgroundColor: chatActive ? 'rgba(10, 132, 255, 0.04)' : 'var(--card-background)',
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={chatActive}
                        onChange={(e) => {
                          setChatActive(e.target.checked);
                          if (errors.consultationTypes) setErrors(prev => ({ ...prev, consultationTypes: '' }));
                          if (errors.chatFee) setErrors(prev => ({ ...prev, chatFee: '' }));
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                      />
                      <span>{t('profile.chat_consultation', 'Chat Consultation')}</span>
                    </label>

                    {chatActive && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '2px' }}>
                          {t('profile.chat_fee_label', 'Chat Fee')}
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            className={`form-control ${errors.chatFee ? 'error' : ''}`}
                            placeholder="e.g. 300"
                            value={chatFee}
                            onChange={(e) => {
                              setChatFee(e.target.value);
                              if (errors.chatFee) setErrors(prev => ({ ...prev, chatFee: '' }));
                            }}
                            style={{ paddingLeft: '28px' }}
                          />
                        </div>
                        {errors.chatFee && <span className="error-text" style={{ fontSize: '0.75rem' }}>{t(errors.chatFee)}</span>}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '28px' }}>
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBack}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ChevronLeft size={16} />
                {t('common.back', 'Back')}
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {t('common.next', 'Next')}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {t('profile.submit_btn', 'Complete & Proceed')}
                <ChevronRight size={16} />
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};

export default ProfileSetupScreen;
