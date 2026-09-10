import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Database, 
  AlertCircle, 
  RefreshCw, 
  Info, 
  ChevronDown, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COMMODITIES = [
  'Tomato',
  'Onion',
  'Potato',
  'Wheat',
  'Maize',
  'Rice',
  'Cotton',
  'Soyabean',
  'Mustard',
  'Banana',
  'Apple',
  'Garlic',
  'Ginger(Green)',
  'Green Chilli'
];

const STATES = [
  'All',
  'Maharashtra',
  'Punjab',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Rajasthan',
  'Gujarat',
  'Karnataka',
  'Haryana',
  'Tamil Nadu',
  'Andhra Pradesh',
  'West Bengal'
];

export default function RealPriceTrendGraph({ initialCrop = 'Tomato', initialMarket = '', initialState = 'Maharashtra', initialDistrict = '' }) {
  const { t, language } = useLanguage();
  const [commodity, setCommodity] = useState(initialCrop);
  const [state, setState] = useState(initialState);
  const [district, setDistrict] = useState(initialDistrict);
  const [selectedMarket, setSelectedMarket] = useState(initialMarket || 'All');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRecord, setHoveredRecord] = useState(null);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (commodity) params.append('commodity', commodity);
      if (state && state !== 'All') params.append('state', state);
      if (district) params.append('district', district);
      if (selectedMarket && selectedMarket !== 'All') params.append('market', selectedMarket);

      const res = await fetch(`/api/market-price-trends?${params.toString()}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch real market price trends:', err);
      setData({
        success: false,
        status: 'error',
        message: 'Could not fetch mandi market data.',
        records: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [commodity, state, district, selectedMarket]);

  useEffect(() => {
    setCommodity(initialCrop);
  }, [initialCrop]);

  useEffect(() => {
    setState(initialState);
    setDistrict(initialDistrict);
    setSelectedMarket(initialMarket || 'All');
  }, [initialState, initialDistrict, initialMarket]);

  const rawRecords = (data?.records || []).filter((r) => {
    if (selectedMarket && selectedMarket !== 'All') {
      return r.market?.toLowerCase() === selectedMarket.toLowerCase();
    }
    return true;
  });

  // Extract unique markets from records for the filter
  const availableMarkets = Array.from(
    new Set((data?.records || []).map((r) => r.market).filter(Boolean))
  );

  // Prepare points for chart
  const validRecords = rawRecords.filter((r) => Number(r.modal_price) > 0);
  const prices = validRecords.map((r) => Number(r.modal_price));
  const minModal = prices.length > 0 ? Math.min(...prices) : 0;
  const maxModal = prices.length > 0 ? Math.max(...prices) : 0;
  const avgModal = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  // Graph dimensions
  const chartHeight = 220;
  const paddingBottom = 40;
  const paddingTop = 20;
  const usableHeight = chartHeight - paddingBottom - paddingTop;
  const range = Math.max(1, maxModal - minModal);

  return (
    <div className="card" style={{ marginBottom: 24, border: '1.5px solid var(--neutral-300)' }}>
      {/* Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} /> {t('market.realDataNotice', 'Live Mandi Rates Feed')}
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-900)', margin: 0 }}>
            {t('market.trendTitle', 'Mandi Price Trend Graph')} — {commodity}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--neutral-500)', margin: '4px 0 0 0' }}>
            {t('market.datasetLabel', 'Active modal prices and commodity market rates')}
          </p>
        </div>

        {/* Recent prices badge (replaces the old 1 Week/1 Month/1 Year filter -
            the government's daily-price feed only has recently reported
            prices, not a real queryable history, so a period filter would
            show identical data regardless of which option was picked) */}
        <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '6px 12px' }}>
          <Calendar size={13} /> {t('market.recentPrices', 'Recent mandi prices')}
        </span>
      </div>

      {/* Selectors Bar (Commodity, State, Market) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16, background: 'var(--neutral-50)', padding: 12, borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neutral-700)' }}>
            {t('market.commodity', 'Commodity')}:
          </label>
          <select
            className="filter-select"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            style={{ minWidth: 140, fontSize: '0.85rem' }}
          >
            {COMMODITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neutral-700)' }}>
            {t('market.state', 'State')}:
          </label>
          <select
            className="filter-select"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setSelectedMarket('All');
            }}
            style={{ minWidth: 140, fontSize: '0.85rem' }}
          >
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neutral-700)' }}>
            {t('market.mandi', 'Market')}:
          </label>
          <select
            className="filter-select"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            style={{ minWidth: 160, fontSize: '0.85rem' }}
          >
            <option value="All">{t('market.allMandis', 'All Mandis')} ({availableMarkets.length})</option>
            {availableMarkets.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchTrends}
          disabled={isLoading}
          style={{ marginLeft: 'auto', gap: 6, fontSize: '0.82rem' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {t('market.fetchBtn', 'Refresh Live Data')}
        </button>
      </div>

      {/* Historical Data Notice - shown whenever the feed only has a single
          reporting date, which is the normal case for this data source */}
      {!data?.hasHistoricalArchive && (
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          borderRadius: 'var(--radius-md)', 
          padding: '10px 14px', 
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: '0.82rem',
          color: '#0369a1'
        }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: '#0284c7' }} />
          <div>
            <strong>{t('mandi.govPeriodNotice', 'About this data')}:</strong>{' '}
            {data?.historicalNotice || t('market.noHistoricalData', 'Showing the latest verified modal price records reported by APMC mandis. The official feed does not provide a longer price history.')}
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}
      {validRecords.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{t('mandi.avgModalPrice', 'AVERAGE MODAL PRICE')}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 2 }}>
              ₹{avgModal.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{t('mandi.minRecorded', 'MINIMUM RECORDED')}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
              ₹{minModal.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{t('mandi.maxRecorded', 'MAXIMUM RECORDED')}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: 2 }}>
              ₹{maxModal.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontWeight: 700 }}>{t('mandi.verifiedRecords', 'VERIFIED RECORDS')}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-800)', marginTop: 2 }}>
              {validRecords.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--neutral-500)' }}>{t('mandi.mandisUnit', 'mandis')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Visualizer */}
      {isLoading ? (
        <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', gap: 8 }}>
          <RefreshCw size={20} className="animate-spin" />
          <span>{t('common.loading', 'Fetching live mandi records...')}</span>
        </div>
      ) : validRecords.length === 0 ? (
        <div style={{ 
          height: 180, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'var(--neutral-50)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          textAlign: 'center',
          color: 'var(--neutral-500)',
          gap: 8
        }}>
          <AlertCircle size={28} style={{ color: '#d97706' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {t('mandi.noLiveRecords', 'No live mandi price records returned for {crop} {state}', { crop: commodity, state: state !== 'All' ? `in ${state}` : '' })}
          </div>
          <div style={{ fontSize: '0.82rem', maxWidth: 480 }}>
            {t('mandi.officialGovNotice', 'Official government reports for this crop may not have reported arrivals today. Check other commodities or visit')}{' '}
            <a href="https://agmarknet.gov.in/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-700)', textDecoration: 'underline' }}>
              {t('mandi.agmarknetPortal', 'Agmarknet Portal')}
            </a>.
          </div>
        </div>
      ) : (
        <div>
          {/* Interactive Bar and Whisker Visualization */}
          <div style={{ 
            height: chartHeight, 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: 12, 
            paddingTop: paddingTop, 
            paddingBottom: paddingBottom, 
            overflowX: 'auto',
            position: 'relative',
            borderBottom: '2px solid var(--neutral-300)'
          }}>
            {validRecords.map((r, idx) => {
              const modalVal = Number(r.modal_price) || 0;
              const minVal = Number(r.min_price) || modalVal;
              const maxVal = Number(r.max_price) || modalVal;

              // Calculate height percentage
              const heightPct = Math.max(12, Math.round(((modalVal - minModal) / (range || 1)) * 75) + 15);
              const isHighest = modalVal === maxModal;
              const isLowest = modalVal === minModal;

              return (
                <div
                  key={idx}
                  style={{
                    flex: '1 0 54px',
                    maxWidth: 80,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredRecord(r)}
                  onMouseLeave={() => setHoveredRecord(null)}
                >
                  {/* Floating Tooltip if Hovered */}
                  {hoveredRecord === r && (
                    <div style={{
                      position: 'absolute',
                      bottom: '105%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.95)',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      zIndex: 50,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      pointerEvents: 'none',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontWeight: 800, color: '#4ade80' }}>{r.market}</div>
                      <div>{r.district}, {r.state}</div>
                      <div>{t('produce.date', 'Date')}: {r.date}</div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: 4, paddingTop: 4 }}>
                        <div>{t('mandi.modalPrice', 'Modal')}: <strong>₹{modalVal}/{t('unit.quintalShort', 'q')}</strong></div>
                        <div>{t('produce.min', 'Min')}: ₹{minVal} | {t('produce.max', 'Max')}: ₹{maxVal}</div>
                      </div>
                    </div>
                  )}

                  {/* Price Tag above bar */}
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    color: isHighest ? '#15803d' : 'var(--neutral-700)', 
                    marginBottom: 4 
                  }}>
                    ₹{modalVal}
                  </span>

                  {/* The Bar */}
                  <div
                    style={{
                      width: '80%',
                      height: `${heightPct}%`,
                      background: isHighest 
                        ? 'linear-gradient(180deg, #15803d, #166534)' 
                        : isLowest
                        ? 'linear-gradient(180deg, #0284c7, #0369a1)'
                        : 'linear-gradient(180deg, #22c55e, #16a34a)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.2s ease',
                      boxShadow: hoveredRecord === r ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
                    }}
                  />

                  {/* Market and Date Label */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: -32, 
                    left: 0, 
                    right: 0, 
                    textAlign: 'center', 
                    fontSize: '0.68rem', 
                    color: 'var(--neutral-600)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {r.market}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
            <div>
              {t('mandi.hoverColumnsHelp', 'Hover over columns to see min, modal, max price and reporting district.')}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, background: '#15803d', borderRadius: 2, display: 'inline-block' }} />
                {t('mandi.highestModalRate', 'Highest Modal Rate')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: 2, display: 'inline-block' }} />
                {t('mandi.modalRate', 'Modal Rate')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
