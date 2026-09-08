import React from 'react';
import { Package, MapPin, ChevronRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function OrderCard({ order, onViewOrder, onUpdateStep }) {
  const { t } = useLanguage();
  const isAggregated = order.orderType === 'Aggregated';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Header: Order ID & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.2rem' }}>{order.emoji || '📦'}</span>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{t('order.orderHash', 'ORDER #')}{order.id}</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
              {isAggregated ? t('order.multiSupplierAggregation', '⚡ Multi-Supplier Aggregation') : t('order.directOrder', 'Direct Order')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            ● {order.orderStatus}
          </span>
        </div>
      </div>

      {/* Main Essential Information Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: 10, 
          background: 'var(--neutral-50)', 
          padding: '12px 14px', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--neutral-200)'
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('produce.crop', 'Produce')}</span>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', marginTop: 2 }}>{order.produce}</div>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('produce.quantity', 'Quantity')}</span>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', marginTop: 2 }}>
            {(order.totalQuantity || order.quantity || 0).toLocaleString()} {order.unit || 'kg'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            {isAggregated ? t('common.suppliers', 'Suppliers') : t('common.buyerSupplier', 'Buyer / Supplier')}
          </span>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', marginTop: 2 }}>
            {isAggregated ? `${order.suppliers?.length || 4} ${t('common.suppliers', 'Suppliers')}` : (order.buyer || order.supplier || 'Verified')}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('produce.price', 'Price')}</span>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--primary-700)', marginTop: 2 }}>
            ₹{(order.averagePrice || order.price || 0).toLocaleString()}/{t('unit.quintalShort', 'q')}
          </div>
        </div>
      </div>

      {/* Delivery Location & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--neutral-200)', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--neutral-700)' }}>
          <MapPin size={15} style={{ color: 'var(--primary-600)' }} />
          <span>{order.deliveryLocation || t('order.locationNotProvided', 'Location not provided')}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {onUpdateStep && (order.stepIndex || 0) < (order.steps?.length || 4) - 1 && (
            <button className="btn btn-outline-primary btn-sm" onClick={() => onUpdateStep(order.id)}>
              {t('order.advanceStatus', 'Advance Status →')}
            </button>
          )}
          {onViewOrder && (
            <button className="btn btn-secondary btn-sm" onClick={() => onViewOrder(order)}>
              {t('btn.viewOrder', 'View Order')} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
