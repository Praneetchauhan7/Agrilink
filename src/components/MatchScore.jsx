import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MatchScore({ score = 92, factors = [] }) {
  const { t } = useLanguage();

  const defaultFactors = [
    { label: t('match.produceMatch', 'Produce Match'), matched: true },
    { label: t('match.quantityMatch', 'Quantity Match'), matched: true },
    { label: t('match.qualityMatch', 'Quality Match'), matched: true },
    { label: t('match.priceMatch', 'Price Match'), matched: true },
    { label: t('match.locationMatch', 'Location Match'), matched: true }
  ];

  const displayFactors = factors.length > 0 ? factors : defaultFactors;

  return (
    <div>
      <div className="match-score-badge">
        <Sparkles size={16} />
        <span>{score}% {t('match.match', 'Match')}</span>
      </div>
      <div className="match-factors">
        {displayFactors.map((factor, index) => (
          <span 
            key={index} 
            className={`match-factor-pill ${factor.matched ? 'matched' : ''}`}
          >
            {factor.matched && <CheckCircle2 size={13} style={{ color: 'var(--primary-600)' }} />}
            {factor.label} {factor.matched ? '✓' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
