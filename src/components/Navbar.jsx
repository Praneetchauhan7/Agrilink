import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Globe, 
  Bell, 
  Repeat, 
  ChevronDown, 
  ShieldCheck,
  Check,
  Building2,
  ShoppingCart
} from 'lucide-react';
import { LogOut } from 'lucide-react';
import SearchBar from './SearchBar';
import NotificationDropdown from './NotificationDropdown';
import { LANGUAGES } from '../constants/languages';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({
  role = 'farmer',
  currentUser = null,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  currentLanguage: propCurrentLanguage,
  onSelectLanguage: propOnSelectLanguage,
  notifications = [],
  onOpenNotifications = () => {},
  isNotifOpen,
  setIsNotifOpen,
  onMarkAllNotifsRead = () => {},
  onNotificationClick = (_notif) => {},
  onOpenMobileMenu = () => {},
  onLogout = () => {},
  cartCount = 0,
  onOpenCart = null
}) {
  const { t, language, setLanguage, currentLangObj } = useLanguage();
  const currentLanguage = propCurrentLanguage || language;
  const onSelectLanguage = propOnSelectLanguage || setLanguage;
  const [isLangOpen, setIsLangOpen] = useState(false);

  const isFarmer = role === 'farmer';
  const unreadCount = notifications.filter((n) => n.unread).length;

  const displayName = currentUser?.name || (isFarmer ? t('role.farmer', 'Farmer') : t('role.buyer', 'Buyer'));

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="mobile-menu-btn" 
          onClick={onOpenMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Menu size={20} />
        </button>

        <SearchBar 
          value={searchQuery} 
          onChange={onSearchChange} 
          onSearch={onSearchSubmit}
          placeholder={isFarmer ? t('search.farmerPlaceholder', "Search market rates, buyers, mandis...") : t('search.buyerPlaceholder', "Search for produce, varieties, FPOs...")}
        />
      </div>

      <div className="topbar-right">
        {/* Buyer Procurement Cart Button */}
        {!isFarmer && onOpenCart && (
          <button 
            id="navbar-cart-btn"
            className="btn btn-sm btn-primary"
            onClick={onOpenCart}
            style={{ gap: 6, fontSize: '0.82rem', padding: '6px 14px', fontWeight: 700 }}
            title="Open Procurement Cart"
          >
            <ShoppingCart size={15} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span 
                style={{ 
                  background: '#ffffff', 
                  color: 'var(--primary-700)', 
                  borderRadius: '999px', 
                  padding: '1px 6px', 
                  fontSize: '0.72rem', 
                  fontWeight: 800,
                  marginLeft: 2 
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* Language selector */}
        <div style={{ position: 'relative' }}>
          <button 
            className="lang-selector-btn"
            onClick={() => setIsLangOpen(!isLangOpen)}
            aria-label={t('btn.changeLanguage', "Change language")}
            title={t('btn.changeLanguage', "Change language")}
          >
            <Globe size={15} />
            <span>{currentLangObj.native}</span>
            <ChevronDown size={13} />
          </button>

          {isLangOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid var(--neutral-200)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                width: 190,
                maxHeight: 300,
                overflowY: 'auto',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {LANGUAGES.map((lang) => (
                <button 
                  key={lang.code}
                  className="nav-item" 
                  style={{ 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.82rem', 
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: currentLanguage === lang.code ? 'rgba(45, 90, 39, 0.08)' : 'transparent',
                    color: currentLanguage === lang.code ? 'var(--primary-600)' : 'var(--neutral-800)',
                    fontWeight: currentLanguage === lang.code ? 700 : 500
                  }}
                  onClick={() => { 
                    onSelectLanguage(lang.code); 
                    setIsLangOpen(false); 
                  }}
                >
                  <span>{lang.native} <span style={{ fontSize: '0.72rem', opacity: 0.65 }}>({lang.name})</span></span>
                  {currentLanguage === lang.code && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button 
            className="notification-btn" 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {isNotifOpen && (
            <NotificationDropdown 
              notifications={notifications}
              onClose={() => setIsNotifOpen(false)}
              onMarkAllAsRead={onMarkAllNotifsRead}
              onNotificationClick={onNotificationClick}
            />
          )}
        </div>

        {/* User indicator pill in topbar */}
        <div 
          id="navbar-user-pill"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            background: 'var(--neutral-100)', 
            padding: '4px 12px 4px 6px', 
            borderRadius: 'var(--radius-full)', 
            border: '1px solid var(--neutral-200)'
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-full)', background: isFarmer ? 'var(--primary-600)' : '#1e40af', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
            {isFarmer ? '👨‍🌾' : '🏢'}
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
            {displayName}
          </span>
        </div>

        {onLogout && (
          <button
            id="navbar-logout-btn"
            onClick={onLogout}
            title="Logout"
            className="btn btn-sm btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem', gap: 4 }}
          >
            <LogOut size={13} />
            <span>{t('btn.logout', 'Logout')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
