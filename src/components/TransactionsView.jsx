import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Truck, 
  DollarSign, 
  ShieldCheck, 
  Package, 
  AlertCircle,
  FileText,
  User,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getCommodityEmoji } from '../constants/commodities';

export const TRANSACTION_STAGES = [
  { key: 'Accepted', label: 'Accepted', icon: CheckCircle2, desc: 'Agreement confirmed by parties' },
  { key: 'Payment Pending', label: 'Payment Pending', icon: Clock, desc: 'Escrow payment awaiting deposit' },
  { key: 'Payment Completed', label: 'Payment Completed', icon: DollarSign, desc: 'Payment secured in escrow' },
  { key: 'Delivery/Pickup', label: 'Delivery/Pickup', icon: Truck, desc: 'Produce dispatched / in transit' },
  { key: 'Completed', label: 'Completed', icon: ShieldCheck, desc: 'Delivery accepted & settlement completed' }
];

export default function TransactionsView({ 
  transactions = [], 
  currentUserId,
  currentUserRole = 'farmer',
  onAdvanceStatus,
  onRefresh
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const getStageIndex = (status) => {
    const idx = TRANSACTION_STAGES.findIndex(s => s.key.toLowerCase() === (status || '').toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  const getNextStage = (currentStatus) => {
    const idx = getStageIndex(currentStatus);
    if (idx < TRANSACTION_STAGES.length - 1) {
      return TRANSACTION_STAGES[idx + 1].key;
    }
    return null;
  };

  const handleAdvance = async (tx) => {
    const nextStatus = getNextStage(tx.status);
    if (!nextStatus) return;

    setActionError(null);
    setUpdatingId(tx.id);
    try {
      await onAdvanceStatus(tx.id, nextStatus);
    } catch (err) {
      setActionError(err.message || 'Failed to update transaction status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'All') return true;
    return tx.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">{t('transactions.title', 'Contract Transactions & State Flow')}</h1>
            <p className="page-subtitle">
              {t('transactions.subtitle', 'Real-time PostgreSQL lifecycle tracking: Accepted → Payment Pending → Payment Completed → Delivery/Pickup → Completed.')}
            </p>
          </div>
          {onRefresh && (
            <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
              {t('common.refresh', 'Refresh Data')}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', ...TRANSACTION_STAGES.map(s => s.key)].map((st) => (
          <button
            key={st}
            className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(st)}
          >
            {st} ({st === 'All' ? transactions.length : transactions.filter(t => t.status.toLowerCase() === st.toLowerCase()).length})
          </button>
        ))}
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Package size={44} style={{ color: 'var(--neutral-300)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('transactions.noTransactions', 'No transactions found')}</h3>
          <p style={{ color: 'var(--neutral-500)', marginTop: 4 }}>
            {t('transactions.noTransactionsDesc', 'Transactions are created automatically in PostgreSQL when an offer is accepted.')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredTransactions.map((tx) => {
            const currentIdx = getStageIndex(tx.status);
            const nextStatus = getNextStage(tx.status);
            const isCompleted = tx.status === 'Completed';

            return (
              <div key={tx.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Top Transaction Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.5rem' }}>{getCommodityEmoji(tx.crop)}</span>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                          {tx.crop}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                          ID: <strong>{tx.id}</strong> • Offer ID: {tx.offer_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${isCompleted ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                      ● {tx.status}
                    </span>
                  </div>
                </div>

                {/* Key Metric Blocks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, background: 'var(--neutral-50)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Quantity</span>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--neutral-900)', marginTop: 2 }}>
                      {Number(tx.quantity).toLocaleString()} kg
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Agreed Price</span>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-700)', marginTop: 2 }}>
                      ₹{Number(tx.agreed_price).toLocaleString()} / q
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Total Contract Amount</span>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--neutral-900)', marginTop: 2 }}>
                      ₹{Number(tx.total_amount).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Contract Parties</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-800)', marginTop: 2 }}>
                      Farmer: {tx.farmer_name || tx.farmer_id} <br />
                      Buyer: {tx.buyer_name || tx.buyer_id}
                    </div>
                  </div>
                </div>

                {/* 5-Stage Visual Stepper */}
                <div style={{ margin: '8px 0', overflowX: 'auto', paddingBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 620, position: 'relative' }}>
                    {TRANSACTION_STAGES.map((stage, idx) => {
                      const Icon = stage.icon;
                      const isPast = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      const isFuture = idx > currentIdx;

                      return (
                        <React.Fragment key={stage.key}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 120, zIndex: 2 }}>
                            <div 
                              style={{ 
                                width: 36, 
                                height: 36, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: isPast || isCurrent ? (isCurrent ? 'var(--primary-600)' : '#16a34a') : '#e2e8f0',
                                color: isPast || isCurrent ? '#ffffff' : '#94a3b8',
                                transition: 'all 0.2s ease',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(45, 90, 39, 0.2)' : 'none'
                              }}
                            >
                              <Icon size={18} />
                            </div>
                            <span 
                              style={{ 
                                fontSize: '0.78rem', 
                                fontWeight: isCurrent ? 800 : 600, 
                                color: isCurrent ? 'var(--primary-800)' : isPast ? '#15803d' : 'var(--neutral-400)',
                                marginTop: 6,
                                textAlign: 'center',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {stage.label}
                            </span>
                          </div>

                          {idx < TRANSACTION_STAGES.length - 1 && (
                            <div 
                              style={{ 
                                flex: 1, 
                                height: 4, 
                                backgroundColor: idx < currentIdx ? '#16a34a' : '#e2e8f0', 
                                margin: '0 -10px',
                                marginBottom: 22,
                                zIndex: 1
                              }} 
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* State Transition Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-100)', paddingTop: 14 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                    Created: {new Date(tx.created_at).toLocaleDateString()} • Updated: {new Date(tx.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {!isCompleted && nextStatus && (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={updatingId === tx.id}
                      onClick={() => handleAdvance(tx)}
                      style={{ gap: 6 }}
                    >
                      {updatingId === tx.id ? (
                        <span>Updating PostgreSQL...</span>
                      ) : (
                        <>
                          <span>Advance to: <strong>{nextStatus}</strong></span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  )}

                  {isCompleted && (
                    <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={16} /> Transaction Complete
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
