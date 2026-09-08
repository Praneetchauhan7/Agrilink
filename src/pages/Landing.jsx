import React, { useState } from 'react';
import { 
  Globe, 
  ChevronDown, 
  ArrowRight, 
  Sprout, 
  Building2, 
  Check, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { LANGUAGES } from '../constants/languages';
import { INDIAN_LOCATIONS } from '../constants/locations';
import { useLanguage } from '../context/LanguageContext';
import '../styles/landing.css';

export default function Landing({ 
  onSelectRole, 
  currentLanguage: propCurrentLanguage, 
  onSelectLanguage: propOnSelectLanguage 
}) {
  const { t, language, setLanguage, currentLangObj } = useLanguage();
  const currentLanguage = propCurrentLanguage || language;
  const onSelectLanguage = propOnSelectLanguage || setLanguage;

  // All available states, and a helper to get districts for a given state
  const ALL_STATE_NAMES = INDIAN_LOCATIONS.map((l) => l.state);
  const getDistrictsForState = (stateName) =>
    INDIAN_LOCATIONS.find((l) => l.state === stateName)?.districts.map((d) => d.name) || [];

  const [isLangOpen, setIsLangOpen] = useState(false);

  // Active Login Form State ('none', 'farmer', 'buyer')
  const [activeLoginForm, setActiveLoginForm] = useState(null);

  // Auth mode ('login' or 'register')
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Farmer Form State
  const [farmerForm, setFarmerForm] = useState({
    name: '',
    mobile: '',
    password: '',
    state: 'Maharashtra',
    district: 'Nashik',
    village: '',
  });
  const [farmerErrors, setFarmerErrors] = useState({});
  const [showFarmerPassword, setShowFarmerPassword] = useState(false);

  // Buyer Form State
  const [buyerForm, setBuyerForm] = useState({
    name: '',
    identifier: '',
    password: '',
    state: 'Maharashtra',
    district: 'Pune',
    locality: '',
    businessType: 'Supermarket Chain',
  });
  const [buyerErrors, setBuyerErrors] = useState({});
  const [showBuyerPassword, setShowBuyerPassword] = useState(false);

  const [authLoading, setAuthLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Geolocation ("Use my current location") state
  const [geoLoading, setGeoLoading] = useState({ farmer: false, buyer: false });
  const [geoMessage, setGeoMessage] = useState({ farmer: '', buyer: '' });

  // Best-effort match of a free-text place name against our curated state/district list
  const findClosestMatch = (name, candidates) => {
    if (!name) return null;
    const clean = (s) => s.toLowerCase().replace(/\s+district$/, '').trim();
    const target = clean(name);
    return (
      candidates.find((c) => clean(c) === target) ||
      candidates.find((c) => clean(c).includes(target) || target.includes(clean(c))) ||
      null
    );
  };

  // Uses the browser's Geolocation API + OpenStreetMap's free Nominatim reverse-geocoding
  // service to best-effort prefill State / District / Village-or-Locality. Entirely optional -
  // never blocks the form, and any field it can't confidently match is simply left for the
  // user to fill in manually.
  const handleUseCurrentLocation = (role) => {
    if (!navigator.geolocation) {
      setGeoMessage((m) => ({ ...m, [role]: 'Location detection is not supported on this browser.' }));
      return;
    }

    setGeoLoading((s) => ({ ...s, [role]: true }));
    setGeoMessage((m) => ({ ...m, [role]: '' }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await res.json();
          const addr = data?.address || {};

          const matchedState = findClosestMatch(addr.state, ALL_STATE_NAMES);
          const districtCandidates = matchedState ? getDistrictsForState(matchedState) : [];
          const matchedDistrict = findClosestMatch(
            addr.state_district || addr.county || addr.city_district,
            districtCandidates
          );
          const place = addr.village || addr.town || addr.city || addr.suburb || addr.hamlet || '';

          if (role === 'farmer') {
            setFarmerForm((f) => ({
              ...f,
              state: matchedState || f.state,
              district: matchedDistrict || (matchedState ? '' : f.district),
              village: place || f.village,
            }));
          } else {
            setBuyerForm((f) => ({
              ...f,
              state: matchedState || f.state,
              district: matchedDistrict || (matchedState ? '' : f.district),
              locality: place || f.locality,
            }));
          }

          if (!matchedState) {
            setGeoMessage((m) => ({
              ...m,
              [role]: `Detected "${place || addr.state || 'your area'}" — please select State/District manually, we couldn't match it to our list.`,
            }));
          } else if (!matchedDistrict) {
            setGeoMessage((m) => ({
              ...m,
              [role]: `State detected as ${matchedState}. Please select your district manually.`,
            }));
          } else {
            setGeoMessage((m) => ({ ...m, [role]: '' }));
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setGeoMessage((m) => ({ ...m, [role]: 'Could not detect your address. Please select manually.' }));
        } finally {
          setGeoLoading((s) => ({ ...s, [role]: false }));
        }
      },
      (error) => {
        setGeoLoading((s) => ({ ...s, [role]: false }));
        const msg =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. You can select your location manually below.'
            : 'Could not get your current location. Please select manually.';
        setGeoMessage((m) => ({ ...m, [role]: msg }));
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Handle Farmer Login / Registration
  const handleFarmerLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errors = {};

    if (!farmerForm.name.trim()) {
      errors.name = 'Please enter your name';
    }
    const cleanMobile = farmerForm.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    if (!farmerForm.password || farmerForm.password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }
    if (authMode === 'register') {
      if (!farmerForm.state) {
        errors.state = 'Please select your state';
      }
      if (!farmerForm.district) {
        errors.district = 'Please select your district';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFarmerErrors(errors);
      return;
    }

    setFarmerErrors({});
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = {
        role: 'farmer',
        name: farmerForm.name.trim(),
        mobile: cleanMobile,
        password: farmerForm.password,
        state: farmerForm.state,
        district: farmerForm.district,
        village: farmerForm.village,
        farm_location: `${farmerForm.village || 'Pimpalgaon'}, ${farmerForm.district || 'Nashik'}`,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerError(data.message || 'Authentication failed. Please check your credentials.');
        setAuthLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('agrilink_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('agrilink_user', JSON.stringify(data.user));
      }

      setAuthLoading(false);
      onSelectRole('farmer', {
        id: data.user.id,
        name: data.user.name,
        mobile: data.user.mobile,
        location: `${data.user.district || 'Nashik'}, ${data.user.state || 'Maharashtra'}`,
        role: 'farmer',
      });
    } catch (err) {
      console.error('Farmer auth error:', err);
      setServerError('Could not connect to the backend server. Please try again.');
      setAuthLoading(false);
    }
  };

  // Handle Buyer Login / Registration
  const handleBuyerLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errors = {};

    if (!buyerForm.name.trim()) {
      errors.name = 'Please enter your Name or Organization name';
    }
    if (!buyerForm.identifier.trim()) {
      errors.identifier = 'Please enter your Email or Mobile Number';
    }
    if (!buyerForm.password || buyerForm.password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }
    if (authMode === 'register') {
      if (!buyerForm.state) {
        errors.state = 'Please select your state';
      }
      if (!buyerForm.district) {
        errors.district = 'Please select your city / district';
      }
    }

    if (Object.keys(errors).length > 0) {
      setBuyerErrors(errors);
      return;
    }

    setBuyerErrors({});
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const isEmail = buyerForm.identifier.includes('@');
      const payload = {
        role: 'buyer',
        name: buyerForm.name.trim(),
        organization_name: buyerForm.name.trim(),
        email: isEmail ? buyerForm.identifier.trim() : undefined,
        mobile: !isEmail ? buyerForm.identifier.replace(/\D/g, '') : undefined,
        identifier: buyerForm.identifier.trim(),
        password: buyerForm.password,
        state: buyerForm.state,
        district: buyerForm.district,
        business_type: buyerForm.businessType,
        location: `${buyerForm.locality ? buyerForm.locality.trim() + ', ' : ''}${buyerForm.district || 'Pune'}, ${buyerForm.state || 'Maharashtra'}`,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerError(data.message || 'Authentication failed. Please check your credentials.');
        setAuthLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('agrilink_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('agrilink_user', JSON.stringify(data.user));
      }

      setAuthLoading(false);
      onSelectRole('buyer', {
        id: data.user.id,
        name: data.user.name,
        identifier: buyerForm.identifier.trim(),
        organization_name: data.user.organization_name || data.user.name,
        location: `${data.user.district || 'Pune'}, ${data.user.state || 'Maharashtra'}`,
        role: 'buyer',
      });
    } catch (err) {
      console.error('Buyer auth error:', err);
      setServerError('Could not connect to the backend server. Please try again.');
      setAuthLoading(false);
    }
  };

  return (
    <div className="landing-page">
      {/* Top Header */}
      <header className="landing-navbar">
        <div className="brand-logo">
          <div className="brand-icon">🌱</div>
          <div className="brand-text">
            <h2>{t('brand.title', 'AgriLink')}</h2>
            <span>{t('brand.subtitle', 'Agricultural Marketplace')}</span>
          </div>
        </div>

        <div className="landing-nav-actions">
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button 
              className="lang-selector-btn"
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-label={t('btn.selectLanguage', 'Select Language')}
            >
              <Globe size={15} />
              <span>{currentLangObj.native} ({currentLangObj.name})</span>
              <ChevronDown size={13} />
            </button>

            {isLangOpen && (
              <div className="lang-dropdown-menu">
                {LANGUAGES.map((lang) => (
                  <button 
                    key={lang.code}
                    className={`lang-dropdown-item ${currentLanguage === lang.code ? 'active' : ''}`}
                    onClick={() => { 
                      onSelectLanguage(lang.code); 
                      setIsLangOpen(false); 
                    }}
                  >
                    <span>{lang.native}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{lang.name}</span>
                    {currentLanguage === lang.code && <Check size={14} style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Focus Area: Welcome & Login Cards or Login Form */}
      <main className="landing-main">
        <div className="landing-welcome-container">
          <div className="landing-badge">
            <span>{t('landing.badge', 'Direct Farm-Gate Procurement')}</span>
          </div>

          <h1 className="landing-main-title">
            {t('landing.welcomeTo', 'Welcome to')} <span className="text-green">{t('brand.title', 'AgriLink')}</span>
          </h1>

          <p className="landing-tagline">
            {t('landing.tagline', 'Connecting farmers, FPOs, and bulk institutional buyers through fair price discovery and smart stock aggregation.')}
          </p>

          {/* View 1: Role Selection Cards (When no specific login form is expanded) */}
          {!activeLoginForm && (
            <div className="login-cards-grid">
              {/* Farmer Login Card */}
              <div 
                className="login-card farmer-card"
                onClick={() => setActiveLoginForm('farmer')}
                role="button"
                tabIndex={0}
              >
                <div className="login-card-icon-wrapper farmer-icon">
                  <span className="emoji-icon">👨‍🌾</span>
                </div>
                <h2 className="login-card-title">{t('landing.farmerCardTitle', 'Farmer Login')}</h2>
                <p className="login-card-desc">
                  {t('landing.farmerCardDesc', 'Access real-time APMC mandi prices, view verified buyer demands, and sell produce directly at fair rates.')}
                </p>
                <div className="login-card-action farmer-action">
                  <span>{t('landing.farmerCardAction', 'Enter Farmer Portal')}</span>
                  <ArrowRight size={18} />
                </div>
              </div>

              {/* Buyer Login Card */}
              <div 
                className="login-card buyer-card"
                onClick={() => setActiveLoginForm('buyer')}
                role="button"
                tabIndex={0}
              >
                <div className="login-card-icon-wrapper buyer-icon">
                  <span className="emoji-icon">🏢</span>
                </div>
                <h2 className="login-card-title">{t('landing.buyerCardTitle', 'Buyer Login')}</h2>
                <p className="login-card-desc">
                  {t('landing.buyerCardDesc', 'Procure bulk volumes from verified farmers and FPO clusters with automated multi-supplier stock aggregation.')}
                </p>
                <div className="login-card-action buyer-action">
                  <span>{t('landing.buyerCardAction', 'Enter Buyer Portal')}</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          )}

          {/* View 2: Farmer Login Form (Interactive with User Inputs) */}
          {activeLoginForm === 'farmer' && (
            <div className="landing-login-form-container" style={{ maxWidth: '440px', width: '100%', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => setActiveLoginForm(null)}
                  style={{ gap: 6 }}
                >
                  <ArrowLeft size={14} /> {t('landing.back', 'Back')}
                </button>
                <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                  {t('landing.farmerAuth', '👨‍🌾 Farmer Authentication')}
                </span>
              </div>

              <div className="card" style={{ padding: '28px 24px', border: '1.5px solid var(--primary-600)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, borderBottom: '1px solid var(--neutral-200)', paddingBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setServerError(''); }}
                      style={{
                        padding: '6px 14px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        background: authMode === 'login' ? 'var(--primary-100)' : 'transparent',
                        color: authMode === 'login' ? 'var(--primary-800)' : 'var(--neutral-600)',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {t('landing.signIn', 'Sign In')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setServerError(''); }}
                      style={{
                        padding: '6px 14px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        background: authMode === 'register' ? 'var(--primary-100)' : 'transparent',
                        color: authMode === 'register' ? 'var(--primary-800)' : 'var(--neutral-600)',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {t('landing.createFarmerAccount', 'Create Farmer Account')}
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-900)', marginBottom: 4 }}>
                    {authMode === 'register' ? t('landing.registerNewFarmer', 'Register New Farmer') : t('landing.farmerSignIn', 'Farmer Sign In')}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--neutral-500)' }}>
                    {authMode === 'register'
                      ? t('landing.farmerRegDesc', 'Create your account to publish produce listings and connect with buyers.')
                      : t('landing.farmerLoginDesc', 'Enter your credentials to access your farmer dashboard.')}
                  </p>
                </div>

                {serverError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.84rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} />
                    <span>{serverError}</span>
                  </div>
                )}

                <form onSubmit={handleFarmerLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t('landing.fullName', 'Farmer Name')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div className="input-icon-group">
                      <input
                        type="text"
                        className={`form-control ${farmerErrors.name ? 'error' : ''}`}
                        placeholder="Enter your name"
                        value={farmerForm.name}
                        onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                        style={{ paddingLeft: 36 }}
                      />
                      <User size={16} className="input-icon-left" />
                    </div>
                    {farmerErrors.name && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <AlertCircle size={12} /> {farmerErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t('landing.mobileNumber', 'Mobile Number')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div className="input-icon-group">
                      <input
                        type="tel"
                        maxLength={10}
                        className={`form-control ${farmerErrors.mobile ? 'error' : ''}`}
                        placeholder="10-digit mobile number"
                        value={farmerForm.mobile}
                        onChange={(e) => setFarmerForm({ ...farmerForm, mobile: e.target.value })}
                        style={{ paddingLeft: 36 }}
                      />
                      <Phone size={16} className="input-icon-left" />
                    </div>
                    {farmerErrors.mobile && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <AlertCircle size={12} /> {farmerErrors.mobile}
                      </span>
                    )}
                  </div>

                  {authMode === 'register' && (
                    <div className="location-section">
                      <div className="location-section-header">
                        <span className="location-section-title">📍 {t('landing.location', 'Location')}</span>
                        <button
                          type="button"
                          className="geo-locate-btn"
                          onClick={() => handleUseCurrentLocation('farmer')}
                          disabled={geoLoading.farmer}
                        >
                          {geoLoading.farmer ? (
                            <><span className="geo-spinner" /> Detecting…</>
                          ) : (
                            <>⌖ {t('landing.useCurrentLocation', 'Use my current location')}</>
                          )}
                        </button>
                      </div>
                      {geoMessage.farmer && <p className="geo-status-message">{geoMessage.farmer}</p>}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {t('landing.state', 'State')} <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <select
                            className={`form-control ${farmerErrors.state ? 'error' : ''}`}
                            value={farmerForm.state}
                            onChange={(e) => setFarmerForm({ ...farmerForm, state: e.target.value, district: '' })}
                          >
                            <option value="">Select state</option>
                            {ALL_STATE_NAMES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {farmerErrors.state && (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <AlertCircle size={12} /> {farmerErrors.state}
                            </span>
                          )}
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {t('landing.district', 'District')} <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <select
                            className={`form-control ${farmerErrors.district ? 'error' : ''}`}
                            value={farmerForm.district}
                            onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
                            disabled={!farmerForm.state}
                          >
                            <option value="">{farmerForm.state ? 'Select district' : 'Select state first'}</option>
                            {getDistrictsForState(farmerForm.state).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          {farmerErrors.district && (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <AlertCircle size={12} /> {farmerErrors.district}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: '10px 0 12px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {t('landing.village', 'Village / Town')}{' '}
                          <span style={{ fontWeight: 500, color: 'var(--neutral-500)' }}>({t('common.optional', 'optional')})</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={farmerForm.village}
                          onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                          placeholder="e.g. Pimpalgaon"
                        />
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t('landing.password', 'Password')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div className="input-icon-group">
                      <input
                        type={showFarmerPassword ? 'text' : 'password'}
                        className={`form-control ${farmerErrors.password ? 'error' : ''}`}
                        placeholder="Enter password"
                        value={farmerForm.password}
                        onChange={(e) => setFarmerForm({ ...farmerForm, password: e.target.value })}
                        style={{ paddingLeft: 36, paddingRight: 36 }}
                      />
                      <Lock size={16} className="input-icon-left" />
                      <button
                        type="button"
                        onClick={() => setShowFarmerPassword(!showFarmerPassword)}
                        className="input-icon-toggle"
                      >
                        {showFarmerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {farmerErrors.password && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <AlertCircle size={12} /> {farmerErrors.password}
                      </span>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={authLoading}
                    style={{ width: '100%', marginTop: 8, padding: '12px' }}
                  >
                    {authLoading ? t('landing.connecting', 'Connecting...') : authMode === 'register' ? t('landing.registerFarmerAccount', 'Register Account') : t('landing.loginAsFarmer', 'Login as Farmer')}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: 4 }}>
                    Switch to <button type="button" onClick={() => { setActiveLoginForm('buyer'); setServerError(''); }} style={{ color: 'var(--primary-700)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>{t('landing.switchToBuyer', 'Buyer Login')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View 3: Buyer Login Form (Interactive with User Inputs) */}
          {activeLoginForm === 'buyer' && (
            <div className="landing-login-form-container" style={{ maxWidth: '440px', width: '100%', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => setActiveLoginForm(null)}
                  style={{ gap: 6 }}
                >
                  <ArrowLeft size={14} /> {t('landing.back', 'Back')}
                </button>
                <span className="badge badge-warning" style={{ padding: '6px 12px', background: '#dbeafe', color: '#1e40af' }}>
                  {t('landing.buyerAuth', '🏢 Buyer / Institutional Authentication')}
                </span>
              </div>

              <div className="card" style={{ padding: '28px 24px', border: '1.5px solid #2563eb', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, borderBottom: '1px solid var(--neutral-200)', paddingBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setServerError(''); }}
                      style={{
                        padding: '6px 14px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        background: authMode === 'login' ? '#dbeafe' : 'transparent',
                        color: authMode === 'login' ? '#1e40af' : 'var(--neutral-600)',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {t('landing.signIn', 'Sign In')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setServerError(''); }}
                      style={{
                        padding: '6px 14px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        background: authMode === 'register' ? '#dbeafe' : 'transparent',
                        color: authMode === 'register' ? '#1e40af' : 'var(--neutral-600)',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {t('landing.createBuyerAccount', 'Create Buyer Account')}
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-900)', marginBottom: 4 }}>
                    {authMode === 'register' ? t('landing.registerNewBuyer', 'Register New Buyer / Institution') : t('landing.buyerSignIn', 'Buyer Sign In')}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--neutral-500)' }}>
                    {authMode === 'register'
                      ? t('landing.buyerRegDesc', 'Register your company or organization to publish demands and procure bulk produce.')
                      : t('landing.buyerLoginDesc', 'Enter your organization name, email or mobile, and password to manage bulk procurement.')}
                  </p>
                </div>

                {serverError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.84rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} />
                    <span>{serverError}</span>
                  </div>
                )}

                <form onSubmit={handleBuyerLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Name / Organization */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t('landing.orgName', 'Name / Organization')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div className="input-icon-group">
                      <input
                        type="text"
                        className={`form-control ${buyerErrors.name ? 'error' : ''}`}
                        placeholder="Enter organization or buyer name"
                        value={buyerForm.name}
                        onChange={(e) => setBuyerForm({ ...buyerForm, name: e.target.value })}
                        style={{ paddingLeft: 36 }}
                      />
                      <Building2 size={16} className="input-icon-left" />
                    </div>
                    {buyerErrors.name && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <AlertCircle size={12} /> {buyerErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Email or Mobile */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t('landing.emailOrMobile', 'Email or Mobile Number')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div className="input-icon-group">
                      <input
                        type="text"
                        className={`form-control ${buyerErrors.identifier ? 'error' : ''}`}
                        placeholder="e.g. procurement@freshmart.in or 9820012345"
                        value={buyerForm.identifier}
                        onChange={(e) => setBuyerForm({ ...buyerForm, identifier: e.target.value })}
                        style={{ paddingLeft: 36 }}
                      />
                      <Mail size={16} className="input-icon-left" />
                    </div>
                    {buyerErrors.identifier && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <AlertCircle size={12} /> {buyerErrors.identifier}
                      </span>
                    )}
                  </div>

                  {authMode === 'register' && (
                    <>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('landing.businessType', 'Business Type')}</label>
                        <input
                          type="text"
                          className="form-control"
                          value={buyerForm.businessType}
                          onChange={(e) => setBuyerForm({ ...buyerForm, businessType: e.target.value })}
                          placeholder="e.g. Supermarket Chain"
                        />
                      </div>

                      <div className="location-section">
                        <div className="location-section-header">
                          <span className="location-section-title">📍 {t('landing.location', 'Location')}</span>
                          <button
                            type="button"
                            className="geo-locate-btn"
                            onClick={() => handleUseCurrentLocation('buyer')}
                            disabled={geoLoading.buyer}
                          >
                            {geoLoading.buyer ? (
                              <><span className="geo-spinner" /> Detecting…</>
                            ) : (
                              <>⌖ {t('landing.useCurrentLocation', 'Use my current location')}</>
                            )}
                          </button>
                        </div>
                        {geoMessage.buyer && <p className="geo-status-message">{geoMessage.buyer}</p>}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              {t('landing.state', 'State')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                              className={`form-control ${buyerErrors.state ? 'error' : ''}`}
                              value={buyerForm.state}
                              onChange={(e) => setBuyerForm({ ...buyerForm, state: e.target.value, district: '' })}
                            >
                              <option value="">Select state</option>
                              {ALL_STATE_NAMES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            {buyerErrors.state && (
                              <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <AlertCircle size={12} /> {buyerErrors.state}
                              </span>
                            )}
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              {t('landing.cityDistrict', 'City / District')} <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                              className={`form-control ${buyerErrors.district ? 'error' : ''}`}
                              value={buyerForm.district}
                              onChange={(e) => setBuyerForm({ ...buyerForm, district: e.target.value })}
                              disabled={!buyerForm.state}
                            >
                              <option value="">{buyerForm.state ? 'Select district' : 'Select state first'}</option>
                              {getDistrictsForState(buyerForm.state).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            {buyerErrors.district && (
                              <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                <AlertCircle size={12} /> {buyerErrors.district}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: '10px 0 12px' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {t('landing.locality', 'Locality / Area')}{' '}
                            <span style={{ fontWeight: 500, color: 'var(--neutral-500)' }}>({t('common.optional', 'optional')})</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={buyerForm.locality}
                            onChange={(e) => setBuyerForm({ ...buyerForm, locality: e.target.value })}
                            placeholder="e.g. Kothrud, near APMC yard"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Password */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t('landing.password', 'Password')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div className="input-icon-group">
                      <input
                        type={showBuyerPassword ? 'text' : 'password'}
                        className={`form-control ${buyerErrors.password ? 'error' : ''}`}
                        placeholder="Enter password"
                        value={buyerForm.password}
                        onChange={(e) => setBuyerForm({ ...buyerForm, password: e.target.value })}
                        style={{ paddingLeft: 36, paddingRight: 36 }}
                      />
                      <Lock size={16} className="input-icon-left" />
                      <button
                        type="button"
                        onClick={() => setShowBuyerPassword(!showBuyerPassword)}
                        className="input-icon-toggle"
                      >
                        {showBuyerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {buyerErrors.password && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <AlertCircle size={12} /> {buyerErrors.password}
                      </span>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className="btn" 
                    disabled={authLoading}
                    style={{ width: '100%', marginTop: 8, padding: '12px', backgroundColor: '#1e40af', color: '#ffffff' }}
                  >
                    {authLoading ? t('landing.connecting', 'Connecting...') : authMode === 'register' ? t('landing.registerBuyerAccount', 'Register Account') : t('landing.loginAsBuyer', 'Login as Buyer')}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: 4 }}>
                    Switch to <button type="button" onClick={() => { setActiveLoginForm('farmer'); setServerError(''); }} style={{ color: '#1e40af', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>{t('landing.switchToFarmer', 'Farmer Login')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Minimal Clean Footer */}
      <footer className="landing-simple-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px 36px' }}>
        <div>
          <strong>{t('brand.title', 'AgriLink')}</strong> • {t('landing.footerText', 'Agricultural Price Discovery & Supply Aggregation')}
        </div>
      </footer>
    </div>
  );
}
