import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, CheckCircle2, AlertTriangle, LogOut, RefreshCw, Upload } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../services/ToastContext';
import FullScreenLoader from '../components/FullScreenLoader';
import api from '../services/api';
import './LoginScreen.css';

export const VerificationScreen: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // Document base64 values
  const [medicalLicense, setMedicalLicense] = useState('');
  const [degreeCertificate, setDegreeCertificate] = useState('');
  const [governmentId, setGovernmentId] = useState('');

  // Filenames for visual feedback
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be under 5MB', 'error');
        return;
      }

      setFileNames(prev => ({ ...prev, [field]: file.name }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'medicalLicense') setMedicalLicense(reader.result as string);
        if (field === 'degreeCertificate') setDegreeCertificate(reader.result as string);
        if (field === 'governmentId') setGovernmentId(reader.result as string);

        setErrors(prev => ({ ...prev, [field]: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    // All document fields are optional
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await api.post('/auth/upload-documents', {
        medicalLicense,
        degreeCertificate,
        governmentId,
      });

      const updatedUser = response.data.data.user;
      updateUser(updatedUser);
      showToast('Documents uploaded successfully! Under review.', 'success');
    } catch (err: any) {
      console.error('Document upload failed:', err);
      showToast(err.message || 'Failed to upload documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/me');
      const refreshedUser = response.data.data.user;
      
      updateUser(refreshedUser);
      if (refreshedUser.verificationStatus === 'approved') {
        showToast('Congratulations! Your account has been verified.', 'success');
        navigate('/');
      } else {
        showToast('Verification is still pending manual approval.', 'info');
      }
    } catch (err: any) {
      console.error('Failed to refresh status:', err);
      showToast(err.message || 'Failed to sync status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast(t('common.logout_success', 'Logged out successfully!'), 'success');
    navigate('/login');
  };

  const status = user?.verificationStatus || 'pending_upload';

  return (
    <div className="login-container">
      <FullScreenLoader visible={isLoading} />
      <div className="login-bg-orb-1"></div>
      <div className="login-bg-orb-2"></div>

      <div className="login-card" style={{ maxWidth: '500px', padding: '36px 28px' }}>
        
        {/* Controls */}
        <div className="login-controls">
          <div></div>
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

        {status === 'pending_upload' && (
          <>
            <div className="login-header" style={{ marginBottom: '24px' }}>
              <div className="login-badge">{t('verification.upload_title', 'Credential Verification')}</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '8px', color: 'var(--text)' }}>
                {t('verification.upload_docs', 'Upload Documents')}
              </h2>
              <p className="login-subtitle" style={{ marginTop: '4px' }}>
                {t('verification.upload_desc', 'Please upload clear copies of your medical license, graduation degrees, and government ID for audit.')}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Medical License Field */}
              <div className="form-group">
                <label className="form-label">{t('verification.license_label', 'Medical License (PDF or Image)')}</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '10px', 
                    height: '48px', border: '1px dashed var(--border)', borderRadius: 'var(--border-radius-md)',
                    padding: '0 16px', cursor: 'pointer', backgroundColor: 'var(--bg-light)',
                    color: fileNames.medicalLicense ? 'var(--primary-color)' : 'var(--text-muted)',
                    fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    <Upload size={16} />
                    <span>{fileNames.medicalLicense || t('verification.choose_license', 'Upload medical license')}</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={(e) => handleFileChange('medicalLicense', e)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  {medicalLicense && <CheckCircle2 size={20} color="var(--success-color)" />}
                </div>
                {errors.medicalLicense && <span className="error-text">{t(errors.medicalLicense)}</span>}
              </div>

              {/* Degree Certificate Field */}
              <div className="form-group">
                <label className="form-label">{t('verification.degree_label', 'Degree Certificate (PDF or Image)')}</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '10px', 
                    height: '48px', border: '1px dashed var(--border)', borderRadius: 'var(--border-radius-md)',
                    padding: '0 16px', cursor: 'pointer', backgroundColor: 'var(--bg-light)',
                    color: fileNames.degreeCertificate ? 'var(--primary-color)' : 'var(--text-muted)',
                    fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    <Upload size={16} />
                    <span>{fileNames.degreeCertificate || t('verification.choose_degree', 'Upload degree certificate')}</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={(e) => handleFileChange('degreeCertificate', e)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  {degreeCertificate && <CheckCircle2 size={20} color="var(--success-color)" />}
                </div>
                {errors.degreeCertificate && <span className="error-text">{t(errors.degreeCertificate)}</span>}
              </div>

              {/* Government ID Field */}
              <div className="form-group">
                <label className="form-label">{t('verification.id_label', 'Government Issued ID (Passport/License)')}</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '10px', 
                    height: '48px', border: '1px dashed var(--border)', borderRadius: 'var(--border-radius-md)',
                    padding: '0 16px', cursor: 'pointer', backgroundColor: 'var(--bg-light)',
                    color: fileNames.governmentId ? 'var(--primary-color)' : 'var(--text-muted)',
                    fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    <Upload size={16} />
                    <span>{fileNames.governmentId || t('verification.choose_id', 'Upload government ID')}</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={(e) => handleFileChange('governmentId', e)} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                  {governmentId && <CheckCircle2 size={20} color="var(--success-color)" />}
                </div>
                {errors.governmentId && <span className="error-text">{t(errors.governmentId)}</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '48px', marginTop: '12px' }}
              >
                {t('verification.submit_docs', 'Submit for Audit')}
              </button>

            </form>
          </>
        )}

        {status === 'pending_approval' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              backgroundColor: 'rgba(255, 149, 0, 0.1)', color: 'var(--warning-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', animation: 'pulse 2s infinite'
            }}>
              <ShieldCheck size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
              {t('verification.pending_title', 'Under Admin Audit')}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
              {t('verification.pending_desc', 'Your profile details and registration credentials are currently being manually reviewed by the compliance administration. This typically takes up to 24-48 business hours. We will notify you once approved.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRefreshStatus}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} />
                {t('verification.check_status', 'Refresh Audit Status')}
              </button>
            </div>
            
            <style>{`
              @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 149, 0, 0.4); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 149, 0, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 149, 0, 0); }
              }
            `}</style>
          </div>
        )}

        {status === 'rejected' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              backgroundColor: 'rgba(255, 59, 48, 0.1)', color: 'var(--danger-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
              {t('verification.rejected_title', 'Verification Auditing Failed')}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
              {t('verification.rejected_desc', 'Some of the credential uploads provided did not match official medical boards or details were blurry. Please re-upload clean copies of your files.')}
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (user) {
                  updateUser({ ...user, verificationStatus: 'pending_upload' });
                }
              }}
              style={{ width: '100%' }}
            >
              {t('verification.reupload_btn', 'Re-upload Credentials')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerificationScreen;
