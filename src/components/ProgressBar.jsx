import React from 'react';

export default function ProgressBar({ current, total, unit = 'kg', showLabels = true }) {
  const safeCurrent = Number(current) || 0;
  const safeTotal = Number(total) || 0;
  const displayedCurrent = safeTotal > 0 ? Math.min(safeCurrent, safeTotal) : 0;
  const percentage = safeTotal > 0 ? Math.min(100, Math.round((safeCurrent / safeTotal) * 100)) : 0;
  const isFull = safeTotal > 0 && safeCurrent >= safeTotal;

  return (
    <div className="progress-container">
      {showLabels && (
        <div className="progress-header">
          <span style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>
            {displayedCurrent.toLocaleString()} / {safeTotal.toLocaleString()} {unit}
          </span>
          <span style={{ fontWeight: 800, color: isFull ? 'var(--primary-700)' : 'var(--neutral-600)' }}>
            {percentage}%
          </span>
        </div>
      )}
      <div className="progress-track">
        <div 
          className={`progress-fill ${isFull ? 'full' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
