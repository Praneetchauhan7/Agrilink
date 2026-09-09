import React, { useState } from 'react';
import { Sparkles, Layers, ArrowRight, ShieldCheck, CheckCircle2, Sliders, MapPin } from 'lucide-react';
import AggregationResult from '../components/AggregationResult';
import { useLanguage } from '../context/LanguageContext';
import { COMMODITIES, getCommodityEmoji } from '../constants/commodities';

export default function CreateRequirement({ 
  farmerListings = [],
  onCreateRequirementAndAggregate = () => {},
  onCreateAggregatedOrder,
  onSendOffers
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    produce: '',
    emoji: '🌾',
    requiredQuantity: '',
    unit: 'kg',
    quality: 'Grade A',
    maxPrice: '',
    delivery: '',
    requiredBy: '',
    storageRequirement: '',
    specialRequirements: ''
  });

  const [hasSearched, setHasSearched] = useState(false);

  const matchedSuppliers = farmerListings
    .filter(f => !formData.produce || (f.produce || '').toLowerCase() === formData.produce.toLowerCase())
    .map(f => ({
      id: f.id,
      name: f.farmerName,
      location: f.location,
      quantity: f.quantity,
      price: f.expectedPrice,
      grade: f.quality,
      type: f.type || 'Farmer',
      distanceKm: f.distanceKm || 30,
      phone: f.phone || '+91 98765 43210'
    }));

  const produceEmojiMap = {
    Tomatoes: '🍅',
    Onions: '🧅',
    Potatoes: '🥔',
    Wheat: '🌾',
    Grapes: '🍇',
    Rice: '🍚'
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setHasSearched(true);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{t('nav.createRequirement', 'Create Bulk Procurement Requirement')}</h1>
        <p className="page-subtitle">
          {t('req.createSubtitle', 'Define your required agricultural produce, volume, and quality constraints to discover aggregated multi-farmer supply pools.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: hasSearched ? '1fr' : '1.5fr 1fr', gap: 24 }}>
        {/* Requirement Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--primary-100)', color: 'var(--primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('req.targetSpecs', 'Target Produce Specifications')}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--neutral-500)' }}>{t('req.automatedMatchingDesc', 'Automated matching will run against verified farmers and FPOs.')}</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit}>
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
                      maxPrice: selected ? Math.round(selected.typicalPrice * 1.05) : formData.maxPrice
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
                  <option value="Grade A">Grade A ({t('grade.premiumTableQuality', 'Premium Table Quality')})</option>
                  <option value="Grade B">Grade B ({t('grade.standardCommercial', 'Standard Commercial')})</option>
                  <option value="Grade C">Grade C ({t('grade.foodProcessing', 'Food Processing')})</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('demand.requiredQuantity', 'Required Quantity')} (kg)</label>
                <input 
                  type="number" 
                  className="form-control"
                  required
                  min="500"
                  step="500"
                  value={formData.requiredQuantity}
                  onChange={(e) => setFormData({ ...formData, requiredQuantity: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('req.maxCeilingPrice', 'Maximum Ceiling Price (₹ / quintal)')}</label>
                <input 
                  type="number" 
                  className="form-control"
                  required
                  min="500"
                  value={formData.maxPrice}
                  onChange={(e) => setFormData({ ...formData, maxPrice: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('req.deliveryLocation', 'Delivery Location')}</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  value={formData.delivery}
                  onChange={(e) => setFormData({ ...formData, delivery: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('req.requiredDeliveryBy', 'Required Delivery By')}</label>
                <input 
                  type="text" 
                  className="form-control"
                  required
                  value={formData.requiredBy}
                  onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('req.storageSpecs', 'Storage / Cold Chain Specs')}</label>
                <select 
                  className="form-control"
                  value={formData.storageRequirement}
                  onChange={(e) => setFormData({ ...formData, storageRequirement: e.target.value })}
                >
                  <option value="Cold Chain Required (12°C - 14°C)">{t('req.coldChainReq', 'Cold Chain Required (12°C - 14°C)')}</option>
                  <option value="Ambient Ventilated Transport">{t('req.ambientVentilated', 'Ambient Ventilated Transport')}</option>
                  <option value="Dry Grain Silo Storage">{t('req.dryGrainSilo', 'Dry Grain Silo Storage')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('req.specialQualityReqs', 'Special Quality / Packaging Requirements')}</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                style={{ width: hasSearched ? 'auto' : '100%' }}
              >
                <Sparkles size={18} /> {t('req.findCombinedSupply', 'Find Combined Supply ({qty} kg)', { qty: (formData.requiredQuantity || 0).toLocaleString() })}
              </button>
            </div>
          </form>
        </div>

        {/* Informational Guidance Panel */}
        {!hasSearched && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'linear-gradient(180deg, #ffffff, var(--primary-50))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} style={{ color: 'var(--primary-700)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('req.howAggregationWorks', 'How Smart Aggregation Works')}</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--neutral-700)', lineHeight: 1.6 }}>
              {t('req.aggregationDesc1', 'Instead of forcing you to hunt for one large seller, KisanSetu scans all verified farmers and FPOs in the regional cluster.')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: 2 }} />
                <span>{t('req.step1', 'Filters matching produce, grade, and maximum price.')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: 2 }} />
                <span>{t('req.step2', 'Calculates the collective volume across 3–5 nearest suppliers.')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: 2 }} />
                <span>{t('req.step3', 'Consolidates logistics into a single multi-pickup truck route.')}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', padding: 14, background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)', fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
              <strong>{t('req.quickSuggestion', 'Quick Suggestion')}:</strong> {t('req.quickSuggestionDesc', 'Try 10,000 kg Tomatoes at ₹2,900/q to view optimal multi-farmer matching.')}
            </div>
          </div>
        )}
      </div>

      {/* Aggregation Results Display */}
      {hasSearched && (
        <div style={{ marginTop: 32 }}>
          <AggregationResult 
            requirement={formData}
            initialSuppliers={matchedSuppliers}
            onCreateOrder={(order) => {
              if (onCreateAggregatedOrder) onCreateAggregatedOrder(order);
            }}
            onSendOffers={() => {
              if (onSendOffers) onSendOffers();
            }}
          />
        </div>
      )}
    </div>
  );
}
