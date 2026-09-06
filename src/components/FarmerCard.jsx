import React from 'react';
import { MapPin, CheckCircle, PlusCircle, Star, Phone, ShieldCheck, Users, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerCard({ 
  farmer, 
  onViewDetails, 
  onAddToRequirement, 
  onAddToCart,
  isInCart = false,
  isSelected = false 
}) {
  const { t } = useLanguage();
  const isFPO = farmer.type === 'FPO';

  return (
    <div className={`card ${isSelected ? 'border-primary' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{farmer.farmerName || farmer.name}</h4>
            <span className={`badge ${isFPO ? 'badge-info' : 'badge-neutral'}`}>
              {isFPO ? <><Users size={12} /> {t('common.fpo', 'FPO')}</> : t('common.farmer', 'Farmer')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--neutral-500)', marginTop: 4 }}>
            <MapPin size={13} />
            <span>{farmer.location}</span>
            {farmer.distanceKm && <span>• {farmer.distanceKm} {t('common.kmAway', 'km away')}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
          <Star size={12} fill="#f59e0b" color="#f59e0b" />
          <span>{farmer.rating || '4.9'}</span>
        </div>
      </div>

      <div style={{ background: 'var(--neutral-50)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.crop', 'Produce')}</span>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span>{farmer.emoji || '🌱'}</span> {farmer.produce}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('farmer.availableStock', 'Available Stock')}</span>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--neutral-900)', marginTop: 2 }}>
            {farmer.quantity?.toLocaleString() || farmer.currentStockKg?.toLocaleString()} {farmer.unit || 'kg'}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.expectedRate', 'Expected Rate')}</span>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-700)', marginTop: 2 }}>
            ₹{farmer.expectedPrice?.toLocaleString() || '2,800'} <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.qualityGrade', 'Quality Grade')}</span>
          <div style={{ marginTop: 2 }}>
            <span className="badge badge-grade">{farmer.quality || 'Grade A'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary-700)', fontWeight: 600 }}>
          <ShieldCheck size={14} /> {t('farmer.verified', 'Aadhaar & Land Verified')}
        </span>
        {farmer.storageAvailable && <span>{t('farmer.storageReady', 'Storage Ready ✓')}</span>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
        {onViewDetails && (
          <button className="btn btn-secondary btn-sm" style={{ flex: '1 1 auto' }} onClick={() => onViewDetails(farmer)}>
            {t('btn.viewDetails', 'View Details')}
          </button>
        )}
        {onAddToCart && (
          <button 
            className={`btn btn-sm ${isInCart ? 'btn-success' : 'btn-primary'}`} 
            style={{ flex: '1.2 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} 
            onClick={() => onAddToCart(farmer)}
          >
            {isInCart ? (
              <><CheckCircle size={14} /> {t('cart.inCart', 'In Cart')}</>
            ) : (
              <><ShoppingCart size={14} /> {t('cart.addToCart', 'Add to Cart')}</>
            )}
          </button>
        )}
        {onAddToRequirement && (
          <button 
            className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-secondary'}`} 
            style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} 
            onClick={() => onAddToRequirement(farmer)}
          >
            {isSelected ? (
              <><CheckCircle size={14} /> {t('btn.added', 'Added')}</>
            ) : (
              <><PlusCircle size={14} /> {t('btn.addToRequirement', 'Add to Requirement')}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
