import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  RotateCcw, 
  Globe, 
  GripVertical
} from 'lucide-react';
import { LANGUAGES } from '../constants/languages';
import { useLanguage } from '../context/LanguageContext';
import '../styles/chatbot.css';

interface ChatbotProps {
  currentLanguage?: string;
  currentRole?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  source?: string | null;
  time: string;
}

interface MandiPriceRecord {
  commodity: string;
  market: string;
  state: string;
  district: string;
  date: string;
  variety?: string;
  grade?: string;
  min_price?: number | null;
  max_price?: number | null;
  modal_price?: number | null;
  unit?: string;
}

const SUGGESTED_QUESTIONS = [
  { id: 'wheat-price', text: "What is today's wheat price?", icon: '🌾' },
  { id: 'wheat-rajasthan', text: "What is the price of wheat in Rajasthan?", icon: '📍' },
  { id: 'higher-market', text: "Which market has a higher price?", icon: '📈' },
  { id: 'modal-price', text: "What is the modal price?", icon: '📊' },
  { id: 'sell', text: "How can I sell my crop?", icon: '📦' },
  { id: 'platform', text: "How does this platform work?", icon: '❓' },
];

// Dictionary of commodities for direct /api/market-prices detection
const COMMODITIES: Record<string, string> = {
  wheat: 'Wheat',
  'गेहूं': 'Wheat',
  'कनक': 'Wheat',
  rice: 'Rice',
  paddy: 'Paddy(Dhan)(Common)',
  'चावल': 'Rice',
  'धान': 'Paddy(Dhan)(Common)',
  tomato: 'Tomato',
  tomatoes: 'Tomato',
  'टमाटर': 'Tomato',
  'टमाटो': 'Tomato',
  onion: 'Onion',
  onions: 'Onion',
  'प्याज': 'Onion',
  'कांदा': 'Onion',
  potato: 'Potato',
  potatoes: 'Potato',
  'आलू': 'Potato',
  'बटाटा': 'Potato',
  cotton: 'Cotton',
  'कपास': 'Cotton',
  'रूई': 'Cotton',
  maize: 'Maize',
  corn: 'Maize',
  'मक्का': 'Maize',
  'मका': 'Maize',
  soyabean: 'Soyabean',
  soybean: 'Soyabean',
  'सोयाबीन': 'Soyabean',
  mustard: 'Mustard',
  'सरसों': 'Mustard',
  banana: 'Banana',
  'केला': 'Banana',
  'केळी': 'Banana',
  apple: 'Apple',
  'सेब': 'Apple',
  garlic: 'Garlic',
  'लहसुन': 'Garlic',
  ginger: 'Ginger(Green)',
  'अदरक': 'Ginger(Green)',
  chilli: 'Green Chilli',
  chillies: 'Green Chilli',
  'मिर्च': 'Green Chilli',
  gram: 'Gram Raw(Chholia)',
  chana: 'Gram Raw(Chholia)',
  'चना': 'Gram Raw(Chholia)',
  tur: 'Arhar (Tur/Red Gram)(Whole)',
  arhar: 'Arhar (Tur/Red Gram)(Whole)',
  'तुअर': 'Arhar (Tur/Red Gram)(Whole)',
  moong: 'Moong(Green Gram)(Whole)',
  'मूंग': 'Moong(Green Gram)(Whole)',
  urad: 'Urad (Black Gram)(Whole)',
  'उड़द': 'Urad (Black Gram)(Whole)',
  groundnut: 'Groundnut',
  'मूंगफली': 'Groundnut',
  sugarcane: 'Sugarcane',
  'गन्ना': 'Sugarcane',
};

// Dictionary of states for targeted queries
const STATES: Record<string, string> = {
  rajasthan: 'Rajasthan',
  'राजस्थान': 'Rajasthan',
  punjab: 'Punjab',
  'पंजाब': 'Punjab',
  haryana: 'Haryana',
  'हरियाणा': 'Haryana',
  maharashtra: 'Maharashtra',
  'महाराष्ट्र': 'Maharashtra',
  'madhya pradesh': 'Madhya Pradesh',
  mp: 'Madhya Pradesh',
  'मध्य प्रदेश': 'Madhya Pradesh',
  'uttar pradesh': 'Uttar Pradesh',
  up: 'Uttar Pradesh',
  'उत्तर प्रदेश': 'Uttar Pradesh',
  gujarat: 'Gujarat',
  'गुजरात': 'Gujarat',
  karnataka: 'Karnataka',
  'कर्नाटक': 'Karnataka',
  'tamil nadu': 'Tamil Nadu',
  'तमिलनाडु': 'Tamil Nadu',
  'andhra pradesh': 'Andhra Pradesh',
  'आंध्र': 'Andhra Pradesh',
  telangana: 'Telangana',
  'तेलंगाना': 'Telangana',
  kerala: 'Kerala',
  'केरल': 'Kerala',
  bihar: 'Bihar',
  'बिहार': 'Bihar',
  'west bengal': 'West Bengal',
  'पश्चिम बंगाल': 'West Bengal',
  odisha: 'Odisha',
  'ओडिशा': 'Odisha',
  assam: 'Assam',
  'असम': 'Assam',
  'himachal pradesh': 'Himachal Pradesh',
  'हिमाचल': 'Himachal Pradesh',
};

