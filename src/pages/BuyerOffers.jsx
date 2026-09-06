import React, { useState } from 'react';
import { Send, Check, X, MessageSquare, Tag, Filter } from 'lucide-react';
import OfferCard from '../components/OfferCard';
import Modal from '../components/Modal';
import { useLanguage } from '../context/LanguageContext';

export default function BuyerOffers({ 
  offers = [], 
  currentUserId,
  onAcceptOffer, 
  onRejectOffer, 
  onSendCounterOffer 
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('All');
  const [negotiatingOffer, setNegotiatingOffer] = useState(null);

  const [counterData, setCounterData] = useState({
    counterPrice: 2750,
    counterQuantity: 2500,
    notes: 'We can confirm immediate payment if price is adjusted.'
  });

  const handleOpenNegotiate = (offer) => {
    setNegotiatingOffer(offer);
    setCounterData({
      counterPrice: (offer.price || offer.offeredPrice || offer.offered_price) - 50,
      counterQuantity: offer.quantity || offer.quantityOffered,
      notes: 'Can accept immediate loading if rate is adjusted.'
    });
  };

  const handleSendCounter = (e) => {
    e.preventDefault();
    if (onSendCounterOffer && negotiatingOffer) {
      onSendCounterOffer(negotiatingOffer.id, {
        offered_price: Number(counterData.counterPrice),
        quantity: Number(counterData.counterQuantity),
        message: counterData.notes,
        actor_role: 'buyer',
        actor_id: currentUserId
      });
    }
    setNegotiatingOffer(null);
  };

  const filteredOffers = offers.filter((o) => {
    if (filter === 'All') return true;
    return (o.status || '').toLowerCase() === filter.toLowerCase();
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case 'All': return t('common.all', 'All');
      case 'Pending': return t('common.pending', 'Pending');
      case 'Countered': return 'Countered';
      case 'Accepted': return t('common.accepted', 'Accepted');
      case 'Rejected': return t('common.rejected', 'Rejected');
      default: return status;
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{t('offers.buyerOffersTitle', 'Received Farmer & FPO Supply Offers')}</h1>
        <p className="page-subtitle">
          {t('offers.buyerOffersSubtitle', 'Review incoming bids from verified growers, accept deals into active orders, or send counter-proposals.')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Countered', 'Accepted', 'Rejected'].map((status) => (
          <button
            key={status}
            className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(status)}
          >
            {getStatusLabel(status)} ({status === 'All' ? offers.length : offers.filter((o) => (o.status || '').toLowerCase() === status.toLowerCase()).length})
          </button>
        ))}
      </div>

      {filteredOffers.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Send size={44} style={{ color: 'var(--neutral-300)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('offers.noOffersInFilter', 'No offers in this filter')}</h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 4 }}>{t('offers.noOffersInFilterDesc', 'Check back later as farmers respond to your requirements.')}</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              role="buyer"
              currentUserId={currentUserId}
              onAccept={onAcceptOffer}
              onReject={onRejectOffer}
              onNegotiate={handleOpenNegotiate}
              onCounter={onSendCounterOffer}
            />
          ))}
        </div>
      )}

      {/* Negotiation / Counter-Offer Modal */}
      {negotiatingOffer && (
        <Modal
          isOpen={!!negotiatingOffer}
          onClose={() => setNegotiatingOffer(null)}
          title={`${t('offers.negotiateWith', 'Negotiate with')} ${negotiatingOffer.farmerName || t('common.supplier', 'Supplier')}`}
        >
          <form onSubmit={handleSendCounter}>
            <div style={{ background: 'var(--neutral-50)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--neutral-700)' }}>
                {t('offers.originalProposal', 'Original Proposal')}: <strong>{(negotiatingOffer.quantity || negotiatingOffer.quantityOffered)?.toLocaleString()} kg {negotiatingOffer.produce} @ ₹{negotiatingOffer.price || negotiatingOffer.offeredPrice}/{t('unit.quintalShort', 'q')}</strong>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('offers.counterQuantity', 'Counter Quantity (kg)')}</label>
                <input 
                  type="number"
                  className="form-control"
                  required
                  min="100"
                  value={counterData.counterQuantity}
                  onChange={(e) => setCounterData({ ...counterData, counterQuantity: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('offers.counterPrice', 'Counter Price (₹ / quintal)')}</label>
                <input 
                  type="number"
                  className="form-control"
                  required
                  min="500"
                  value={counterData.counterPrice}
                  onChange={(e) => setCounterData({ ...counterData, counterPrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('offers.termsNote', 'Message / Payment & Terms Note')}</label>
              <textarea 
                className="form-control"
                rows="3"
                value={counterData.notes}
                onChange={(e) => setCounterData({ ...counterData, notes: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setNegotiatingOffer(null)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                <MessageSquare size={16} /> {t('offers.sendCounterOffer', 'Send Counter Offer')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
