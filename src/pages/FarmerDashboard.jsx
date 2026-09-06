import React, { useState } from 'react';
import { 
  Sprout, 
  TrendingUp, 
  Store, 
  Send, 
  Package, 
  PlusCircle, 
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  Search
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ProduceCard from '../components/ProduceCard';
import DashboardMandiPriceGraph from '../components/DashboardMandiPriceGraph';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerDashboard({ 
  farmerName = '', 
  location = '',
  produceListings = [],
  marketPrices = {},
  buyerDemands = [],
  offers = [],
  orders = [],
  onNavigate,
  onOpenAddProduceModal,
  onSubmitOfferClick,
  onSearch
}) {
  const { t } = useLanguage();
  const activeListingsCount = produceListings.filter((p) => p.status === 'Active' || p.status === 'active').length;
  const buyerRequestsCount = buyerDemands.length;
  const pendingOffersCount = offers.filter((o) => o.status === 'Pending' || o.status === 'pending').length;
  const activeOrdersCount = orders.filter((o) => o.orderStatus !== 'Delivered' && o.status !== 'completed').length;

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">{t('dashboard.welcomeFarmer', 'Welcome back,')} {farmerName ? farmerName.split(' ')[0] : t('role.farmer', 'Farmer')} 👋</h1>
            <p className="page-subtitle">
              {location 
                ? <>{t('dashboard.farmerSubtitle', 'Overview of your produce, buyer requests, and orders in')} <strong>{location}</strong>.</>
                : t('dashboard.farmerSubtitleGeneral', 'Overview of your produce, buyer requests, and orders.')
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('market-prices')}>
              <TrendingUp size={15} /> {t('dashboard.checkPrices', 'View Market Prices')}
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddProduceModal}>
              <PlusCircle size={15} /> + {t('produce.addNew', 'Add Produce')}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Essential Summary Cards */}
      <div className="stats-grid">
        <div style={{ cursor: 'pointer' }} onClick={() => onNavigate('produce')}>
          <StatCard 
            label={t('dashboard.totalStock', 'Active Produce')} 
            value={activeListingsCount} 
            icon={Sprout} 
            color="green" 
            subtitle={t('dashboard.activeBatches', 'Batches available for sale')}
          />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => onNavigate('buyer-demand')}>
          <StatCard 
            label={t('dashboard.activeDemands', 'Buyer Requests')} 
            value={buyerRequestsCount} 
            icon={Store} 
            color="amber" 
            subtitle={t('dashboard.verifiedBuyerReqs', 'Verified buyer requirements')}
          />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => onNavigate('offers')}>
          <StatCard 
            label={t('dashboard.pendingOffers', 'Pending Offers')} 
            value={pendingOffersCount} 
            icon={Send} 
            color="purple" 
            subtitle={t('dashboard.offersAwaiting', 'Offers awaiting confirmation')}
          />
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => onNavigate('orders')}>
          <StatCard 
            label={t('dashboard.activeOrders', 'Active Orders')} 
            value={activeOrdersCount} 
            icon={Package} 
            color="blue" 
            subtitle={t('dashboard.ordersInProgress', 'Orders in progress & delivery')}
          />
        </div>
      </div>

      {/* Live Mandi Market Price Graph (data.gov.in Integration) */}
      <DashboardMandiPriceGraph onNavigate={onNavigate} />

      {/* Main Section: My Produce */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('nav.myProduce', 'My Produce')}</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--neutral-500)' }}>
              {t('dashboard.manageStockDesc', 'Manage your stock and receive direct purchase offers.')}
            </p>
          </div>
          {produceListings.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('produce')}>
              {t('common.viewAll', 'View All')} ({produceListings.length}) <ArrowRight size={13} />
            </button>
          )}
        </div>

        {produceListings.length === 0 ? (
          <div className="card" style={{ padding: '36px 20px', textAlign: 'center', background: '#ffffff' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--primary-700)' }}>
              <Sprout size={24} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--neutral-800)' }}>{t('produce.noProduceListed', 'No produce listed yet')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: 4, maxWidth: 420, margin: '4px auto 16px' }}>
              {t('produce.noProduceDesc', 'Add your harvest lot to connect directly with institutional buyers and receive purchase offers.')}
            </p>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddProduceModal}>
              <PlusCircle size={15} /> + {t('produce.addNew', 'Add Produce')}
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {produceListings.slice(0, 3).map((item) => (
              <ProduceCard 
                key={item.id} 
                item={item} 
                onViewOffers={() => onNavigate('offers')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Two-Column Grid: Buyer Requests & Active Orders */}
      <div className="two-col-grid" style={{ marginTop: 28, marginBottom: 28 }}>
        {/* Buyer Requests Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Store size={18} style={{ color: 'var(--primary-600)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('nav.buyerDemands', 'Buyer Requests')}</h3>
            </div>
            {buyerDemands.length > 0 && (
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => onNavigate('buyer-demand')}
              >
                {t('common.viewAll', 'View All')} ({buyerDemands.length}) <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {buyerDemands.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--neutral-500)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--neutral-400)' }}>
                  <Store size={22} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--neutral-700)' }}>{t('demand.noDemands', 'No buyer requests available')}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: 4 }}>
                  {t('demand.noDemandsDesc', 'Procurement requests from verified buyers will appear here as they are posted.')}
                </p>
              </div>
            ) : (
              buyerDemands.slice(0, 3).map((demand) => (
                <div 
                  key={demand.id}
                  style={{
                    background: 'var(--neutral-50)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                      {demand.buyer}
                    </div>
                    <span className="badge badge-grade">{demand.quality}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--neutral-600)' }}>
                    <span>{demand.emoji || '🌾'} <strong>{(demand.quantity || demand.requiredQuantity || demand.quantityRequired || 0).toLocaleString()} kg</strong> {demand.produce}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{demand.expectedPriceRange || `₹${demand.targetPrice || 0}/q`}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px dashed var(--neutral-200)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                      {t('produce.deadline', 'Deadline')}: {demand.deadline || demand.requiredBy || t('common.open', 'Open')}
                    </span>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => onSubmitOfferClick(demand)}
                    >
                      {t('offers.submitOffer', 'Submit Offer')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Orders Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} style={{ color: 'var(--primary-600)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('dashboard.activeOrders', 'Active Orders')}</h3>
            </div>
            {orders.length > 0 && (
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => onNavigate('orders')}
              >
                {t('common.viewAll', 'View All')} ({orders.length}) <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--neutral-500)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--neutral-400)' }}>
                  <Package size={22} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--neutral-700)' }}>{t('order.noOrders', 'No orders yet')}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: 4 }}>
                  {t('order.noOrdersDesc', 'Confirmed purchase orders with delivery tracking and escrow will appear here.')}
                </p>
              </div>
            ) : (
              orders.slice(0, 3).map((ord) => (
                <div 
                  key={ord.id}
                  style={{
                    background: 'var(--neutral-50)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                      {ord.produce} • {(ord.totalQuantity || ord.quantity || 0).toLocaleString()} {ord.unit || 'kg'}
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                      {ord.orderStatus || ord.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
                    {t('order.buyer', 'Buyer')}: <strong>{ord.buyer}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px dashed var(--neutral-200)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                      ₹{(ord.estimatedTotalValue || ord.totalAmount || 0).toLocaleString()}
                    </span>
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem', gap: 4 }}
                      onClick={() => onNavigate('orders')}
                    >
                      <Truck size={12} /> {t('order.trackDelivery', 'Track Delivery')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
