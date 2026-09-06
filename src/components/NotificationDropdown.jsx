import React from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Truck, 
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationDropdown({ 
  notifications = [], 
  onClose, 
  onMarkAllAsRead,
  onNotificationClick
}) {
  const { t } = useLanguage();

  const getIcon = (type) => {
    switch (type) {
      case 'aggregation':
        return <Sparkles size={16} style={{ color: 'var(--primary-600)' }} />;
      case 'price':
        return <TrendingUp size={16} style={{ color: '#0284c7' }} />;
      case 'payment':
        return <DollarSign size={16} style={{ color: '#16a34a' }} />;
      case 'offer':
        return <ShoppingBag size={16} style={{ color: '#7c3aed' }} />;
      case 'logistics':
        return <Truck size={16} style={{ color: '#d97706' }} />;
      default:
        return <Package size={16} style={{ color: '#d97706' }} />;
    }
  };

  const handleItemClick = (n) => {
    if (onNotificationClick) {
      onNotificationClick(n);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: 60,
        right: 28,
        width: 380,
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--neutral-200)',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'modalPop 0.15s ease-out'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} style={{ color: 'var(--primary-700)' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('nav.notifications', 'Notifications')}</h4>
        </div>
        <button 
          style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={onMarkAllAsRead}
        >
          <CheckCheck size={14} /> {t('common.markAllRead', 'Mark all read')}
        </button>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem' }}>
            {t('common.noNotifications', 'No new notifications')}
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              onClick={() => handleItemClick(n)}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--neutral-100)',
                backgroundColor: n.unread ? 'var(--primary-50)' : '#ffffff',
                display: 'flex',
                gap: 12,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = n.unread ? '#dcfce7' : '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = n.unread ? 'var(--primary-50)' : '#ffffff';
              }}
            >
              <div style={{ marginTop: 2, width: 30, height: 30, borderRadius: 'var(--radius-full)', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--neutral-200)', flexShrink: 0 }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                    {n.title}
                  </div>
                  {n.unread && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', marginLeft: 6 }} />
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', marginTop: 2, lineHeight: 1.4 }}>
                  {n.message}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--neutral-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {n.time}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--primary-700)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {t('btn.viewDetails', 'View details')} <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '10px 16px', background: 'var(--neutral-50)', textAlign: 'center', borderTop: '1px solid var(--neutral-200)', fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
        {t('notifications.hint', 'Click any notification to jump directly to details')}
      </div>
    </div>
  );
}
