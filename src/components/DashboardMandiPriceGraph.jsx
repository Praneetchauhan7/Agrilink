import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COMMODITIES = [
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Potato', emoji: '🥔' },
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Rice', emoji: '🍚' },
  { name: 'Maize', emoji: '🌽' },
  { name: 'Cotton', emoji: '☁️' },
  { name: 'Soyabean', emoji: '🌱' },
  { name: 'Mustard', emoji: '🌼' },
  { name: 'Banana', emoji: '🍌' },
  { name: 'Garlic', emoji: '🧄' }
];

// Date parsing helper for Indian DD/MM/YYYY or standard ISO date strings
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function DashboardMandiPriceGraph({ onNavigate }) {
  const { t } = useLanguage();
  const [selectedCommodity, setSelectedCommodity] = useState('Tomato');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Fetch real government data for the selected commodity from data.gov.in
  const fetchMandiData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('commodity', selectedCommodity);
      params.append('limit', '100');

      const response = await fetch(`/api/market-prices?${params.toString()}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch real mandi prices:', err);
      setData({
        success: false,
        status: 'error',
        message: 'Could not connect to mandi market prices API.',
        records: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMandiData();
  }, [selectedCommodity]);

  // Valid records with positive price
  const rawRecords = useMemo(() => {
    return (data?.records || []).filter((r) => Number(r.modal_price) > 0);
  }, [data]);

  // Extract unique markets that have REAL data for this selected commodity
  const availableMarkets = useMemo(() => {
    const marketMap = new Map();
    rawRecords.forEach((r) => {
      if (r.market && !marketMap.has(r.market)) {
        marketMap.set(r.market, {
          market: r.market,
          state: r.state || '',
          district: r.district || ''
        });
      }
    });
    return Array.from(marketMap.values()).sort((a, b) => a.market.localeCompare(b.market));
  }, [rawRecords]);

  // Ensure a valid market is selected whenever available markets change
  useEffect(() => {
    if (availableMarkets.length > 0) {
      const exists = availableMarkets.some((m) => m.market === selectedMarket);
      if (!exists) {
        setSelectedMarket(availableMarkets[0].market);
      }
    } else {
      setSelectedMarket('');
    }
  }, [availableMarkets, selectedMarket]);

  // Filter records strictly for the selected market
  const marketRecords = useMemo(() => {
    if (!selectedMarket) return [];
    return rawRecords.filter((r) => r.market === selectedMarket);
  }, [rawRecords, selectedMarket]);

  // Aggregate by actual distinct dates reported in the API for this market
  const aggregatedByDate = useMemo(() => {
    const dateMap = new Map();

    marketRecords.forEach((r) => {
      const dStr = r.date || 'Today';
      const price = Number(r.modal_price);
      if (!price) return;

      if (!dateMap.has(dStr)) {
        dateMap.set(dStr, {
          date: dStr,
          dateObj: parseDate(dStr),
          prices: [price],
          minPrices: [Number(r.min_price) || price],
          maxPrices: [Number(r.max_price) || price],
          variety: r.variety || 'Standard',
          grade: r.grade || 'FAQ',
          market: r.market,
          state: r.state || '',
          district: r.district || ''
        });
      } else {
        const existing = dateMap.get(dStr);
        existing.prices.push(price);
        if (r.min_price) existing.minPrices.push(Number(r.min_price));
        if (r.max_price) existing.maxPrices.push(Number(r.max_price));
      }
    });

    return Array.from(dateMap.values())
      .map((item) => ({
        date: item.date,
        dateObj: item.dateObj,
        price: Math.round(item.prices.reduce((a, b) => a + b, 0) / item.prices.length),
        minPrice: Math.min(...item.minPrices),
        maxPrice: Math.max(...item.maxPrices),
        variety: item.variety,
        grade: item.grade,
        market: item.market,
        state: item.state,
        district: item.district
      }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [marketRecords]);

  // The data.gov.in daily-price feed only ever contains whatever's currently
  // been reported (typically the last day or two) - it has no real
  // week/month/year history to query. So we show everything that's actually
  // been reported, rather than a fake period filter that would return
  // identical results no matter which option was picked.
  const displayBars = aggregatedByDate;

  // Selected commodity object
  const currentCommodityObj = COMMODITIES.find((c) => c.name === selectedCommodity) || { 
    name: selectedCommodity, 
    emoji: '🌱' 
  };

  // Primary active record for snapshot display
  const activeRecord = displayBars[displayBars.length - 1] || null;

  // Chart layout calculations
  const svgWidth = 680;
  const svgHeight = 260;
  const paddingLeft = 65;
  const paddingRight = 30;
  const paddingTop = 35;
  const paddingBottom = 48;
  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // Compute clean Y-axis scale starting at 0
  const maxBarPrice = displayBars.length > 0 ? Math.max(...displayBars.map((b) => b.price)) : 3000;
  // Round yMax up to a clean multiple
  const yMax = Math.ceil((maxBarPrice * 1.2) / 500) * 500 || 3000;

  // Check if historical data across multiple dates exists
  const hasMultipleHistoricalDates = displayBars.length > 1;

  return (
    <div className="card" style={{ marginTop: 24, marginBottom: 24, border: '1px solid var(--neutral-200)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} /> {t('mandi.officialFeed', 'Live Mandi Price Feed')}
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{currentCommodityObj.emoji}</span>
            <span>{t('mandi.priceTrend', 'Mandi Price Trend')} — {selectedCommodity}</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--neutral-500)', margin: '4px 0 0 0' }}>
            {t('mandi.dailyModalRatesDesc', 'Daily modal rates (₹/quintal) reported across APMC mandis.')}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchMandiData}
          disabled={isLoading}
          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
          title="Refresh live mandi data"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>{t('btn.refresh', 'Refresh')}</span>
        </button>
      </div>

      {/* Selectors Bar: Commodity, Market, and Period */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap', 
        gap: 12, 
        padding: '12px 16px', 
        background: 'var(--neutral-50)', 
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--neutral-200)',
        marginBottom: 20
      }}>
        {/* Commodity Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neutral-700)' }}>
            {t('produce.commodity', 'Commodity')}:
          </label>
          <select
            className="filter-select"
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            style={{ fontSize: '0.84rem', padding: '6px 12px', borderRadius: 'var(--radius-md)', minWidth: 140 }}
          >
            {COMMODITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Market / APMC Selector (Only markets with REAL data for selected commodity) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px', maxWidth: 360 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neutral-700)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <Building2 size={14} /> {t('produce.market', 'Market')}:
          </label>
          <select
            className="filter-select"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            disabled={availableMarkets.length === 0}
            style={{ fontSize: '0.84rem', padding: '6px 12px', borderRadius: 'var(--radius-md)', width: '100%' }}
          >
            {availableMarkets.length === 0 ? (
              <option value="">{t('mandi.noReportingMandis', 'No reporting mandis found')}</option>
            ) : (
              availableMarkets.map((m) => (
                <option key={m.market} value={m.market}>
                  {m.market} {m.state ? `(${m.state})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Recent prices badge (replaces the old Week/Month/Year filter -
            the underlying data source only has recent reported prices,
            not real historical ranges, so a period filter would be
            misleading) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
            <Calendar size={13} /> {t('mandi.recentPrices', 'Recent mandi prices')}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', gap: 8 }}>
          <RefreshCw size={26} className="animate-spin" style={{ color: 'var(--primary-600)' }} />
          <span style={{ fontSize: '0.86rem' }}>{t('mandi.fetchingPrices', 'Fetching live verified mandi prices for {crop}...', { crop: selectedCommodity })}</span>
        </div>
      ) : availableMarkets.length === 0 ? (
        <div style={{ 
          height: 160, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'var(--neutral-50)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          textAlign: 'center',
          color: 'var(--neutral-600)',
          gap: 6
        }}>
          <AlertCircle size={26} style={{ color: '#d97706' }} />
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--neutral-800)' }}>
            {t('mandi.noPricesReporting', 'No live mandi prices currently reporting for {crop}', { crop: selectedCommodity })}
          </div>
          <div style={{ fontSize: '0.8rem', maxWidth: 440, color: 'var(--neutral-500)' }}>
            {t('mandi.noPricesReportingDesc', 'APMC mandis publish arrival rates dynamically throughout trading hours. Choose another commodity from the selector above to view real market data.')}
          </div>
        </div>
      ) : (
        <div>
          {/* Market Summary Metrics Strip */}
          {activeRecord && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--neutral-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('mandi.modalPrice', 'Modal Price')}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 2 }}>
                  ₹{Number(activeRecord.price).toLocaleString()}{' '}
                  <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--neutral-500)' }}>/{t('unit.quintal', 'quintal')}</span>
                </div>
              </div>

              <div style={{ background: 'var(--neutral-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('mandi.minMaxPrice', 'Min – Max Price')}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--neutral-800)', marginTop: 2 }}>
                  ₹{activeRecord.minPrice.toLocaleString()} – ₹{activeRecord.maxPrice.toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--neutral-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('mandi.reportedDate', 'Reported Date (X-Axis)')}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={15} />
                  <span>{activeRecord.date}</span>
                </div>
              </div>

              <div style={{ background: 'var(--neutral-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('produce.varietyGrade', 'Variety & Grade')}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--neutral-800)', marginTop: 4 }}>
                  {activeRecord.variety} ({activeRecord.grade})
                </div>
              </div>
            </div>
          )}

          {/* Historical Data Notice if only single date available */}
          {!hasMultipleHistoricalDates && (
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid var(--neutral-200)', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px 16px', 
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              fontSize: '0.84rem',
              color: 'var(--neutral-700)'
            }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: 1, color: '#0284c7' }} />
              <div>
                <strong style={{ color: 'var(--neutral-900)', fontSize: '0.88rem' }}>
                  {t('mandi.historicalUnavailable', 'Historical data unavailable for this period.')}
                </strong>
                <div style={{ color: 'var(--neutral-600)', marginTop: 2, lineHeight: 1.4, fontSize: '0.8rem' }}>
                  Live daily arrivals are reported for <strong>{selectedMarket}</strong> ({activeRecord?.date || 'Today'}). In accordance with strict data integrity standards, missing historical dates are never populated with estimated bars.
                </div>
              </div>
            </div>
          )}

          {/* Clean Vertical Bar Chart Container */}
          <div style={{ 
            border: '1px solid var(--neutral-200)', 
            borderRadius: 'var(--radius-md)', 
            padding: '20px 20px 14px 20px', 
            background: '#ffffff',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--neutral-700)' }}>
                {t('mandi.priceByArrivalDate', 'Price by Arrival Date')} — {selectedCommodity} ({selectedMarket})
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.74rem' }}>
                {displayBars.length} {t('mandi.verifiedDates', 'Verified Real Dates')}
              </span>
            </div>

            {/* SVG Vertical Bar Chart */}
            <div style={{ position: 'relative' }}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const val = Math.round(ratio * yMax);
                  const yPos = paddingTop + (1 - ratio) * chartInnerHeight;
                  return (
                    <g key={ratio}>
                      <line 
                        x1={paddingLeft} 
                        y1={yPos} 
                        x2={svgWidth - paddingRight} 
                        y2={yPos} 
                        stroke="#f1f5f9" 
                        strokeDasharray={ratio === 0 ? 'none' : '3 3'} 
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={yPos + 4} 
                        textAnchor="end" 
                        fontSize="10" 
                        fill="#64748b"
                        fontWeight={ratio === 0 || ratio === 1 ? '700' : '400'}
                      >
                        ₹{val.toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Y-Axis Label */}
                <text 
                  x={paddingLeft - 46} 
                  y={paddingTop + chartInnerHeight / 2} 
                  textAnchor="middle" 
                  fontSize="9.5" 
                  fontWeight="700" 
                  fill="#64748b" 
                  transform={`rotate(-90, ${paddingLeft - 46}, ${paddingTop + chartInnerHeight / 2})`}
                >
                  Price (₹ / quintal)
                </text>

                {/* X-Axis Baseline */}
                <line 
                  x1={paddingLeft} 
                  y1={paddingTop + chartInnerHeight} 
                  x2={svgWidth - paddingRight} 
                  y2={paddingTop + chartInnerHeight} 
                  stroke="#cbd5e1" 
                  strokeWidth="1.5" 
                />

                {/* Vertical Bars */}
                {(() => {
                  const barCount = displayBars.length;
                  const slotWidth = chartInnerWidth / Math.max(1, barCount);
                  // Responsive bar width bounded nicely
                  const barWidth = Math.min(54, Math.max(26, slotWidth * 0.48));

                  return displayBars.map((item, index) => {
                    const centerX = paddingLeft + (index + 0.5) * slotWidth;
                    const barX = centerX - barWidth / 2;
                    const barHeight = Math.max(4, (item.price / yMax) * chartInnerHeight);
                    const barY = paddingTop + chartInnerHeight - barHeight;
                    const isHovered = hoveredBar === item;

                    return (
                      <g 
                        key={item.date + index}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredBar(item)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {/* Vertical Bar */}
                        <rect 
                          x={barX} 
                          y={barY} 
                          width={barWidth} 
                          height={barHeight} 
                          rx="4" 
                          ry="4" 
                          fill={isHovered ? '#15803d' : '#16a34a'}
                          stroke={isHovered ? '#14532d' : 'none'}
                          strokeWidth={isHovered ? '1.5' : '0'}
                          style={{ transition: 'all 0.15s ease' }}
                        />

                        {/* Exact Price on Top of the Bar */}
                        <text 
                          x={centerX} 
                          y={barY - 8} 
                          textAnchor="middle" 
                          fontSize="11" 
                          fontWeight="700" 
                          fill={isHovered ? '#14532d' : '#15803d'}
                        >
                          ₹{item.price.toLocaleString()}
                        </text>

                        {/* X-Axis Tick Mark */}
                        <line 
                          x1={centerX} 
                          y1={paddingTop + chartInnerHeight} 
                          x2={centerX} 
                          y2={paddingTop + chartInnerHeight + 5} 
                          stroke="#64748b" 
                          strokeWidth="1" 
                        />

                        {/* X-Axis Date Label */}
                        <text 
                          x={centerX} 
                          y={paddingTop + chartInnerHeight + 18} 
                          textAnchor="middle" 
                          fontSize="10" 
                          fontWeight="600" 
                          fill="#334155"
                        >
                          {item.date}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>

              {/* Hover Tooltip */}
              {hoveredBar && (
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 15,
                  background: '#1e293b',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  boxShadow: 'var(--shadow-lg)',
                  pointerEvents: 'none',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3
                }}>
                  <div style={{ fontWeight: 800, color: '#f8fafc' }}>
                    {hoveredBar.market} ({hoveredBar.state})
                  </div>
                  <div style={{ color: '#4ade80', fontWeight: 800 }}>
                    {t('mandi.modalPrice', 'Modal Price')}: ₹{hoveredBar.price.toLocaleString()} /{t('unit.quintal', 'quintal')}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    {t('produce.min', 'Min')}: ₹{hoveredBar.minPrice.toLocaleString()} • {t('produce.max', 'Max')}: ₹{hoveredBar.maxPrice.toLocaleString()}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>
                    {t('produce.date', 'Date')}: {hoveredBar.date} | {t('produce.variety', 'Variety')}: {hoveredBar.variety}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Details: Source, APMC Jurisdiction, and Detailed View Link */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 8, 
            marginTop: 12, 
            fontSize: '0.76rem', 
            color: 'var(--neutral-500)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} />
              <span>
                {t('mandi.selectedApmc', 'Selected APMC')}: <strong>{selectedMarket || t('common.none', 'None')}</strong>{' '}
                {activeRecord?.district ? `(${activeRecord.district}, ${activeRecord.state})` : ''}
              </span>
            </div>

            {onNavigate && (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => onNavigate('market-prices')}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {t('mandi.fullIntelligence', 'Full Mandi Intelligence →')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
