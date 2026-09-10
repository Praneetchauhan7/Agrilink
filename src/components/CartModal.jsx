import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, PackageCheck, AlertCircle, ArrowRight, ShieldCheck, Store } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';

export default function CartModal({
  isOpen,
  onClose,
  cartItems = [],
  cartSummary = { totalItems: 0, totalQuantity: 0, subtotal: 0 },
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onNavigate,
  isPlacingOrder = false,
}) {
  const { t } = useLanguage();
  const [updatingId, setUpdatingId] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [createdOrderCount, setCreatedOrderCount] = useState(0);

  const handleQtyChange = async (item, newQty) => {
    if (newQty < 1) {
      if (window.confirm(t('cart.confirmRemove', `Remove ${item.crop_name} from your cart?`))) {
        setUpdatingId(item.id);
        await onRemoveItem(item.id);
        setUpdatingId(null);
      }
      return;
    }
    setUpdatingId(item.id);
    await onUpdateQuantity(item.id, newQty);
    setUpdatingId(null);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    const res = await onPlaceOrder();
    if (res && res.success) {
      setCheckoutSuccess(true);
      setCreatedOrderCount(res.offers?.length || cartItems.length);
    }
  };

  const handleViewOrders = () => {
    setCheckoutSuccess(false);
    onClose();
    if (onNavigate) {
      onNavigate('offers');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setCheckoutSuccess(false);
        onClose();
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingCart size={22} style={{ color: 'var(--primary-700)' }} />
          <span>{t('cart.title', 'Procurement Cart')}</span>
          <span className="badge badge-grade" style={{ fontSize: '0.8rem' }}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      }
    >
      {checkoutSuccess ? (
        <div style={{ padding: '24px 8px', textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <PackageCheck size={36} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
            {t('cart.orderPlacedTitle', 'Purchase Request Sent!')}
          </h3>
          <p style={{ color: 'var(--neutral-600)', marginTop: 8, maxWidth: 440, margin: '8px auto 0', fontSize: '0.92rem' }}>
            {t('cart.orderPlacedDesc', 'Sent {count} purchase request(s) to the respective farmer(s). You will be notified as soon as they respond.', { count: createdOrderCount })}
          </p>

          <div
            style={{
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              margin: '20px auto',
              maxWidth: 440,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.82rem',
              color: 'var(--neutral-700)',
              textAlign: 'left',
            }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--primary-700)', flexShrink: 0 }} />
            <span>No order is created yet - each farmer needs to accept your request first. You can track status and chat with them from My Offers.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => { setCheckoutSuccess(false); onClose(); }}>
              {t('common.close', 'Close')}
            </button>
            <button className="btn btn-primary" onClick={handleViewOrders}>
              {t('cart.viewPlacedOrders', 'View My Requests')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : cartItems.length === 0 ? (
        <div style={{ padding: '36px 16px', textAlign: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'var(--neutral-100)',
              color: 'var(--neutral-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ShoppingCart size={30} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
            {t('cart.emptyTitle', 'Your procurement cart is empty')}
          </h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 6, maxWidth: 380, margin: '6px auto 0', fontSize: '0.88rem' }}>
            {t('cart.emptyDesc', 'Browse available verified farmer crop listings and add items to your cart for direct bulk procurement.')}
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => {
              onClose();
              if (onNavigate) onNavigate('find-produce');
            }}
          >
            <Store size={16} /> {t('cart.browseProduce', 'Browse Produce Listings')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* List of Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '380px', overflowY: 'auto', paddingRight: 4 }}>
            {cartItems.map((item) => {
              const isUpdating = updatingId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--neutral-50)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {/* Header: Crop name & remove button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
                          {item.crop_name}
                        </h4>
                        {item.variety && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                            ({item.variety})
                          </span>
                        )}
                        {item.quality_grade && (
                          <span className="badge badge-grade" style={{ fontSize: '0.72rem' }}>
                            {item.quality_grade}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--neutral-600)', marginTop: 3 }}>
                        <strong>{t('common.farmer', 'Farmer')}:</strong> {item.farmer_name}
                        {item.location && <span style={{ color: 'var(--neutral-500)' }}> • {item.location}</span>}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      title={t('common.remove', 'Remove')}
                      style={{ color: '#ef4444', padding: '6px 8px' }}
                      onClick={() => onRemoveItem(item.id)}
                      disabled={isUpdating}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Quantity and Price Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 12,
                      alignItems: 'center',
                      background: '#fff',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--neutral-200)',
                    }}
                  >
                    {/* Quantity Selector */}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block', marginBottom: 4 }}>
                        {t('produce.quantity', 'Quantity')} ({item.quantity_unit || 'kg'})
                      </span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <button
                          type="button"
                          style={{ background: 'var(--neutral-100)', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                          onClick={() => handleQtyChange(item, Math.max(1, item.quantity - 100))}
                          disabled={isUpdating}
                          title="-100 kg"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="10"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(item, Number(e.target.value) || 1)}
                          style={{
                            width: 60,
                            border: 'none',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            padding: '2px 4px',
                          }}
                          disabled={isUpdating}
                        />
                        <button
                          type="button"
                          style={{ background: 'var(--neutral-100)', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                          onClick={() => handleQtyChange(item, item.quantity + 100)}
                          disabled={isUpdating}
                          title="+100 kg"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>
                        {t('produce.price', 'Price')}
                      </span>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--neutral-800)', marginTop: 4 }}>
                        ₹{item.unit_price.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>/{item.price_unit?.includes('quintal') || item.price_unit?.includes('/q') ? 'quintal' : item.price_unit || 'quintal'}</span>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>
                        {t('common.total', 'Total')}
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 4 }}>
                        ₹{item.total_amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Card */}
          <div
            style={{
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--neutral-600)', marginBottom: 6 }}>
              <span>Total Commodities</span>
              <span>{cartSummary.totalItems} listing(s)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--neutral-600)', marginBottom: 8 }}>
              <span>Total Volume</span>
              <span>{(cartSummary.totalQuantity || 0).toLocaleString()} kg ({((cartSummary.totalQuantity || 0) / 100).toFixed(1)} quintals)</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingTop: 8,
                borderTop: '1px solid var(--neutral-200)',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--neutral-900)' }}>
                {t('cart.grandTotal', 'Estimated Grand Total')}
              </span>
              <span style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--primary-700)' }}>
                ₹{(cartSummary.subtotal || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Database & Non-payment advisory */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: '0.8rem',
              color: 'var(--neutral-600)',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <ShieldCheck size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
            <span>
              Orders will be saved permanently to the PostgreSQL database with farm gate dispatch tracking. Direct settlement occurs via verified escrow stages upon produce delivery inspection.
            </span>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isPlacingOrder}
            >
              {t('cart.continueSourcing', 'Continue Sourcing')}
            </button>

            <button
              className="btn btn-primary"
              style={{ minWidth: 160, padding: '10px 20px', fontWeight: 800 }}
              onClick={handleCheckout}
              disabled={isPlacingOrder || cartItems.length === 0}
            >
              {isPlacingOrder ? (
                <>Sending Request...</>
              ) : (
                <>
                  <PackageCheck size={18} /> {t('cart.placeOrder', 'Send Purchase Request')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
