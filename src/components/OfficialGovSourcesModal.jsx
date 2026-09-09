import React from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Layers, 
  Sparkles, 
  KeyRound, 
  Building2 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const GOVT_PORTALS_DATA = [
  {
    id: 'data-gov-mandi',
    name: 'Open Government Data (OGD) Platform — Mandi Price Dataset',
    organization: 'National Informatics Centre (NIC) / MeitY',
    domain: 'data.gov.in',
    url: 'https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi',
    category: 'Mandi Prices & Open Data',
    description:
      'Official daily mandi price and market arrival records across APMC mandis. Connected directly via our backend /api/market-prices endpoint.',
    apiStatus: 'Integrated in Backend (Requires DATA_GOV_API_KEY)',
    verified: true
  },
  {
    id: 'agmarknet',
    name: 'Agmarknet (Agricultural Marketing Information Network)',
    organization: 'Directorate of Marketing & Inspection (DMI), Ministry of Agriculture',
    domain: 'agmarknet.gov.in',
    url: 'https://agmarknet.gov.in/',
    category: 'Daily Mandi Arrivals & Prices',
    description:
      'Government portal tracking wholesale commodity prices, daily market arrivals, grade standards, and interstate price trends.',
    apiStatus: 'Official Web & Portal Feeds',
    verified: true
  },
  {
    id: 'enam',
    name: 'e-NAM (National Agriculture Market)',
    organization: 'Small Farmers Agribusiness Consortium (SFAC)',
    domain: 'enam.gov.in',
    url: 'https://www.enam.gov.in/',
    category: 'Electronic Mandi Trading',
    description:
      'Pan-India electronic trading portal networking APMCs across states for unified, transparent competitive bidding.',
    apiStatus: 'Official Government Trading Platform',
    verified: true
  },
  {
    id: 'pm-kisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    organization: 'Department of Agriculture & Farmers Welfare (DAC&FW)',
    domain: 'pmkisan.gov.in',
    url: 'https://pmkisan.gov.in/',
    category: 'Direct Income Support',
    description:
      'Central scheme providing direct financial benefit of ₹6,000 per year in three 4-monthly installments to farmer families.',
    apiStatus: 'Aadhaar / Mobile Beneficiary Verification',
    verified: true
  },
  {
    id: 'soil-health',
    name: 'Soil Health Card Portal',
    organization: 'Ministry of Agriculture and Farmers Welfare',
    domain: 'soilhealth.dac.gov.in',
    url: 'https://soilhealth.dac.gov.in/',
    category: 'Soil Nutrient Analysis',
    description:
      'Provides farmers with soil nutrient status cards, crop-specific fertilizer dosage recommendations, and soil testing lab locator.',
    apiStatus: 'Official Soil Lab Portal',
    verified: true
  },
  {
    id: 'mkisan',
    name: 'mKisan Portal & Kisan Call Centre (KCC)',
    organization: 'Ministry of Agriculture and Farmers Welfare',
    domain: 'mkisan.gov.in',
    url: 'https://mkisan.gov.in/',
    category: 'Helpline & SMS Advisories',
    description:
      'SMS-based weather and agronomy advisories and toll-free expert agricultural advice via Kisan Call Centre (1800-180-1551).',
    apiStatus: 'Toll-Free 1800-180-1551 Helpline & SMS',
    verified: true
  },
  {
    id: 'imd-agromet',
    name: 'IMD Mausam (Agromet Advisory Services)',
    organization: 'India Meteorological Department, Ministry of Earth Sciences',
    domain: 'mausam.imd.gov.in',
    url: 'https://mausam.imd.gov.in/',
    category: 'Weather & Agromet Advisories',
    description:
      'Official district-level agrometeorological advisories, monsoon progress tracking, rainfall maps, and extreme weather alerts.',
    apiStatus: 'Official IMD Meteorological Service',
    verified: true
  },
  {
    id: 'desagri',
    name: 'Directorate of Economics and Statistics (DESAgri)',
    organization: 'Department of Agriculture & Farmers Welfare',
    domain: 'desagri.gov.in',
    url: 'https://desagri.gov.in/',
    category: 'National Crop Statistics & MSP',
    description:
      'Official data on agricultural production, area under cultivation, Minimum Support Prices (MSP), and national food grain statistics.',
    apiStatus: 'Official Government Agricultural Statistics',
    verified: true
  },
  {
    id: 'icar',
    name: 'Indian Council of Agricultural Research (ICAR)',
    organization: 'Department of Agricultural Research and Education (DARE)',
    domain: 'icar.org.in',
    url: 'https://icar.org.in/',
    category: 'Research, High-Yield Seeds & Agronomy',
    description:
      'National apex body for coordinating, guiding, and managing agricultural research, seed varieties, and soil science in India.',
    apiStatus: 'Official Research Organization',
    verified: true
  }
];

export default function OfficialGovSourcesModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '840px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)', color: '#ffffff', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255, 255, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              🏛️
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {t('govModal.title', "Official Government of India Agriculture Portals")}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#bbf7d0', margin: '3px 0 0 0' }}>
                {t('govModal.subtitle', "Verified official portals, datasets, and public services")}
              </p>
            </div>
          </div>
          <button 
            className="modal-close" 
            onClick={onClose} 
            style={{ color: '#ffffff', background: 'rgba(255, 255, 255, 0.15)' }}
            aria-label={t('btn.close', "Close")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--neutral-50)' }}>
          {/* API Info Alert */}
          <div style={{ 
            padding: '14px 18px', 
            backgroundColor: '#ffffff', 
            borderRadius: 'var(--radius-lg)', 
            border: '1.5px solid var(--neutral-200)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <Database size={22} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--neutral-700)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--neutral-900)' }}>{t('govModal.protocol', "Official Data Protocol:")}</strong> {t('govModal.protocolText', "All mandi price data and agricultural intelligence in KisanSetu adhere to verified Government of India feeds (such as the data.gov.in Mandi Price Catalog and Agmarknet). We never invent or fabricate agricultural data.")}
            </div>
          </div>

          {/* Portals Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {GOVT_PORTALS_DATA.map((portal) => (
              <div 
                key={portal.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ 
                      display: 'inline-block',
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      color: 'var(--primary-700)',
                      backgroundColor: 'rgba(45, 90, 39, 0.08)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      marginBottom: 6
                    }}>
                      {portal.category}
                    </span>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--neutral-900)', margin: 0 }}>
                      {portal.name}
                    </h3>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', fontWeight: 600 }}>
                  🏛️ {portal.organization}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--neutral-600)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                  {portal.description}
                </p>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  paddingTop: 10, 
                  borderTop: '1px solid var(--neutral-100)',
                  marginTop: 'auto'
                }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--neutral-500)' }}>
                    Domain: <strong style={{ color: 'var(--neutral-800)' }}>{portal.domain}</strong>
                  </div>

                  <a 
                    href={portal.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                    style={{ gap: 5, fontSize: '0.78rem', padding: '5px 10px', textDecoration: 'none' }}
                  >
                    <span>{t('govModal.visit', "Visit Official Portal")}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '14px 24px', backgroundColor: '#ffffff', borderTop: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
            {t('govModal.footerText', "All linked domains are official Government of India (.gov.in / .nic.in / .org.in) portals.")}
          </span>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            {t('btn.close', "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
