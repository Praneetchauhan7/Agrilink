import React, { useState } from 'react';
import { 
  PlusCircle, 
  Sprout, 
  Filter, 
  Search, 
  Store, 
  CheckCircle2, 
  XCircle, 
  Eye 
} from 'lucide-react';
import ProduceCard from '../components/ProduceCard';
import Modal from '../components/Modal';
import { useLanguage } from '../context/LanguageContext';
import { COMMODITIES, getCommodityEmoji } from '../constants/commodities';
import { ALL_DISTRICTS } from '../constants/locations';

export default function FarmerProduce({ 
  produceListings = [], 
  offers = [],
  currentUser = null,
  onAddProduce, 
  onEditProduce, 
  onDeleteProduce,
  onAcceptOffer,
  onRejectOffer,
  onFindMandiMatches
}) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedProduceForOffers, setSelectedProduceForOffers] = useState(null);
  const [selectedProduceForMatches, setSelectedProduceForMatches] = useState(null);
  const [mandiMatches, setMandiMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const toDateInputValue = (value) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return '';
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [formData, setFormData] = useState({
    produce: 'Tomatoes',
    emoji: '🍅',
    quantity: 2500,
    unit: 'kg',
    quality: 'Grade A',
    expectedPrice: 2800,
    harvestDate: '',
    storageAvailable: true,
    location: 'Nashik, Maharashtra'
  });

  const produceEmojiMap = {
    Tomatoes: '🍅',
    Onions: '🧅',
    Potatoes: '🥔',
    Wheat: '🌾',
    Grapes: '🍇',
    Rice: '🍚'
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      produce: 'Tomatoes',
      emoji: '🍅',
      quantity: 2500,
      unit: 'kg',
      quality: 'Grade A',
      expectedPrice: 2800,
      harvestDate: '',
      storageAvailable: true,
      location: 'Nashik, Maharashtra'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      produce: item.produce,
      emoji: item.emoji || produceEmojiMap[item.produce] || '🌱',
      quantity: item.quantity,
      unit: item.unit || 'kg',
      quality: item.quality,
      expectedPrice: item.expectedPrice,
      harvestDate: toDateInputValue(item.harvestDate),
      storageAvailable: item.storageAvailable,
      location: item.location
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onEditProduce({
        ...editingItem,
        ...formData,
        emoji: produceEmojiMap[formData.produce] || '🌱'
      });
    } else {
      onAddProduce({
        id: `LST-${Date.now()}`,
        farmerId: currentUser?.id || `FARM-${Date.now().toString().slice(-4)}`,
        farmerName: currentUser?.name || 'Farmer',
        ...formData,
        emoji: produceEmojiMap[formData.produce] || '🌱',
        status: 'Active',
        distanceKm: 0,
        type: 'Farmer',
        phone: currentUser?.mobile || ''
      });
    }
    setIsModalOpen(false);
  };

  const handleViewMandiMatches = async (listing) => {
    setSelectedProduceForMatches(listing);
    setMandiMatches([]);
    setMatchError('');
    setIsLoadingMatches(true);
    try {
      const matches = await onFindMandiMatches(listing.id);
      setMandiMatches(matches);
    } catch (error) {
      setMatchError(error.message || 'Unable to find mandi matches');
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const filteredListings = produceListings.filter((item) => {
    const matchesFilter = filterType === 'All' || item.produce === filterType;
    const matchesSearch = item.produce.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">{t('produce.title', 'My Produce Listings')}</h1>
            <p className="page-subtitle">
              {t('produce.subtitle', 'Publish and manage your farm inventory for verified direct buyers and multi-farmer aggregation pools.')}
            </p>
          </div>

          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <PlusCircle size={18} /> + {t('produce.addNew', 'Add Produce')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['All', 'Tomatoes', 'Onions', 'Potatoes', 'Wheat', 'Grapes'].map((type) => (
            <button
              key={type}
              className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'All' ? `🌱 ${t('produce.allCrops', 'All Crops')}` : `${produceEmojiMap[type] || ''} ${type}`}
            </button>
          ))}
        </div>

        <div style={{ minWidth: 240 }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t('produce.searchPlaceholder', 'Search my listings...')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Sprout size={48} style={{ color: 'var(--neutral-300)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('produce.noListingsFound', 'No produce listings found')}</h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 4 }}>{t('produce.addCropDesc', 'Add a crop listing to start receiving buyer demand matching.')}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleOpenAddModal}>
            + {t('produce.addNow', 'Add Produce Now')}
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredListings.map((item) => (
            <ProduceCard
              key={item.id}
              item={item}
              onEdit={handleOpenEditModal}
              onDelete={onDeleteProduce}
              onViewOffers={(prod) => setSelectedProduceForOffers(prod)}
              onFindMandiMatches={onFindMandiMatches ? handleViewMandiMatches : undefined}
            />
          ))}
        </div>
      )}

      {selectedProduceForMatches && (
        <Modal
          isOpen={!!selectedProduceForMatches}
          onClose={() => setSelectedProduceForMatches(null)}
          title={`Mandi matches for ${selectedProduceForMatches.produce}`}
        >
          {isLoadingMatches ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--neutral-500)' }}>Finding the best mandi houses...</p>
          ) : matchError ? (
            <p style={{ padding: 24, color: 'var(--danger-700)' }}>{matchError}</p>
          ) : mandiMatches.length === 0 ? (
            <p style={{ padding: 24, textAlign: 'center', color: 'var(--neutral-500)' }}>No mandi matches found for this listing.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mandiMatches.map((mandi) => (
                <div key={mandi.id} style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <strong>{mandi.name}</strong>
                      <div style={{ color: 'var(--neutral-500)', fontSize: '0.8rem', marginTop: 3 }}>{mandi.district}, {mandi.state}</div>
                    </div>
                    <span className="badge badge-success">{mandi.match_score}% match</span>
                  </div>
                  <div style={{ color: 'var(--neutral-600)', fontSize: '0.8rem', marginTop: 8 }}>{mandi.match_reasons.join(' • ')}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Offers for Produce Modal */}
      {selectedProduceForOffers && (
        <Modal
          isOpen={!!selectedProduceForOffers}
          onClose={() => setSelectedProduceForOffers(null)}
          title={`${t('offers.offersFor', 'Offers for')} ${selectedProduceForOffers.emoji || '🌱'} ${selectedProduceForOffers.produce}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--neutral-50)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{t('produce.yourListingQtyPrice', 'Your Listing Quantity & Price')}</span>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--neutral-900)' }}>
                  {(selectedProduceForOffers.quantity || 0).toLocaleString()} {selectedProduceForOffers.unit || 'kg'} • {t('produce.expected', 'Expected')}: ₹{(selectedProduceForOffers.expectedPrice || 0).toLocaleString()}/{t('unit.quintalShort', 'q')}
                </div>
              </div>
              <span className="badge badge-success">{selectedProduceForOffers.status || t('common.active', 'Active')}</span>
            </div>

            {offers.filter((o) => 
              (o.produce || '').toLowerCase() === (selectedProduceForOffers.produce || '').toLowerCase() ||
              o.listingId === selectedProduceForOffers.id
            ).length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--neutral-500)' }}>
                <Store size={32} style={{ color: 'var(--neutral-300)', margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neutral-800)' }}>{t('offers.noOffers', 'No offers received yet')}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--neutral-500)', marginTop: 4 }}>
                  {t('offers.noOffersDesc', 'When verified buyers or aggregators make offers on this batch, they will appear here.')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {offers.filter((o) => 
                  (o.produce || '').toLowerCase() === (selectedProduceForOffers.produce || '').toLowerCase() ||
                  o.listingId === selectedProduceForOffers.id
                ).map((off) => (
                  <div key={off.id} style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: 14, background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--neutral-900)' }}>{off.buyerName || off.buyer}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: 2 }}>
                          {t('offers.offered', 'Offered')}: <strong>{(off.quantity || off.quantityOffered || 0).toLocaleString()} {off.unit || 'kg'}</strong> {t('offers.at', 'at')} <strong style={{ color: 'var(--primary-700)' }}>₹{(off.price || off.offeredPrice || 0).toLocaleString()}/{t('common.quintal', 'quintal')}</strong>
                        </div>
                      </div>
                      <span className={`badge ${off.status === 'Accepted' ? 'badge-success' : off.status === 'Rejected' ? 'badge-neutral' : 'badge-grade'}`}>
                        {off.status === 'Accepted' ? t('common.accepted', 'Accepted') : off.status === 'Rejected' ? t('common.rejected', 'Rejected') : off.status}
                      </span>
                    </div>

                    {off.notes && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', marginTop: 8, fontStyle: 'italic' }}>
                        "{off.notes}"
                      </p>
                    )}

                    {off.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                        {onRejectOffer && (
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            style={{ gap: 4, fontSize: '0.78rem' }}
                            onClick={() => {
                              onRejectOffer(off.id);
                              setSelectedProduceForOffers(null);
                            }}
                          >
                            <XCircle size={14} /> {t('offers.decline', 'Decline')}
                          </button>
                        )}
                        {onAcceptOffer && (
                          <button 
                            className="btn btn-sm btn-primary" 
                            style={{ gap: 4, fontSize: '0.78rem' }}
                            onClick={() => {
                              onAcceptOffer(off.id);
                              setSelectedProduceForOffers(null);
                            }}
                          >
                            <CheckCircle2 size={14} /> {t('offers.acceptOffer', 'Accept Offer')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedProduceForOffers(null)}>
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Produce Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('produce.editListing', 'Edit Produce Listing') : t('produce.addNewListing', '+ Add New Produce Listing')}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('produce.produceName', 'Produce Name')}</label>
              <select 
                className="form-control"
                value={formData.produce}
                onChange={(e) => {
                  const selected = COMMODITIES.find(c => c.name === e.target.value);
                  setFormData({ 
                    ...formData, 
                    produce: e.target.value,
                    emoji: selected?.emoji || getCommodityEmoji(e.target.value),
                    expectedPrice: selected?.typicalPrice || formData.expectedPrice
                  });
                }}
              >
                {COMMODITIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.emoji} {c.name} {c.hindiName ? `(${c.hindiName})` : ''} - {c.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('produce.qualityGrade', 'Quality Grade')}</label>
              <select 
                className="form-control"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              >
                <option value="Grade A">Grade A ({t('grade.premiumTable', 'Premium / Table Quality')})</option>
                <option value="Grade B">Grade B ({t('grade.standardCommercial', 'Standard Commercial')})</option>
                <option value="Grade C">Grade C ({t('grade.processingIndustrial', 'Processing / Industrial')})</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('produce.quantity', 'Quantity')}</label>
              <input 
                type="number" 
                className="form-control"
                required
                min="100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('produce.unit', 'Unit')}</label>
              <select 
                className="form-control"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="kg">kg ({t('unit.kilograms', 'Kilograms')})</option>
                <option value="quintal">quintal (100 kg)</option>
                <option value="tonne">tonne (1000 kg)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('produce.expectedPrice', 'Expected Price (₹ / quintal)')}</label>
              <input 
                type="number" 
                className="form-control"
                required
                min="500"
                value={formData.expectedPrice}
                onChange={(e) => setFormData({ ...formData, expectedPrice: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('produce.harvestDate', 'Harvest Date')}</label>
              <input 
                type="date"
                className="form-control"
                required
                value={formData.harvestDate}
                onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('produce.locationFarmGate', 'Location / Farm Gate')}</label>
              <input 
                type="text" 
                className="form-control" 
                required
                list="farmer-locations-list"
                placeholder="e.g. Nashik, Maharashtra or Lasalgaon APMC"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <datalist id="farmer-locations-list">
                {ALL_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">{t('produce.storageFacility', 'Storage Facility')}</label>
              <select 
                className="form-control"
                value={formData.storageAvailable ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, storageAvailable: e.target.value === 'true' })}
              >
                <option value="true">{t('produce.storageYes', 'Yes, Ventilated / Cold Storage Available')}</option>
                <option value="false">{t('produce.storageNo', 'No, Direct Harvest Dispatch Required')}</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? t('common.save', 'Save Changes') : t('produce.createListing', 'Create Listing')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
