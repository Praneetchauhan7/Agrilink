import React from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, ShieldCheck, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RouteVisualizer({ logisticsData }) {
  const { t } = useLanguage();
  const data = logisticsData || {
    orderId: 'AG1024',
    produce: 'Tomatoes',
    emoji: '🍅',
    totalQuantity: '10,000 kg',
    vehicleNumber: 'MH-15-EG-4421',
    driverName: 'Sandeep Shinde',
    estimatedDeliveryDate: '30 Aug 2026',
    currentStatus: 'In Transit',
    currentStepIndex: 2, // 0: Confirmed, 1: Picked Up, 2: In Transit, 3: Delivered
    destination: {
      name: 'Pune Distribution Center',
      city: 'Pune, Maharashtra'
    }
  };

  const steps = [
    { label: t('status.confirmed', 'Confirmed'), desc: t('route.confirmedDesc', 'Order placed & locked') },
    { label: t('status.pickedUp', 'Picked Up'), desc: t('route.pickedUpDesc', 'Loaded from farm gates') },
    { label: t('status.inTransit', 'In Transit'), desc: t('route.inTransitDesc', 'On route to destination') },
    { label: t('status.delivered', 'Delivered'), desc: t('route.deliveredDesc', 'Final warehouse receipt') }
  ];

  const currentStep = data.currentStepIndex ?? 2;

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return t('status.confirmed', 'Confirmed');
      case 'picked up': return t('status.pickedUp', 'Picked Up');
      case 'in transit': return t('status.inTransit', 'In Transit');
      case 'delivered': return t('status.delivered', 'Delivered');
      default: return status || t('status.inTransit', 'In Transit');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--neutral-200)' }}>
        <div>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--neutral-500)', letterSpacing: 0.5 }}>
            {t('order.order', 'ORDER')} #{data.orderId}
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--neutral-900)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{data.emoji || '🍅'} {data.produce}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--neutral-600)' }}>• {data.totalQuantity}</span>
          </h2>
          <div style={{ fontSize: '0.88rem', color: 'var(--neutral-600)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={15} style={{ color: 'var(--primary-600)' }} />
            <span>{data.destination?.name || 'Pune Distribution Center'}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            ● {getStatusText(data.currentStatus)}
          </span>
        </div>
      </div>

      {/* Simplified Step Tracker */}
      <div style={{ margin: '32px 0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, position: 'relative', textAlign: 'center' }}>
          {/* Progress bar background line */}
          <div 
            style={{ 
              position: 'absolute', 
              top: 18, 
              left: '12%', 
              right: '12%', 
              height: 4, 
              backgroundColor: 'var(--neutral-200)', 
              zIndex: 1 
            }}
          >
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: 'var(--primary-600)', 
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
                transition: 'width 0.3s ease'
              }} 
            />
          </div>

          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={idx} style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: isDone || isCurrent ? 'var(--primary-600)' : '#ffffff',
                    border: isDone || isCurrent ? '2px solid var(--primary-600)' : '2px solid var(--neutral-300)',
                    color: isDone || isCurrent ? '#ffffff' : 'var(--neutral-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(45, 90, 39, 0.15)' : 'none',
                    marginBottom: 10
                  }}
                >
                  {isDone ? <Check size={18} /> : (isCurrent ? '●' : idx + 1)}
                </div>
                <strong style={{ fontSize: '0.88rem', color: isCurrent ? 'var(--primary-700)' : (isDone ? 'var(--neutral-900)' : 'var(--neutral-400)') }}>
                  {step.label}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', marginTop: 2 }}>
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Essential Delivery Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, background: 'var(--neutral-50)', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', marginTop: 20 }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
            {t('route.deliveryLocation', 'Delivery Location')}
          </span>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--neutral-900)', marginTop: 2 }}>
            {data.destination?.name || 'Pune Distribution Center'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
            {t('route.estimatedDelivery', 'Estimated Delivery')}
          </span>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 2 }}>
            {data.estimatedDeliveryDate || '30 Aug 2026'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
            {t('route.transportStatus', 'Transport Status')}
          </span>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--neutral-900)', marginTop: 2 }}>
            {getStatusText(data.currentStatus)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 700 }}>
            {t('route.assignedVehicle', 'Assigned Vehicle')}
          </span>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--neutral-900)', marginTop: 2 }}>
            {data.vehicleNumber || 'MH-15-EG-4421'}
          </div>
        </div>
      </div>
    </div>
  );
}
