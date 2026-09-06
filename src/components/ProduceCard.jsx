import React from 'react';
import { Calendar, Warehouse, MapPin, Edit3, Trash2, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ProduceCard({ item, onEdit, onDelete, onViewOffers }) {
  const { t } = useLanguage();

  return (
    <div className="produce-card">
      <div className="produce-card-header">
        <div className="produce-title-group">
          <div className="produce-emoji-box">
            {item.emoji || '🌱'}
          </div>
          <div>
            <div className="produce-name">{item.produce}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span className="badge badge-grade">{item.quality}</span>
              <span className={`badge ${item.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                {item.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="produce-card-body">
        <div className="produce-detail-row">
          <span className="produce-detail-label">{t('produce.availableQuantity', 'Available Quantity')}</span>
          <span className="produce-detail-value">{(item.quantity || 0).toLocaleString()} {item.unit || 'kg'}</span>
        </div>

        <div className="produce-detail-row">
          <span className="produce-detail-label">{t('produce.expectedPrice', 'Expected Price')}</span>
          <span className="produce-detail-value produce-price-highlight">
            ₹{(item.expectedPrice || 0).toLocaleString()} <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>/ {t('unit.quintal', 'quintal')}</span>
          </span>
        </div>

        <div className="produce-detail-row">
          <span className="produce-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={14} /> {t('produce.harvestDate', 'Harvest Date')}
          </span>
          <span className="produce-detail-value" style={{ fontWeight: 600 }}>{item.harvestDate}</span>
        </div>

        <div className="produce-detail-row">
          <span className="produce-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Warehouse size={14} /> {t('produce.storageFacility', 'Storage Facility')}
          </span>
          <span className="produce-detail-value" style={{ color: item.storageAvailable ? 'var(--primary-700)' : 'var(--neutral-500)' }}>
            {item.storageAvailable ? t('produce.availableOnFarm', 'Available on Farm ✓') : t('produce.directDispatch', 'Direct Dispatch')}
          </span>
        </div>

        <div className="produce-detail-row">
          <span className="produce-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} /> {t('produce.location', 'Location')}
          </span>
          <span className="produce-detail-value" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.location}</span>
        </div>
      </div>

      <div className="produce-card-footer">
        {onViewOffers && (
          <button className="btn btn-outline-primary btn-sm" onClick={() => onViewOffers(item)}>
            <Eye size={14} /> {t('btn.viewOffers', 'View Offers')}
          </button>
        )}
        {onEdit && (
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(item)}>
            <Edit3 size={14} /> {t('btn.edit', 'Edit')}
          </button>
        )}
        {onDelete && (
          <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(item.id)}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
