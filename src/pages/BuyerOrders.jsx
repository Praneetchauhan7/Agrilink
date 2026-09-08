import React, { useState } from 'react';
import { Package, ShieldCheck, Truck, PlusCircle, FileCheck } from 'lucide-react';
import OrderCard from '../components/OrderCard';
import Modal from '../components/Modal';
import TransactionsView from '../components/TransactionsView';
import { useLanguage } from '../context/LanguageContext';

export default function BuyerOrders({ 
  orders = [], 
  transactions = [],
  onUpdateTransactionStatus,
  onSaveLogistics,
  onUpdateStep, 
  onNavigate 
}) {
  const { t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [locationForm, setLocationForm] = useState({ pickupLocation: '', deliveryLocation: '' });
  const [isSavingLocations, setIsSavingLocations] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [activeSection, setActiveSection] = useState('transactions');

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">{t('orders.title', 'Procurement Orders & Settlements')}</h1>
            <p className="page-subtitle">
              {t('orders.procurementOrdersSubtitle', 'Track 5-stage contract settlements, direct farm gate shipments, and automated escrow payouts.')}
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => onNavigate('create-requirement')}>
            <PlusCircle size={16} /> + {t('nav.createRequirement', 'New Requirement')}
          </button>
        </div>
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
          <Package size={15} /> Procurement Shipments ({orders.length})
        </button>
      </div>

      {activeSection === 'transactions' ? (
        <TransactionsView
          transactions={transactions}
          role="buyer"
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
                {t('orders.noOrdersYetDesc', 'Confirmed procurement contracts and shipments will appear here with delivery tracking.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewOrder={(ord) => {
                    setSelectedOrder(ord);
                    setLocationForm({
                      pickupLocation: ord.pickupLocation || ord.logistics?.pickup_location || '',
                      deliveryLocation: ord.deliveryLocation || ord.logistics?.delivery_location || '',
                    });
                    setLocationError('');
                  }}
                  onUpdateStep={onUpdateStep}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Order Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`${t('order.orderNumber', 'Order #{id}', { id: selectedOrder.id })} - ${selectedOrder.produce}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-grade">{selectedOrder.orderType || t('order.directProcurement', 'Direct Procurement')}</span>
                <span className="badge badge-success">{selectedOrder.orderStatus}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-900)', marginTop: 8 }}>
                {t('common.total', 'Total')}: ₹{(selectedOrder.estimatedTotalValue || selectedOrder.totalAmount || 0).toLocaleString()} ({(selectedOrder.totalQuantity || selectedOrder.quantity || 0).toLocaleString()} {selectedOrder.unit || 'kg'})
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginTop: 2 }}>
                {t('order.avgPrice', 'Average Price')}: ₹{selectedOrder.averagePrice || selectedOrder.price || 2800} / {t('common.quintal', 'quintal')}
              </div>
            </div>

            {selectedOrder.suppliers && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 6 }}>{t('order.participatingSuppliers', 'Participating Suppliers')}:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedOrder.suppliers.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 10px', background: '#ffffff', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)' }}>
                      <span><strong>{s.name}</strong> ({s.location})</span>
                      <span style={{ color: 'var(--primary-700)', fontWeight: 700 }}>{(s.quantity || 0).toLocaleString()} kg @ ₹{s.price}/{t('unit.quintalShort', 'q')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 14, background: 'var(--neutral-50)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--neutral-800)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={15} style={{ color: 'var(--primary-600)' }} /> {t('order.deliveryConsignmentStatus', 'Delivery & Consignment Status')}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--neutral-700)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><strong>{t('order.pickupLocation', 'Pickup Location')}:</strong> {locationForm.pickupLocation || t('order.locationNotProvided', 'Not provided')}</div>
                <div><strong>{t('order.destination', 'Destination')}:</strong> {locationForm.deliveryLocation || t('order.locationNotProvided', 'Not provided')}</div>
                <div><strong>{t('order.estimatedArrival', 'Estimated Arrival')}:</strong> {selectedOrder.estimatedDeliveryDate || t('order.within48Hours', 'Within 48 hours')}</div>
              </div>
            </div>

            <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 10 }}>{t('order.updateLocations', 'Order Locations')}</h4>
              <div style={{ display: 'grid', gap: 10 }}>
                <input className="form-control" placeholder={t('order.pickupLocationPlaceholder', 'Enter pickup location')} value={locationForm.pickupLocation} onChange={(e) => setLocationForm((prev) => ({ ...prev, pickupLocation: e.target.value }))} />
                <input className="form-control" placeholder={t('order.deliveryLocationPlaceholder', 'Enter delivery location')} value={locationForm.deliveryLocation} onChange={(e) => setLocationForm((prev) => ({ ...prev, deliveryLocation: e.target.value }))} />
                {locationError && <span style={{ color: 'var(--danger-700)', fontSize: '0.82rem' }}>{locationError}</span>}
                <button className="btn btn-primary" disabled={isSavingLocations || !onSaveLogistics} onClick={async () => {
                  setIsSavingLocations(true);
                  setLocationError('');
                  try { await onSaveLogistics(selectedOrder.id, locationForm); } catch (error) { setLocationError(error.message); } finally { setIsSavingLocations(false); }
                }}>
                  {isSavingLocations ? t('common.loading', 'Saving...') : t('common.saveChanges', 'Save Locations')}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedOrder(null)}
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
