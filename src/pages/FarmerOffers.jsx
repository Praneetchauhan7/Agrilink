import React, { useState } from 'react';
import { Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import OfferCard from '../components/OfferCard';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerOffers({ 
  offers = [],
  currentUserId,
  onAcceptOffer,
  onRejectOffer,
  onSendCounterOffer
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('All');

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
        <h1 className="page-title">{t('offers.farmerOffersTitle', 'My Offers & Negotiations')}</h1>
        <p className="page-subtitle">
          {t('offers.farmerOffersSubtitle', 'Track the status of price bids, proposals, and counter-negotiations with institutional buyers.')}
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('offers.noOffersInCategory', 'No offers in this category')}</h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 4 }}>
            {t('offers.exploreDemandDesc', 'Explore the Buyer Demand board to submit new supply offers.')}
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              role="farmer"
              currentUserId={currentUserId}
              onAccept={onAcceptOffer}
              onReject={onRejectOffer}
              onCounter={onSendCounterOffer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
