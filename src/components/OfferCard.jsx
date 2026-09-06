import React, { useState } from 'react';
import { Check, X, MessageSquare, Calendar, MapPin, Tag, History } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import NegotiationHistoryModal from './NegotiationHistoryModal';

export default function OfferCard({ 
  offer, 
  role = 'buyer', // 'buyer' or 'farmer'
  currentUserId,
  onAccept, 
  onReject, 
  onNegotiate,
  onCounter
}) {
  const { t } = useLanguage();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <span className="badge badge-success">{t('status.accepted', 'Accepted')} ✓</span>;
      case 'Rejected':
        return <span className="badge badge-danger">{t('status.rejected', 'Rejected')} ✕</span>;
      case 'Countered':
      case 'Counter-Offer Sent':
        return <span className="badge badge-warning">Countered ⮂</span>;
      default:
        return <span className="badge badge-warning">{t('status.pendingReview', 'Pending')}</span>;
    }
  };

  const isRejected = (offer.status || '').toLowerCase() === 'rejected';
  const isAccepted = (offer.status || '').toLowerCase() === 'accepted';
  const isPendingOrCountered = !isRejected && !isAccepted;

  // Determine if this user sent the current proposal or is receiving it
  const isSender = offer.sender_role ? offer.sender_role === role : (role === 'buyer' && offer.buyer_id === currentUserId);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.25rem' }}>{offer.emoji || '🌾'}</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
              {role === 'buyer' ? (offer.farmerName || offer.farmer_name || 'Farmer Partner') : (offer.buyerName || offer.buyer_name || 'Buyer')}
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: 4 }}>
            <MapPin size={13} />
            <span>{offer.farmerLocation || offer.buyerLocation || offer.location || 'Nashik'}</span>
            <span>• {offer.date || (offer.created_at ? new Date(offer.created_at).toLocaleDateString() : 'Today')}</span>
          </div>
        </div>

        <div>{getStatusBadge(offer.status)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--neutral-50)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.produceAndQuality', 'Produce & Quality')}</span>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
            {offer.produce || offer.crop_name || 'Produce'} ({offer.quality || 'Grade A'})
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.offeredQuantity', 'Offered Quantity')}</span>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--neutral-900)', marginTop: 2 }}>
            {((offer.quantity || offer.quantityOffered) || 0).toLocaleString()} {offer.unit || offer.quantity_unit || 'kg'}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.pricePerQuintal', 'Price / Quintal')}</span>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-700)', marginTop: 2 }}>
            ₹{((offer.price || offer.offeredPrice || offer.offered_price) || 0).toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.estLotValue', 'Est. Lot Value')}</span>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--neutral-900)', marginTop: 2 }}>
            ₹{Math.round(((((offer.quantity || offer.quantityOffered) || 0) / 100) * ((offer.price || offer.offeredPrice || offer.offered_price) || 0))).toLocaleString()}
          </div>
        </div>
      </div>

      {(offer.notes || offer.message) && (
        <div style={{ fontSize: '0.82rem', color: 'var(--neutral-600)', fontStyle: 'italic', background: '#ffffff', padding: '6px 10px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)' }}>
          "{offer.notes || offer.message}"
        </div>
      )}

      {/* History Button & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--neutral-100)', flexWrap: 'wrap', gap: 8 }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setIsHistoryModalOpen(true)}
          style={{ gap: 4 }}
        >
          <History size={14} /> View Negotiation History
        </button>

        {/* If pending or countered, and the current user is NOT the sender of the latest proposal, show action buttons */}
        {isPendingOrCountered && !isSender && (
          <div style={{ display: 'flex', gap: 6 }}>
            {onReject && (
              <button className="btn btn-outline-danger btn-sm" onClick={() => onReject(offer.id || offer)}>
                <X size={14} /> {t('btn.reject', 'Reject')}
              </button>
            )}
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                if (onNegotiate) onNegotiate(offer);
                else setIsHistoryModalOpen(true);
              }}
            >
              <MessageSquare size={14} /> Counter
            </button>
            {onAccept && (
              <button className="btn btn-success btn-sm" onClick={() => onAccept(offer.id || offer)}>
                <Check size={14} /> {t('btn.accept', 'Accept')}
              </button>
            )}
          </div>
        )}

        {isPendingOrCountered && isSender && (
          <span style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
            Awaiting response from {role === 'buyer' ? 'Farmer' : 'Buyer'}
          </span>
        )}

        {isRejected && (
          <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
            Offer Rejected • Thread Closed
          </span>
        )}

        {isAccepted && (
          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
            Offer Accepted • Transaction Initiated ✓
          </span>
        )}
      </div>

      {/* History & Negotiation Modal */}
      {isHistoryModalOpen && (
        <NegotiationHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          offer={offer}
          currentUserId={currentUserId}
          currentUserRole={role}
          onAccept={onAccept ? async (id) => { await onAccept(id); setIsHistoryModalOpen(false); } : undefined}
          onReject={onReject ? async (id) => { await onReject(id); setIsHistoryModalOpen(false); } : undefined}
          onCounter={onCounter}
        />
      )}
    </div>
  );
}
