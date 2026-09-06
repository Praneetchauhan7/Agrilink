import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  DollarSign, 
  Package, 
  Store, 
  TrendingUp, 
  ArrowRight, 
  CheckCheck, 
  Tag, 
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationsPage({
  role = 'farmer',
  notifications = [],
  onNotificationClick,
  onMarkAllRead
}) {
  const { t } = useLanguage();
  const unreadCount = notifications.filter((n) => n.unread).length;

  const getNotifIcon = (notif) => {
    const type = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const entityType = (notif.related_entity_type || '').toLowerCase();

    if (entityType === 'offer' || type.includes('offer') || title.includes('offer')) {
      return <Tag size={18} style={{ color: 'var(--primary-600)' }} />;
    }
    if (entityType === 'transaction' || type.includes('transaction') || type.includes('payment') || title.includes('escrow') || title.includes('payment')) {
      return <ShieldCheck size={18} style={{ color: '#059669' }} />;
    }
    if (entityType === 'order' || type.includes('order') || title.includes('order')) {
      return <Package size={18} style={{ color: '#0284c7' }} />;
    }
    if (entityType === 'demand' || type.includes('demand') || title.includes('requirement')) {
      return <Store size={18} style={{ color: '#d97706' }} />;
    }
    if (type.includes('price') || title.includes('price') || title.includes('mandi')) {
      return <TrendingUp size={18} style={{ color: '#7c3aed' }} />;
    }
    if (type.includes('logistics') || title.includes('shipment')) {
      return <Truck size={18} style={{ color: '#0d9488' }} />;
    }
    return <Bell size={18} style={{ color: 'var(--primary-600)' }} />;
  };

  const getDestinationLabel = (notif) => {
    const type = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    const entityType = (notif.related_entity_type || '').toLowerCase();

    if (entityType === 'offer' || type.includes('offer') || title.includes('offer')) {
      return t('notifications.viewOffers', 'View Offers & Negotiate');
    }
    if (entityType === 'transaction' || type.includes('transaction') || type.includes('payment') || title.includes('escrow') || title.includes('payment')) {
      return t('notifications.viewTransactions', 'View Transactions & Escrow');
    }
    if (entityType === 'order' || type.includes('order') || title.includes('order')) {
      return t('notifications.viewOrders', 'View Orders');
    }
    if (entityType === 'demand' || type.includes('demand') || title.includes('requirement')) {
      return role === 'farmer' ? t('notifications.viewDemands', 'View Buyer Requests') : t('notifications.viewReqs', 'View Requirements');
    }
    if (type.includes('price') || title.includes('price')) {
      return t('notifications.viewPrices', 'View Market Prices');
    }
    return t('notifications.viewDetails', 'View Details');
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">{t('nav.notifications', 'Notifications')}</h1>
            {unreadCount > 0 && (
              <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                {unreadCount} {t('common.unread', 'unread')}
              </span>
            )}
          </div>
          <p className="page-subtitle">
            {t('notifications.subtitle', 'Real-time alerts for offers, contracts, escrow payments, and procurement orders.')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onMarkAllRead}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <CheckCheck size={16} />
            <span>{t('notifications.markAllRead', 'Mark all as read')}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: notifications.length === 0 ? '48px 24px' : '8px 16px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--neutral-500)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--neutral-400)' }}>
              <Bell size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
              {t('notifications.noNotifs', 'No notifications yet')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: 4, maxWidth: 420, margin: '4px auto 0' }}>
              {t('notifications.emptyDesc', 'You will receive real-time alerts here when buyers send purchase offers, when escrow contracts advance, or when market rates update.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n, idx) => {
              const isUnread = !!n.unread;
              return (
                <div 
                  key={n.id || idx}
                  onClick={() => onNotificationClick && onNotificationClick(n)}
                  style={{ 
                    padding: '16px 12px', 
                    borderBottom: idx < notifications.length - 1 ? '1px solid var(--neutral-100)' : 'none',
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isUnread ? 'rgba(45, 90, 39, 0.04)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isUnread ? 'rgba(45, 90, 39, 0.08)' : 'var(--neutral-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isUnread ? 'rgba(45, 90, 39, 0.04)' : 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: isUnread ? 'var(--primary-50)' : 'var(--neutral-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {getNotifIcon(n)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--neutral-900)' }}>{n.title}</strong>
                        {isUnread && (
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-600)', 
                            display: 'inline-block' 
                          }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginTop: 4, lineHeight: 1.45 }}>
                        {n.message}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                        <span>{n.time || 'Recently'}</span>
                        {n.type && <span style={{ textTransform: 'capitalize' }}>• {n.type}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                      {getDestinationLabel(n)}
                    </span>
                    <ArrowRight size={15} style={{ color: 'var(--primary-700)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
