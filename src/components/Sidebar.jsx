import React from 'react';
import {
  LayoutDashboard,
  Sprout,
  TrendingUp,
  Store,
  Send,
  Package,
  Truck,
  Bell,
  User,
  Users,
  Search,
  PlusCircle,
  Layers,
  Repeat,
  LogOut,
  Sparkles,
  Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({
  role = 'farmer', // 'farmer' or 'buyer'
  currentUser = null,
  activeTab = 'dashboard',
  onSelectTab,
  onSwitchRole,
  onLogout,
  counts = {},
  isMobileOpen = false,
  onCloseMobile
}) {
  const { t } = useLanguage();
  const isFarmer = role === 'farmer';

  const displayName = currentUser?.name || (isFarmer ? t('role.farmer', 'Farmer') : t('role.buyer', 'Buyer'));
  const displayLocation = currentUser?.location || currentUser?.state || '';
  const avatarInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const farmerNavItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'produce', label: t('nav.myProduce', 'My Produce'), icon: Sprout, badge: counts.farmerProduce },
    { id: 'market-prices', label: t('nav.marketPrices', 'Market Prices'), icon: TrendingUp },
    { id: 'buyer-demand', label: t('nav.buyerDemand', 'Buyer Requests'), icon: Store, badge: counts.buyerDemand },
    { id: 'orders', label: t('nav.orders', 'Orders'), icon: Package, badge: counts.farmerOrders },
    { id: 'notifications', label: t('nav.notifications', 'Notifications'), icon: Bell, badge: counts.unreadNotifs },
    { id: 'profile', label: t('nav.profile', 'Profile'), icon: User }
  ];

  const buyerNavItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'find-produce', label: t('nav.produceListings', 'Produce Listings'), icon: Search },
    { id: 'market-prices', label: t('nav.marketPrices', 'Market Prices'), icon: TrendingUp },
    { id: 'create-requirement', label: t('nav.buyerDemand', 'Buyer Requests'), icon: PlusCircle, badge: counts.buyerDemand },
    { id: 'orders', label: t('nav.orders', 'Orders'), icon: Package, badge: counts.buyerOrders },
    { id: 'notifications', label: t('nav.notifications', 'Notifications'), icon: Bell, badge: counts.unreadNotifs },
    { id: 'profile', label: t('nav.profile', 'Profile'), icon: User }
  ];

  const navItems = isFarmer ? farmerNavItems : buyerNavItems;

  const handleNavClick = (id) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-logo" onClick={() => handleNavClick('dashboard')}>
            <div className="brand-icon">🌱</div>
            <div className="brand-text">
              <h2>{t('brand.title', 'AgriLink')}</h2>
              <span>{t('brand.subtitle', 'Farm Gate to Markets')}</span>
            </div>
          </div>
        </div>

        {/* Current Active Role Indicator */}
        <div className="sidebar-role-indicator">
          <span className="role-badge-pill" style={{ backgroundColor: isFarmer ? 'rgba(45, 90, 39, 0.1)' : 'rgba(30, 64, 175, 0.1)', color: isFarmer ? 'var(--primary-700)' : '#1e40af' }}>
            {isFarmer ? t('portal.farmer', '👨‍🌾 Farmer Portal') : t('portal.buyer', '🏢 Buyer Portal')}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <div className="nav-icon">
                  <Icon size={18} />
                </div>
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Market Pulse Widget */}
        <div className="sidebar-market-pulse">
          <div className="sidebar-market-pulse-title">{t('market.officialFeed', 'Market Pulse (Live Mandi)')}</div>
          <div className="sidebar-market-pulse-row">
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
                🍅 Tomatoes
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--neutral-500)' }}>
                Nashik APMC Mandi
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                ₹2,850/q
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                Live Mandi
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer with Profile & Logout */}
        <div className="sidebar-footer">
          <div className="user-snippet" onClick={() => handleNavClick('profile')} style={{ cursor: 'pointer' }}>
            <div className="user-avatar" style={{ backgroundColor: isFarmer ? 'var(--primary-600)' : '#1e40af' }}>
              {avatarInitials}
            </div>
            <div className="user-info">
              <div className="user-name">
                {displayName}
              </div>
              <div className="user-location">
                {displayLocation}
              </div>
            </div>
          </div>

          <button 
            id="sidebar-logout-btn"
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', gap: 8, color: 'var(--neutral-700)', fontWeight: 700 }}
            onClick={onLogout}
          >
            <LogOut size={16} /> {t('btn.logout', 'Logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
