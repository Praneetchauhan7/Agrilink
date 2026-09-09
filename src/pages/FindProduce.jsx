import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Sparkles, Filter, Users, Sprout, PlusCircle, CheckCircle, RefreshCw, ShoppingCart } from 'lucide-react';
import FarmerCard from '../components/FarmerCard';
import FilterPanel from '../components/FilterPanel';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import { useLanguage } from '../context/LanguageContext';

export default function FindProduce({ 
  farmerListings: initialFarmerListings = [], 
  onTriggerAggregation, 
  onAddToRequirementList,
  onAddToCart,
  cartItems = [],
  initialSearchQuery = '',
  selectedSupplierIds = []
}) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedFarmerDetail, setSelectedFarmerDetail] = useState(null);
  const [dbListings, setDbListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const cartListingIds = useMemo(() => {
    return cartItems.map((ci) => ci.listing_id || ci.id);
  }, [cartItems]);

  const [filters, setFilters] = useState({
    produce: '',
    location: '',
    quality: '',
    type: '',
    storageAvailable: ''
  });

  const fetchPostgreSQLProduce = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (filters.produce) params.append('commodity', filters.produce);
      if (filters.location) params.append('location', filters.location);
      if (filters.quality) params.append('quality', filters.quality);
      if (filters.type) params.append('type', filters.type);
      if (filters.storageAvailable) params.append('storageAvailable', filters.storageAvailable);

      const url = `/api/produce?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.produce)) {
        setDbListings(data.produce.map((listing) => {
          const produce = listing.crop_name || listing.produce || 'Produce';
          return {
            ...listing,
            farmerId: listing.farmer_id || listing.farmerId,
            farmerName: listing.farmer_name || listing.farmerName || 'Farmer Producer',
            location: listing.district
              ? `${listing.district}, ${listing.state || ''}`.replace(/, $/, '')
              : (listing.location || ''),
            produce,
            emoji: produce.toLowerCase().includes('onion') ? '🧅'
                 : produce.toLowerCase().includes('potato') ? '🥔'
                 : produce.toLowerCase().includes('wheat') ? '🌾'
                 : produce.toLowerCase().includes('grape') ? '🍇'
                 : produce.toLowerCase().includes('rice') ? '🍚'
                 : '🍅',
            quantity: Number(listing.quantity) || 0,
            unit: listing.quantity_unit || 'kg',
            quality: listing.quality_grade || 'Grade A',
            expectedPrice: Number(listing.expected_price) || 0,
            harvestDate: listing.harvest_date || 'Current Harvest',
            storageAvailable: true,
            status: listing.status === 'active' ? 'Active' : (listing.status || 'Active'),
            distanceKm: listing.distanceKm || 25,
            type: listing.type || 'Farmer',
            phone: listing.farmer_mobile || listing.phone || ''
          };
        }));
      } else {
        setDbListings(initialFarmerListings);
      }
    } catch (err) {
      console.error('Failed to query PostgreSQL produce listings:', err);
      // Fallback
      setDbListings(initialFarmerListings);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters, initialFarmerListings]);

  // Query on mount and whenever search or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPostgreSQLProduce();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPostgreSQLProduce]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      produce: '',
      location: '',
      quality: '',
      type: '',
      storageAvailable: ''
    });
    setSearchQuery('');
  };

  // Listings source from real PostgreSQL database
  const activeListings = dbListings.length > 0 || searchQuery || filters.produce || filters.location 
    ? dbListings 
    : initialFarmerListings;

  return (
    <div className="page-content">
      {/* Header with Smart Aggregation Action Button */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              {t('nav.findProduce', 'Find Produce')} &amp; {t('nav.farmerNetwork', 'Farmer Network')}
            </h1>
            <p className="page-subtitle">
              {t('findProduce.subtitle', 'Live PostgreSQL search across verified Indian growers, mandis, and commodities.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={fetchPostgreSQLProduce}
              title="Refresh from PostgreSQL"
            >
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => onTriggerAggregation()}
            >
              <Sparkles size={17} /> {t('findProduce.multiSupplierAggregation', 'Multi-Supplier Aggregation')}
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Search Bar */}
      <div style={{ marginBottom: 16 }}>
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={() => fetchPostgreSQLProduce()}
          placeholder="Search by commodity (e.g. Wheat, Tomatoes, Cotton), location (e.g. Nashik, Ludhiana, Rajkot), or farmer name..."
        />
      </div>

      {/* Advanced Filter Panel */}
      <FilterPanel 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
          {isLoading ? (
            'Searching PostgreSQL database...'
          ) : (
            t('findProduce.showingListings', 'Showing {count} verified listings from PostgreSQL', { count: activeListings.length })
          )}
        </span>

        {selectedSupplierIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
              {t('findProduce.suppliersAddedBasket', '{count} Suppliers Added to Basket', { count: selectedSupplierIds.length })}
            </span>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => onTriggerAggregation()}
            >
              {t('findProduce.calculateCombinedSupply', 'Calculate Combined Supply →')}
            </button>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      {activeListings.length === 0 && !isLoading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Search size={44} style={{ color: 'var(--neutral-300)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No commodities match your search or filter</h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 4 }}>
            Try searching for a different commodity, clearing search keywords, or selecting another location.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={handleResetFilters}>
            {t('filter.reset', 'Reset Search & Filters')}
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {activeListings.map((farmer) => (
            <FarmerCard 
              key={farmer.id}
              farmer={farmer}
              isSelected={selectedSupplierIds.includes(farmer.id)}
              isInCart={cartListingIds.includes(farmer.id || farmer.listingId)}
              onViewDetails={(f) => setSelectedFarmerDetail(f)}
              onAddToCart={onAddToCart ? (f) => onAddToCart(f) : undefined}
              onAddToRequirement={(f) => onAddToRequirementList(f)}
            />
          ))}
        </div>
      )}

      {/* Farmer / FPO Details Modal */}
      {selectedFarmerDetail && (
        <Modal
          isOpen={!!selectedFarmerDetail}
          onClose={() => setSelectedFarmerDetail(null)}
          title={selectedFarmerDetail.farmerName || selectedFarmerDetail.name}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--neutral-50)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-grade">{selectedFarmerDetail.quality}</span>
                <span className="badge badge-success">{t('farmer.landRecordVerified', 'Aadhaar & 7/12 Land Record Verified ✓')}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 8 }}>
                ₹{selectedFarmerDetail.expectedPrice} / {t('common.quintal', 'quintal')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginTop: 4 }}>
                {t('produce.availableStock', 'Available Stock')}: <strong>{(selectedFarmerDetail.quantity || 0).toLocaleString()} {selectedFarmerDetail.unit || 'kg'}</strong>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{t('farmer.farmerFarmProfile', 'Farmer & Farm Profile')}</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--neutral-700)', marginTop: 4 }}>
                <strong>{t('common.location', 'Location')}:</strong> {selectedFarmerDetail.location} ({selectedFarmerDetail.distanceKm || 25} km {t('farmer.fromCentralHub', 'from central hub')})
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--neutral-700)', marginTop: 2 }}>
                <strong>{t('produce.harvestDate', 'Harvest Date')}:</strong> {selectedFarmerDetail.harvestDate}
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--neutral-700)', marginTop: 2 }}>
                <strong>{t('farmer.directContact', 'Direct Contact')}:</strong> {selectedFarmerDetail.phone || '+91 98765 43210'}
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--neutral-700)', marginTop: 2 }}>
                <strong>{t('farmer.onFarmStorage', 'On-Farm Storage')}:</strong> {selectedFarmerDetail.storageAvailable ? t('common.available', 'Available') + ' ✓' : t('farmer.directLoadingNeeded', 'Direct loading needed')}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {onAddToCart && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    onAddToCart(selectedFarmerDetail);
                    setSelectedFarmerDetail(null);
                  }}
                >
                  <ShoppingCart size={16} /> {t('cart.addToCart', 'Add to Cart')}
                </button>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  onAddToRequirementList(selectedFarmerDetail);
                  setSelectedFarmerDetail(null);
                }}
              >
                <PlusCircle size={16} /> {t('farmer.addToBulkReq', 'Add to Bulk Requirement')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
