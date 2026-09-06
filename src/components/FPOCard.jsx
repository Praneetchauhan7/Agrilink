import React from 'react';
import { Users, MapPin, CheckCircle2, ShieldCheck, Phone, Package, Warehouse } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FPOCard({ fpo, onViewFPO }) {
  const { t } = useLanguage();

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{fpo.name}</h4>
            {fpo.verified && (
              <span className="badge badge-success" style={{ gap: 3 }}>
                <ShieldCheck size={12} /> {t('fpo.verifiedFpo', 'Verified FPO')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--neutral-500)', marginTop: 4 }}>
            <MapPin size={13} />
            <span>{fpo.location}</span>
            <span>• {t('common.est', 'Est.')} {fpo.established}</span>
          </div>
        </div>

        <div style={{ background: 'var(--primary-50)', padding: '6px 12px', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary-800)', fontWeight: 800, fontSize: '0.9rem' }}>
            <Users size={14} /> {fpo.membersCount}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)' }}>{t('fpo.memberFarmers', 'Member Farmers')}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--neutral-50)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('fpo.aggregatedStockReady', 'Aggregated Stock Ready')}</span>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--neutral-900)', marginTop: 2 }}>
            {(fpo.currentStockKg || 0).toLocaleString()} kg
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('fpo.cropsHandled', 'Crops Handled')}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {fpo.availableProduce.map((p, idx) => (
              <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{p}</span>
            ))}
          </div>
        </div>
      </div>

      {fpo.facilities && (
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-600)' }}>{t('fpo.infrastructure', 'Infrastructure & Facilities:')}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {fpo.facilities.map((fac, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--neutral-700)', background: 'var(--neutral-100)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                ✓ {fac}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--neutral-100)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
          {t('common.contact', 'Contact')}: <strong>{fpo.contactPerson}</strong>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onViewFPO(fpo)}>
          {t('btn.viewFpoSupplies', 'View FPO & Supplies')}
        </button>
      </div>
    </div>
  );
}
