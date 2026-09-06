import React, { useState } from 'react';
import { 
  Package, 
  ShieldCheck, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Phone,
  Navigation,
  FileCheck,
  Layers
} from 'lucide-react';
import OrderCard from '../components/OrderCard';
import Modal from '../components/Modal';
import TransactionsView from '../components/TransactionsView';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerOrders({ 
  orders = [], 
  transactions = [],
  onUpdateTransactionStatus,
  onNavigate = (_tab) => {} 
}) {
  const { t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [activeSection, setActiveSection] = useState('transactions');

  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setShowLiveTracking(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{t('orders.farmerOrdersTitle', 'Orders & Contract Transactions')}</h1>
        <p className="page-subtitle">
          {t('orders.farmerOrdersSubtitle', 'Track 5-stage contract settlements, escrow balances, and delivery progress.')}
        </p>
      </div>

      {/* Sub tabs between Transactions and Consignments */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn btn-sm ${activeSection === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSection('transactions')}
        >
          <FileCheck size={15} /> Contract Transactions ({transactions.length})
        </button>
        <button
          className={`btn btn-sm ${activeSection === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSection('orders')}
        >
          <Package size={15} /> Consignment Shipments ({orders.length})
        </button>
      </div>

      {activeSection === 'transactions' ? (
        <TransactionsView
          transactions={transactions}
          role="farmer"
          onUpdateStatus={onUpdateTransactionStatus}
        />
      ) : (
        <>
          {orders.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--neutral-400)' }}>
                <Package size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--neutral-800)' }}>{t('orders.noOrdersYet', 'No orders yet')}</h3>
              <p style={{ color: 'var(--neutral-500)', marginTop: 4, maxWidth: 420, margin: '4px auto 0' }}>
                {t('orders.farmerNoOrdersDesc', 'Confirmed purchase agreements from buyers will appear here with delivery details and escrow tracking.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order}
                  onViewOrder={handleOpenOrder}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Order Details & Logistics Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={t('order.orderNumberDetails', 'Order #{id} Details', { id: selectedOrder.id })}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Top Summary Banner */}
            <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-900)' }}>
                  {selectedOrder.emoji || '📦'} {selectedOrder.produce}
                </span>
                <span className="badge badge-success">
                  ● {selectedOrder.orderStatus || selectedOrder.status || t('common.confirmed', 'Confirmed')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--primary-200)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-800)', fontWeight: 600 }}>{t('common.quantity', 'Quantity')}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--neutral-900)', marginTop: 2 }}>
                    {(selectedOrder.totalQuantity || selectedOrder.quantity || 0).toLocaleString()} {selectedOrder.unit || 'kg'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-800)', fontWeight: 600 }}>{t('order.agreedPrice', 'Agreed Price')}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-800)', marginTop: 2 }}>
                    ₹{(selectedOrder.averagePrice || selectedOrder.agreed_price || selectedOrder.price || 2800).toLocaleString()}/{t('unit.quintalShort', 'q')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-800)', fontWeight: 600 }}>{t('order.totalValue', 'Total Value')}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-800)', marginTop: 2 }}>
                    ₹{(selectedOrder.estimatedTotalValue || selectedOrder.totalAmount || selectedOrder.total_amount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--primary-800)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} /> {t('order.escrowPaymentSecuredDesc', 'Escrow payment secured. Released automatically upon destination verification.')}
              </div>
            </div>

            {/* Buyer Details */}
            <div style={{ background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: 8 }}>
                {t('order.buyerInfo', 'Buyer Information')}
              </h4>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--neutral-900)' }}>
                {selectedOrder.buyer || 'FreshMart Retail Pvt Ltd'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--neutral-600)', marginTop: 4 }}>
                <MapPin size={14} style={{ color: 'var(--primary-600)' }} />
                <span>{t('order.destination', 'Destination')}: {selectedOrder.deliveryLocation || 'Pune Distribution Center'}</span>
              </div>
            </div>

            {/* Logistics & Delivery Information */}
            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                  {t('order.logisticsDelivery', 'Logistics & Delivery')}
                </h4>
                <button 
                  className={`btn btn-sm ${showLiveTracking ? 'btn-primary' : 'btn-outline-primary'}`}
                  style={{ gap: 6, fontSize: '0.78rem' }}
                  onClick={() => setShowLiveTracking(!showLiveTracking)}
                >
                  <Truck size={14} />
                  {showLiveTracking ? t('logistics.hideTracking', 'Hide Tracking') : t('logistics.trackDelivery', 'Track Delivery')}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem' }}>{t('logistics.transporter', 'Transporter')}</span>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    {selectedOrder.logistics?.transporter || 'Mahindra Logistics Cold Chain'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem' }}>{t('logistics.vehicleNumber', 'Vehicle Number')}</span>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    {selectedOrder.logistics?.vehicleNumber || 'MH-15-EG-4412'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem' }}>{t('logistics.estimatedDispatch', 'Estimated Dispatch')}</span>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>
                    {selectedOrder.estimatedDeliveryDate || 'Tomorrow, 9:00 AM'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--neutral-500)', fontSize: '0.78rem' }}>{t('logistics.deliveryStatus', 'Delivery Status')}</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-700)', marginTop: 2 }}>
                    {t('logistics.pickupScheduled', 'Pickup Scheduled')}
                  </div>
                </div>
              </div>

              {/* In-Modal Delivery Tracking */}
              {showLiveTracking && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--neutral-200)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Navigation size={14} style={{ color: 'var(--primary-600)' }} /> {t('logistics.liveTransitProgress', 'Live Transit Progress')}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--primary-600)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{t('logistics.orderConfirmedEscrowFunded', 'Order Confirmed & Escrow Funded')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('logistics.paymentHeldEscrow', 'Payment held securely in AgriLink escrow')}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Clock size={16} style={{ color: 'var(--primary-600)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{t('logistics.farmGatePickupScheduled', 'Farm Gate Pickup Scheduled')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('logistics.reeferDispatched', 'Cold-chain reefer truck dispatched to farm location')}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--neutral-300)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--neutral-500)' }}>{t('logistics.qualityAuditLoading', 'Quality Audit & Loading')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{t('logistics.weightVerificationLoading', 'Weight verification at loading point')}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--neutral-300)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--neutral-500)' }}>{t('logistics.finalDeliveryPaymentRelease', 'Final Delivery & Direct Payment Release')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>{t('logistics.instantBankTransfer', 'Instant bank transfer to farmer account upon acceptance')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
