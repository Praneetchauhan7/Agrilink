import React, { useState } from 'react';
import { 
  Sparkles, 
  Package, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  Clock,
  ChevronRight,
  Play
} from 'lucide-react';
import OrderCard from '../components/OrderCard';
import Modal from '../components/Modal';
import { useLanguage } from '../context/LanguageContext';

export default function AggregatedOrders({ 
  orders = [], 
  onAdvanceStep, 
  onNavigate 
}) {
  const { t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const aggregatedOrders = orders.filter((o) => o.orderType === 'Aggregated');

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={24} style={{ color: 'var(--primary-600)' }} />
              <h1 className="page-title">{t('aggregatedOrders.title', 'Multi-Farmer Aggregated Orders')}</h1>
            </div>
            <p className="page-subtitle">
              {t('aggregatedOrders.subtitle', 'Manage large procurement contracts fulfilled through automated multi-farmer and FPO regional stock consolidation.')}
            </p>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('logistics')}
          >
            <Truck size={16} /> {t('aggregatedOrders.viewLogistics', 'View Fleet & Logistics')}
          </button>
        </div>
      </div>

      {aggregatedOrders.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Package size={48} style={{ color: 'var(--neutral-300)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('aggregatedOrders.noOrders', 'No Aggregated Orders active')}</h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 4 }}>
            {t('aggregatedOrders.noOrdersDesc', 'Go to "Create Requirement" to match and create a new multi-farmer aggregated order.')}
          </p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('create-requirement')}>
            + {t('nav.createRequirement', 'Create Requirement')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {aggregatedOrders.map((order) => (
            <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>{order.emoji || '🍅'}</span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Order #{order.id}</h2>
                    <span className="badge badge-grade">⚡ {t('order.smartAggregation', 'Smart Multi-Farmer Aggregation')}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginTop: 4 }}>
                    {t('order.orderedBy', 'Ordered by')} <strong>{order.buyer}</strong> • {t('order.destination', 'Destination')}: <strong>{order.deliveryLocation}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    {t('common.status', 'Status')}: {order.orderStatus}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={14} style={{ color: 'var(--primary-600)' }} /> {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, background: 'var(--neutral-50)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('produce.produceName', 'Produce')}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 2 }}>{order.produce}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('order.consolidatedVolume', 'Consolidated Volume')}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: 2 }}>
                    {(order.totalQuantity || order.quantity || 0).toLocaleString()} {order.unit || 'kg'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('order.combinedAvgRate', 'Combined Avg Rate')}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-700)', marginTop: 2 }}>
                    ₹{(order.averagePrice || order.price || 0).toLocaleString()} / {t('common.quintal', 'quintal')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('order.totalOrderValue', 'Total Order Value')}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--neutral-900)', marginTop: 2 }}>
                    ₹{(order.estimatedTotalValue || order.totalAmount || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('order.regionalSuppliers', 'Regional Suppliers')}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-800)', marginTop: 2 }}>
                    {order.suppliers ? order.suppliers.length : 4} {t('order.farmersFpo', 'Farmers/FPO')}
                  </div>
                </div>
              </div>

              {/* Individual Supplier Contribution Breakdown Table */}
              {order.suppliers && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={16} style={{ color: 'var(--primary-600)' }} />
                    {t('order.fulfillmentNetwork', 'Fulfillment Supplier Network')}:
                  </h4>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
                    <table className="supplier-list-table">
                      <thead>
                        <tr>
                          <th>{t('order.supplierName', 'Supplier Name')}</th>
                          <th>{t('common.location', 'Location')}</th>
                          <th>{t('order.suppliedQty', 'Supplied Quantity')}</th>
                          <th>{t('order.pricePerQuintal', 'Price / Quintal')}</th>
                          <th>{t('order.subtotalValue', 'Subtotal Value')}</th>
                          <th>{t('common.type', 'Type')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.suppliers.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 800 }}>{s.name}</td>
                            <td>{s.location}</td>
                            <td style={{ fontWeight: 700 }}>{(s.quantity || 0).toLocaleString()} kg</td>
                            <td style={{ color: 'var(--primary-700)', fontWeight: 700 }}>₹{s.price || 0}/{t('unit.quintalShort', 'q')}</td>
                            <td style={{ fontWeight: 800 }}>₹{Math.round(((s.quantity || 0) / 100) * (s.price || 0)).toLocaleString()}</td>
                            <td><span className={`badge ${s.type === 'FPO' ? 'badge-info' : 'badge-neutral'}`}>{s.type}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6-Step Visual Interactive Lifecycle Tracker */}
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-700)' }}>
                    {t('order.lifecycleTitle', 'Aggregated Order Fulfillment Lifecycle (6 Steps)')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: 700 }}>
                    {t('order.currentStep', 'Current Step')}: {order.steps[order.stepIndex || 0]}
                  </span>
                </div>

                <div className="order-tracker">
                  <div className="order-tracker-line">
                    <div 
                      className="order-tracker-progress" 
                      style={{ width: `${((order.stepIndex || 0) / (order.steps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {order.steps.map((step, idx) => {
                    const isCompleted = idx < (order.stepIndex || 0);
                    const isCurrent = idx === (order.stepIndex || 0);

                    return (
                      <div 
                        key={idx} 
                        className={`tracker-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        <div className="step-circle">
                          {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                        </div>
                        <span className="step-title">{step}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Step action advance simulator button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--neutral-200)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
                    {t('order.milestones', 'Fulfillment Milestones')}:
                  </span>
                  {(order.stepIndex || 0) < order.steps.length - 1 ? (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => onAdvanceStep(order.id)}
                    >
                      <Play size={13} fill="#ffffff" /> {t('order.advanceToStage', 'Advance to Next Stage')}: "{order.steps[(order.stepIndex || 0) + 1]}"
                    </button>
                  ) : (
                    <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                      ✓ {t('order.fulfilledEscrowReleased', 'Order Fulfilled & Escrow Released to All Farmers')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
