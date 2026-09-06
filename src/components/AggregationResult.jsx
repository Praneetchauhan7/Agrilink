import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  PlusCircle, 
  CheckSquare, 
  Square, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Sliders, 
  ArrowRight 
} from 'lucide-react';
import ProgressBar from './ProgressBar';
import MatchScore from './MatchScore';
import { useLanguage } from '../context/LanguageContext';

export default function AggregationResult({ 
  requirement = {
    produce: 'Produce',
    emoji: '🌾',
    requiredQuantity: 1000,
    quality: 'Grade A',
    maxPrice: 2800,
    delivery: 'Central Distribution Center'
  },
  initialSuppliers = [],
  onCreateOrder,
  onSendOffers
}) {
  const { t } = useLanguage();
  // State for selected suppliers
  const [selectedIds, setSelectedIds] = useState(() => (initialSuppliers || []).map((s) => s.id));
  const [showAdjustMode, setShowAdjustMode] = useState(false);

  React.useEffect(() => {
    setSelectedIds((initialSuppliers || []).map((s) => s.id));
  }, [initialSuppliers]);

  const toggleSupplier = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds((initialSuppliers || []).map((s) => s.id));
  };

  if (!initialSuppliers || initialSuppliers.length === 0) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neutral-800)' }}>
          {t('aggregation.noMatchingSuppliers', 'No Matching Suppliers Currently Available')}
        </h4>
        <p style={{ color: 'var(--neutral-500)', fontSize: '0.88rem', marginTop: 6 }}>
          {t('aggregation.noMatchingDesc', 'There are currently no active farmer listings matching within the price target. As farmers post new harvest batches, matches will appear here automatically.')}
        </p>
      </div>
    );
  }

  // Dynamic calculations
  const { matchedQuantity, totalCost, avgPrice, avgDistance, matchedSuppliersCount, isFullyMatched, remainingShortfall } = useMemo(() => {
    const activeSuppliers = initialSuppliers.filter((s) => selectedIds.includes(s.id));
    const totalQty = activeSuppliers.reduce((acc, curr) => acc + curr.quantity, 0);
    
    // Each price is in ₹ / quintal (1 quintal = 100 kg)
    const cost = activeSuppliers.reduce((acc, curr) => {
      const quintals = curr.quantity / 100;
      return acc + (quintals * curr.price);
    }, 0);

    const averagePricePerQuintal = totalQty > 0 ? Math.round((cost / totalQty) * 100) : 0;
    const averageDist = activeSuppliers.length > 0
      ? Math.round(activeSuppliers.reduce((acc, curr) => acc + curr.distanceKm, 0) / activeSuppliers.length)
      : 0;

    return {
      matchedQuantity: totalQty,
      totalCost: Math.round(cost),
      avgPrice: averagePricePerQuintal,
      avgDistance: averageDist,
      matchedSuppliersCount: activeSuppliers.length,
      isFullyMatched: totalQty >= requirement.requiredQuantity,
      remainingShortfall: Math.max(0, requirement.requiredQuantity - totalQty)
    };
  }, [selectedIds, initialSuppliers, requirement]);

  const handleCreateOrder = () => {
    if (onCreateOrder) {
      const activeSuppliers = initialSuppliers.filter((s) => selectedIds.includes(s.id));
      onCreateOrder({
        produce: requirement.produce,
        emoji: requirement.emoji,
        totalQuantity: matchedQuantity,
        averagePrice: avgPrice,
        estimatedTotalValue: totalCost,
        deliveryLocation: requirement.delivery,
        suppliers: activeSuppliers
      });
    }
  };

  const handleSendOffers = () => {
    if (onSendOffers) {
      const activeSuppliers = initialSuppliers.filter((s) => selectedIds.includes(s.id));
      onSendOffers(activeSuppliers);
    }
  };

  return (
    <div className="aggregation-card">
      <div className="agg-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="badge badge-grade" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
              <Sparkles size={14} /> {t('aggregation.optimizedMatch', 'Smart Stock Aggregation Engine')}
            </span>
            <span className="badge badge-success">{t('aggregation.liveMatchActive', 'Live Match Active')}</span>
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
            {isFullyMatched ? (
              <span style={{ color: 'var(--primary-700)' }}>
                ✓ {(requirement.requiredQuantity || 0).toLocaleString()} kg {t('aggregation.targetMet', '100% Target Met!')}
              </span>
            ) : (
              <span style={{ color: '#d97706' }}>
                ⚠️ Only {(matchedQuantity || 0).toLocaleString()} kg matched. Need {(remainingShortfall || 0).toLocaleString()} kg more.
              </span>
            )}
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--neutral-600)', marginTop: 4 }}>
            Aggregated from <strong>{matchedSuppliersCount} {t('common.verifiedSuppliers', 'verified regional suppliers')}</strong> within 45 km radius of Nashik agricultural belt.
          </p>
        </div>

        <MatchScore score={isFullyMatched ? 92 : 74} />
      </div>

      {/* Progress visualizer */}
      <div style={{ margin: '16px 0 24px' }}>
        <ProgressBar 
          current={matchedQuantity || 0} 
          total={requirement.requiredQuantity || 0} 
          unit="kg" 
        />
      </div>

      {/* Dynamic Calculated Combined Offer Metrics */}
      <div className="agg-metrics-grid">
        <div className="agg-metric-item">
          <span className="agg-metric-label">{t('aggregation.requiredTarget', 'Required Target')}</span>
          <span className="agg-metric-val">{(requirement.requiredQuantity || 0).toLocaleString()} kg</span>
        </div>
        <div className="agg-metric-item">
          <span className="agg-metric-label">{t('aggregation.matchedStock', 'Matched Stock')}</span>
          <span className="agg-metric-val" style={{ color: isFullyMatched ? 'var(--primary-700)' : '#d97706' }}>
            {(matchedQuantity || 0).toLocaleString()} kg
          </span>
        </div>
        <div className="agg-metric-item">
          <span className="agg-metric-label">{t('aggregation.farmersAndFpos', 'Farmers & FPOs')}</span>
          <span className="agg-metric-val">{matchedSuppliersCount} {t('common.suppliers', 'Suppliers')}</span>
        </div>
        <div className="agg-metric-item">
          <span className="agg-metric-label">{t('aggregation.avgPrice', 'Average Price')}</span>
          <span className="agg-metric-val" style={{ color: 'var(--primary-700)' }}>₹{(avgPrice || 0).toLocaleString()} /{t('unit.quintalShort', 'q')}</span>
        </div>
        <div className="agg-metric-item">
          <span className="agg-metric-label">{t('aggregation.avgDistance', 'Avg Distance')}</span>
          <span className="agg-metric-val">{avgDistance} km</span>
        </div>
        <div className="agg-metric-item">
          <span className="agg-metric-label">{t('aggregation.estTotalValue', 'Est. Total Value')}</span>
          <span className="agg-metric-val" style={{ color: 'var(--neutral-900)' }}>₹{(totalCost || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Interactive Suppliers Selection Table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} style={{ color: 'var(--primary-600)' }} />
          {t('aggregation.breakdown', 'Individual Supplier Contribution Breakdown')}
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAdjustMode(!showAdjustMode)}
          >
            <Sliders size={14} /> {showAdjustMode ? t('btn.doneAdjusting', 'Done Adjusting') : t('btn.adjustSuppliers', 'Adjust Suppliers')}
          </button>
          {showAdjustMode && (
            <button className="btn btn-outline-primary btn-sm" onClick={selectAll}>
              {t('btn.selectAll', 'Select All')} ({initialSuppliers.length})
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)' }}>
        <table className="supplier-list-table">
          <thead>
            <tr>
              {showAdjustMode && <th style={{ width: '40px' }}>{t('common.select', 'Select')}</th>}
              <th>#</th>
              <th>{t('common.supplierName', 'Supplier Name')}</th>
              <th>{t('produce.location', 'Location')}</th>
              <th>{t('produce.quantity', 'Quantity')}</th>
              <th>{t('produce.pricePerQuintal', 'Price / Quintal')}</th>
              <th>{t('produce.qualityGrade', 'Quality')}</th>
              <th>{t('common.subtotalValue', 'Subtotal Value')}</th>
              <th>{t('common.type', 'Type')}</th>
            </tr>
          </thead>
          <tbody>
            {initialSuppliers.map((supplier, index) => {
              const isSelected = selectedIds.includes(supplier.id);
              const subtotal = Math.round((supplier.quantity / 100) * supplier.price);

              return (
                <tr 
                  key={supplier.id} 
                  className={isSelected ? 'supplier-row-selected' : 'supplier-row-unselected'}
                  style={{ cursor: showAdjustMode ? 'pointer' : 'default' }}
                  onClick={() => showAdjustMode && toggleSupplier(supplier.id)}
                >
                  {showAdjustMode && (
                    <td>
                      {isSelected ? (
                        <CheckSquare size={18} style={{ color: 'var(--primary-600)' }} />
                      ) : (
                        <Square size={18} style={{ color: 'var(--neutral-400)' }} />
                      )}
                    </td>
                  )}
                  <td style={{ fontWeight: 700, color: 'var(--neutral-500)' }}>{index + 1}.</td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>{supplier.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>{supplier.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} style={{ color: 'var(--neutral-400)' }} />
                      <span>{supplier.location}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800 }}>{supplier.quantity.toLocaleString()} kg</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>₹{supplier.price.toLocaleString()} /{t('unit.quintalShort', 'q')}</td>
                  <td><span className="badge badge-grade">{supplier.grade}</span></td>
                  <td style={{ fontWeight: 800 }}>₹{subtotal.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${supplier.type === 'FPO' ? 'badge-info' : 'badge-neutral'}`}>
                      {supplier.type}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Natural Tones Aggregated Order Summary Bar */}
      <div className="natural-summary-bar">
        <div>
          <div className="natural-summary-label">{t('aggregation.offerSummary', 'Combined Direct Offer Summary')}</div>
          <div className="natural-summary-stats">
            <div className="natural-summary-stat-item">
              <span className="natural-summary-label">{t('aggregation.aggregatedStock', 'Aggregated Stock')}</span>
              <span className="natural-summary-val">{matchedQuantity.toLocaleString()} kg</span>
            </div>
            <div className="natural-summary-stat-item">
              <span className="natural-summary-label">{t('aggregation.averageRate', 'Average Rate')}</span>
              <span className="natural-summary-val">₹{avgPrice.toLocaleString()} / {t('unit.quintal', 'quintal')}</span>
            </div>
            <div className="natural-summary-stat-item">
              <span className="natural-summary-label">{t('aggregation.consolidatedValue', 'Consolidated Value')}</span>
              <span className="natural-summary-val highlight">₹{totalCost.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={15} style={{ color: 'var(--accent-gold)' }} />
            {t('aggregation.logisticsNote', 'Single consolidated logistics route & Escrow-protected settlement')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}
            onClick={handleSendOffers}
          >
            <Send size={16} /> {t('btn.sendOfferAll', 'Send Offer to All Suppliers')}
          </button>
          <button 
            className="btn btn-gold" 
            onClick={handleCreateOrder}
          >
            <CheckCircle2 size={16} /> {t('btn.createAggOrder', 'Create Aggregated Order')}
          </button>
        </div>
      </div>
    </div>
  );
}
