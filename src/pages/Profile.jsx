import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  CheckCircle2, 
  Award, 
  Star, 
  LogOut, 
  Edit3, 
  Save, 
  X, 
  Languages, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../constants/languages';

export default function Profile({ 
  role = 'farmer',
  currentUser = null,
  farmerName = '',
  buyerName = '',
  onLogout = () => {},
  onUpdateUser = () => {},
  onLanguageChange = () => {}
}) {
  const { t, language, setLanguage } = useLanguage();
  const isFarmer = role === 'farmer';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    organization_name: '',
    mobile: '',
    email: '',
    state: '',
    district: '',
    village: '',
    farm_location: '',
    location: '',
    business_type: '',
    preferred_language: 'en',
  });

  useEffect(() => {
    let cancelled = false;
    const applyUser = (user) => {
      if (!user || cancelled) return;
      const profile = user.profile || {};
      setFormData({
        name: user.name || (isFarmer ? farmerName : buyerName),
        organization_name: user.organization_name || (isFarmer ? '' : buyerName),
        mobile: user.mobile || '',
        email: user.email || '',
        state: user.state || profile.state || '',
        district: user.district || profile.district || '',
        village: profile.village || '',
        farm_location: profile.farm_location || user.location || '',
        location: profile.location || user.location || '',
        business_type: profile.business_type || '',
        preferred_language: user.preferred_language || language || 'en',
      });
      onUpdateUser(user);
    };

    const loadCurrentUser = async () => {
      const token = localStorage.getItem('agrilink_token') || sessionStorage.getItem('agrilink_token');
      if (!token) {
        applyUser(currentUser);
        return;
      }
      try {
        const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        applyUser(response.ok && result.success ? result.user : currentUser);
      } catch {
        applyUser(currentUser);
      }
    };

    loadCurrentUser();
    return () => { cancelled = true; };
  }, [currentUser, isFarmer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const token = localStorage.getItem('agrilink_token') || sessionStorage.getItem('agrilink_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        ...formData,
        id: currentUser?.id,
        role: role,
      };

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSaveSuccessMsg(t('profile.updateSuccess', 'Profile updated successfully in SQLite database!'));
        setIsEditing(false);

        // Update active user state in App
        if (onUpdateUser && result.user) {
          onUpdateUser(result.user);
        }

        // If language changed, update globally
        if (formData.preferred_language && formData.preferred_language !== language) {
          setLanguage(formData.preferred_language);
          if (onLanguageChange) {
            onLanguageChange(formData.preferred_language);
          }
        }
      } else {
        setSaveErrorMsg(result.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveErrorMsg('Network error while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = formData.name || (isFarmer ? farmerName : buyerName);
  const displayLocation = isFarmer 
    ? (formData.farm_location || [formData.district, formData.state].filter(Boolean).join(', ') || 'Select location')
    : (formData.location || [formData.district, formData.state].filter(Boolean).join(', ') || 'Select location');

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="page-content">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">
              {isFarmer ? t('portal.farmer', 'Farmer Producer Profile') : t('portal.buyer', 'Institutional Buyer Profile')}
            </h1>
            <p className="page-subtitle">
              {t('profile.subtitle', 'Manage your personal details, contact information, location, and account preferences.')}
            </p>
          </div>

          {!isEditing && (
            <button
              id="profile-edit-btn"
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={15} /> {t('profile.editBtn', 'Edit Profile')}
            </button>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#166534',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#991b1b',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Side Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 88, height: 88, borderRadius: 'var(--radius-full)', background: 'var(--primary-100)', color: 'var(--primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>
            {initials || (isFarmer ? 'FP' : 'EB')}
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
              {displayName}
            </h3>
            {!isFarmer && formData.organization_name && (
              <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                {formData.organization_name}
              </div>
            )}
            <span className="badge badge-success" style={{ marginTop: 6, gap: 4 }}>
              <ShieldCheck size={14} /> {isFarmer ? t('profile.verified', 'Verified Farmer Producer') : t('profile.verified', 'Verified Enterprise Buyer')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <span>{t('profile.verifiedMember', 'Verified Member')}</span>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid var(--neutral-200)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--neutral-600)' }}>
              <MapPin size={15} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>{displayLocation}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--neutral-600)' }}>
              <Phone size={15} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>{formData.mobile || '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--neutral-600)' }}>
              <Mail size={15} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>{formData.email || '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--neutral-600)' }}>
              <Languages size={15} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>
                {LANGUAGES.find(l => l.code === (formData.preferred_language || language))?.name || 'English'} ({LANGUAGES.find(l => l.code === (formData.preferred_language || language))?.native || 'English'})
              </span>
            </div>
          </div>

          {onLogout && (
            <button 
              id="profile-logout-btn"
              className="btn btn-secondary btn-sm" 
              style={{ width: '100%', marginTop: 'auto', gap: 6, color: 'var(--neutral-700)', fontWeight: 700 }}
              onClick={onLogout}
            >
              <LogOut size={14} /> {t('btn.logout', 'Sign Out')}
            </button>
          )}
        </div>

        {/* Right Side: Edit Form OR Credentials Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isEditing ? (
            /* EDIT PROFILE FORM */
            <div className="card" style={{ border: '2px solid var(--primary-400)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Edit3 size={18} style={{ color: 'var(--primary-700)' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    {isFarmer ? t('profile.editFarmerProfile', 'Edit Farmer Profile') : t('profile.editBuyerProfile', 'Edit Buyer Profile')}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(false)}
                  style={{ gap: 4 }}
                >
                  <X size={14} /> {t('common.cancel', 'Cancel')}
                </button>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-name">
                      {t('profile.fullName', 'Full Name')} *
                    </label>
                    <input
                      id="profile-name"
                      name="name"
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Buyer: Organization Name */}
                  {!isFarmer && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-org">
                        {t('profile.orgName', 'Organization Name')}
                      </label>
                      <input
                        id="profile-org"
                        name="organization_name"
                        type="text"
                        className="form-input"
                        value={formData.organization_name}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  {/* Mobile */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-mobile">
                      {t('profile.mobile', 'Mobile Number')} *
                    </label>
                    <input
                      id="profile-mobile"
                      name="mobile"
                      type="tel"
                      className="form-input"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-email">
                      {t('profile.email', 'Email Address')}
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* State */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-state">
                      {t('profile.state', 'State')}
                    </label>
                    <input
                      id="profile-state"
                      name="state"
                      type="text"
                      className="form-input"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* District */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-district">
                      {t('profile.district', 'District')}
                    </label>
                    <input
                      id="profile-district"
                      name="district"
                      type="text"
                      className="form-input"
                      value={formData.district}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Farmer: Village */}
                  {isFarmer && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-village">
                        {t('profile.village', 'Village')}
                      </label>
                      <input
                        id="profile-village"
                        name="village"
                        type="text"
                        className="form-input"
                        value={formData.village}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  {/* Farmer: Farm Location */}
                  {isFarmer && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-farm-loc">
                        {t('profile.farmLocation', 'Farm Location / Tehsil')}
                      </label>
                      <input
                        id="profile-farm-loc"
                        name="farm_location"
                        type="text"
                        className="form-input"
                        value={formData.farm_location}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  {/* Buyer: Business Type */}
                  {!isFarmer && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-biz-type">
                        {t('profile.businessType', 'Business Type')}
                      </label>
                      <input
                        id="profile-biz-type"
                        name="business_type"
                        type="text"
                        className="form-input"
                        value={formData.business_type}
                        onChange={handleInputChange}
                        placeholder="Wholesaler / Processor / Retailer"
                      />
                    </div>
                  )}

                  {/* Buyer: Procurement Location */}
                  {!isFarmer && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile-hub-loc">
                        {t('profile.hubLocation', 'Procurement Hub Address')}
                      </label>
                      <input
                        id="profile-hub-loc"
                        name="location"
                        type="text"
                        className="form-input"
                        value={formData.location}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  {/* Preferred Language */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-lang">
                      {t('profile.preferredLang', 'Preferred Language')}
                    </label>
                    <select
                      id="profile-lang"
                      name="preferred_language"
                      className="form-input"
                      value={formData.preferred_language}
                      onChange={handleInputChange}
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name} ({lang.native})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, borderTop: '1px solid var(--neutral-200)', paddingTop: 16 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    id="profile-save-btn"
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                    style={{ gap: 6 }}
                  >
                    <Save size={16} />
                    {isSaving ? t('common.loading', 'Saving...') : t('profile.saveBtn', 'Save Changes to Database')}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Detailed Profile Information Card */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                    {isFarmer ? t('profile.farmPersonalCredentials', 'Farm & Personal Credentials') : t('profile.businessProcurementProfile', 'Business & Procurement Profile')}
                  </h4>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 4, fontSize: '0.8rem' }}
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={13} /> {t('common.edit', 'Edit')}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                      {t('profile.fullName', 'Full Name')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{displayName}</span>
                  </div>

                  {!isFarmer && (
                    <div>
                      <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                        {t('profile.orgName', 'Organization Name')}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{formData.organization_name || '—'}</span>
                    </div>
                  )}

                  <div>
                    <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                      {t('profile.mobile', 'Mobile Number')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{formData.mobile || '—'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                      {t('profile.email', 'Email Address')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{formData.email || '—'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                      {t('profile.state', 'State')} & {t('profile.district', 'District')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                      {formData.district || formData.state ? `${formData.district ? formData.district + ', ' : ''}${formData.state || ''}` : '—'}
                    </span>
                  </div>

                  {isFarmer ? (
                    <div>
                      <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                        {t('profile.village', 'Village / Farm')}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                        {formData.village || formData.farm_location || '—'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                        {t('profile.businessType', 'Business Type')}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                        {formData.business_type || '—'}
                      </span>
                    </div>
                  )}

                  <div>
                    <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                      {t('profile.preferredLang', 'Preferred Language')}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                      {LANGUAGES.find(l => l.code === (formData.preferred_language || language))?.name || 'English'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem', display: 'block', fontWeight: 600 }}>
                      {t('profile.databaseStatus', 'Database Storage Status')}
                    </span>
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> {t('profile.sqlitePersisted', 'SQLite Persisted')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
