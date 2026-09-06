import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  PlusCircle, 
  Users, 
  Send, 
  Package, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2,
  Store,
  Layers
} from 'lucide-react';
import StatCard from '../components/StatCard';
import AggregationResult from '../components/AggregationResult';
import DashboardMandiPriceGraph from '../components/DashboardMandiPriceGraph';
import { useLanguage } from '../context/LanguageContext';

export default function BuyerDashboard({ 
  buyerName = '',
  location = '',
  farmerListings = [],
  buyerDemands = [],
  orders = [],
  offers = [],
  onNavigate,
  onOpenCreateRequirement,
  onLaunchAggregation,
  onSearch
}) {
  const { t } = useLanguage();
  const matchingFarmersCount = farmerListings.length;
  const pendingOffersCount = offers.filter((o) => o.status === 'Pending').length;

  const topDemand = buyerDemands[0];
  const matchedSuppliers = topDemand 
    ? farmerListings
        .filter(f => !topDemand.produce || (f.produce || '').toLowerCase() === (topDemand.produce || '').toLowerCase())
        .map(f => ({
          id: f.id,
          name: f.farmerName,
          location: f.location,
          quantity: f.quantity,
          price: f.expectedPrice,
          grade: f.quality,
          type: f.type || 'Farmer',
          distanceKm: f.distanceKm || 25,
          phone: f.phone || ''
        }))
    : [];

  return (
    <div className="page-content">
      {/* Buyer Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">{t('dashboard.welcomeBuyer', 'Welcome back,')} {buyerName || t('role.buyer', 'Buyer')} 👋</h1>
            <p className="page-subtitle">
              {location 
                ? <>{t('dashboard.buyerSubtitle', 'Intelligent direct procurement from verified farmers and aggregated FPO clusters for')} <strong>{location}</strong>.</>
                : t('dashboard.buyerSubtitleGeneral', 'Intelligent direct procurement from verified farmers and aggregated FPO clusters.')
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('find-produce')}>
              <Search size={15} /> {t('nav.findProduce', 'Find Produce')}
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenCreateRequirement}>
              <PlusCircle size={15} /> {t('nav.createRequirement', 'Create Requirement')}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="stats-grid">
        <StatCard 
          label={t('dashboard.activeReqs', 'Active Requirements')} 
          value={buyerDemands.length} 
          icon={Layers} 
          color="green" 
          subtitle={t('dashboard.targetsOpen', 'Procurement targets open')}
        />
        <StatCard 
          label={t('dashboard.availableBatches', 'Available Produce Batches')} 
          value={farmerListings.length} 
          icon={Users} 
          color="blue" 
          subtitle={t('dashboard.verifiedProducerListings', 'Verified producer listings')}
        />
        <StatCard 
          label={t('dashboard.pendingOffers', 'Pending Offers')} 
          value={pendingOffersCount} 
          icon={Send} 
          color="amber" 
          subtitle={t('dashboard.readyNegotiation', 'Ready for price negotiation')}
        />
        <StatCard 
          label={t('dashboard.activeOrders', 'Active Orders')} 
          value={orders.length} 
          icon={Package} 
          color="purple" 
          subtitle={t('dashboard.txInProgress', 'Transactions in progress')}
        />
      </div>

      {/* Live Mandi Market Price Graph (data.gov.in Integration) */}
      <DashboardMandiPriceGraph onNavigate={onNavigate} />

      {/* Aggregation Engine Match - Only if real demands exist */}
      {buyerDemands.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} style={{ color: 'var(--primary-600)' }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{t('aggregation.title', 'Smart Multi-Farmer Stock Aggregation')}</h2>
            </div>
          </div>

          <AggregationResult 
            requirement={{
              produce: buyerDemands[0].produce || 'Tomatoes',
              emoji: buyerDemands[0].emoji || '🍅',
              requiredQuantity: buyerDemands[0].requiredQuantity || 1000,
              quality: buyerDemands[0].quality || 'Grade A',
              maxPrice: buyerDemands[0].maxPrice || 2800,
              delivery: buyerDemands[0].delivery || buyerDemands[0].location || 'Central Distribution Center'
            }}
            initialSuppliers={matchedSuppliers}
            onCreateOrder={(order) => {
              if (onLaunchAggregation) onLaunchAggregation(order);
            }}
            onSendOffers={() => {
              if (onNavigate) onNavigate('offers');
            }}
          />
        </div>
      )}

      {/* Quick Action Bento Grid */}
      <div className="two-col-grid">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('dashboard.availableRegionalSupply', 'Available Regional Produce Supply')}</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('find-produce')}>
              {t('common.searchAll', 'Search All')} <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {farmerListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--neutral-500)', fontSize: '0.88rem' }}>
                {t('dashboard.noBatchesAvailable', 'No active produce batches available right now. Check back as farmers list fresh harvest.')}
              </div>
            ) : (
              farmerListings.slice(0, 4).map((f) => (
                <div 
                  key={f.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--neutral-50)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                      {f.farmerName} <span className="badge badge-grade" style={{ fontSize: '0.7rem' }}>{f.quality}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
                      {f.produce} • {f.location}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.95rem' }}>
                      {(f.quantity || 0).toLocaleString()} kg @ ₹{f.expectedPrice || 2800}/{t('unit.quintalShort', 'q')}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)' }}>{f.status === 'Active' ? t('common.active', 'Active') : f.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Procurement Direct Actions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Store size={20} style={{ color: 'var(--primary-600)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('dashboard.procurementHub', 'Institutional Procurement Hub')}</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--neutral-600)' }}>
            {t('dashboard.procurementDesc', 'Procure directly from verified farmer clusters with electronic Proof of Delivery (e-POD) and escrow security.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate('create-requirement')}
            >
              <PlusCircle size={16} /> {t('dashboard.postNewDemand', 'Post New Demand Requirement')}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate('find-produce')}
            >
              <Search size={16} /> {t('dashboard.browseAllListings', 'Browse All Produce Listings')}
            </button>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--primary-600)' }} />
            {t('dashboard.kycVerifiedNotice', 'All suppliers are KYC & 7/12 land title verified.')}
          </div>
        </div>
      </div>
    </div>
  );
}
