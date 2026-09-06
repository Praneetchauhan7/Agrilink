import React, { useState, useMemo } from 'react';
import { Store, Send, ShieldCheck, MapPin, Calendar, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerDemand({ 
  buyerDemands = [], 
  onSubmitOffer,
  searchQuery = ''
}) {
  const { t } = useLanguage();
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredDemands = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return buyerDemands;
    const q = searchQuery.toLowerCase().trim();
    return buyerDemands.filter((d) => {
      const produce = (d.produce || d.crop_name || '').toLowerCase();
      const buyer = (d.buyer || d.buyerName || d.organization_name || '').toLowerCase();
      const loc = (d.location || d.state || d.district || '').toLowerCase();
      return produce.includes(q) || buyer.includes(q) || loc.includes(q);
    });
  }, [buyerDemands, searchQuery]);

  const [offerData, setOfferData] = useState({
    quantityOffered: 2500,
    offeredPrice: 2850,
    notes: 'Grade A freshly harvested produce ready for loading. Ventilated crates.'
  });

  const handleOpenOfferModal = (demand) => {
    setSelectedDemand(demand);
    setOfferData({
      quantityOffered: Math.min(2500, demand.quantity),
      offeredPrice: demand.maxPrice || 2850,
      notes: 'Grade A farm gate lot available with verified quality.'
    });
    setIsModalOpen(true);
  };

  const handleSendOffer = (e) => {
    e.preventDefault();
    if (onSubmitOffer && selectedDemand) {
      onSubmitOffer({
        id: `OFF-${Date.now()}`,
        buyerName: selectedDemand.buyer,
        buyerLocation: selectedDemand.location,
        produce: selectedDemand.produce,
        emoji: selectedDemand.emoji,
        quantityOffered: offerData.quantityOffered,
        unit: selectedDemand.unit || 'kg',
        offeredPrice: offerData.offeredPrice,
        status: 'Pending',
        date: 'Today',
        notes: offerData.notes
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{t('nav.buyerDemands', 'Buyer Requests')}</h1>
        <p className="page-subtitle">
          {t('demand.subtitle', 'Direct purchase requirements from verified institutional buyers, retail chains, and food processors.')}
        </p>
      </div>

      {filteredDemands.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--neutral-400)' }}>
            <Store size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
            {searchQuery ? t('demand.noMatchingDemands', 'No buyer requests matching your search') : t('demand.noDemands', 'No buyer requests available')}
          </h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 4, maxWidth: 420, margin: '4px auto 0' }}>
            {searchQuery 
              ? t('demand.tryDifferentSearch', 'Try a different commodity or location search term from the top search bar.')
              : t('demand.noDemandsDesc', 'Verified procurement requirements from retail chains and buyers will appear here as soon as they are posted.')}
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredDemands.map((demand) => (
            <div key={demand.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.3rem' }}>{demand.emoji || '🌾'}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{demand.buyer}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: 4 }}>
                    <MapPin size={13} />
                    <span>{demand.location}</span>
                    <span>• {demand.buyerType || t('demand.verifiedBuyer', 'Verified Buyer')}</span>
                  </div>
                </div>

                <span className="badge badge-grade">{demand.quality}</span>
              </div>

              <div style={{ background: 'var(--neutral-50)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('demand.requiredQuantity', 'Required Quantity')}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--neutral-900)', marginTop: 2 }}>
                    {(demand.quantity || demand.requiredQuantity || demand.quantityRequired || 0).toLocaleString()} {demand.unit || 'kg'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('demand.expectedRate', 'Expected Rate')}</span>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-700)', marginTop: 2 }}>
                    {demand.expectedPriceRange || `₹${demand.targetPrice || 0}/${t('unit.quintalShort', 'q')}`}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('demand.deliveryHub', 'Delivery Hub')}</span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: 2 }}>
                    {demand.delivery || demand.delivery_location || t('demand.localHub', 'Local Hub')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{t('produce.deadline', 'Deadline')}</span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', marginTop: 2 }}>
                    {demand.deadline || demand.requiredBy || t('common.open', 'Open')}
                  </div>
                </div>
              </div>

              {demand.specialRequirements && (
                <div style={{ fontSize: '0.78rem', color: 'var(--neutral-600)', background: '#ffffff', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                  <strong>{t('demand.qualitySpecs', 'Quality Specs')}:</strong> {demand.specialRequirements}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} /> {t('demand.escrowProtected', 'Escrow Protected')}
                </span>

                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenOfferModal(demand)}
                >
                  <Send size={14} /> {t('offers.submitOffer', 'Submit Offer')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Custom Offer Modal */}
      {selectedDemand && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`${t('offers.submitOfferTo', 'Submit Offer to')} ${selectedDemand.buyer}`}
        >
          <form onSubmit={handleSendOffer}>
            <div style={{ background: 'var(--neutral-50)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--neutral-600)' }}>
                {t('offers.targetRequirement', 'Target Requirement')}: <strong>{(selectedDemand.quantity || selectedDemand.requiredQuantity || 0).toLocaleString()} kg {selectedDemand.produce} ({selectedDemand.quality})</strong>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--neutral-600)', marginTop: 2 }}>
                {t('offers.buyersBudget', "Buyer's Budget")}: <strong>{selectedDemand.expectedPriceRange}</strong>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('offers.qtyYouCanSupply', 'Quantity You Can Supply (kg)')}</label>
                <input 
                  type="number"
                  className="form-control"
                  required
                  min="100"
                  max={selectedDemand.quantity}
                  value={offerData.quantityOffered}
                  onChange={(e) => setOfferData({ ...offerData, quantityOffered: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('offers.yourAskingPrice', 'Your Asking Price (₹ / quintal)')}</label>
                <input 
                  type="number"
                  className="form-control"
                  required
                  min="500"
                  value={offerData.offeredPrice}
                  onChange={(e) => setOfferData({ ...offerData, offeredPrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('offers.notesForBuyer', 'Notes for Buyer (Packaging, Logistics availability)')}</label>
              <textarea 
                className="form-control"
                rows="3"
                value={offerData.notes}
                onChange={(e) => setOfferData({ ...offerData, notes: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                <Send size={16} /> {t('offers.sendDirectOffer', 'Send Direct Offer')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
