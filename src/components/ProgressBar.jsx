import React from 'react';

export default function ProgressBar({ current, total, unit = 'kg', showLabels = true }) {
  const percentage = Math.min(100, Math.round((current / (total || 1)) * 100));
  const isFull = current >= total;

  return (
    <div className="progress-container">
      {showLabels && (
        <div className="progress-header">
          <span style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>
            {(current || 0).toLocaleString()} / {(total || 0).toLocaleString()} {unit}
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
