import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';

/**
 * Buyer <-> Farmer chat, scoped to a single offer/purchase request.
 * The backend (GET/POST /api/messages/:offerId) enforces that only the
 * buyer and farmer on that specific offer can read or send messages -
 * this component just renders whatever the server allows it to see.
 */
export default function ChatWindow({ isOpen, onClose, offer, currentUserId, role }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const otherPartyName = role === 'buyer'
    ? (offer?.farmerName || offer?.farmer_name || 'Farmer')
    : (offer?.buyerName || offer?.buyer_name || 'Buyer');

  const authHeaders = () => {
    const token = localStorage.getItem('kisansetu_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadMessages = async () => {
    if (!offer?.id) return;
    try {
      const res = await fetch(`/api/messages/${offer.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setError('');
      } else {
        setError(data.message || 'Could not load messages.');
      }
    } catch (err) {
      console.error('Error loading chat messages:', err);
      setError('Could not load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      loadMessages();
      // Light polling while the chat is open, so both sides see new
      // messages without needing a full realtime/websocket layer.
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, offer?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      const res = await fetch(`/api/messages/${offer.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        setError(data.message || 'Could not send message.');
        setDraft(text);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      setError('Could not send message.');
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageCircle size={18} /> {otherPartyName}
      </span>
    }>
      <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', marginBottom: 10 }}>
        {offer?.produce || offer?.crop_name || 'Produce'} · {(offer?.quantity || 0).toLocaleString()} {offer?.unit || offer?.quantity_unit || 'kg'} · {t('chat.request', 'Request')} #{(offer?.id || '').slice(-8)}
      </div>

      <div
        style={{
          height: 320,
          overflowY: 'auto',
          background: 'var(--neutral-50)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem', margin: 'auto' }}>
            {t('chat.loading', 'Loading conversation...')}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem', margin: 'auto' }}>
            {t('chat.empty', 'No messages yet. Say hello!')}
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: isMine ? 'var(--primary-600)' : '#fff',
                  color: isMine ? '#fff' : 'var(--neutral-900)',
                  border: isMine ? 'none' : '1px solid var(--neutral-200)',
                  borderRadius: 14,
                  borderBottomRightRadius: isMine ? 4 : 14,
                  borderBottomLeftRadius: isMine ? 14 : 4,
                  padding: '9px 13px',
                  fontSize: '0.85rem',
                  lineHeight: 1.45,
                }}
              >
                {m.message}
                <div style={{ fontSize: '0.65rem', opacity: 0.65, marginTop: 3 }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: 8 }}>{error}</div>
      )}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          className="form-control"
          placeholder={t('chat.placeholder', 'Type a message...')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
          style={{ flex: 1, borderRadius: 999 }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending || !draft.trim()}
          style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={16} />
        </button>
      </form>
    </Modal>
  );
}
