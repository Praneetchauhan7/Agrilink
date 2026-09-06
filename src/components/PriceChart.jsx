import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Store, 
  Calendar, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  X, 
  ArrowUpDown, 
  Search,
  Filter,
  BarChart2,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PriceChart({ onSelectProduce, selectedProduce = 'Tomatoes' }) {
  const { t } = useLanguage();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [realRecords, setRealRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // View states: 'compact' | 'expanded'
  const [viewMode, setViewMode] = useState('compact');
  // Fullscreen / detailed modal state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Modal filter and sort states
  const [modalSearch, setModalSearch] = useState('');
  const [modalSort, setModalSort] = useState('price-desc'); // 'price-desc' | 'price-asc' | 'name-asc'

  // Normalize commodity query for mandi rate database (e.g. Tomatoes -> Tomato, Onions -> Onion)
  const normalizedCommodity = selectedProduce
    ? selectedProduce.replace(/es$/, '').replace(/s$/, '')
    : 'Tomato';

  useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/market-price-trends?commodity=${encodeURIComponent(normalizedCommodity)}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && Array.isArray(json.records)) {
            const valid = json.records.filter((r) => Number(r.modal_price) > 0);
            setRealRecords(valid);
          } else {
            setRealRecords([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch market trend data:', err);
        if (isMounted) {
          setRealRecords([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRealData();
    return () => {
      isMounted = false;
    };
  }, [normalizedCommodity]);

  // Handle ESC key to close fullscreen modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Derived statistics
  const prices = useMemo(() => realRecords.map((r) => Number(r.modal_price)), [realRecords]);
  const avgPrice = useMemo(() => (prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0), [prices]);
  const minPrice = useMemo(() => (prices.length > 0 ? Math.min(...prices) : 0), [prices]);
  const maxPrice = useMemo(() => (prices.length > 0 ? Math.max(...prices) : 0), [prices]);
  const range = useMemo(() => Math.max(1, maxPrice - minPrice), [maxPrice, minPrice]);

  // Best reported rate
  const bestRecord = useMemo(() => {
    if (realRecords.length === 0) return null;
    return realRecords.reduce((best, cur) => {
      return Number(cur.modal_price) > Number(best.modal_price) ? cur : best;
    }, realRecords[0]);
  }, [realRecords]);

  // Filtered and sorted records for fullscreen modal
  const modalRecords = useMemo(() => {
    let list = [...realRecords];
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.market?.toLowerCase().includes(q) ||
          r.district?.toLowerCase().includes(q) ||
          r.variety?.toLowerCase().includes(q)
      );
    }
    if (modalSort === 'price-desc') {
      list.sort((a, b) => Number(b.modal_price) - Number(a.modal_price));
    } else if (modalSort === 'price-asc') {
      list.sort((a, b) => Number(a.modal_price) - Number(b.modal_price));
    } else if (modalSort === 'name-asc') {
      list.sort((a, b) => (a.market || '').localeCompare(b.market || ''));
    }
    return list;
  }, [realRecords, modalSearch, modalSort]);

  // Loading state
  if (isLoading) {
    return (
      <div className="chart-card" style={{ padding: '40px 20px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
        <RefreshCw size={26} className="animate-spin" style={{ color: 'var(--primary-600)', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '0.9rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
          {t('price.fetchingMandiTrends', 'Fetching live mandi price discovery and rates...')}
        </p>
      </div>
    );
  }

  // Empty state
  if (!realRecords || realRecords.length === 0) {
    return (
      <div className="chart-card" style={{ padding: '36px 20px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'var(--neutral-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: 'var(--neutral-400)',
          }}
        >
          <TrendingUp size={24} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--neutral-800)' }}>
          {t('price.noTrendData', 'No price trend data available')}
        </h3>
        <p style={{ color: 'var(--neutral-500)', fontSize: '0.85rem', maxWidth: 440, margin: '8px auto 0' }}>
          {t('price.noTrendDesc', 'Active mandi arrival records are not currently available for')} <strong>{selectedProduce}</strong>. {t('price.checkAnother', 'Try selecting another commodity to view real-time price discovery.')}
        </p>

        {onSelectProduce && (
          <div style={{ marginTop: 18 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--neutral-500)', marginRight: 8 }}>
              {t('produce.commodity', 'Commodity')}:
            </span>
            <select
              className="filter-select"
              value={selectedProduce}
              onChange={(e) => onSelectProduce(e.target.value)}
              style={{ display: 'inline-block', width: 'auto', fontSize: '0.84rem' }}
            >
              <option value="Tomatoes">🍅 Tomatoes</option>
              <option value="Onions">🧅 Onions</option>
              <option value="Potatoes">🥔 Potatoes</option>
              <option value="Wheat">🌾 Wheat</option>
              <option value="Grapes">🍇 Grapes</option>
            </select>
          </div>
        )}
      </div>
    );
  }

  const isExpanded = viewMode === 'expanded';
  const graphHeight = isExpanded ? 260 : 180;

  return (
    <>
      <div 
        className="chart-card"
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header */}
        <div 
          className="chart-header"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16
          }}
        >
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                <TrendingUp size={12} /> {t('mandi.liveFeed', 'Live Mandi Rates')}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                {realRecords.length} {realRecords.length === 1 ? 'reporting mandi' : 'reporting mandis'}
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--neutral-900)' }}>
              {normalizedCommodity} {t('price.trendAndIntelligence', 'Mandi Price Discovery & Rates')}
            </h3>

            <div className="price-metric-box" style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span className="price-hero-value" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
                ₹{avgPrice.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--neutral-500)' }}>
                /{t('unit.quintal', 'quintal')} ({t('common.avg', 'Mandi Average')})
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--neutral-600)', background: 'var(--neutral-100)', padding: '2px 8px', borderRadius: 6 }}>
                Range: ₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Controls: View switcher, Fullscreen, and Commodity Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Toggle Compact / Expanded */}
            <div style={{ display: 'flex', background: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', padding: 2 }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem', border: 'none' }}
                onClick={() => setViewMode('compact')}
                title="Compact view"
              >
                Normal
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'expanded' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem', border: 'none' }}
                onClick={() => setViewMode('expanded')}
                title="Expanded view with higher resolution"
              >
                Expanded
              </button>
            </div>

            {/* Fullscreen / Detailed Modal Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsFullscreen(true)}
              style={{ padding: '5px 10px', fontSize: '0.78rem', gap: 5, display: 'inline-flex', alignItems: 'center' }}
              title="Open full-screen interactive view"
            >
              <Maximize2 size={13} />
              <span>Full View</span>
            </button>

            {/* Quick Produce Switcher */}
            {onSelectProduce && (
              <select
                className="filter-select"
                value={selectedProduce}
                onChange={(e) => onSelectProduce(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '5px 10px', borderRadius: 'var(--radius-md)' }}
              >
                <option value="Tomatoes">🍅 Tomatoes</option>
                <option value="Onions">🧅 Onions</option>
                <option value="Potatoes">🥔 Potatoes</option>
                <option value="Wheat">🌾 Wheat</option>
                <option value="Grapes">🍇 Grapes</option>
              </select>
            )}
          </div>
        </div>

        {/* Highlight Sub-strip: Best mandi rate */}
        {bestRecord && (
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: 8, 
              fontSize: '0.82rem', 
              color: 'var(--neutral-600)', 
              background: '#f8fafc',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              marginBottom: 16 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Store size={15} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {t('price.bestNearbyRate', 'Highest Reported Rate')}:{' '}
                <strong style={{ color: 'var(--primary-700)' }}>
                  ₹{Number(bestRecord.modal_price).toLocaleString()}/{t('unit.quintalShort', 'q')}
                </strong>
                {' '}({bestRecord.market.trim()}{bestRecord.district ? `, ${bestRecord.district}` : ''})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: '0.76rem', color: 'var(--neutral-500)' }}>
              <Calendar size={13} />
              <span>{bestRecord.date ? `Arrival Date: ${bestRecord.date}` : 'Active Mandi Session'}</span>
            </div>
          </div>
        )}

        {/* Scrollable, Responsive Graph Container - NEVER OVERFLOWS CONTAINER */}
        <div 
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflowX: 'auto',
            overflowY: 'hidden',
            paddingBottom: 8,
            scrollbarWidth: 'thin',
            position: 'relative',
          }}
        >
          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              height: graphHeight,
              minWidth: Math.max(320, realRecords.length * 64),
              width: '100%',
              gap: 12,
              paddingTop: 32,
              paddingBottom: 4,
              boxSizing: 'border-box',
              position: 'relative',
              borderBottom: '2px solid var(--neutral-200)',
            }}
          >
            {realRecords.map((item, index) => {
              const itemPrice = Number(item.modal_price);
              const heightPct = range > 0
                ? Math.max(18, Math.round(((itemPrice - minPrice) / range) * 78 + 18))
                : 50;
              const isHighest = itemPrice === maxPrice;
              const isLowest = itemPrice === minPrice && realRecords.length > 1;
              const isHovered = hoveredItem === item;

              return (
                <div
                  key={index}
                  style={{
                    flex: '1 1 0',
                    minWidth: 54,
                    maxWidth: 90,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => setIsFullscreen(true)}
                >
                  {/* Interactive Tooltip Card */}
                  {isHovered && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: 6,
                        background: 'rgba(15, 23, 42, 0.95)',
                        color: '#ffffff',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        zIndex: 20,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        pointerEvents: 'none',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#f8fafc' }}>{item.market.trim()}</div>
                      <div style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 800, margin: '2px 0' }}>
                        ₹{itemPrice.toLocaleString()} /{t('unit.quintalShort', 'q')}
                      </div>
                      {item.min_price && item.max_price && (
                        <div style={{ color: '#cbd5e1', fontSize: '0.68rem' }}>
                          ₹{item.min_price} - ₹{item.max_price}
                        </div>
                      )}
                      {item.district && (
                        <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                          {item.district}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price Tag Above Bar */}
                  <span
                    style={{
                      fontSize: isExpanded ? '0.75rem' : '0.7rem',
                      fontWeight: 800,
                      color: isHighest ? 'var(--primary-700)' : isHovered ? 'var(--neutral-900)' : 'var(--neutral-600)',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ₹{itemPrice}
                  </span>

                  {/* The Colored Bar */}
                  <div
                    style={{
                      width: '80%',
                      maxWidth: 42,
                      height: `${heightPct}%`,
                      minHeight: 12,
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.2s ease',
                      transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                      background: isHighest
                        ? 'linear-gradient(180deg, #16a34a, #15803d)'
                        : isLowest
                        ? 'linear-gradient(180deg, #94a3b8, #64748b)'
                        : isHovered
                        ? 'linear-gradient(180deg, #22c55e, #16a34a)'
                        : 'linear-gradient(180deg, #4ade80, #22c55e)',
                      boxShadow: isHovered ? '0 2px 8px rgba(34, 197, 94, 0.4)' : 'none',
                    }}
                  />

                  {/* Mandi Name Label below bar */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: isHovered ? 'var(--neutral-900)' : 'var(--neutral-600)',
                      fontWeight: isHovered ? 700 : 500,
                      marginTop: 6,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      display: 'block',
                      width: '100%',
                    }}
                    title={`${item.market} (${item.district || ''})`}
                  >
                    {item.market.replace(/APMC/i, '').trim()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend and Helper */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 10, 
            marginTop: 10, 
            fontSize: '0.74rem', 
            color: 'var(--neutral-500)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} />
              Highest Rate
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
              Modal Rate
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#94a3b8', display: 'inline-block' }} />
              Lowest Rate
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-700)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.75rem',
              padding: 0
            }}
          >
            <span>View All Reporting Mandis ({realRecords.length})</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Compact Mandi Comparison Cards */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--neutral-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--neutral-700)', margin: 0 }}>
              {t('mandi.nearbyDiscovery', 'Reporting Mandi Rates')}
            </h4>
            <span style={{ fontSize: '0.74rem', color: 'var(--neutral-500)' }}>
              Live Daily Rates
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
            {realRecords.slice(0, 6).map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--neutral-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.market.trim()}
                  </span>
                  {m.district && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)', flexShrink: 0 }}>
                      {m.district}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 3 }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.92rem' }}>
                    ₹{Number(m.modal_price).toLocaleString()}
                    <span style={{ fontSize: '0.68rem', color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--neutral-500)' }}>
                    {m.variety || 'Standard'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FULLSCREEN / DETAILED INTERACTIVE MODAL */}
      {isFullscreen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '1100px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--neutral-200)',
              overflow: 'hidden',
              animation: 'modalPop 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--neutral-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--neutral-50)',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div 
                  style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 10, 
                    background: 'var(--primary-100)', 
                    color: 'var(--primary-700)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
                    {normalizedCommodity} Mandi Price Discovery & Detailed Analysis
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--neutral-500)' }}>
                    Detailed interactive view of all reporting mandis and modal rates
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsFullscreen(false)}
                  style={{
                    background: 'var(--neutral-200)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--neutral-700)'
                  }}
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Summary Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--neutral-500)', fontWeight: 700 }}>AVERAGE MODAL RATE</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: 2 }}>
                    ₹{avgPrice.toLocaleString()} <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--neutral-500)', fontWeight: 700 }}>HIGHEST REPORTED RATE</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                    ₹{maxPrice.toLocaleString()} <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--neutral-500)', fontWeight: 700 }}>LOWEST REPORTED RATE</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
                    ₹{minPrice.toLocaleString()} <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--neutral-500)' }}>/{t('unit.quintalShort', 'q')}</span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--neutral-500)', fontWeight: 700 }}>REPORTING MANDIS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--neutral-800)', marginTop: 2 }}>
                    {realRecords.length}
                  </div>
                </div>
              </div>

              {/* Fullscreen Graph Container */}
              <div 
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--neutral-800)' }}>
                    Comparative Modal Rates Across Mandis
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, background: '#16a34a', borderRadius: 2 }} /> Highest (₹{maxPrice})
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: 2 }} /> Active Modal Rate
                    </span>
                  </div>
                </div>

                {/* Graph Scrollable View */}
                <div 
                  style={{
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    paddingBottom: 10,
                    scrollbarWidth: 'thin'
                  }}
                >
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      height: 320,
                      minWidth: Math.max(500, modalRecords.length * 70),
                      width: '100%',
                      gap: 16,
                      paddingTop: 36,
                      paddingBottom: 4,
                      borderBottom: '2px solid var(--neutral-200)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {modalRecords.map((item, index) => {
                      const itemPrice = Number(item.modal_price);
                      const heightPct = range > 0
                        ? Math.max(20, Math.round(((itemPrice - minPrice) / range) * 76 + 20))
                        : 60;
                      const isHighest = itemPrice === maxPrice;

                      return (
                        <div
                          key={index}
                          style={{
                            flex: '1 1 0',
                            minWidth: 60,
                            maxWidth: 96,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                            position: 'relative',
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: '0.76rem', 
                              fontWeight: 800, 
                              color: isHighest ? 'var(--primary-700)' : 'var(--neutral-700)',
                              marginBottom: 4,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ₹{itemPrice}
                          </span>

                          <div
                            style={{
                              width: '75%',
                              maxWidth: 48,
                              height: `${heightPct}%`,
                              borderRadius: '6px 6px 0 0',
                              background: isHighest
                                ? 'linear-gradient(180deg, #16a34a, #15803d)'
                                : 'linear-gradient(180deg, #4ade80, #22c55e)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            }}
                          />

                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--neutral-700)',
                              fontWeight: 600,
                              marginTop: 8,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                              width: '100%',
                            }}
                            title={item.market}
                          >
                            {item.market.replace(/APMC/i, '').trim()}
                          </span>
                          {item.district && (
                            <span 
                              style={{ 
                                fontSize: '0.66rem', 
                                color: 'var(--neutral-400)', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                textAlign: 'center'
                              }}
                            >
                              {item.district}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar for Modal Mandis Table */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ position: 'relative', flex: '1 1 240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search mandi, district, or variety..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    style={{ paddingLeft: 36, fontSize: '0.84rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowUpDown size={15} style={{ color: 'var(--neutral-500)' }} />
                  <select
                    className="filter-select"
                    value={modalSort}
                    onChange={(e) => setModalSort(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  >
                    <option value="price-desc">Rate: High to Low</option>
                    <option value="price-asc">Rate: Low to High</option>
                    <option value="name-asc">Mandi Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Comprehensive Mandi Records Table */}
              <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--neutral-100)', borderBottom: '1px solid var(--neutral-200)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-700)' }}>Mandi / Market</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-700)' }}>District</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-700)' }}>Variety</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-700)' }}>Min Price</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-700)' }}>Max Price</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-700)' }}>Modal Rate</th>
                      <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-700)' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalRecords.map((rec, i) => (
                      <tr 
                        key={i} 
                        style={{ 
                          borderBottom: '1px solid var(--neutral-200)',
                          background: i % 2 === 0 ? '#ffffff' : 'var(--neutral-50)'
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                          {rec.market}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--neutral-600)' }}>
                          {rec.district || '-'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--neutral-600)' }}>
                          {rec.variety || 'Standard'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--neutral-600)' }}>
                          {rec.min_price ? `₹${Number(rec.min_price).toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--neutral-600)' }}>
                          {rec.max_price ? `₹${Number(rec.max_price).toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--primary-700)' }}>
                          ₹{Number(rec.modal_price).toLocaleString()}/q
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--neutral-500)', fontSize: '0.78rem' }}>
                          {rec.date || 'Today'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              style={{ 
                padding: '12px 24px', 
                borderTop: '1px solid var(--neutral-200)', 
                background: 'var(--neutral-50)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '0.78rem',
                color: 'var(--neutral-600)'
              }}
            >
              <span>Showing {modalRecords.length} of {realRecords.length} reporting mandis</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsFullscreen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