/**
 * Remove any introductory fluff, polite padding, or trailing follow-up endings.
 */
function stripFiller(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Strip leading greetings & intros
  cleaned = cleaned.replace(/^(hello|hi|hey|greetings|welcome|dear\s+\w+)[^.!?\n]*[.!?\n]+\s*/i, '');
  cleaned = cleaned.replace(/^(certainly|sure|of course|i'd be happy to help|here is the requested)[^.!?\n]*[,:.!?\n]+\s*/i, '');
  cleaned = cleaned.replace(/^(namaste|नमस्ते)[^.!?\n]*[.!?\n]+\s*/i, '');

  // Strip trailing "would you like to know more" or open-ended follow-ups
  cleaned = cleaned.replace(/(would you like to know more|would you like to check|feel free to ask|let me know if you need|hope this helps|is there anything else)[^.!?\n]*[.?!\s]*$/i, '');
  cleaned = cleaned.replace(/(क्या आप.*जानना चाहते हैं\??|यदि आपका कोई.*पूछें[।.]?)/i, '');

  return cleaned.trim();
}

/**
 * Extract commodity and state from user query
 */
function extractQueryEntities(queryText: string): { commodity?: string; state?: string } {
  const lower = queryText.toLowerCase();
  let commodity: string | undefined;
  let state: string | undefined;

  for (const [k, v] of Object.entries(COMMODITIES)) {
    if (lower.includes(k)) {
      commodity = v;
      break;
    }
  }

  for (const [k, v] of Object.entries(STATES)) {
    if (lower.includes(k)) {
      state = v;
      break;
    }
  }

  return { commodity, state };
}

/**
 * Check if the user query is asking for market price information
 */
function isMarketPriceInquiry(queryText: string): boolean {
  const lower = queryText.toLowerCase();
  const priceKeywords = [
    'price', 'rate', 'bhav', 'cost', 'mandi', 'modal',
    'highest', 'lowest', 'maximum', 'minimum', 'worth', 'value',
    '₹', 'rs', 'quintal', 'भाव', 'दाम', 'कीमत', 'रेट', 'मंडी'
  ];

  if (priceKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  // If query names any known commodity
  for (const k of Object.keys(COMMODITIES)) {
    if (lower.includes(k)) {
      return true;
    }
  }

  return false;
}

export default function Chatbot({ 
  currentLanguage: propCurrentLanguage, 
  currentRole = 'farmer' 
}: ChatbotProps) {
  const { t, language } = useLanguage();
  const currentLanguage = propCurrentLanguage || language;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCommodity, setLastCommodity] = useState('Wheat');

  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('kisansetu_chatbot_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (_) {}
    return {
      x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 195) : 300,
      y: typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 80) : 500,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    btnX: 0,
    btnY: 0,
    hasMoved: false,
    activePointerId: -1,
  });

  // Clamp position within viewport bounds
  const clampPos = (x: number, y: number, btnWidth = 180, btnHeight = 54) => {
    const minX = 12;
    const maxX = Math.max(minX, (window.innerWidth || 800) - btnWidth - 12);
    const minY = 12;
    const maxY = Math.max(minY, (window.innerHeight || 600) - btnHeight - 12);
    return {
      x: Math.min(Math.max(minX, x), maxX),
      y: Math.min(Math.max(minY, y), maxY)
    };
  };

  // Re-clamp position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPos(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      btnX: position.x,
      btnY: position.y,
      hasMoved: false,
      activePointerId: e.pointerId,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || dragRef.current.activePointerId !== e.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.hypot(dx, dy) > 5) {
      dragRef.current.hasMoved = true;
    }
    const nextPos = clampPos(dragRef.current.btnX + dx, dragRef.current.btnY + dy);
    setPosition(nextPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.activePointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
    dragRef.current.activePointerId = -1;

    if (dragRef.current.hasMoved) {
      localStorage.setItem('kisansetu_chatbot_pos', JSON.stringify(position));
    } else {
      setIsOpen(true);
    }
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    dragRef.current.activePointerId = -1;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const currentLangObj = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];
  const isHindi = currentLanguage === 'hi';

  const suggestedQuestions = [
    { id: 'wheat-price', text: t('chatbot.q1', "What is today's wheat price?"), icon: '🌾' },
    { id: 'wheat-rajasthan', text: t('chatbot.q2', "What is the price of wheat in Rajasthan?"), icon: '📍' },
    { id: 'higher-market', text: t('chatbot.q3', "Which market has a higher price?"), icon: '📈' },
    { id: 'modal-price', text: t('chatbot.q4', "What is the modal price?"), icon: '📊' },
    { id: 'sell', text: t('chatbot.q5', "How can I sell my crop?"), icon: '📦' },
    { id: 'platform', text: t('chatbot.q6', "How does this platform work?"), icon: '❓' },
  ];

  /**
   * Handle market price inquiry by fetching directly from /api/market-prices
   * and presenting ONLY the value without introductory filler or 'would you like to know more' endings.
   */
  const handleMarketPriceQuery = async (queryText: string): Promise<{ text: string; source: string }> => {
    const { commodity: detectedComm, state: detectedState } = extractQueryEntities(queryText);
    const targetCommodity = detectedComm || lastCommodity || 'Wheat';
    if (detectedComm) {
      setLastCommodity(detectedComm);
    }

    const lower = queryText.toLowerCase();

    try {
      const params = new URLSearchParams();
      params.set('commodity', targetCommodity);
      if (detectedState) {
        params.set('state', detectedState);
      }
      params.set('limit', '50');

      const res = await fetch(`/api/market-prices?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      const records: MandiPriceRecord[] = Array.isArray(json?.records) ? json.records : [];
      const validRecords = records.filter((r) => r.modal_price && Number(r.modal_price) > 0);

      if (validRecords.length === 0) {
        return {
          text: isHindi
            ? "माफ़ कीजिए, मुझे मंडी बाज़ार डेटा में वह जानकारी नहीं मिली।"
            : "Sorry, I couldn't find that data in the mandi market data.",
          source: 'Live Mandi Intelligence'
        };
      }

      // 1. User asks for "highest" or "higher" market / price
      if (
        lower.includes('highest') || 
        lower.includes('higher') || 
        lower.includes('maximum') || 
        lower.includes('अधिकतम') || 
        lower.includes('सबसे ज्यादा')
      ) {
        const highest = [...validRecords].sort(
          (a, b) => Number(b.modal_price) - Number(a.modal_price)
        )[0];
        const formattedPrice = Number(highest.modal_price).toLocaleString();
        return {
          text: isHindi
            ? `${highest.market}, ${highest.state}: ₹${formattedPrice} / क्विंटल`
            : `${highest.market}, ${highest.state}: ₹${formattedPrice} / quintal`,
          source: 'Live Mandi Intelligence'
        };
      }

      // 2. User asks for "lowest" or "minimum" market / price
      if (
        lower.includes('lowest') || 
        lower.includes('minimum') || 
        lower.includes('cheapest') || 
        lower.includes('न्यूनतम') || 
        lower.includes('सबसे कम')
      ) {
        const lowest = [...validRecords].sort(
          (a, b) => Number(a.modal_price) - Number(b.modal_price)
        )[0];
        const formattedPrice = Number(lowest.modal_price).toLocaleString();
        return {
          text: isHindi
            ? `${lowest.market}, ${lowest.state}: ₹${formattedPrice} / क्विंटल`
            : `${lowest.market}, ${lowest.state}: ₹${formattedPrice} / quintal`,
          source: 'Live Mandi Intelligence'
        };
      }

      // 3. User specifically asks for "modal price"
      if (
        lower.includes('modal price') || 
        lower.includes('what is modal') || 
        lower.includes('मॉडल भाव')
      ) {
        const formattedPrice = Number(validRecords[0].modal_price).toLocaleString();
        return {
          text: isHindi
            ? `₹${formattedPrice} / क्विंटल`
            : `₹${formattedPrice} / quintal`,
          source: 'Live Mandi Intelligence'
        };
      }

      // 4. Standard price inquiry: present value with market & date context, zero filler
      const rec = validRecords[0];
      const formattedPrice = Number(rec.modal_price).toLocaleString();
      const unitStr = isHindi ? 'क्विंटल' : 'quintal';

      return {
        text: `₹${formattedPrice} / ${unitStr} (${rec.market}, ${rec.state} • ${rec.date})`,
        source: 'Live Mandi Intelligence'
      };
    } catch {
      return {
        text: isHindi
          ? "माफ़ कीजिए, मुझे मंडी बाज़ार डेटा में वह जानकारी नहीं मिली।"
          : "Sorry, I couldn't find that data in the mandi market data.",
        source: 'Live Mandi Intelligence'
      };
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Direct /api/market-prices route for all market price questions
      if (isMarketPriceInquiry(text)) {
        const priceResult = await handleMarketPriceQuery(text);
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: priceResult.text,
          source: priceResult.source,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Direct call to /api/chat for agronomy / platform questions
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: newMessages.map((m) => ({ sender: m.sender, text: m.text })),
            language: currentLanguage,
            role: currentRole
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        // Clean any potential filler or follow-up endings to guarantee concise response
        const cleanAnswer = stripFiller(data.reply || '');

        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: cleanAnswer || (isHindi ? 'विवरण उपलब्ध नहीं है।' : 'Details unavailable.'),
          source: data.source || null,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, botMessage]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: isHindi
          ? "माफ़ कीजिए, कनेक्शन में समस्या है। कृपया पुनः प्रयास करें।"
          : "Unable to connect. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Draggable Toggle Button */}
      {!isOpen && (
        <button 
          className="chatbot-floating-trigger"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            right: 'auto',
            bottom: 'auto',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            zIndex: 9999,
          }}
          aria-label={t('chatbot.assistant', "Agri Assistant")}
          title="Drag to reposition, click to open"
          id="agri-chat-toggle-btn"
        >
          <GripVertical size={14} style={{ opacity: 0.65, marginLeft: -4, marginRight: -2 }} />
          <div className="chatbot-trigger-icon">🌱</div>
          <span className="chatbot-trigger-text">{t('chatbot.assistant', "Agri Assistant")}</span>
          <div className="chatbot-trigger-pulse" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div 
          className="chatbot-window" 
          id="agri-chat-window"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: position.x > ((typeof window !== 'undefined' ? window.innerWidth : 800) / 2) ? '24px' : 'auto',
            left: position.x <= ((typeof window !== 'undefined' ? window.innerWidth : 800) / 2) ? '24px' : 'auto',
            zIndex: 10000,
          }}
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-header-avatar">🌱</div>
              <div className="chatbot-header-title">
                <h3>{t('chatbot.title', "Agriculture Assistant")}</h3>
                <div className="chatbot-header-status">
                  <span style={{ fontSize: '10px' }}>●</span>
                  <span>{t('chatbot.online', "Online")}</span>
                </div>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button 
                className="chatbot-header-btn"
                onClick={handleResetChat}
                title={t('chatbot.restart', "Restart conversation")}
                aria-label={t('chatbot.restart', "Restart conversation")}
                id="agri-chat-reset-btn"
              >
                <RotateCcw size={14} />
              </button>
              <button 
                className="chatbot-header-btn"
                onClick={() => setIsOpen(false)}
                title={t('chatbot.close', "Close chat")}
                aria-label={t('chatbot.close', "Close chat")}
                id="agri-chat-close-btn"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Language Bar */}
          <div className="chatbot-lang-bar">
            <span>{t('chatbot.language', "Language")}: <strong className="chatbot-lang-badge"><Globe size={11} /> {currentLangObj.native} ({currentLangObj.name})</strong></span>
          </div>

          {/* Message History Container */}
          <div className="chatbot-messages-container">
            {messages.length === 0 && (
              <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', fontWeight: 600 }}>
                  {t('chatbot.suggested', "Suggested queries:")}
                </div>
                <div className="chat-suggestions-list" style={{ marginTop: 0 }}>
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q.id}
                      className="chat-suggestion-chip"
                      onClick={() => handleSendMessage(q.text)}
                      id={`chat-suggestion-${q.id}`}
                    >
                      <span>{q.icon}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                <div className="chat-avatar">
                  {msg.sender === 'bot' ? '🌱' : '👤'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="chat-bubble">
                    <div className="chat-bubble-content">
                      <p style={{ margin: 0, fontWeight: msg.sender === 'bot' && msg.text.startsWith('₹') ? 600 : 400 }}>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                  <span className="chat-message-time">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="chat-message bot">
                <div className="chat-avatar">🌱</div>
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="chatbot-input-container">
            <input 
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={t('chatbot.placeholder', "Ask about crop prices, mandis, or how to sell...")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              id="agri-chat-input"
            />
            <button 
              className="chatbot-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label={t('chatbot.send', "Send message")}
              id="agri-chat-send-btn"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
