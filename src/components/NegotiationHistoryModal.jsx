import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  User, 
  ShieldCheck, 
  Send,
  AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';

export default function NegotiationHistoryModal({
  isOpen,
  onClose,
  offer,
  currentUserId,
  currentUserRole = 'buyer', // 'buyer' or 'farmer'
  onAccept,
  onReject,
  onCounter
}) {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterPrice, setCounterPrice] = useState(offer?.price || offer?.offeredPrice || 2800);
  const [counterQuantity, setCounterQuantity] = useState(offer?.quantity || offer?.quantityOffered || 1000);
  const [counterMessage, setCounterMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!offer?.id) return;
    setLoading(true);
    setErrorMsg(null);
    fetch(`/api/offers/${offer.id}/history`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history) {
          setHistory(data.history);
        } else {
          setHistory([offer]);
        }
      })
      .catch(err => {
        console.error('Error fetching negotiation history:', err);
        setHistory([offer]);
      })
      .finally(() => setLoading(false));
  }, [offer]);

  if (!isOpen || !offer) return null;

  const latestOffer = history.length > 0 ? history[history.length - 1] : offer;
  const isRejected = (latestOffer.status || '').toLowerCase() === 'rejected';
  const isAccepted = (latestOffer.status || '').toLowerCase() === 'accepted';
  const isPendingOrCountered = !isRejected && !isAccepted;

  // Can the current user respond?
  // If latest proposal was made by 'farmer' and current user is 'buyer', buyer can respond.
  // If latest proposal was made by 'buyer' and current user is 'farmer', farmer can respond.
  const lastSenderRole = latestOffer.sender_role || (latestOffer.buyer_id === currentUserId ? 'buyer' : 'farmer');
  const canRespond = isPendingOrCountered && (lastSenderRole !== currentUserRole);

  const handleSendCounter = async (e) => {
    e.preventDefault();
    if (!counterPrice || counterPrice <= 0) {
      setErrorMsg('A valid positive price is required');
      return;
    }
    if (!counterQuantity || counterQuantity <= 0) {
      setErrorMsg('A valid positive quantity is required');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onCounter(latestOffer.id, {
        offered_price: Number(counterPrice),
        quantity: Number(counterQuantity),
        message: counterMessage || `Counter proposal from ${currentUserRole}`,
        actor_role: currentUserRole,
        actor_id: currentUserId
      });
      setShowCounterForm(false);
      // Reload history
      const res = await fetch(`/api/offers/${offer.id}/history`);
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit counter-offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Negotiation History: ${offer.produce || offer.crop_name || 'Produce'}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Thread Status Banner */}
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          backgroundColor: isAccepted ? 'var(--primary-50)' : isRejected ? '#fef2f2' : 'var(--neutral-50)',
          border: `1px solid ${isAccepted ? 'var(--primary-300)' : isRejected ? '#fca5a5' : 'var(--neutral-200)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isAccepted ? 'var(--primary-900)' : isRejected ? '#991b1b' : 'var(--neutral-800)' }}>
              Thread Status: {latestOffer.status || 'Pending'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--neutral-600)', marginTop: 2 }}>
              {isAccepted ? 'Contract accepted! Active in PostgreSQL Transactions.' : isRejected ? 'This negotiation thread is closed. No further counter-offers are permitted.' : 'Negotiation active between farmer and buyer.'}
            </div>
          </div>
          <span className={`badge ${isAccepted ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning'}`}>
            {latestOffer.status || 'Pending'}
          </span>
        </div>

        {/* Negotiation Timeline / History Messages */}
        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--neutral-500)' }}>Loading negotiation history...</div>
          ) : (
            history.map((step, idx) => {
              const isBuyerStep = (step.sender_role === 'buyer') || (!step.sender_role && idx === 0);
              const senderTitle = isBuyerStep ? `Buyer (${step.buyer_name || 'Buyer'})` : `Farmer (${step.farmer_name || 'Farmer'})`;
              const isLatest = idx === history.length - 1;

              return (
                <div 
                  key={step.id || idx}
                  style={{
                    border: `1px solid ${isLatest ? 'var(--primary-400)' : 'var(--neutral-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    backgroundColor: isLatest ? '#f8fafc' : '#ffffff',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isBuyerStep ? '#1e40af' : 'var(--primary-800)', background: isBuyerStep ? 'rgba(30,64,175,0.08)' : 'rgba(45,90,39,0.08)', padding: '2px 8px', borderRadius: 12 }}>
                        {senderTitle}
                      </span>
                      {idx === 0 ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)' }}>Initial Offer</span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)' }}>Counter-Offer #{idx}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--neutral-400)' }}>
                      {step.created_at ? new Date(step.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '8px 0', background: 'var(--neutral-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)' }}>Proposed Price:</span>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-700)' }}>
                        ₹{Number(step.offered_price || step.price).toLocaleString()} / {step.quantity_unit || 'q'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--neutral-500)' }}>Quantity:</span>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--neutral-900)' }}>
                        {Number(step.quantity).toLocaleString()} {step.quantity_unit || 'kg'}
                      </div>
                    </div>
                  </div>

                  {step.message && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--neutral-700)', fontStyle: 'italic', background: '#f1f5f9', padding: '6px 10px', borderRadius: 4, marginTop: 4 }}>
                      "{step.message}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Counter Form (if user chooses to counter) */}
        {showCounterForm && !isRejected && !isAccepted && (
          <form onSubmit={handleSendCounter} style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: 14 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 12 }}>
              Submit Counter-Offer as {currentUserRole === 'farmer' ? 'Farmer' : 'Buyer'}
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Counter Price (₹ / quintal)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  min="1"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Counter Quantity (kg)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  min="1"
                  value={counterQuantity}
                  onChange={(e) => setCounterQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Note / Message</label>
              <textarea 
                className="form-control" 
                rows={2} 
                placeholder="Specify condition, loading schedule, or revised terms..."
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCounterForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                <Send size={14} /> {submitting ? 'Submitting...' : 'Send Counter-Offer'}
              </button>
            </div>
          </form>
        )}

        {/* Bottom Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-200)', paddingTop: 14 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>

          {!showCounterForm && canRespond && (
            <div style={{ display: 'flex', gap: 8 }}>
              {onReject && (
                <button 
                  className="btn btn-outline-danger btn-sm" 
                  onClick={async () => {
                    setErrorMsg(null);
                    try {
                      await onReject(latestOffer.id);
                      onClose();
                    } catch (err) {
                      setErrorMsg(err.message || 'Failed to reject offer');
                    }
                  }}
                >
                  <X size={14} /> Reject Thread
                </button>
              )}

              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setShowCounterForm(true)}
              >
                <MessageSquare size={14} /> Make Counter-Offer
              </button>

              {onAccept && (
                <button 
                  className="btn btn-success btn-sm" 
                  onClick={async () => {
                    setErrorMsg(null);
                    try {
                      await onAccept(latestOffer.id);
                      onClose();
                    } catch (err) {
                      setErrorMsg(err.message || 'Failed to accept offer');
                    }
                  }}
                >
                  <Check size={14} /> Accept Offer & Create Contract
                </button>
              )}
            </div>
          )}

          {!showCounterForm && !canRespond && isPendingOrCountered && (
            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
              Waiting for response from {lastSenderRole === 'buyer' ? 'Farmer' : 'Buyer'}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
